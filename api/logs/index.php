<?php
// API: Logs Management
// @version 2.2.0-ENTERPRISE
// @since 2025-01
// @updated 2026-01-25 - P0.1 FIX: Migrado requireAdmin() para UARPSGate::enforceTrigger()
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

UARPSGate::enforceTrigger($userId, 'gate:admin:logs');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetLogs();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteLogs();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetLogs(): void {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 100);
    $level = $_GET['level'] ?? null;
    $module = $_GET['module'] ?? null;
    $dateFrom = $_GET['date_from'] ?? null;
    $dateTo = $_GET['date_to'] ?? null;
    $search = $_GET['search'] ?? null;

    $offset = ($page - 1) * $limit;

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = [];
        $params = [];

        if ($level) {
            $where[] = "level = ?";
            $params[] = $level;
        }

        if ($module) {
            $where[] = "module = ?";
            $params[] = $module;
        }

        if ($dateFrom) {
            $where[] = "created_at >= ?";
            $params[] = $dateFrom;
        }

        if ($dateTo) {
            $where[] = "created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        if ($search) {
            $where[] = "(message LIKE ? OR context LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_logs {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT id, level, module, message, context, user_id, ip_address, created_at
            FROM app_logs
            {$whereClause}
            ORDER BY created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($logs as &$log) {
            if ($log['context']) {
                $log['context'] = json_decode($log['context'], true);
            }
        }

        ApiResponse::success([
            'logs' => $logs,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Exception $e) {
        error_log("Logs GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteLogs(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    $olderThan = $input['older_than'] ?? null;
    $level = $input['level'] ?? null;

    if (!$olderThan) {
        ApiResponse::error('MISSING_DATE', 400, ['message' => 'older_than é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = ["created_at < ?"];
        $params = [$olderThan];

        if ($level) {
            $where[] = "level = ?";
            $params[] = $level;
        }

        $whereClause = implode(' AND ', $where);

        $stmt = $pdo->prepare("DELETE FROM app_logs WHERE {$whereClause}");
        $stmt->execute($params);

        $deleted = $stmt->rowCount();

        ApiResponse::success([
            'message' => "Logs excluídos com sucesso",
            'deleted_count' => $deleted
        ]);

    } catch (Exception $e) {
        error_log("Logs DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
