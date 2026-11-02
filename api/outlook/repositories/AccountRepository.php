<?php
// Outlook / AccountRepository - persistencia das contas Microsoft (outlook_accounts)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Multi-conta por usuario. Tokens (access + refresh) cifrados em repouso
// (OutlookCrypto). O texto puro NUNCA e persistido, logado nem devolvido ao front.
// TODAS as consultas sao escopadas por user_id (isolamento §26.1: um usuario nunca
// acessa contas de outro).
declare(strict_types=1);

final class OutlookAccountRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Linha ativa por id, escopada ao usuario (crua, inclui tokens cifrados). Uso interno. */
    public function getOwnedRaw(int $userId, int $accountId): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT * FROM outlook_accounts WHERE id = :id AND user_id = :uid LIMIT 1"
        );
        $st->execute([':id' => $accountId, ':uid' => $userId]);
        $row = $st->fetch();
        return $row ?: null;
    }

    /**
     * Cria ou atualiza a conta a partir do resultado da troca de code.
     * Cifra access + refresh; marca connection_status='connected'.
     * Chave natural: (user_id, microsoft_account_id).
     * @return int id da conta
     */
    public function upsertFromTokens(int $userId, array $identity, array $tokens): int
    {
        $accessCipher  = OutlookCrypto::encrypt((string)($tokens['access_token'] ?? ''));
        $refreshCipher = isset($tokens['refresh_token']) && $tokens['refresh_token'] !== ''
            ? OutlookCrypto::encrypt((string)$tokens['refresh_token'])
            : null;
        $expiresIn = (int)($tokens['expires_in'] ?? 3600);

        $sql = "INSERT INTO outlook_accounts
                  (user_id, provider, microsoft_account_id, tenant_id, email, display_name,
                   account_type, connection_status, scopes,
                   token_encrypted, refresh_token_encrypted,
                   token_expires_at, last_success_at,
                   last_error_code, last_error_message, is_active, disconnected_at)
                VALUES
                  (:uid, 'microsoft', :msid, :tid, :email, :dname,
                   :atype, 'connected', :scopes,
                   :access, :refresh,
                   DATE_ADD(UTC_TIMESTAMP(), INTERVAL :expin SECOND), UTC_TIMESTAMP(),
                   NULL, NULL, 1, NULL)
                ON DUPLICATE KEY UPDATE
                   tenant_id           = VALUES(tenant_id),
                   email               = VALUES(email),
                   display_name        = VALUES(display_name),
                   account_type        = VALUES(account_type),
                   connection_status   = 'connected',
                   scopes              = VALUES(scopes),
                   token_encrypted     = VALUES(token_encrypted),
                   refresh_token_encrypted = COALESCE(VALUES(refresh_token_encrypted), refresh_token_encrypted),
                   token_expires_at    = VALUES(token_expires_at),
                   last_success_at     = UTC_TIMESTAMP(),
                   last_error_code     = NULL,
                   last_error_message  = NULL,
                   is_active           = 1,
                   disconnected_at     = NULL";
        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':uid'    => $userId,
            ':msid'   => $identity['microsoft_account_id'] ?? null,
            ':tid'    => $identity['tenant_id'] ?? null,
            ':email'  => $identity['email'] ?? null,
            ':dname'  => $identity['display_name'] ?? null,
            ':atype'  => $identity['account_type'] ?? 'unknown',
            ':scopes' => $tokens['scope'] ?? null,
            ':access' => $accessCipher,
            ':refresh'=> $refreshCipher,
            ':expin'  => $expiresIn,
        ]);

        // Recupera o id (INSERT novo ou UPDATE de linha existente).
        $id = (int)$this->pdo->lastInsertId();
        if ($id === 0 && !empty($identity['microsoft_account_id'])) {
            $q = $this->pdo->prepare(
                "SELECT id FROM outlook_accounts WHERE user_id = :uid AND microsoft_account_id = :msid LIMIT 1"
            );
            $q->execute([':uid' => $userId, ':msid' => $identity['microsoft_account_id']]);
            $id = (int)($q->fetchColumn() ?: 0);
        }

        // Se for a unica conta ativa do usuario, torna-a padrao de envio.
        $this->ensureSingleDefault($userId, $id);
        return $id;
    }

    /**
     * Atualiza os tokens apos um refresh bem-sucedido. Rotaciona o refresh se veio novo.
     */
    public function updateTokens(int $accountId, array $tokens): void
    {
        $accessCipher = OutlookCrypto::encrypt((string)($tokens['access_token'] ?? ''));
        $refreshCipher = isset($tokens['refresh_token']) && $tokens['refresh_token'] !== ''
            ? OutlookCrypto::encrypt((string)$tokens['refresh_token'])
            : null;
        $expiresIn = (int)($tokens['expires_in'] ?? 3600);

        $st = $this->pdo->prepare(
            "UPDATE outlook_accounts SET
                token_encrypted = :access,
                refresh_token_encrypted = COALESCE(:refresh, refresh_token_encrypted),
                token_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL :expin SECOND),
                connection_status = 'connected',
                last_success_at = UTC_TIMESTAMP(),
                last_error_code = NULL,
                last_error_message = NULL
             WHERE id = :id"
        );
        $st->execute([
            ':access' => $accessCipher,
            ':refresh'=> $refreshCipher,
            ':expin'  => $expiresIn,
            ':id'     => $accountId,
        ]);
    }

    public function decryptAccessToken(array $row): ?string
    {
        if (empty($row['token_encrypted'])) {
            return null;
        }
        return OutlookCrypto::decrypt($row['token_encrypted']);
    }

    public function decryptRefreshToken(array $row): ?string
    {
        if (empty($row['refresh_token_encrypted'])) {
            return null;
        }
        return OutlookCrypto::decrypt($row['refresh_token_encrypted']);
    }

    /** Marca status/erro de uma conta (ex.: consentimento revogado). */
    public function markStatus(int $accountId, string $status, ?string $errorCode = null, ?string $errorMsg = null): void
    {
        $st = $this->pdo->prepare(
            "UPDATE outlook_accounts SET
                connection_status = :s,
                last_error_code = :ec,
                last_error_message = :em
             WHERE id = :id"
        );
        $st->execute([
            ':s'  => $status,
            ':ec' => $errorCode,
            ':em' => $errorMsg !== null ? mb_substr($errorMsg, 0, 512) : null,
            ':id' => $accountId,
        ]);
    }

    /**
     * Desconecta: desativa a conta e zera os tokens (revogacao local). Escopado ao usuario.
     * @return bool true se havia conta ativa para desligar.
     */
    public function disconnect(int $userId, int $accountId): bool
    {
        $st = $this->pdo->prepare(
            "UPDATE outlook_accounts SET
                is_active = 0,
                connection_status = 'disconnected',
                token_encrypted = NULL,
                refresh_token_encrypted = NULL,
                token_expires_at = NULL,
                is_default = 0,
                disconnected_at = UTC_TIMESTAMP()
             WHERE id = :id AND user_id = :uid AND is_active = 1"
        );
        $st->execute([':id' => $accountId, ':uid' => $userId]);
        $ok = $st->rowCount() > 0;
        if ($ok) {
            // Promove outra conta ativa a padrao, se houver.
            $this->ensureSingleDefault($userId, null);
        }
        return $ok;
    }

    /** Define a conta padrao de envio (escopado ao usuario). */
    public function setDefault(int $userId, int $accountId): bool
    {
        $chk = $this->pdo->prepare(
            "SELECT id FROM outlook_accounts WHERE id = :id AND user_id = :uid AND is_active = 1 LIMIT 1"
        );
        $chk->execute([':id' => $accountId, ':uid' => $userId]);
        if (!$chk->fetchColumn()) {
            return false;
        }
        $this->pdo->prepare("UPDATE outlook_accounts SET is_default = 0 WHERE user_id = :uid")
            ->execute([':uid' => $userId]);
        $this->pdo->prepare("UPDATE outlook_accounts SET is_default = 1 WHERE id = :id AND user_id = :uid")
            ->execute([':id' => $accountId, ':uid' => $userId]);
        return true;
    }

    /**
     * Garante exatamente 1 conta padrao ativa por usuario. Se $preferId for dado e
     * valido, prioriza-o; senao mantem/eleva a primeira ativa.
     */
    private function ensureSingleDefault(int $userId, ?int $preferId): void
    {
        $count = $this->pdo->prepare(
            "SELECT COUNT(*) FROM outlook_accounts WHERE user_id = :uid AND is_active = 1 AND is_default = 1"
        );
        $count->execute([':uid' => $userId]);
        if ((int)$count->fetchColumn() === 1) {
            return; // ja consistente
        }
        // Zera e reelege.
        $this->pdo->prepare("UPDATE outlook_accounts SET is_default = 0 WHERE user_id = :uid")
            ->execute([':uid' => $userId]);
        $target = $preferId;
        if ($target === null) {
            $q = $this->pdo->prepare(
                "SELECT id FROM outlook_accounts WHERE user_id = :uid AND is_active = 1 ORDER BY id ASC LIMIT 1"
            );
            $q->execute([':uid' => $userId]);
            $target = (int)($q->fetchColumn() ?: 0) ?: null;
        }
        if ($target !== null) {
            $this->pdo->prepare("UPDATE outlook_accounts SET is_default = 1 WHERE id = :id AND user_id = :uid AND is_active = 1")
                ->execute([':id' => $target, ':uid' => $userId]);
        }
    }

    /** Lista publica (mascarada) das contas do usuario. NUNCA inclui tokens. */
    public function listPublic(int $userId): array
    {
        $st = $this->pdo->prepare(
            "SELECT id, microsoft_account_id, tenant_id, email, display_name, account_type,
                    is_default, is_active, connection_status, scopes, token_expires_at,
                    last_sync_at, last_success_at, last_error_code, last_error_message,
                    created_at, updated_at, disconnected_at
               FROM outlook_accounts
              WHERE user_id = :uid
              ORDER BY is_active DESC, is_default DESC, id ASC"
        );
        $st->execute([':uid' => $userId]);
        $rows = $st->fetchAll();
        return array_map([self::class, 'toPublic'], $rows);
    }

    /** Uma conta publica (mascarada) do usuario, ou null. */
    public function getPublic(int $userId, int $accountId): ?array
    {
        $row = $this->getOwnedRaw($userId, $accountId);
        return $row ? self::toPublic($row) : null;
    }

    private static function toPublic(array $row): array
    {
        return [
            'id'                 => (int)$row['id'],
            'microsoft_account_id' => $row['microsoft_account_id'] ?? null,
            'tenant_id'          => $row['tenant_id'] ?? null,
            'email'              => $row['email'] ?? null,
            'display_name'       => $row['display_name'] ?? null,
            'account_type'       => $row['account_type'] ?? 'unknown',
            'is_default'         => (int)($row['is_default'] ?? 0) === 1,
            'is_active'          => (int)($row['is_active'] ?? 0) === 1,
            'connection_status'  => $row['connection_status'] ?? 'disconnected',
            'scopes'             => $row['scopes'] ?? null,
            'token_expires_at'   => $row['token_expires_at'] ?? null,
            'last_sync_at'       => $row['last_sync_at'] ?? null,
            'last_success_at'    => $row['last_success_at'] ?? null,
            'last_error_code'    => $row['last_error_code'] ?? null,
            'last_error_message' => $row['last_error_message'] ?? null,
            'created_at'         => $row['created_at'] ?? null,
            'disconnected_at'    => $row['disconnected_at'] ?? null,
        ];
    }
}
