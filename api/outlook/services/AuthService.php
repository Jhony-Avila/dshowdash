<?php
// Outlook / AuthService - orquestra OAuth delegado + ciclo de vida do token
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Orquestra (briefing §8):
//   beginConnect()      -> gera PKCE+state, devolve a authorize URL (front redireciona)
//   completeCallback()  -> consome state, troca code, identifica a conta, persiste
//   disconnect()        -> revoga localmente (zera tokens)
//   accessTokenFor()    -> devolve access_token valido, renovando via refresh se perto de expirar
//
// O access_token/refresh_token NUNCA saem deste backend.
declare(strict_types=1);

final class OutlookAuthService
{
    /** Tenant "consumers" da Microsoft = contas pessoais (Outlook.com/Hotmail/Live). */
    private const CONSUMERS_TID = '9188040d-6c67-4c5b-b112-36a304b66dad';

    /** Margem (s) antes da expiracao para renovar proativamente. */
    private const REFRESH_SKEW = 300;

    private PDO $pdo;
    private OutlookAccountRepository $accounts;
    private OutlookOAuthStateRepository $states;
    private OutlookLogRepository $logs;

    public function __construct(PDO $pdo)
    {
        $this->pdo      = $pdo;
        $this->accounts = new OutlookAccountRepository($pdo);
        $this->states   = new OutlookOAuthStateRepository($pdo);
        $this->logs     = new OutlookLogRepository($pdo);
    }

    public function accountsRepo(): OutlookAccountRepository { return $this->accounts; }

    /**
     * Inicia o consentimento. Devolve a authorize URL para o front redirecionar o navegador.
     * @throws GraphOAuthException se a app nao esta configurada.
     */
    public function beginConnect(int $userId, ?string $returnTo = null, string $purpose = 'connect', ?int $reconnectAccountId = null): string
    {
        $this->states->gc(); // limpeza oportunistica
        $verifier  = GraphOAuth::newCodeVerifier();
        $challenge = GraphOAuth::codeChallenge($verifier);
        $state = $this->states->create(
            $userId,
            $verifier,
            GraphOAuth::redirectUri(),
            $returnTo,
            $purpose,
            $reconnectAccountId
        );
        return GraphOAuth::authorizeUrl($state, $challenge);
    }

    /**
     * Completa o callback OAuth. Consome o state, troca o code por tokens, identifica a
     * conta (id_token + /me) e persiste.
     * @return array ['ok'=>bool, 'account'=>?array(publica), 'return_to'=>?string, 'error'=>?string, 'error_code'=>?string]
     */
    public function completeCallback(string $state, string $code): array
    {
        $flow = $this->states->consume($state);
        if ($flow === null) {
            $this->logs->error('oauth.fail', null, null, 'INVALID_STATE', 'State invalido, expirado ou ja usado');
            return ['ok' => false, 'error' => 'Sessao de autorizacao invalida ou expirada. Tente conectar novamente.', 'error_code' => 'INVALID_STATE'];
        }
        $userId = (int)$flow['user_id'];

        try {
            $tokens = GraphOAuth::exchangeCode($code, $flow['code_verifier']);
        } catch (GraphOAuthException $e) {
            $this->logs->error('oauth.fail', $userId, null, 'TOKEN_EXCHANGE', $e->getMessage());
            return ['ok' => false, 'error' => 'Nao foi possivel concluir a autorizacao com a Microsoft.', 'error_code' => 'TOKEN_EXCHANGE', 'return_to' => $flow['return_to'] ?? null];
        }

        $identity = $this->resolveIdentity($tokens);
        $accountId = $this->accounts->upsertFromTokens($userId, $identity, $tokens);

        $this->logs->info('account.connect', $userId, $accountId, 'Conta Microsoft conectada', [
            'account_type' => $identity['account_type'] ?? 'unknown',
            'scopes'       => $tokens['scope'] ?? null,
        ]);

        return [
            'ok'        => true,
            'account'   => $this->accounts->getPublic($userId, $accountId),
            'return_to' => $flow['return_to'] ?? null,
        ];
    }

