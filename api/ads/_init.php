<?php
// Ads / _init.php - bootstrap do modulo (Ads Intelligence / Google Ads)
// @module  ads.init
// @version 1.0.0
// @created 2026-07-21
//
// Molde: api/outlook/_init.php. Concentra requires, CORS e helpers de body.
// Fase mock-first: so o provedor AdsMock + StatusController sao necessarios.
// Os caminhos reais (GoogleAdsClient/controllers/ADS_DSHOW) entram na Fase 1 real.
declare(strict_types=1);

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/AdsMock.php';
require_once __DIR__ . '/lib/AdsCrypto.php';        // cifra de tokens (caminho real)
require_once __DIR__ . '/lib/GoogleAdsClient.php';  // cliente Google Ads (caminho real)

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/AdsMockController.php';
require_once __DIR__ . '/controllers/AdsAuthController.php';   // OAuth connect/callback (real)
require_once __DIR__ . '/controllers/AdsRealController.php';   // dispatch do caminho real

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true,
]);

/** Body JSON do request. [] se vazio; 400 se malformado. */
function ads_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        ApiResponse::error(ApiResponse::ERR_INVALID_JSON, 400, ['message' => 'Corpo JSON invalido']);
    }
    return $data;
}

/** Valor de query string, com fallback. */
function ads_query(string $key, $default = null)
{
    return $_GET[$key] ?? $default;
}

/**
 * Acesso ao modulo: qualquer usuario autenticado (o gate RBAC fino — perfis §33 —
 * entra na Fase 1). O isolamento de contas conectadas e por usuario no banco real.
 */
function ads_require_access(): void
{
    AuthHelpers::requireAuth();
}

/** Modo de testes (dados ficticios, sem Google Ads API/DB) — ligado por ADS_PROVIDER=mock. */
function ads_is_mock(): bool
{
    return AdsMock::isEnabled();
}
