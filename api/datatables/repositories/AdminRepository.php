<?php
// DataTables / AdminRepository - limites, regras, canais e silencios (§38.15)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Configuracao que MUDA COMPORTAMENTO REAL:
//   - DT_Limite         -> limiar de lento, % de nulos, dependencias excessivas
//   - DT_Regra_Alerta   -> severidade, canais, anti-flood por tipo/conexao
//   - DT_Silencio_Alerta-> suprime ENVIO externo (nunca o registro interno)
//   - DT_Canal_Alerta   -> cadastro dos canais; segredo SEMPRE cifrado
//
// SEGREDO (§30.1): secret_encrypted nunca sai deste repositorio. O front recebe
// apenas has_secret (booleano).
declare(strict_types=1);

require_once __DIR__ . '/../../core/repositories/RepositoryException.php';
require_once __DIR__ . '/../lib/Crypto.php';

final class DtAdminRepository
{
    /** Metricas conhecidas, com rotulo e unidade para o front nao adivinhar. */
    public const METRICS = [
        'latency_ms'    => ['label' => 'Latência da verificação', 'unit' => 'ms',
                            'help'  => 'Acima do valor de atenção a conexão é classificada como LENTA.'],
        'disk_pct'      => ['label' => 'Uso de disco',            'unit' => '%',
                            'help'  => 'Percentual de ocupação que dispara alerta.'],
        'connections'   => ['label' => 'Conexões simultâneas',    'unit' => '',
                            'help'  => 'Quantidade de conexões abertas no banco monitorado.'],
        'growth_pct_7d' => ['label' => 'Crescimento em 7 dias',   'unit' => '%',
                            'help'  => 'Crescimento percentual de tabela considerado anormal.'],
        'null_pct'      => ['label' => 'Percentual de nulos',     'unit' => '%',
                            'help'  => 'A partir daqui a coluna vira problema de qualidade.'],
        'table_deps'    => ['label' => 'Dependências por tabela', 'unit' => '',
                            'help'  => 'Acima disso a tabela é marcada com dependências excessivas.'],
    ];

    /** Tipos de alerta configuraveis (§26.1). */
    public const ALERT_TYPES = [
        'db_offline'      => 'Banco offline',
        'cred_expired'    => 'Credencial expirada',
        'read_failed'     => 'Falha no teste de leitura',
        'write_failed'    => 'Falha no teste de gravação',
        'db_unstable'     => 'Conexão instável',
        'db_slow'         => 'Conexão lenta',
        'fk_broken'       => 'Chave estrangeira quebrada',
        'quality_critical'=> 'Problema crítico de qualidade',
        'abnormal_growth' => 'Crescimento anormal',
        'new_table'       => 'Nova tabela identificada',
        'table_removed'   => 'Tabela não encontrada',
        'new_field'       => 'Novo campo identificado',
        'field_removed'   => 'Campo não encontrado',
        'type_changed'    => 'Tipo de campo alterado',
        'low_disk'        => 'Pouco espaço em disco',
        'discovery_new_db'      => 'Descoberta: novo banco',
        'discovery_new_server'  => 'Descoberta: novo servidor',
        'discovery_db_vanished' => 'Descoberta: banco desapareceu',
        'discovery_backup_only' => 'Descoberta: só em backup',
        'discovery_ref_found'   => 'Descoberta: referenciado não encontrado',
        'discovery_partial'     => 'Descoberta: inventário parcial',
        'discovery_collision'   => 'Descoberta: colisão de nome',
        'discovery_db_moved'    => 'Descoberta: banco mudou de servidor',
    ];

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ═══════════════════════════════════════════════════════════════
    // LIMITES (§16.2)
    // ═══════════════════════════════════════════════════════════════

