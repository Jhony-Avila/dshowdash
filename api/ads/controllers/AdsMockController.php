<?php
// Ads / AdsMockController - roteia TODAS as rotas para o provedor AdsMock
// @version 1.0.0
// @created 2026-07-21
// @app Ads Intelligence
//
// Ativo quando ADS_PROVIDER=mock. Bypassa Google Ads API e ADS_DSHOW: serve dados
// ficticios deterministicos com estado mutavel por sessao (contas). Espelha os
// envelopes que os controllers reais terao na Fase 1.
declare(strict_types=1);

final class AdsMockController
{
    /** Callback do fluxo "conectar" (roteado antes do gate CSRF, como o real). */
    public static function callback(): void
    {
        AdsMock::connectAccount();
        $returnTo = isset($_GET['return_to']) ? (string)$_GET['return_to'] : '';
        $base = ($returnTo !== '' && $returnTo[0] === '/') ? $returnTo : '/#/panel-ads/contas';
        $sep = strpos($base, '?') === false ? '?' : '&';
        header('Location: ' . $base . $sep . 'ads_auth=connected', true, 302);
    }

    public static function route(string $method, array $segments): void
    {
        $seg0 = $segments[0] ?? '';
        switch ($seg0) {
            case '':
            case 'status':
                ApiResponse::success(AdsMock::status());
                return;

            case 'summary':
                $s = AdsMock::status();
                ApiResponse::success(['configured' => true, 'provider' => 'mock',
                    'accounts' => $s['accounts_total'], 'cost' => self::accCost()]);
                return;

            case 'accounts':
                self::accounts($method, $segments);
                return;

            case 'dashboard':
                self::guardGet($method);
                ApiResponse::success(AdsMock::dashboard(self::accId(), (string)ads_query('period', '30d')));
                return;

            case 'board':
                self::guardGet($method);
                ApiResponse::success(AdsMock::board(self::accId(), (string)ads_query('period', '30d')));
                return;

            case 'campaigns':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::campaigns(self::accId())]);
                return;

            case 'ad-groups':
                self::guardGet($method);
                $camp = ads_query('campaign_id');
                ApiResponse::success(['items' => AdsMock::adGroups(self::accId(), $camp !== null ? (int)$camp : null)]);
                return;

            case 'ads':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::ads(self::accId())]);
                return;

            case 'keywords':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::keywords(self::accId())]);
                return;

            case 'search-terms':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::searchTerms(self::accId())]);
                return;

            case 'recommendations':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::recommendations(self::accId())]);
                return;

            case 'devices':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::devices(self::accId())]);
                return;

            case 'locations':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::locations(self::accId())]);
                return;

            case 'hours':
                self::guardGet($method);
                ApiResponse::success(AdsMock::hours(self::accId()));
                return;

            case 'conversions':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::conversions(self::accId())]);
                return;

            case 'audiences':
                self::guardGet($method);
                ApiResponse::success([
                    'items' => AdsMock::audiences(self::accId()),
                    'overlap' => AdsMock::audienceOverlap(self::accId()),
                ]);
                return;

            case 'landing-pages':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::landingPages(self::accId())]);
                return;

            case 'budgets':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::budgets(self::accId())]);
                return;

            case 'quality':
                self::guardGet($method);
                ApiResponse::success(AdsMock::quality(self::accId()));
                return;

            case 'funnel':
                self::guardGet($method);
                ApiResponse::success(AdsMock::funnelFull(self::accId()));
                return;

            case 'alerts':
                self::guardGet($method);
                ApiResponse::success(AdsMock::alerts(self::accId()));
                return;

            case 'reports':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::reports()]);
                return;

            case 'history':
                self::guardGet($method);
                ApiResponse::success(['items' => AdsMock::history(self::accId())]);
                return;

            case 'mock':
                if (($segments[1] ?? '') === 'reset' && $method === 'POST') {
                    AdsMock::reset();
                    ApiResponse::success(['reset' => true]);
                    return;
                }
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
                return;

            default:
                ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota mock desconhecida: /' . implode('/', $segments)]);
        }
    }

    // ── contas ──────────────────────────────────────────────────────────
    private static function accounts(string $method, array $segments): void
    {
        $sub = $segments[1] ?? '';
        if ($sub === '' && $method === 'GET') {
            ApiResponse::success(['accounts' => AdsMock::accountsPublic(), 'provider' => 'mock']);
            return;
        }
        if ($sub === 'connect' && $method === 'POST') {
            $body = ads_body();
            $rt = rawurlencode((string)($body['return_to'] ?? '#/panel-ads/contas'));
            ApiResponse::success(['authorize_url' => '/api/ads/accounts/callback?mock=1&return_to=' . $rt]);
            return;
        }
        $id = (int)$sub;
        if ($id <= 0) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
        $action = $segments[2] ?? '';
        if ($action === 'default' && $method === 'POST') {
            if (!AdsMock::setDefault($id)) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
            ApiResponse::success(['ok' => true, 'accounts' => AdsMock::accountsPublic()]);
            return;
        }
        if ($action === 'favorite' && $method === 'POST') {
            $body = ads_body();
            if (!AdsMock::setFavorite($id, (bool)($body['favorite'] ?? true))) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); return; }
            ApiResponse::success(['ok' => true, 'accounts' => AdsMock::accountsPublic()]);
            return;
        }
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404);
    }

    /** Conta ativa do request (account_id na query; default = 1). */
    private static function accId(): int
    {
        $id = (int)(ads_query('account_id', 0));
        if ($id > 0 && AdsMock::ownsAccount($id)) { return $id; }
        $accs = AdsMock::accountsPublic();
        foreach ($accs as $a) { if (!empty($a['is_default'])) { return (int)$a['id']; } }
        return (int)($accs[0]['id'] ?? 1);
    }

    private static function accCost(): float
    {
        $sum = 0.0;
        foreach (AdsMock::accountsPublic() as $a) { $sum += (float)($a['cost'] ?? 0); }
        return round($sum, 2);
    }

    private static function guardGet(string $method): void
    {
        if ($method !== 'GET') { ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405); }
    }
}
