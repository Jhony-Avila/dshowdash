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
require_once __DIR__ . '/../_helpers/GuardaDono.php';   // UARPS-DONO (P0 17/11/2026)
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/services/UarpsService.php';

// UARPS saneamento A (27/11): a classe do serviço é GLOBAL (services/UarpsService.php:17); o `use Permissions\Services\UarpsService`
// antigo apontava para uma classe inexistente e derrubava o controlador no `new UarpsService` (erro fatal).

$method = $_SERVER['REQUEST_METHOD'];
$validator = InputValidator::fromGet();
$action = $validator->string('action', 'check', ['maxLength' => 50]);

function enforceUarpsAdmin(int $userId): void
{
    UARPSGate::enforceTrigger($userId, 'gate:admin:permissions');
    // UARPS-DONO (P0 17/11/2026): nível de antes da P3 (requireAdmin = 80) + nenhuma escrita sobre o dono (75) por terceiros.
    dshow_exigir_nivel($userId, 80, 'permissions/uarps');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        dshow_proteger_dono($userId, ['user_id', 'user_ids', 'target_user_id'], 'permissions/uarps');
    }
}

// UARPS saneamento A (27/11): a getClientIp() local foi REMOVIDA — o AuthHelpers.php (carregado acima) já declara getClientIp() e a
// segunda declaração era erro fatal "Cannot redeclare" ao carregar o controlador. O IP só vai para o evento de auditoria.

