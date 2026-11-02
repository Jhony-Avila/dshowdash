<?php
// Ads / index.php - roteador PATH_INFO do modulo (Ads Intelligence / Google Ads)
// @version 1.0.0
// @created 2026-07-21
// @app Ads Intelligence
//
// Molde: api/outlook/index.php. nginx mapeia ^/api/ads(/.*)?$ para este arquivo.
//
// Rotas (mock-first):
//   GET  /status                    provider/contas/estado da credencial (§7.5)
//   GET  /accounts                  seletor de contas (§6)
//   POST /accounts/{id}/default     define conta padrao (CSRF)
//   POST /accounts/{id}/favorite    favorita/desfavorita (CSRF)
//   POST /accounts/connect          inicia "conexao" -> {authorize_url}  (CSRF)
//   GET  /accounts/callback         callback (mock: cria conta e volta ao SPA)
//   GET  /dashboard                 Big Numbers + series + distribuicao (§7/§9)  ?account_id=&period=
//   GET  /board                     dashboard da diretoria (§10)  ?account_id=&period=
//   GET  /campaigns|ad-groups|ads|keywords|search-terms   DataGrids (§11-§15)  ?account_id=
//   GET  /recommendations           IA (§26)  ?account_id=
//   POST /mock/reset                zera o estado do mock
declare(strict_types=1);

@ini_set('display_errors', '0');   // nunca vazar stack/paths ao cliente

require_once __DIR__ . '/_init.php';

set_exception_handler(static function (\Throwable $e): void {
    error_log('[ads] uncaught ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, [
        'message' => 'Erro interno ao processar a solicitacao.',
    ]);
});

$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path     = trim((string)($_SERVER['PATH_INFO'] ?? ''), '/');
$segments = $path === '' ? [] : explode('/', $path);

// ── Callback do fluxo "conectar" (browser) — precede o gate CSRF (protecao por state) ──
if (($segments[0] ?? '') === 'accounts' && ($segments[1] ?? '') === 'callback') {
    SessionGate::start();
    if (!isAuthenticated()) {
        header('Location: /#/panel-ads/contas?ads_auth=error&reason=session', true, 302);
        return;
    }
    if (ads_is_mock()) {
        AdsMockController::callback();
        return;
    }
    // Caminho real: valida state + troca code por tokens (persistencia ADS_DSHOW = TODO go-live).
    AdsAuthController::callback();
    return;
}

SessionGate::start();
ads_require_access();
AuthHelpers::requireCsrfForWrite();   // gate central de CSRF para POST/PUT/PATCH/DELETE

// Modo de testes (ADS_PROVIDER=mock): serve dados ficticios, sem Google Ads API nem ADS_DSHOW.
if (ads_is_mock()) {
    AdsMockController::route($method, $segments);
    return;
}

// ── Caminho real (ADS_PROVIDER=google) ──
// /status reporta prontidao (nao quebra o header); connect inicia OAuth; rotas de dados dao
// 503 NOT_CONFIGURED claro ate a persistencia em ADS_DSHOW (Fase 1). Dispatch em AdsRealController.
AdsRealController::route($method, $segments);
