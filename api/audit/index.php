<?php
// API: Audit Trail
// @version 2.3.0-COLUMN-FIX
// @changelog v2.3.0-COLUMN-FIX: Fixed u.name → u.username (app_users uses 'username' not 'name')
// @since 2025-01
// @updated 2026-02-01
// v2.2.0: Migrado para UARPSGate + getConnection() centralizado

declare(strict_types=1);

require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
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
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 50);
    $userId = $_GET['user_id'] ?? null;
    $action = $_GET['action'] ?? null;
    $entity = $_GET['entity'] ?? null;
    $dateFrom = $_GET['date_from'] ?? null;
    $dateTo = $_GET['date_to'] ?? null;

    $offset = ($page - 1) * $limit;

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = [];
        $params = [];

        if ($userId) {
            $where[] = "a.user_id = ?";
            $params[] = $userId;
        }

        if ($action) {
            $where[] = "a.action = ?";
            $params[] = $action;
        }

        if ($entity) {
            $where[] = "a.entity_type = ?";
            $params[] = $entity;
        }

        if ($dateFrom) {
            $where[] = "a.created_at >= ?";
            $params[] = $dateFrom;
        }

        if ($dateTo) {
            $where[] = "a.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_audit_trail a {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                a.id,
                a.user_id,
                u.username as user_name,
                u.email as user_email,
                a.action,
                a.entity_type,
                a.entity_id,
                a.old_values,
                a.new_values,
                a.ip_address,
                a.user_agent,
                a.created_at
            FROM app_audit_trail a
            LEFT JOIN app_users u ON a.user_id = u.id
            {$whereClause}
            ORDER BY a.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($records as &$record) {
            if ($record['old_values']) {
                $record['old_values'] = json_decode($record['old_values'], true);
            }
            if ($record['new_values']) {
                $record['new_values'] = json_decode($record['new_values'], true);
            }
        }

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
        error_log("Audit GET error: " . $e->getMessage());
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
    $entityType = $input['entity_type'] ?? null;

    if (!$action || !$entityType) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'action e entity_type são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_audit_trail 
            (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $oldValues = isset($input['old_values']) ? json_encode($input['old_values']) : null;
        $newValues = isset($input['new_values']) ? json_encode($input['new_values']) : null;

        $stmt->execute([
            $_SESSION['user_id'] ?? null,
            $action,
            $entityType,
            $input['entity_id'] ?? null,
            $oldValues,
            $newValues,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        ApiResponse::success([
            'message' => 'Registro de auditoria criado',
            'audit_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("Audit POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
