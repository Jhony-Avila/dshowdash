<?php
/**
 * Rate Limit Avançado – IP + Username com Backoff Progressivo
 * @version 2.1.0-HARDENED
 *
 * Correções aplicadas:
 * - P0: Bugs críticos de sintaxe/tabela (v2.0.3)
 * - P1: Race condition, overflow exponencial, validação de data
 * - P2: Performance (query única), docblocks completos
 */

declare(strict_types=1);

final class RateLimit
{
    private const DEFAULT_MAX_ATTEMPTS = 5;
    private const DEFAULT_WINDOW_MINUTES = 5;
    private const DEFAULT_BACKOFF_MULTIPLIER = 2.0;
    private const DEFAULT_MAX_BLOCK_MINUTES = 60;
    private const MAX_BACKOFF_STEPS = 5; // Cap para evitar explosão exponencial

    private \PDO $pdo;
    private array $config;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->config = [
            'max_attempts'       => self::DEFAULT_MAX_ATTEMPTS,
            'window_minutes'     => self::DEFAULT_WINDOW_MINUTES,
            'backoff_multiplier' => self::DEFAULT_BACKOFF_MULTIPLIER,
            'max_block_minutes'  => self::DEFAULT_MAX_BLOCK_MINUTES,
        ];
        $this->loadConfig();
    }

    /**
     * Carrega configuração do banco (rate_limit_config)
     *
     * @return void
     */
    private function loadConfig(): void
    {
        try {
            $stmt = $this->pdo->query(
                "SELECT max_amount AS max_attempts, window_minutes, backoff_multiplier, max_block_minutes
                 FROM rate_limit_config
                 ORDER BY id DESC
                 LIMIT 1"
            );
            $row = $stmt ? $stmt->fetch(\PDO::FETCH_ASSOC) : false;

            if (is_array($row)) {
                if (isset($row['max_attempts']) && is_numeric($row['max_attempts'])) {
                    $this->config['max_attempts'] = max(1, (int) $row['max_attempts']);
                }
                if (isset($row['window_minutes']) && is_numeric($row['window_minutes'])) {
                    $this->config['window_minutes'] = max(1, (int) $row['window_minutes']);
                }
                if (isset($row['backoff_multiplier']) && is_numeric($row['backoff_multiplier'])) {
                    $this->config['backoff_multiplier'] = max(1.0, (float) $row['backoff_multiplier']);
                }
                if (isset($row['max_block_minutes']) && is_numeric($row['max_block_minutes'])) {
                    $this->config['max_block_minutes'] = max(1, (int) $row['max_block_minutes']);
                }
            }
        } catch (\Throwable $e) {
            error_log("RateLimit config fallback: " . $e->getMessage());
        }
    }

    /**
     * Calcula timestamp de início da janela de análise
     *
     * @return string Formato 'Y-m-d H:i:s'
     */
    private function cutoffTimestamp(): string
    {
        $minutes = max(1, (int) $this->config['window_minutes']);
        $cutoffTime = time() - ($minutes * 60);
        return date('Y-m-d H:i:s', $cutoffTime);
    }

    /**
     * Valida se timestamp está no formato correto
     *
     * @param string $timestamp
     * @return bool
     */
    private function isValidTimestamp(string $timestamp): bool
    {
        $dt = \DateTime::createFromFormat('Y-m-d H:i:s', $timestamp);
        return $dt && $dt->format('Y-m-d H:i:s') === $timestamp;
    }

    /**
     * Verifica se IP/usuário podem tentar login
     *
     * @param string $ip Endereço IP do cliente
     * @param string $username Username (opcional)
     * @return array{allowed: bool, remaining?: int, reason?: string, retry_after?: int, attempts?: int}
     */
    public function checkLimit(string $ip, string $username = ''): array
    {
        $cutoff = $this->cutoffTimestamp();

        if (!$this->isValidTimestamp($cutoff)) {
            error_log("RateLimit: Invalid cutoff timestamp");
            return ['allowed' => true, 'remaining' => $this->config['max_attempts']];
        }

        try {
            // Cleanup antigo
            $stmt = $this->pdo->prepare(
                "DELETE FROM login_attempts
                 WHERE attempt_time < :cutoff AND success = 0"
            );
            $stmt->execute([':cutoff' => $cutoff]);

            // Verifica bloqueio ativo
            if ($username !== '') {
                $stmt = $this->pdo->prepare(
                    "SELECT blocked_until
                     FROM login_attempts
                     WHERE username = :username
                     AND blocked_until IS NOT NULL
                     AND blocked_until > NOW()
                     ORDER BY blocked_until DESC
                     LIMIT 1"
                );
                $stmt->execute([':username' => $username]);

                if ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    $retryAfter = max(0, strtotime($row['blocked_until']) - time());
                    return [
                        'allowed'     => false,
                        'reason'      => 'user_blocked',
                        'retry_after' => $retryAfter,
                    ];
                }
            }

            // Conta tentativas (query otimizada)
            $ipAttempts = $this->countAttempts($ip, 'ip', $cutoff);
            $userAttempts = $username !== '' ? $this->countAttempts($username, 'username', $cutoff) : 0;

            $max = max(1, (int) $this->config['max_attempts']);
            $current = max($ipAttempts, $userAttempts);

            if ($current >= $max) {
                $multiplier = (float) $this->config['backoff_multiplier'];
                $window = max(1, (int) $this->config['window_minutes']);

                // Cap no número de steps para evitar overflow
                $extraSteps = min($current - $max, self::MAX_BACKOFF_STEPS);

                $blockMins = min(
                    (int) round($window * pow($multiplier, $extraSteps)),
                    (int) $this->config['max_block_minutes']
                );

                return [
                    'allowed'     => false,
                    'reason'      => 'rate_limit_exceeded',
                    'retry_after' => $blockMins * 60,
                    'attempts'    => $current,
                ];
            }

            return [
                'allowed'   => true,
                'remaining' => $max - $current,
            ];

        } catch (\Throwable $e) {
            error_log("RateLimit checkLimit ERROR: " . $e->getMessage());
            return ['allowed' => true, 'remaining' => $this->config['max_attempts']];
        }
    }

    /**
     * Conta tentativas falhas para um critério específico
     *
     * @param string $value Valor a buscar (IP ou username)
     * @param string $column Nome da coluna ('ip' ou 'username')
     * @param string $cutoff Timestamp de corte
     * @return int Número de tentativas
     */
    private function countAttempts(string $value, string $column, string $cutoff): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) AS attempts
             FROM login_attempts
             WHERE {$column} = :value
             AND attempt_time > :cutoff
             AND success = 0"
        );
        $stmt->execute([':value' => $value, ':cutoff' => $cutoff]);
        return (int) $stmt->fetchColumn();
    }

    /**
     * Registra tentativa de login (com transação para evitar race condition)
     *
     * @param string $ip Endereço IP
     * @param string $username Username
     * @param bool $success Se login foi bem-sucedido
     * @return void
     */
    public function recordAttempt(string $ip, string $username, bool $success): void
    {
        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare(
                "INSERT INTO login_attempts (ip, attempt_time, success, username)
                 VALUES (:ip, NOW(), :success, :username)"
            );
            $stmt->execute([
                ':ip'       => $ip,
                ':success'  => $success ? 1 : 0,
                ':username' => $username,
            ]);

            if ($success) {
                $clear = $this->pdo->prepare(
                    "DELETE FROM login_attempts
                     WHERE (ip = :ip OR username = :username) AND success = 0"
                );
                $clear->execute([':ip' => $ip, ':username' => $username]);

                $this->pdo->commit();
                return;
            }

            // Aplica bloqueio se necessário
            if ($username !== '') {
                $check = $this->checkLimit($ip, $username);
                if (!$check['allowed'] && isset($check['retry_after'])) {
                    $blockUntil = date('Y-m-d H:i:s', time() + (int) $check['retry_after']);
                    $cutoff = $this->cutoffTimestamp();

                    $upd = $this->pdo->prepare(
                        "UPDATE login_attempts
                         SET blocked_until = :until
                         WHERE username = :username
                         AND success = 0
                         AND attempt_time > :cutoff"
                    );
                    $upd->execute([
                        ':until'    => $blockUntil,
                        ':username' => $username,
                        ':cutoff'   => $cutoff,
                    ]);
                }
            }

            $this->pdo->commit();

        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("RateLimit recordAttempt ERROR: " . $e->getMessage());
        }
    }

    /**
     * Limpa tentativas falhas pendentes
     *
     * @param string $ip Endereço IP
     * @param string $username Username (opcional)
     * @return void
     */
    public function clearAttempts(string $ip, string $username = ''): void
    {
        try {
            if ($username !== '') {
                $stmt = $this->pdo->prepare(
                    "DELETE FROM login_attempts
                     WHERE (ip = :ip OR username = :username) AND success = 0"
                );
                $stmt->execute([':ip' => $ip, ':username' => $username]);
            } else {
                $stmt = $this->pdo->prepare(
                    "DELETE FROM login_attempts
                     WHERE ip = :ip AND success = 0"
                );
                $stmt->execute([':ip' => $ip]);
            }
        } catch (\Throwable $e) {
            error_log("RateLimit clearAttempts ERROR: " . $e->getMessage());
        }
    }
}
