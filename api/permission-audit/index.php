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
    $userId = $validator->id('user_id', false);
    $action = $validator->string('action', '', ['maxLength' => 100]) ?: null;
    $dateFrom = $validator->string('date_from', '', ['maxLength' => 20]) ?: null;
    $dateTo = $validator->string('date_to', '', ['maxLength' => 20]) ?: null;

    $offset = $pagination['offset'];

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = [];
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

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_permission_audit pa {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                pa.id,
                pa.user_id,
                u.name as user_name,
                u.email as user_email,
                pa.action,
                pa.resource,
                pa.resource_id,
                pa.old_value,
                pa.new_value,
                pa.ip_address,
                pa.user_agent,
                pa.created_at
            FROM app_permission_audit pa
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
