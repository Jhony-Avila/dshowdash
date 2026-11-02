<?php
// UARPS API Controller
// @version 3.1.0-ENTERPRISE
// @description Controller orquestrador para API UARPS (modularizado)
// v3.1.0: Implementado InputValidator para validacao de entrada
// v3.0.0: Modularização completa - Controller/Service/Repository/Validator
// v2.2.0: Migrado para _init.php
// P3.2: Migrado para padrão _init.php (CorsPolicy + RedisHelper + InputValidator)
// P3.1: Migrado requireAdmin() para UARPSGate::enforceTrigger()

declare(strict_types=1);

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/services/UarpsService.php';

use Permissions\Services\UarpsService;

$method = $_SERVER['REQUEST_METHOD'];
$validator = InputValidator::fromGet();
$action = $validator->string('action', 'check', ['maxLength' => 50]);

function enforceUarpsAdmin(int $userId): void
{
    UARPSGate::enforceTrigger($userId, 'gate:admin:permissions');
}

function getClientIp(): string
{
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

try {
    $pdo = getConnection('DSHOWDASH');
    $service = new UarpsService($pdo);
    $ip = getClientIp();

    // ════════════════════════════════════════════════════════════════════════
    // GET REQUESTS
    // ════════════════════════════════════════════════════════════════════════
    if ($method === 'GET') {
        requireAuth();
        $user = getCurrentUser();
        $userId = (int)$user['id'];

        switch ($action) {
            case 'check-trigger':
                $triggerId = $validator->string('trigger_id', '', ['maxLength' => 100]) ?: null;
                $targetUserId = $validator->id('user_id', false) ?: $userId;
                if (!$triggerId) {
                    ApiResponse::error('TRIGGER_ID_REQUIRED', 400, ['message' => 'Parâmetro trigger_id obrigatório']);
                }
                ApiResponse::success($service->checkTrigger($targetUserId, $triggerId));
                break;

            case 'check-region':
                $regionId = $validator->string('region_id', '', ['maxLength' => 100]) ?: null;
                $targetUserId = $validator->id('user_id', false) ?: $userId;
                if (!$regionId) {
                    ApiResponse::error('REGION_ID_REQUIRED', 400, ['message' => 'Parâmetro region_id obrigatório']);
                }
                ApiResponse::success($service->checkRegion($targetUserId, $regionId));
                break;

            case 'check-multiple':
                $idsRaw = $validator->string('ids', '', ['maxLength' => 1000]);
                $entityIds = $idsRaw ? explode(',', $idsRaw) : [];
                $targetUserId = $validator->id('user_id', false) ?: $userId;
                if (empty($entityIds)) {
                    ApiResponse::error('IDS_REQUIRED', 400, ['message' => 'Parâmetro ids obrigatório']);
                }
                ApiResponse::success($service->checkMultiple($targetUserId, $entityIds));
                break;

            case 'my-permissions':
                ApiResponse::success($service->getMyPermissions($userId));
                break;

            case 'user-permissions':
                enforceUarpsAdmin($userId);
                $targetUserId = $validator->id('user_id', false);
                if (!$targetUserId) {
                    ApiResponse::error('USER_ID_REQUIRED', 400, ['message' => 'Parâmetro user_id obrigatório']);
                }
                ApiResponse::success($service->getUserPermissions($targetUserId));
                break;

            case 'user-matrix':
                enforceUarpsAdmin($userId);
                $targetUserId = $validator->id('user_id', false);
                if (!$targetUserId) {
                    ApiResponse::error('USER_ID_REQUIRED', 400, ['message' => 'Parâmetro user_id obrigatório']);
                }
                $matrix = $service->getUserMatrix($targetUserId);
                if (!$matrix) {
                    ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Usuário não encontrado']);
                }
                ApiResponse::success($matrix);
                break;

            case 'users-with-permissions':
                enforceUarpsAdmin($userId);
                ApiResponse::success($service->getUsersWithPermissions());
                break;

            case 'all-users':
                enforceUarpsAdmin($userId);
                ApiResponse::success($service->getAllUsers());
                break;

            case 'audit':
                enforceUarpsAdmin($userId);
                $limit = min($validator->int('limit', 50), 200);
                $targetUserId = $validator->id('user_id', false);
                ApiResponse::success($service->getAuditLogs($limit, $targetUserId));
                break;

            default:
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
        }
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // POST REQUESTS
    // ════════════════════════════════════════════════════════════════════════
    if ($method === 'POST') {
        requireAuth();
        $user = getCurrentUser();
        $userId = (int)$user['id'];
        enforceUarpsAdmin($userId);
        requireCsrf();

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        switch ($action) {
            case 'set-trigger':
                $result = $service->setTrigger($input, $userId, $ip);
                handleServiceResult($result, 'Trigger permission updated');
                break;

            case 'set-region':
                $result = $service->setRegion($input, $userId, $ip);
                handleServiceResult($result, 'Region permission updated');
                break;

            case 'bulk-set-triggers':
                $result = $service->bulkSetTriggers($input, $userId, $ip);
                handleServiceResult($result);
                break;

            case 'bulk-set-regions':
                $result = $service->bulkSetRegions($input, $userId, $ip);
                handleServiceResult($result);
                break;

            case 'reset-user':
                $targetUserId = (int)($input['user_id'] ?? 0);
                $reason = $input['reason'] ?? 'Reset to defaults';
                if (!$targetUserId) {
                    ApiResponse::error('USER_ID_REQUIRED', 400, ['message' => 'user_id obrigatório']);
                }
                $result = $service->resetUser($targetUserId, $userId, $ip, $reason);
                ApiResponse::success(['triggers_reset' => $result['triggers_reset'], 'regions_reset' => $result['regions_reset']]);
                break;

            default:
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
        }
        exit;
    }

    // ════════════════════════════════════════════════════════════════════════
    // DELETE REQUESTS
    // ════════════════════════════════════════════════════════════════════════
    if ($method === 'DELETE') {
        requireAuth();
        $user = getCurrentUser();
        $userId = (int)$user['id'];
        enforceUarpsAdmin($userId);
        requireCsrf();

        switch ($action) {
            case 'remove-trigger':
                $targetUserId = $validator->id('user_id', false);
                $triggerId = $validator->string('trigger_id', '', ['maxLength' => 100]) ?: null;
                if (!$targetUserId || !$triggerId) {
                    ApiResponse::error('USER_ID_AND_TRIGGER_ID_REQUIRED', 400, ['message' => 'user_id e trigger_id obrigatórios']);
                }
                $service->removeTrigger($targetUserId, $triggerId, $userId, $ip);
                ApiResponse::success(null, ['message' => 'Trigger permission removed']);
                break;

            case 'remove-region':
                $targetUserId = $validator->id('user_id', false);
                $regionId = $validator->string('region_id', '', ['maxLength' => 100]) ?: null;
                if (!$targetUserId || !$regionId) {
                    ApiResponse::error('USER_ID_AND_REGION_ID_REQUIRED', 400, ['message' => 'user_id e region_id obrigatórios']);
                }
                $service->removeRegion($targetUserId, $regionId, $userId, $ip);
                ApiResponse::success(null, ['message' => 'Region permission removed']);
                break;

            default:
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
        }
        exit;
    }

    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);

} catch (PDOException $e) {
    error_log("[uarps.php] Database error: " . $e->getMessage());
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'DATABASE_ERROR', 'message' => 'Erro de conexão com banco de dados']);
} catch (Exception $e) {
    error_log("[uarps.php] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'INTERNAL_ERROR', 'message' => 'Erro interno do servidor']);
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION
// ════════════════════════════════════════════════════════════════════════════

function handleServiceResult(array $result, ?string $successMessage = null): void
{
    if (!$result['success']) {
        $code = match($result['error'] ?? 'ERROR') {
            'VALIDATION_ERROR' => 400,
            'NOT_FOUND' => 404,
            'FORBIDDEN' => 403,
            default => 400
        };
        ApiResponse::error($result['error'], $code, [
            'message' => $result['message'] ?? null,
            'details' => $result['details'] ?? null
        ]);
        exit;
    }

    $data = $result;
    unset($data['success']);

    $meta = $successMessage ? ['message' => $successMessage] : null;
    ApiResponse::success(empty($data) ? null : $data, $meta);
}
