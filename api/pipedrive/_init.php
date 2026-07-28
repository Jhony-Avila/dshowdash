<?php
// Pipedrive / _init.php - bootstrap do modulo
// @module pipedrive.init
// @version 1.0.0
// @created 2026-07-21
//
// Molde: api/datatables/_init.php. Concentra requires, CORS e helpers de body.
declare(strict_types=1);

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/PipeCrypto.php';
require_once __DIR__ . '/lib/PipedriveClient.php';

// ── Repositorios ────────────────────────────────────────────────
require_once __DIR__ . '/repositories/AccountRepository.php';
require_once __DIR__ . '/repositories/SyncRepository.php';
require_once __DIR__ . '/repositories/QueueRepository.php';
require_once __DIR__ . '/repositories/MetricsRepository.php';
require_once __DIR__ . '/repositories/AnalyticsRepository.php';
require_once __DIR__ . '/repositories/HealthRepository.php';

// ── Servicos ────────────────────────────────────────────────────
require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/services/SyncService.php';
require_once __DIR__ . '/services/QueueService.php';
require_once __DIR__ . '/services/ReconcileService.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/SyncController.php';
require_once __DIR__ . '/controllers/QueryController.php';
require_once __DIR__ . '/controllers/WebhookController.php';
require_once __DIR__ . '/controllers/MetricsController.php';
require_once __DIR__ . '/controllers/AnalyticsController.php';
require_once __DIR__ . '/controllers/HealthController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true,
]);

/** Body JSON do request. [] se vazio; 400 se malformado. */
function pipe_body(): array
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

/** Query string tipada, so com as chaves esperadas. */
function pipe_query(array $keys): array
{
    $out = [];
    foreach ($keys as $k) {
        if (isset($_GET[$k]) && $_GET[$k] !== '') {
            $out[$k] = $_GET[$k];
        }
    }
    return $out;
}

/**
 * Acesso ao modulo: restrito (§7.3). Bloqueia usuarios comuns/vendedores.
 * Nivel minimo 50 = diretoria/gestao comercial/admin (piloto: so o dono).
 */
function pipe_require_access(): void
{
    AuthHelpers::requireAuth(50);
}
