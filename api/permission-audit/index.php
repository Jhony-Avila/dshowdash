<?php
// API: Permission Audit
// @version 2.3.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
// v2.3.0: Migrado para UARPSGate + getConnection() centralizado
// v2.2.0: Migrado para InputValidator

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../_helpers/GuardaDono.php';   // UARPS-DONO (P0 17/11/2026)
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/helpers/InputValidator.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::apply();
SessionGate::start();
AuthHelpers::requireAuth();

$user = getCurrentUser();
$userId = (int)($user['id'] ?? 0);

UARPSGate::enforceTrigger($userId, 'gate:admin:audit');
dshow_exigir_nivel($userId, 80, 'permission-audit');   // UARPS-DONO (P0 17/11/2026): nível de antes da P3 (requireAdmin = 80)

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetAudit();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleCreateAudit();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetAudit(): void {
    $validator = InputValidator::fromGet();
    $pagination = $validator->pagination(50, 100);
    $page = $pagination['page'];
    $limit = $pagination['limit'];
    $userId = $validator->id('user_id', 0);
    $action = $validator->string('action', '', ['maxLength' => 100]) ?: null;
    $dateFrom = $validator->string('date_from', '', ['maxLength' => 20]) ?: null;
    $dateTo = $validator->string('date_to', '', ['maxLength' => 20]) ?: null;

    $offset = $pagination['offset'];
    // DSHOW-009 (18/11): filtro opcional — ausente/vazio = sem filtro (0); não numérico = 400 VALIDATION_ERROR (padrão do settings) (antes: TypeError por passar false no parâmetro int)
    if ($validator->hasErrors()) { ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'Parâmetros inválidos.', 'details' => $validator->getErrors()]); return; }

    try {
        $pdo = getConnection('DSHOWDASH');

        // AUDITORIA-PERMISSOES (18/11): a tela lê AS DUAS fontes, unidas e ordenadas por data, com a coluna `fonte`:
        //   'permissoes' = app_permission_audit_log (permissions/index.php, UserRolesRepository, scripts de portão)
        //   'uarps'      = app_uarps_audit_log (tela UARPS: UarpsService::setTrigger → insertAuditLog)
        // Mapa explícito (nada inventado): resource ← resource_type | entity_type · resource_id ← resource_id | entity_id ·
        // old_value/new_value ← context_json.antes/.depois | old_state/new_state · user_agent da fonte UARPS = NULL (não existe lá).
        $fp = ['pa.deleted_at IS NULL']; $fu = ['1=1']; $pp = []; $pu = [];
        if ($userId)   { $fp[] = 'pa.user_id = ?';       $pp[] = $userId;           $fu[] = 'ua.user_id = ?';       $pu[] = $userId; }
        if ($action)   { $fp[] = 'pa.action = ?';        $pp[] = $action;           $fu[] = 'ua.action = ?';        $pu[] = $action; }
        if ($dateFrom) { $fp[] = 'pa.created_at >= ?';   $pp[] = $dateFrom;         $fu[] = 'ua.created_at >= ?';   $pu[] = $dateFrom; }
        if ($dateTo)   { $fp[] = 'pa.created_at <= ?';   $pp[] = $dateTo . ' 23:59:59'; $fu[] = 'ua.created_at <= ?'; $pu[] = $dateTo . ' 23:59:59'; }
        $wp = implode(' AND ', $fp); $wu = implode(' AND ', $fu);

        $c1 = $pdo->prepare("SELECT COUNT(*) FROM app_permission_audit_log pa WHERE {$wp}"); $c1->execute($pp);
        $c2 = $pdo->prepare("SELECT COUNT(*) FROM app_uarps_audit_log ua WHERE {$wu}");     $c2->execute($pu);
        $total = (int) $c1->fetchColumn() + (int) $c2->fetchColumn();

        $sql = "
            SELECT t.fonte, t.id, t.user_id, u.username AS user_name, u.email AS user_email, t.action, t.resource, t.resource_id,
                   t.old_value, t.new_value, t.ip_address, t.user_agent, t.created_at
              FROM (
                SELECT CONVERT('permissoes' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS fonte, pa.id, pa.user_id,
                       CONVERT(pa.action USING utf8mb4) COLLATE utf8mb4_unicode_ci AS action,
                       CONVERT(pa.resource_type USING utf8mb4) COLLATE utf8mb4_unicode_ci AS resource,
                       CONVERT(pa.resource_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS resource_id,
                       CONVERT(JSON_UNQUOTE(JSON_EXTRACT(pa.context_json, '$.antes')) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS old_value,
                       CONVERT(JSON_UNQUOTE(JSON_EXTRACT(pa.context_json, '$.depois')) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS new_value,
                       CONVERT(pa.ip_address USING utf8mb4) COLLATE utf8mb4_unicode_ci AS ip_address,
                       CONVERT(pa.user_agent USING utf8mb4) COLLATE utf8mb4_unicode_ci AS user_agent, pa.created_at
                  FROM app_permission_audit_log pa WHERE {$wp}
                UNION ALL
                SELECT CONVERT('uarps' USING utf8mb4) COLLATE utf8mb4_unicode_ci, ua.id, ua.user_id,
                       CONVERT(ua.action USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       CONVERT(ua.entity_type USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       CONVERT(ua.entity_id USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       CONVERT(ua.old_state USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       CONVERT(ua.new_state USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       CONVERT(ua.ip_address USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                       NULL, ua.created_at
                  FROM app_uarps_audit_log ua WHERE {$wu}
              ) t
              LEFT JOIN app_users u ON t.user_id = u.id
             ORDER BY t.created_at DESC, t.fonte ASC, t.id DESC
             LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($pp, $pu));
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        ApiResponse::success([
            'records' => $records,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Exception $e) {
        error_log("Permission Audit GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateAudit(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $action = $input['action'] ?? null;
    $resource = $input['resource'] ?? null;

    if (!$action || !$resource) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'action e resource são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_permission_audit 
            (user_id, action, resource, resource_id, old_value, new_value, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $_SESSION['user_id'] ?? null,
            $action,
            $resource,
            $input['resource_id'] ?? null,
            $input['old_value'] ?? null,
            $input['new_value'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        ApiResponse::success([
            'message' => 'Registro de auditoria criado',
            'audit_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("Permission Audit POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
