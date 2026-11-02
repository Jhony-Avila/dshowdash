<?php
// Outlook / _init.php - bootstrap do modulo
// @module outlook.init
// @version 1.0.0
// @created 2026-07-21
//
// Molde: api/pipedrive/_init.php. Concentra requires, CORS e helpers de body.
declare(strict_types=1);

// ── Nucleo compartilhado ────────────────────────────────────────
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
// Cache do badge (opcional): se ausente, o MetricsService degrada sem cache.
$__redisHelper = __DIR__ . '/../core/helpers/RedisHelper.php';
if (is_file($__redisHelper)) { require_once $__redisHelper; }
unset($__redisHelper);

// ── Bibliotecas do modulo ───────────────────────────────────────
require_once __DIR__ . '/lib/OutlookCrypto.php';
require_once __DIR__ . '/lib/GraphOAuth.php';
require_once __DIR__ . '/lib/GraphClient.php';
require_once __DIR__ . '/lib/OutlookMock.php';

// ── Repositorios ────────────────────────────────────────────────
require_once __DIR__ . '/repositories/OAuthStateRepository.php';
require_once __DIR__ . '/repositories/AccountRepository.php';
require_once __DIR__ . '/repositories/LogRepository.php';

// ── Servicos ────────────────────────────────────────────────────
require_once __DIR__ . '/services/AuthService.php';
require_once __DIR__ . '/services/MessageService.php';
require_once __DIR__ . '/services/FolderService.php';
require_once __DIR__ . '/services/MetricsService.php';

// ── Controllers ─────────────────────────────────────────────────
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/StatusController.php';
require_once __DIR__ . '/controllers/MessageController.php';
require_once __DIR__ . '/controllers/FolderController.php';
require_once __DIR__ . '/controllers/MetricsController.php';
require_once __DIR__ . '/controllers/TemplateController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/RulesController.php';
require_once __DIR__ . '/controllers/MassController.php';
require_once __DIR__ . '/controllers/MockController.php';

CorsPolicy::setupApiEndpoint([
    'methods'  => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'no_cache' => true,
]);

/** Body JSON do request. [] se vazio; 400 se malformado. */
function outlook_body(): array
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

/**
 * Acesso ao modulo: qualquer usuario autenticado (nivel 0). O isolamento e por
 * user_id no repositorio (§26.1: cada usuario ve apenas as proprias contas).
 * Na Fase 0/piloto, na pratica so o dono tera contas conectadas.
 */
function outlook_require_access(): void
{
    AuthHelpers::requireAuth();
}

/** Modo de testes (dados ficticios, sem Azure/DB) — ligado por OUTLOOK_PROVIDER=mock. */
function outlook_is_mock(): bool
{
    return OutlookMock::isEnabled();
}
