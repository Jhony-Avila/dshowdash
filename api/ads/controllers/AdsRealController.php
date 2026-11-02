<?php
// Ads / AdsRealController - dispatch do caminho REAL (ADS_PROVIDER=google)
// @version 0.1.0-scaffold
// @created 2026-07-24
// @app Ads Intelligence
//
// Ponto unico do caminho real. Enquanto tokens/contas nao estao persistidos em ADS_DSHOW,
// as rotas de dados respondem 503 NOT_CONFIGURED de forma clara (sem quebrar o header, que
// so depende de /status). Quando o go-live acontecer, cada rota de dados monta a GAQL
// correspondente via GoogleAdsClient::search() (TODO go-live).
declare(strict_types=1);

final class AdsRealController
{
    // Rotas de dados que existem no mock e serao servidas por GAQL na Fase 1.
    private const DATA_ROUTES = [
        'dashboard', 'board', 'campaigns', 'ad-groups', 'ads', 'keywords', 'search-terms',
        'recommendations', 'devices', 'locations', 'hours', 'audiences', 'landing-pages',
        'budgets', 'quality', 'funnel', 'alerts', 'reports', 'history',
    ];

    public static function route(string $method, array $segments): void
    {
        $route = $segments[0] ?? '';

        if ($route === '' || $route === 'status') {
            AdsStatusController::degraded();
            return;
        }

        if ($route === 'summary') {
            ApiResponse::success([
                'configured' => GoogleAdsClient::isConfigured(),
                'provider'   => 'google',
                'accounts'   => 0,
            ]);
            return;
        }

        // Iniciar conexao OAuth (o callback e tratado em index.php, antes do gate CSRF).
        if ($route === 'accounts') {
            if (($segments[1] ?? '') === 'connect' && $method === 'POST') {
                AdsAuthController::connect();
                return;
            }
            // Sem contas ate o primeiro OAuth + persistencia em ADS_DSHOW.
            ApiResponse::success(['accounts' => [], 'provider' => 'google']);
            return;
        }

        if (in_array($route, self::DATA_ROUTES, true)) {
            self::notProvisioned($route);
            return;
        }

        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Rota Ads desconhecida: /' . implode('/', $segments)]);
    }

    /** 503 claro para rotas de dados ainda nao provisionadas no caminho real. */
    private static function notProvisioned(string $route): void
    {
        $r = GoogleAdsClient::readiness();
        $faltando = [];
        foreach (['developer_token' => 'developer token', 'oauth_client' => 'OAuth client', 'login_customer' => 'login-customer-id', 'crypto_key' => 'ADS_CRYPTO_KEY', 'db' => 'banco ADS_DSHOW'] as $k => $rot) {
            if (empty($r[$k])) { $faltando[] = $rot; }
        }
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, [
            'message' => 'Rota /' . $route . ' indisponivel: caminho real ainda nao provisionado. '
                . ($faltando ? 'Pendente: ' . implode(', ', $faltando) . '. ' : '')
                . 'Use ADS_PROVIDER=mock para testes ou conclua o go-live (docs/GOOGLE-ADS/05-plano-fases.md).',
            'provider' => 'google',
        ]);
    }
}
