<?php
// DataTables / _init.php - bootstrap do modulo
// @module datatables.init
// @version 1.0.0
// @created 2026-07-20
//
// Molde: api/koala/_init.php. Concentra requires, CORS e helper de body.
declare(strict_types=1);

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/Crypto.php';
require_once __DIR__ . '/lib/ConnectionFactory.php';
require_once __DIR__ . '/lib/FieldClassifier.php';
require_once __DIR__ . '/lib/WebhookSender.php';

// ── Repositorios ────────────────────────────────────────────────
require_once __DIR__ . '/repositories/ConnectionRepository.php';
require_once __DIR__ . '/repositories/StatusRepository.php';
require_once __DIR__ . '/repositories/CatalogRepository.php';
require_once __DIR__ . '/repositories/ServerRepository.php';
require_once __DIR__ . '/repositories/AdminRepository.php';

// ── Servicos ────────────────────────────────────────────────────
require_once __DIR__ . '/services/InventoryService.php';
require_once __DIR__ . '/services/HealthCheckService.php';
require_once __DIR__ . '/services/AlertService.php';
require_once __DIR__ . '/services/QualityService.php';
require_once __DIR__ . '/services/ExternalSourceService.php';
require_once __DIR__ . '/services/MetricsService.php';
require_once __DIR__ . '/services/DiscoveryScanService.php';
require_once __DIR__ . '/services/DiscoveryService.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/CatalogController.php';
require_once __DIR__ . '/controllers/ConnectionController.php';
require_once __DIR__ . '/controllers/MonitoringController.php';
require_once __DIR__ . '/controllers/AlertController.php';
require_once __DIR__ . '/controllers/ServerController.php';
require_once __DIR__ . '/controllers/AdminController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true,
]);

/** Body JSON do request. [] se vazio; 400 se malformado. */
function dt_body(): array
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
function dt_query(array $keys): array
{
    $out = [];
    foreach ($keys as $k) {
        if (isset($_GET[$k]) && $_GET[$k] !== '') {
            $out[$k] = $_GET[$k];
        }
    }
    return $out;
}

/** Nivel minimo do modulo: equipe de desenvolvimento (§4). */
function dt_require_access(): void
{
    AuthHelpers::requireAuth();
}