    public function listLimits(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT l.*, c.name connection_name
                   FROM DT_Limite l
              LEFT JOIN DT_Conexao c ON c.id = l.connection_id
               ORDER BY l.connection_id IS NOT NULL, c.name, l.metric_key'
            );
            return array_map(static function ($r) {
                $r['id'] = (int)$r['id'];
                $r['connection_id'] = $r['connection_id'] !== null ? (int)$r['connection_id'] : null;
                $r['is_active'] = (bool)$r['is_active'];
                $r['is_global'] = $r['connection_id'] === null;
                $meta = self::METRICS[$r['metric_key']] ?? null;
                $r['label'] = $meta['label'] ?? $r['metric_key'];
                $r['unit']  = $meta['unit']  ?? '';
                $r['help']  = $meta['help']  ?? '';
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::listLimits');
        }
    }

    /** Upsert por (conexao, metrica). connection_id null = default global. */
    public function saveLimit(?int $connId, string $metric, ?float $warn, ?float $critical, bool $active = true): void
    {
        if (!isset(self::METRICS[$metric])) {
            throw new InvalidArgumentException("Metrica desconhecida: {$metric}");
        }
        if ($warn !== null && $critical !== null && $critical < $warn) {
            throw new InvalidArgumentException('O valor crítico não pode ser menor que o de atenção');
        }

        try {
            // connection_id NULL nao colide em UNIQUE: o upsert do default global
            // precisa de UPDATE explicito, senao duplicaria a cada salvamento.
            if ($connId === null) {
                $ex = $this->pdo->prepare(
                    'SELECT id FROM DT_Limite WHERE connection_id IS NULL AND metric_key = :m LIMIT 1'
                );
                $ex->execute([':m' => $metric]);
                $id = $ex->fetchColumn();

                if ($id !== false) {
                    $this->pdo->prepare(
                        'UPDATE DT_Limite SET warn_value = :w, critical_value = :c, is_active = :a WHERE id = :id'
                    )->execute([':w' => $warn, ':c' => $critical, ':a' => (int)$active, ':id' => $id]);
                    return;
                }
                $this->pdo->prepare(
                    'INSERT INTO DT_Limite (connection_id, metric_key, warn_value, critical_value, is_active)
                     VALUES (NULL, :m, :w, :c, :a)'
                )->execute([':m' => $metric, ':w' => $warn, ':c' => $critical, ':a' => (int)$active]);
                return;
            }

            $this->pdo->prepare(
                'INSERT INTO DT_Limite (connection_id, metric_key, warn_value, critical_value, is_active)
                 VALUES (:id, :m, :w, :c, :a)
                 ON DUPLICATE KEY UPDATE
                    warn_value = VALUES(warn_value), critical_value = VALUES(critical_value),
                    is_active = VALUES(is_active)'
            )->execute([':id' => $connId, ':m' => $metric, ':w' => $warn, ':c' => $critical, ':a' => (int)$active]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::saveLimit');
        }
    }

    public function deleteLimit(int $id): bool
    {
        try {
            // Default global nao pode ser apagado: sem ele o sistema fica sem piso.
            $chk = $this->pdo->prepare('SELECT connection_id FROM DT_Limite WHERE id = :id');
            $chk->execute([':id' => $id]);
            $row = $chk->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                return false;
            }
            if ($row['connection_id'] === null) {
                throw new RuntimeException('Limite padrão global não pode ser removido — apenas editado');
            }
            $st = $this->pdo->prepare('DELETE FROM DT_Limite WHERE id = :id');
            $st->execute([':id' => $id]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::deleteLimit');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REGRAS DE ALERTA (§26.7)
    // ═══════════════════════════════════════════════════════════════

    public function listAlertRules(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT r.*, c.name connection_name
                   FROM DT_Regra_Alerta r
              LEFT JOIN DT_Conexao c ON c.id = r.connection_id
               ORDER BY r.connection_id IS NOT NULL, c.name, r.alert_type'
            );
            return array_map(static function ($r) {
                $r['id'] = (int)$r['id'];
                $r['connection_id'] = $r['connection_id'] !== null ? (int)$r['connection_id'] : null;
                $r['is_enabled'] = (bool)$r['is_enabled'];
                $r['is_global']  = $r['connection_id'] === null;
                $r['min_interval_sec'] = (int)$r['min_interval_sec'];
                $r['channels'] = $r['channels_json'] ? (json_decode((string)$r['channels_json'], true) ?: []) : [];
                $r['label'] = self::ALERT_TYPES[$r['alert_type']] ?? $r['alert_type'];
                unset($r['channels_json']);
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::listAlertRules');
        }
    }

    public function saveAlertRule(?int $connId, string $type, array $data): void
    {
        if (!isset(self::ALERT_TYPES[$type])) {
            throw new InvalidArgumentException("Tipo de alerta desconhecido: {$type}");
        }

        $sev = (string)($data['severity'] ?? 'atencao');
        if (!in_array($sev, ['informativo', 'atencao', 'critico'], true)) {
            throw new InvalidArgumentException('Severidade inválida');
        }

        $interval = max(0, (int)($data['min_interval_sec'] ?? 3600));
        $enabled  = (int)((bool)($data['is_enabled'] ?? true));
        $channels = $data['channels'] ?? null;
        $chJson   = is_array($channels) ? json_encode(array_values($channels), JSON_UNESCAPED_UNICODE) : null;
        $recip    = isset($data['recipients']) ? mb_substr(trim((string)$data['recipients']), 0, 500) : null;

        try {
            if ($connId === null) {
                $ex = $this->pdo->prepare(
                    'SELECT id FROM DT_Regra_Alerta WHERE connection_id IS NULL AND alert_type = :t LIMIT 1'
                );
                $ex->execute([':t' => $type]);
                $id = $ex->fetchColumn();

                if ($id !== false) {
                    $this->pdo->prepare(
                        'UPDATE DT_Regra_Alerta
                            SET severity = :s, is_enabled = :e, min_interval_sec = :i,
                                channels_json = :c, recipients = :r
                          WHERE id = :id'
                    )->execute([':s' => $sev, ':e' => $enabled, ':i' => $interval,
                                ':c' => $chJson, ':r' => $recip, ':id' => $id]);
                    return;
                }
                $this->pdo->prepare(
                    'INSERT INTO DT_Regra_Alerta
                       (connection_id, alert_type, severity, is_enabled, min_interval_sec, channels_json, recipients)
                     VALUES (NULL, :t, :s, :e, :i, :c, :r)'
                )->execute([':t' => $type, ':s' => $sev, ':e' => $enabled, ':i' => $interval,
                            ':c' => $chJson, ':r' => $recip]);
                return;
            }

            $this->pdo->prepare(
                'INSERT INTO DT_Regra_Alerta
                   (connection_id, alert_type, severity, is_enabled, min_interval_sec, channels_json, recipients)
                 VALUES (:cid, :t, :s, :e, :i, :c, :r)
                 ON DUPLICATE KEY UPDATE
                    severity = VALUES(severity), is_enabled = VALUES(is_enabled),
                    min_interval_sec = VALUES(min_interval_sec),
                    channels_json = VALUES(channels_json), recipients = VALUES(recipients)'
            )->execute([':cid' => $connId, ':t' => $type, ':s' => $sev, ':e' => $enabled,
                        ':i' => $interval, ':c' => $chJson, ':r' => $recip]);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::saveAlertRule');
        }
    }

    public function deleteAlertRule(int $id): bool
    {
        try {
            $st = $this->pdo->prepare('DELETE FROM DT_Regra_Alerta WHERE id = :id');
            $st->execute([':id' => $id]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::deleteAlertRule');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CANAIS (§26.4)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Canais SEM o segredo. `delivery_implemented` diz a verdade sobre o que
     * realmente sai daqui — hoje so 'app'. Sem esse campo, habilitar um canal
     * externo daria a falsa impressao de que a notificacao seria enviada.
     */
    public function listChannels(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT id, channel_key, label, config_json, is_enabled, last_ok_at, last_error,
                        (secret_encrypted IS NOT NULL AND secret_encrypted <> "") has_secret
                   FROM DT_Canal_Alerta ORDER BY channel_key = "app" DESC, label'
            );
            return array_map(static function ($r) {
                $r['id'] = (int)$r['id'];
                $r['is_enabled'] = (bool)$r['is_enabled'];
                $r['has_secret'] = (bool)$r['has_secret'];
                $r['config'] = $r['config_json'] ? (json_decode((string)$r['config_json'], true) ?: []) : [];
                unset($r['config_json']);
                // Mascara qualquer coisa que pareca segredo dentro do config.
                foreach (['token', 'secret', 'api_key', 'password', 'webhook_url'] as $k) {
                    if (isset($r['config'][$k]) && $r['config'][$k] !== '') {
                        $r['config'][$k] = '********';
                    }
                }
                // Canais com entrega REAL implementada. Mantido explicito para a
                // UI nunca sugerir que um canal so-configurado vai entregar.
                $r['delivery_implemented'] = in_array($r['channel_key'], ['app', 'webhook'], true);
                $r['testable'] = $r['channel_key'] === 'webhook';
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::listChannels');
        }
    }

    /** $secret: null = manter; '' = remover; texto = cifrar e trocar. */
    public function saveChannel(int $id, array $data, ?string $secret = null): void
    {
        $sets = [];
        $par  = [':id' => $id];

        if (isset($data['label']) && trim((string)$data['label']) !== '') {
            $sets[] = 'label = :l';
            $par[':l'] = mb_substr(trim((string)$data['label']), 0, 100);
        }
        if (array_key_exists('is_enabled', $data)) {
            $sets[] = 'is_enabled = :e';
            $par[':e'] = (int)((bool)$data['is_enabled']);
        }
        if (array_key_exists('config', $data) && is_array($data['config'])) {
            // Nao regrava campo mascarado: '********' significa "nao mexi".
            $cfg = array_filter($data['config'], static fn($v) => $v !== '********');
            $sets[] = 'config_json = :c';
            $par[':c'] = json_encode($cfg, JSON_UNESCAPED_UNICODE);
        }
        if ($secret !== null) {
            $sets[] = 'secret_encrypted = :s';
            $par[':s'] = $secret === '' ? null : DtCrypto::encrypt($secret);
        }
        if ($sets === []) {
            return;
        }

        try {
            $this->pdo->prepare('UPDATE DT_Canal_Alerta SET ' . implode(', ', $sets) . ' WHERE id = :id')
                      ->execute($par);
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::saveChannel');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SILENCIOS (§26.6)
    // ═══════════════════════════════════════════════════════════════

    public function listSilences(): array
    {
        try {
            $st = $this->pdo->query(
                'SELECT s.*, c.name connection_name
                   FROM DT_Silencio_Alerta s
              LEFT JOIN DT_Conexao c ON c.id = s.connection_id
                  WHERE s.is_active = 1
               ORDER BY s.created_at DESC'
            );
            return array_map(static function ($r) {
                $r['id'] = (int)$r['id'];
                $r['connection_id'] = $r['connection_id'] !== null ? (int)$r['connection_id'] : null;
                $r['is_active'] = (bool)$r['is_active'];
                $r['scope'] = ($r['connection_id'] === null ? 'todas as conexões' : $r['connection_name'])
                    . ' · ' . ($r['alert_type'] === null ? 'todos os tipos' : $r['alert_type']);
                $r['kind'] = $r['daily_from'] !== null ? 'diario' : 'intervalo';
                return $r;
            }, $st->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::listSilences');
        }
    }

    public function createSilence(array $data, ?string $by = null): int
    {
        $daily = !empty($data['daily_from']) && !empty($data['daily_to']);
        $range = !empty($data['starts_at']) && !empty($data['ends_at']);

        if (!$daily && !$range) {
            throw new InvalidArgumentException(
                'Informe uma janela diária (de/até) ou um intervalo com início e fim'
            );
        }

        try {
            $st = $this->pdo->prepare(
                'INSERT INTO DT_Silencio_Alerta
                   (connection_id, alert_type, starts_at, ends_at, daily_from, daily_to,
                    reason, created_by, is_active)
                 VALUES (:cid, :t, :sa, :ea, :df, :dt, :r, :by, 1)'
            );
            $st->execute([
                ':cid' => !empty($data['connection_id']) ? (int)$data['connection_id'] : null,
                ':t'   => !empty($data['alert_type']) ? (string)$data['alert_type'] : null,
                ':sa'  => $range ? $data['starts_at'] : null,
                ':ea'  => $range ? $data['ends_at'] : null,
                ':df'  => $daily ? $data['daily_from'] : null,
                ':dt'  => $daily ? $data['daily_to'] : null,
                ':r'   => isset($data['reason']) ? mb_substr((string)$data['reason'], 0, 255) : null,
                ':by'  => $by,
            ]);
            return (int)$this->pdo->lastInsertId();
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::createSilence');
        }
    }

    public function deleteSilence(int $id): bool
    {
        try {
            $st = $this->pdo->prepare('UPDATE DT_Silencio_Alerta SET is_active = 0 WHERE id = :id');
            $st->execute([':id' => $id]);
            return $st->rowCount() > 0;
        } catch (PDOException $e) {
            throw RepositoryException::fromPDOException($e, 'DtAdminRepository::deleteSilence');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // FREQUENCIAS (§36.1) — leitura do cron real, nao de metadado
    // ═══════════════════════════════════════════════════════════════

    /**
     * Frequencias vem do /etc/cron.d/datatables. Deliberadamente SO LEITURA:
     * gravar um valor num banco que nao altera o crontab produziria a mesma
     * mentira do `sync_jobs.cron_expression` deste projeto, que e decorativo.
     */
    public function schedules(): array
    {
        $file = '/etc/cron.d/datatables';
        $out  = ['file' => $file, 'readable' => false, 'entries' => []];

        if (!is_readable($file)) {
            return $out;
        }
        $out['readable'] = true;

        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            if ($line === '' || $line[0] === '#' || !str_contains($line, 'datatables-monitor.php')) {
                continue;
            }
            if (preg_match('/^(\S+\s+\S+\s+\S+\s+\S+\s+\S+)\s+(\S+)\s+.*--mode=(\w+)/', $line, $m)) {
                $out['entries'][] = [
                    'cron'  => $m[1],
                    'user'  => $m[2],
                    'mode'  => $m[3],
                    'human' => self::humanCron($m[1], $m[3]),
                ];
            }
        }
        return $out;
    }

    private static function humanCron(string $expr, string $mode): string
    {
        // O cron real usa espacos multiplos para alinhar as colunas; sem
        // normalizar, todo padrao com espaco unico falha silenciosamente.
        $e = preg_replace('/\s+/', ' ', trim($expr)) ?? $expr;
        [$min, $hour, $dom, $mon, $dow] = array_pad(explode(' ', $e), 5, '*');

        return match (true) {
            str_starts_with($min, '*/')  => 'a cada ' . substr($min, 2) . ' minutos',
            str_starts_with($hour, '*/') => 'a cada ' . substr($hour, 2) . ' horas, aos '
                                            . str_pad($min, 2, '0', STR_PAD_LEFT) . ' min',
            $dow !== '*' => 'semanalmente (' . self::weekday($dow) . ' às '
                            . sprintf('%02d:%02d', (int)$hour, (int)$min) . ')',
            $dom === '*' && $mon === '*' => 'diariamente às '
                            . sprintf('%02d:%02d', (int)$hour, (int)$min),
            default => $e,
        };
    }

    private static function weekday(string $d): string
    {
        $map = ['0' => 'domingo', '1' => 'segunda', '2' => 'terça', '3' => 'quarta',
                '4' => 'quinta', '5' => 'sexta', '6' => 'sábado', '7' => 'domingo'];
        return $map[$d] ?? "dia {$d}";
    }
}
