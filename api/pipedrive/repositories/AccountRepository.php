<?php
// Pipedrive / AccountRepository - persistencia da credencial (pipe_accounts)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Guarda 1 conexao ativa. Token cifrado em repouso (PipeCrypto). O texto puro
// NUNCA e persistido, logado nem devolvido ao front (so token_last4).
declare(strict_types=1);

final class PipeAccountRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Linha ativa (crua, inclui token_cipher). Uso interno — nunca expor. */
    public function getActiveRaw(): ?array
    {
        $st = $this->pdo->query(
            "SELECT * FROM pipe_accounts WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1"
        );
        $row = $st->fetch();
        return $row ?: null;
    }

    /** Token decifrado da conexao ativa (uso backend). null se ausente. */
    public function getActiveToken(): ?string
    {
        $row = $this->getActiveRaw();
        if (!$row || empty($row['token_cipher'])) {
            return null;
        }
        return PipeCrypto::decrypt($row['token_cipher']);
    }

    /**
     * Grava/atualiza a conexao a partir do payload validado de /users/me.
     * Cifra o token; marca status='connected'.
     */
    public function upsertFromValidation(array $me, string $token, string $authMethod = 'token'): void
    {
        $cipher = PipeCrypto::encrypt($token);
        $last4  = PipeCrypto::last4($token);
        $companyId = isset($me['company_id']) ? (int)$me['company_id'] : null;

        // desativa outras conexoes (mantemos 1 ativa)
        $this->pdo->exec("UPDATE pipe_accounts SET is_active = 0 WHERE is_active = 1");

        $sql = "INSERT INTO pipe_accounts
                  (auth_method, company_id, company_name, company_domain, api_domain,
                   token_cipher, token_last4, scopes, connected_user_id, connected_user_name,
                   status, last_validated_at, last_error, is_active)
                VALUES
                  (:auth_method, :company_id, :company_name, :company_domain, :api_domain,
                   :token_cipher, :token_last4, :scopes, :cu_id, :cu_name,
                   'connected', NOW(), NULL, 1)
                ON DUPLICATE KEY UPDATE
                   auth_method = VALUES(auth_method),
                   company_name = VALUES(company_name),
                   company_domain = VALUES(company_domain),
                   api_domain = VALUES(api_domain),
                   token_cipher = VALUES(token_cipher),
                   token_last4 = VALUES(token_last4),
                   scopes = VALUES(scopes),
                   connected_user_id = VALUES(connected_user_id),
                   connected_user_name = VALUES(connected_user_name),
                   status = 'connected',
                   last_validated_at = NOW(),
                   last_error = NULL,
                   is_active = 1";
        $st = $this->pdo->prepare($sql);
        $domain = $me['company_domain'] ?? null;
        $st->execute([
            ':auth_method'  => $authMethod,
            ':company_id'   => $companyId,
            ':company_name' => $me['company_name'] ?? null,
            ':company_domain' => $domain,
            ':api_domain'   => $domain ? ('https://' . $domain . '.pipedrive.com') : null,
            ':token_cipher' => $cipher,
            ':token_last4'  => $last4,
            ':scopes'       => null,
            ':cu_id'        => isset($me['id']) ? (int)$me['id'] : null,
            ':cu_name'      => $me['name'] ?? null,
        ]);
    }

    /** Atualiza status/erro da conexao ativa (ex.: falha de revalidacao). */
    public function markStatus(string $status, ?string $error = null): void
    {
        $st = $this->pdo->prepare(
            "UPDATE pipe_accounts SET status = :s, last_error = :e,
                 last_validated_at = IF(:s2 = 'connected', NOW(), last_validated_at)
             WHERE is_active = 1"
        );
        $st->execute([':s' => $status, ':e' => $error, ':s2' => $status]);
    }

    /**
     * Desconecta: desativa a conexao ativa. A linha (token cifrado) fica inerte,
     * fora do alcance de getActiveRaw() — publicStatus() volta a 'not_configured'.
     * status='not_configured' e o unico valor "desligado" do ENUM (nao ha 'disconnected').
     * Reversivel: reconectar a mesma empresa reativa a linha via ON DUPLICATE KEY.
     * @return bool true se havia uma conexao ativa para desligar.
     */
    public function deactivateActive(): bool
    {
        $st = $this->pdo->prepare(
            "UPDATE pipe_accounts SET is_active = 0, status = 'not_configured', last_error = NULL
             WHERE is_active = 1"
        );
        $st->execute();
        return $st->rowCount() > 0;
    }

    /** Visao publica mascarada (para /status). Nunca inclui o token. */
    public function publicStatus(): array
    {
        $row = $this->getActiveRaw();
        if (!$row) {
            return [
                'configured' => false,
                'status'     => 'not_configured',
                'crypto_ready' => PipeCrypto::isConfigured(),
            ];
        }
        return [
            'configured'   => true,
            'status'       => $row['status'],
            'auth_method'  => $row['auth_method'],
            'company_id'   => $row['company_id'] !== null ? (int)$row['company_id'] : null,
            'company_name' => $row['company_name'],
            'company_domain' => $row['company_domain'],
            'connected_user_id'   => $row['connected_user_id'] !== null ? (int)$row['connected_user_id'] : null,
            'connected_user_name' => $row['connected_user_name'],
            'token_last4'  => $row['token_last4'],
            'last_validated_at' => $row['last_validated_at'],
            'last_error'   => $row['last_error'],
            'crypto_ready' => PipeCrypto::isConfigured(),
        ];
    }

    /** Log de chamada a API externa (pipe_api_requests). Sem token/headers de auth. */
    public function logApiRequest(string $method, string $endpoint, array $res): void
    {
        try {
            $meta = $res['meta'] ?? [];
            $st = $this->pdo->prepare(
                "INSERT INTO pipe_api_requests
                   (correlation_id, method, endpoint, http_status, duration_ms,
                    ratelimit_remaining, daily_requests_left, result, error_message)
                 VALUES (:cid, :m, :ep, :st, :dur, :rl, :daily, :res, :err)"
            );
            $st->execute([
                ':cid'   => bin2hex(random_bytes(8)),
                ':m'     => $method,
                ':ep'    => $endpoint,
                ':st'    => $res['status'] ?? null,
                ':dur'   => $meta['duration_ms'] ?? null,
                ':rl'    => $meta['ratelimit_remaining'] ?? null,
                ':daily' => $meta['daily_token_left'] ?? null,
                ':res'   => ($res['ok'] ?? false) ? 'ok' : 'error',
                ':err'   => ($res['ok'] ?? false) ? null : substr((string)($res['error'] ?? ''), 0, 500),
            ]);
        } catch (\Throwable $e) {
            error_log('[pipedrive] logApiRequest falhou: ' . $e->getMessage());
        }
    }
}
