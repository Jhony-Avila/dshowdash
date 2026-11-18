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

        // DSHOW-009 opção A (18/11): lê a tabela REAL app_permission_audit_log (a app_permission_audit nunca existiu).
        // Mapa explícito: resource ← resource_type · resource_id ← resource_id · old_value/new_value ← NULL (sem equivalente; context_json não é exposto).
        $where = ['pa.deleted_at IS NULL'];
        $params = [];

        if ($userId) {
            $where[] = "pa.user_id = ?";
            $params[] = $userId;
        }

        if ($action) {
            $where[] = "pa.action = ?";
            $params[] = $action;
        }

        if ($dateFrom) {
            $where[] = "pa.created_at >= ?";
            $params[] = $dateFrom;
        }

        if ($dateTo) {
            $where[] = "pa.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_permission_audit_log pa {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                pa.id,
                pa.user_id,
                u.username AS user_name   /* app_users sem coluna name (DSHOW-009) */,
                u.email as user_email,
                pa.action,
                pa.resource_type AS resource,
                pa.resource_id,
                NULL AS old_value,
                NULL AS new_value,
                pa.ip_address,
                pa.user_agent,
                pa.created_at
            FROM app_permission_audit_log pa
            LEFT JOIN app_users u ON pa.user_id = u.id
            {$whereClause}
            ORDER BY pa.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
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
