<?php
// Outlook / OAuthStateRepository - estado efemero do fluxo OAuth (PKCE)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Guarda o par (state, code_verifier) por poucos minutos entre o inicio do
// consentimento e o callback. O state opaco protege o callback contra CSRF/replay.
// O code_verifier e cifrado em repouso (OutlookCrypto). Linhas sao consumidas 1x.
declare(strict_types=1);

final class OutlookOAuthStateRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Cria um novo estado. Devolve o state opaco (hex) a colocar na authorize URL.
     * @param string $purpose 'connect'|'reconnect'
     */
    public function create(
        int $userId,
        string $codeVerifier,
        string $redirectUri,
        ?string $returnTo,
        string $purpose = 'connect',
        ?int $reconnectAccountId = null,
        int $ttlSeconds = 600
    ): string {
        $state = bin2hex(random_bytes(32)); // 64 hex chars
        $st = $this->pdo->prepare(
            "INSERT INTO outlook_oauth_states
               (state, user_id, code_verifier_cipher, redirect_uri, return_to,
                purpose, reconnect_account_id, expires_at)
             VALUES
               (:state, :uid, :cv, :ru, :rt, :purpose, :racc,
                DATE_ADD(UTC_TIMESTAMP(), INTERVAL :ttl SECOND))"
        );
        $st->execute([
            ':state'   => $state,
            ':uid'     => $userId,
            ':cv'      => OutlookCrypto::encrypt($codeVerifier),
            ':ru'      => $redirectUri,
            ':rt'      => $returnTo,
            ':purpose' => $purpose,
            ':racc'    => $reconnectAccountId,
            ':ttl'     => $ttlSeconds,
        ]);
        return $state;
    }

    /**
     * Consome (1x) um state valido e nao-expirado. Devolve os dados do fluxo com o
     * code_verifier ja decifrado, ou null se invalido/expirado/ja usado.
     * Marca used_at atomically para evitar replay.
     */
    public function consume(string $state): ?array
    {
        // Marca como usado apenas se ainda valido — a linha afetada prova a posse.
        $upd = $this->pdo->prepare(
            "UPDATE outlook_oauth_states
                SET used_at = UTC_TIMESTAMP()
              WHERE state = :state
                AND used_at IS NULL
                AND expires_at > UTC_TIMESTAMP()"
        );
        $upd->execute([':state' => $state]);
        if ($upd->rowCount() === 0) {
            return null;
        }
        $sel = $this->pdo->prepare("SELECT * FROM outlook_oauth_states WHERE state = :state LIMIT 1");
        $sel->execute([':state' => $state]);
        $row = $sel->fetch();
        if (!$row) {
            return null;
        }
        $row['code_verifier'] = OutlookCrypto::decrypt($row['code_verifier_cipher']);
        unset($row['code_verifier_cipher']);
        return $row;
    }

    /** Limpa estados expirados/usados (chamar oportunisticamente). */
    public function gc(): int
    {
        $st = $this->pdo->prepare(
            "DELETE FROM outlook_oauth_states
              WHERE expires_at < UTC_TIMESTAMP()
                 OR used_at IS NOT NULL"
        );
        $st->execute();
        return $st->rowCount();
    }
}
