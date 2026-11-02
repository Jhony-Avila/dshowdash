<?php
// Outlook / AuthController - contas Microsoft (conectar/callback/desconectar)
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// Rotas (montadas em index.php):
//   GET    /accounts                 lista contas do usuario (mascarada)
//   POST   /accounts/connect         inicia OAuth -> devolve authorize_url
//   GET    /accounts/callback        callback OAuth (browser redirect; SEM CSRF, valida state)
//   POST   /accounts/{id}/reconnect  reinicia OAuth p/ uma conta -> authorize_url
//   PATCH  /accounts/{id}            define conta padrao (body {is_default:true})
//   DELETE /accounts/{id}            desconecta (revoga localmente)
declare(strict_types=1);

final class OutlookAuthController
{
    /**
     * Callback OAuth. Chamado ANTES dos gates de CSRF (o redirect da Microsoft nao
     * carrega token CSRF; a protecao e o parametro `state`, unico e consumido 1x).
     * Responde com REDIRECT do navegador de volta ao SPA — nunca JSON.
     */
    public static function callback(PDO $pdo): void
    {
        $state = isset($_GET['state']) ? (string)$_GET['state'] : '';
        $code  = isset($_GET['code']) ? (string)$_GET['code'] : '';
        $oauthError = isset($_GET['error']) ? (string)$_GET['error'] : '';

        $svc = new OutlookAuthService($pdo);

        // Erro devolvido pela propria Microsoft (ex.: usuario cancelou o consentimento).
        if ($oauthError !== '') {
            $desc = isset($_GET['error_description']) ? (string)$_GET['error_description'] : '';
            (new OutlookLogRepository($pdo))->error('oauth.fail', null, null, $oauthError, $desc);
            self::redirectToSpa(null, 'error', $oauthError);
            return;
        }
        if ($state === '' || $code === '') {
            self::redirectToSpa(null, 'error', 'missing_params');
            return;
        }

        $result = $svc->completeCallback($state, $code);
        if (!($result['ok'] ?? false)) {
            self::redirectToSpa($result['return_to'] ?? null, 'error', $result['error_code'] ?? 'failed');
            return;
        }
        self::redirectToSpa($result['return_to'] ?? null, 'connected', null);
    }

    public static function route(string $method, array $segments, PDO $pdo): void
    {
        // $segments[0] === 'accounts'
        $sub = $segments[1] ?? '';

        // /accounts (lista) | /accounts/connect
        if ($sub === '' || $sub === null) {
            if ($method === 'GET') { self::listAccounts($pdo); return; }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405, ['message' => 'Use GET para listar contas.']);
            return;
        }
        if ($sub === 'connect') {
            if ($method === 'POST') { self::connect($pdo); return; }
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            return;
        }
        if ($sub === 'callback') {
            // Tratado em index.php antes dos gates; se cair aqui, e metodo/rota invalidos.
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
            return;
        }

        // /accounts/{id}[/reconnect]
        $accountId = (int)$sub;
        if ($accountId <= 0) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta invalida.']);
            return;
        }
        $action = $segments[2] ?? '';

        if ($action === 'reconnect' && $method === 'POST') { self::reconnect($pdo, $accountId); return; }
        if ($action === '' && $method === 'PATCH')  { self::patch($pdo, $accountId); return; }
        if ($action === '' && $method === 'DELETE') { self::disconnect($pdo, $accountId); return; }

        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota de conta desconhecida.']);
    }

    private static function listAccounts(PDO $pdo): void
    {
        $userId = getCurrentUserId();
        $repo = new OutlookAccountRepository($pdo);
        ApiResponse::success([
            'accounts'         => $repo->listPublic($userId),
            'oauth_configured' => GraphOAuth::isConfigured(),
            'crypto_ready'     => OutlookCrypto::isConfigured(),
        ]);
    }

    private static function connect(PDO $pdo): void
    {
        if (!self::assertConfigured()) { return; }
        $userId = getCurrentUserId();
        $body = outlook_body();
        $returnTo = self::safeReturnTo($body['return_to'] ?? null);
        try {
            $url = (new OutlookAuthService($pdo))->beginConnect($userId, $returnTo, 'connect');
        } catch (GraphOAuthException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 503, ['message' => 'Integracao Microsoft nao configurada: ' . $e->getMessage()]);
            return;
        }
        ApiResponse::success(['authorize_url' => $url]);
    }

    private static function reconnect(PDO $pdo, int $accountId): void
    {
        if (!self::assertConfigured()) { return; }
        $userId = getCurrentUserId();
        $repo = new OutlookAccountRepository($pdo);
        if ($repo->getPublic($userId, $accountId) === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta nao encontrada.']);
            return;
        }
        $body = outlook_body();
        $returnTo = self::safeReturnTo($body['return_to'] ?? null);
        try {
            $url = (new OutlookAuthService($pdo))->beginConnect($userId, $returnTo, 'reconnect', $accountId);
        } catch (GraphOAuthException $e) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 503, ['message' => $e->getMessage()]);
            return;
        }
        ApiResponse::success(['authorize_url' => $url]);
    }

    private static function patch(PDO $pdo, int $accountId): void
    {
        $userId = getCurrentUserId();
        $body = outlook_body();
        $repo = new OutlookAccountRepository($pdo);
        if (array_key_exists('is_default', $body) && $body['is_default']) {
            if (!$repo->setDefault($userId, $accountId)) {
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta nao encontrada ou inativa.']);
                return;
            }
        }
        $acc = $repo->getPublic($userId, $accountId);
        if ($acc === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
            return;
        }
        ApiResponse::success(['account' => $acc]);
    }

    private static function disconnect(PDO $pdo, int $accountId): void
    {
        $userId = getCurrentUserId();
        $ok = (new OutlookAuthService($pdo))->disconnect($userId, $accountId);
        if (!$ok) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Conta nao encontrada ou ja desconectada.']);
            return;
        }
        ApiResponse::success(['disconnected' => true, 'account_id' => $accountId]);
    }

    private static function assertConfigured(): bool
    {
        if (!OutlookCrypto::isConfigured()) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 503, ['message' => 'OUTLOOK_CRYPTO_KEY ausente. Configure a chave de cifragem no .env.']);
            return false;
        }
        if (!GraphOAuth::isConfigured()) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 503, ['message' => 'App Microsoft nao registrada. Configure MS_OAUTH_* no .env.']);
            return false;
        }
        return true;
    }

    /** So aceita rota interna do SPA (comeca com / e sem host) para evitar open-redirect. */
    private static function safeReturnTo($v): ?string
    {
        if (!is_string($v) || $v === '') { return null; }
        if ($v[0] !== '/' || strpos($v, '//') === 0) { return null; }
        return mb_substr($v, 0, 512);
    }

    /** Redireciona o navegador de volta ao SPA de contas, sinalizando o resultado. */
    private static function redirectToSpa(?string $returnTo, string $status, ?string $code): void
    {
        $base = ($returnTo && $returnTo[0] === '/') ? $returnTo : '/#/panel-outlook/contas';
        $sep = strpos($base, '?') === false ? '?' : '&';
        $q = 'outlook_auth=' . rawurlencode($status);
        if ($code !== null) { $q .= '&reason=' . rawurlencode($code); }
        header('Location: ' . $base . $sep . $q, true, 302);
        echo '';
    }
}
