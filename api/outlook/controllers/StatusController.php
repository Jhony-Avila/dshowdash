<?php
// Outlook / StatusController - estado da integracao e da configuracao
// @version 1.0.0
// @created 2026-07-21
// @app Integracao Outlook
//
// GET /status — visao (mascarada) do estado da Fase 0 para o front/dono:
//   prontidao de cifragem, se a app Microsoft esta configurada, redirect_uri
//   esperado (util no registro do Azure) e resumo das contas do usuario.
declare(strict_types=1);

final class OutlookStatusController
{
    public static function status(string $method, PDO $pdo): void
    {
        if ($method !== 'GET') {
            ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
            return;
        }
        $userId = getCurrentUserId();
        $repo = new OutlookAccountRepository($pdo);
        $accounts = $repo->listPublic($userId);

        $active = array_values(array_filter($accounts, fn($a) => $a['is_active']));
        $needAuth = array_values(array_filter($accounts, fn($a) => in_array($a['connection_status'], ['needs_auth', 'revoked', 'expired'], true)));

        // redirect_uri so e lido se a app estiver minimamente configurada.
        $redirectUri = null;
        try { $redirectUri = GraphOAuth::redirectUri(); } catch (\Throwable $e) { /* nao configurado */ }

        ApiResponse::success([
            'phase'            => 0,
            'crypto_ready'     => OutlookCrypto::isConfigured(),
            'oauth_configured' => GraphOAuth::isConfigured(),
            'tenant'           => GraphOAuth::isConfigured() ? GraphOAuth::tenant() : null,
            'redirect_uri'     => $redirectUri,
            'accounts_total'   => count($accounts),
            'accounts_active'  => count($active),
            'accounts_need_auth' => count($needAuth),
            'accounts'         => $accounts,
            'db_ready'         => true,
        ]);
    }

    /**
     * Status degradado: banco OUTLOOK_DSHOW ainda nao provisionado. Reporta apenas a
     * prontidao de configuracao (util no bootstrap da Fase 0, antes de criar o schema).
     */
    public static function degraded(): void
    {
        $redirectUri = null;
        try { $redirectUri = GraphOAuth::redirectUri(); } catch (\Throwable $e) { /* nao configurado */ }

        ApiResponse::success([
            'phase'            => 0,
            'db_ready'         => false,
            'crypto_ready'     => OutlookCrypto::isConfigured(),
            'oauth_configured' => GraphOAuth::isConfigured(),
            'tenant'           => GraphOAuth::isConfigured() ? GraphOAuth::tenant() : null,
            'redirect_uri'     => $redirectUri,
            'accounts_total'   => 0,
            'accounts_active'  => 0,
            'accounts'         => [],
            'message'          => 'Banco OUTLOOK_DSHOW ainda nao provisionado. Aplique sql/outlook_schema.sql.',
        ]);
    }
}