/** Id de operação (idempotência): cabeçalho Idempotency-Key ou `operacao_id` no corpo. Ausente = 400 explícito. */
function uarpsOperacaoId(array $input): string
{
    $v = (string) ($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? ($input['operacao_id'] ?? ''));
    if ($v === '') {
        ApiResponse::error('OPERACAO_ID_OBRIGATORIO', 400, ['message' => 'Toda alteração de permissão exige um id de operação (cabeçalho Idempotency-Key).']);
    }
    return $v;
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
                $targetUserId = $validator->id('user_id', 0) ?: $userId;
                if (!$triggerId) {
                    ApiResponse::error('TRIGGER_ID_REQUIRED', 400, ['message' => 'Parâmetro trigger_id obrigatório']);
                }
                ApiResponse::success($service->checkTrigger($targetUserId, $triggerId));
                break;

            case 'check-region':
                $regionId = $validator->string('region_id', '', ['maxLength' => 100]) ?: null;
                $targetUserId = $validator->id('user_id', 0) ?: $userId;
                if (!$regionId) {
                    ApiResponse::error('REGION_ID_REQUIRED', 400, ['message' => 'Parâmetro region_id obrigatório']);
                }
                ApiResponse::success($service->checkRegion($targetUserId, $regionId));
                break;

            case 'check-multiple':
                $idsRaw = $validator->string('ids', '', ['maxLength' => 1000]);
                $entityIds = $idsRaw ? explode(',', $idsRaw) : [];
                $targetUserId = $validator->id('user_id', 0) ?: $userId;
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
                $targetUserId = $validator->id('user_id', 0);
                if (!$targetUserId) {
                    ApiResponse::error('USER_ID_REQUIRED', 400, ['message' => 'Parâmetro user_id obrigatório']);
                }
                ApiResponse::success($service->getUserPermissions($targetUserId));
                break;

            case 'preview-trigger':
                // VERDE E2 (3): prévia só de leitura (atual × futuro + bloqueio que a gravação teria); mesma guarda das leituras administrativas
                enforceUarpsAdmin($userId);
                ApiResponse::success($service->previewTrigger($validator->id('user_id', 0), $validator->string('trigger_id', '', ['maxLength' => 100]), $validator->string('state', '', ['maxLength' => 10]), $userId));
                break;

            case 'user-matrix':
                enforceUarpsAdmin($userId);
                $targetUserId = $validator->id('user_id', 0);
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
                $targetUserId = $validator->id('user_id', 0);
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
            // UARPS saneamento A (27/11): toda escrita = regra + evento na MESMA transação (UarpsEscrita); erro = HTTP explícito.
            case 'set-trigger':
                ApiResponse::success($service->setTrigger($input, $userId, $ip, uarpsOperacaoId($input)), ['message' => 'Permissão de gatilho gravada']);
                break;

            case 'set-region':
                ApiResponse::success($service->setRegion($input, $userId, $ip, uarpsOperacaoId($input)), ['message' => 'Permissão de região gravada']);
                break;

            case 'bulk-set-triggers':
                ApiResponse::success($service->bulkSetTriggers($input, $userId, $ip, uarpsOperacaoId($input)));
                break;

            case 'bulk-set-regions':
                ApiResponse::success($service->bulkSetRegions($input, $userId, $ip, uarpsOperacaoId($input)));
                break;

            case 'reset-user':
                $targetUserId = (int)($input['user_id'] ?? 0);
                $result = $service->resetUser($targetUserId, $userId, $ip, isset($input['reason']) ? (string) $input['reason'] : null, uarpsOperacaoId($input));
                ApiResponse::success($result);
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
        // Nota 2 (arquiteto, 27/11): o MOTIVO vai no CORPO do DELETE, fora da URL (URL costuma ir para o access log). A URL continua aceita só
        // por compatibilidade com o editor antigo, com aviso no log (sem o conteúdo do motivo).
        $corpoDel = json_decode((string) file_get_contents('php://input'), true);
        $motivoDel = is_array($corpoDel) && array_key_exists('reason', $corpoDel) ? (is_string($corpoDel['reason']) ? $corpoDel['reason'] : null) : null;
        if ($motivoDel === null && isset($_GET['reason'])) { $motivoDel = (string) $_GET['reason']; error_log('[uarps.php] DELETE com motivo na URL (obsoleto): mande no corpo'); }

        switch ($action) {
            case 'remove-trigger':
                $targetUserId = $validator->id('user_id', 0);
                $triggerId = $validator->string('trigger_id', '', ['maxLength' => 100]) ?: null;
                if (!$targetUserId || !$triggerId) {
                    ApiResponse::error('USER_ID_AND_TRIGGER_ID_REQUIRED', 400, ['message' => 'user_id e trigger_id obrigatórios']);
                }
                ApiResponse::success($service->removeTrigger($targetUserId, $triggerId, $userId, $ip, uarpsOperacaoId(['operacao_id' => $_GET['operacao_id'] ?? '']), $motivoDel));
                break;

            case 'remove-region':
                $targetUserId = $validator->id('user_id', 0);
                $regionId = $validator->string('region_id', '', ['maxLength' => 100]) ?: null;
                if (!$targetUserId || !$regionId) {
                    ApiResponse::error('USER_ID_AND_REGION_ID_REQUIRED', 400, ['message' => 'user_id e region_id obrigatórios']);
                }
                ApiResponse::success($service->removeRegion($targetUserId, $regionId, $userId, $ip, uarpsOperacaoId(['operacao_id' => $_GET['operacao_id'] ?? '']), $motivoDel));
                break;

            default:
                ApiResponse::error(ApiResponse::ERR_INVALID_ACTION, 400, ['action' => $action]);
        }
        exit;
    }

    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);

} catch (UarpsEscritaErro $e) {
    // UARPS saneamento A: falha de gravação/auditoria/idempotência = erro explícito (nunca sucesso com auditoria perdida)
    ApiResponse::error($e->codigo, $e->http, ['message' => $e->getMessage()] + ($e->detalhes ? ['details' => $e->detalhes] : []));
} catch (PDOException $e) {
    error_log("[uarps.php] Database error: " . get_class($e));
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'DATABASE_ERROR', 'message' => 'Erro de conexão com banco de dados']);
} catch (Exception $e) {
    error_log("[uarps.php] Error: " . get_class($e));
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