    /** Desconecta (revoga localmente) uma conta do usuario. */
    public function disconnect(int $userId, int $accountId): bool
    {
        $ok = $this->accounts->disconnect($userId, $accountId);
        if ($ok) {
            $this->logs->info('account.disconnect', $userId, $accountId, 'Conta desconectada');
        }
        return $ok;
    }

    /**
     * Devolve um access_token valido para a conta (renova via refresh se perto de expirar
     * ou se $force). Em invalid_grant (consentimento revogado/expirado), marca needs_auth
     * e devolve null.
     * @return string|null access_token em texto puro (uso imediato; nunca persistir/logar)
     */
    public function accessTokenFor(int $userId, int $accountId, bool $force = false): ?string
    {
        $row = $this->accounts->getOwnedRaw($userId, $accountId);
        if (!$row || (int)$row['is_active'] !== 1) {
            return null;
        }

        $expiresAt = isset($row['token_expires_at']) ? strtotime($row['token_expires_at'] . ' UTC') : 0;
        $nowUtc = time();
        $needsRefresh = $force
            || empty($row['token_encrypted'])
            || $expiresAt === false
            || $expiresAt <= ($nowUtc + self::REFRESH_SKEW);

        if (!$needsRefresh) {
            return $this->accounts->decryptAccessToken($row);
        }

        $refresh = $this->accounts->decryptRefreshToken($row);
        if ($refresh === null) {
            // Sem refresh token: so reautenticando.
            $this->accounts->markStatus($accountId, 'needs_auth', 'NO_REFRESH_TOKEN', 'Sem refresh token; reconecte a conta.');
            $this->logs->error('token.refresh', $userId, $accountId, 'NO_REFRESH_TOKEN', 'Sem refresh token');
            return null;
        }

        try {
            $tokens = GraphOAuth::refresh($refresh);
        } catch (GraphOAuthException $e) {
            $code = $this->classifyRefreshError($e->getMessage());
            $status = $code === 'invalid_grant' ? 'revoked' : 'error';
            $this->accounts->markStatus($accountId, $status, $code, $e->getMessage());
            $this->logs->error('token.refresh', $userId, $accountId, $code, $e->getMessage());
            return null;
        }

        $this->accounts->updateTokens($accountId, $tokens);
        return (string)($tokens['access_token'] ?? '') ?: null;
    }

    /** Extrai identidade da conta a partir do id_token e, quando possivel, de /me. */
    private function resolveIdentity(array $tokens): array
    {
        $claims = GraphOAuth::decodeIdToken($tokens['id_token'] ?? null);
        $tid = $claims['tid'] ?? null;
        $identity = [
            'microsoft_account_id' => $claims['oid'] ?? ($claims['sub'] ?? null),
            'tenant_id'   => $tid,
            'email'       => $claims['preferred_username'] ?? ($claims['email'] ?? null),
            'display_name'=> $claims['name'] ?? null,
            'account_type'=> $tid === self::CONSUMERS_TID ? 'personal' : ($tid ? 'work' : 'unknown'),
        ];

        // Enriquecimento best-effort via /me (mail confiavel e userPrincipalName).
        $access = (string)($tokens['access_token'] ?? '');
        if ($access !== '') {
            try {
                $graph = new GraphClient($access);
                $me = $graph->get('/me', ['$select' => 'id,displayName,mail,userPrincipalName']);
                if ($me['ok'] && is_array($me['data'])) {
                    $d = $me['data'];
                    $identity['microsoft_account_id'] = $identity['microsoft_account_id'] ?: ($d['id'] ?? null);
                    $identity['display_name'] = $d['displayName'] ?? $identity['display_name'];
                    $identity['email'] = $d['mail'] ?? ($d['userPrincipalName'] ?? $identity['email']);
                }
            } catch (\Throwable $e) {
                error_log('[outlook] resolveIdentity /me falhou: ' . $e->getMessage());
            }
        }
        return $identity;
    }

    private function classifyRefreshError(string $msg): string
    {
        return strpos($msg, 'invalid_grant') === 0 ? 'invalid_grant' : 'REFRESH_FAILED';
    }
}
