<?php
// API: Security Events Management
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

UARPSGate::enforceTrigger($userId, 'gate:admin:security-events');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetEvents();
        break;
    case 'POST':
        AuthHelpers::requireCsrf();
        handleCreateEvent();
        break;
    case 'PUT':
    case 'PATCH':
        AuthHelpers::requireCsrf();
        handleUpdateEvent();
        break;
    case 'DELETE':
        AuthHelpers::requireCsrf();
        handleDeleteEvents();
        break;
    default:
        ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

function handleGetEvents(): void {
    $validator = InputValidator::fromGet();
    $pagination = $validator->pagination(50, 100);
    $page = $pagination['page'];
    $limit = $pagination['limit'];
    $allowedSeverities = ['critical', 'high', 'medium', 'low', 'info'];
    $severity = $validator->enum('severity', '', $allowedSeverities) ?: null;
    $eventType = $validator->string('event_type', '', ['maxLength' => 100]) ?: null;
    $userId = $validator->id('user_id', false);
    $dateFrom = $validator->string('date_from', '', ['maxLength' => 20]) ?: null;
    $dateTo = $validator->string('date_to', '', ['maxLength' => 20]) ?: null;
    $resolved = $validator->string('resolved', '', ['maxLength' => 1]) ?: null;

    $offset = $pagination['offset'];

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = [];
        $params = [];

        if ($severity) {
            $where[] = "se.severity = ?";
            $params[] = $severity;
        }

        if ($eventType) {
            $where[] = "se.event_type = ?";
            $params[] = $eventType;
        }

        if ($userId) {
            $where[] = "se.user_id = ?";
            $params[] = $userId;
        }

        if ($dateFrom) {
            $where[] = "se.created_at >= ?";
            $params[] = $dateFrom;
        }

        if ($dateTo) {
            $where[] = "se.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        if ($resolved !== null) {
            $where[] = "se.is_resolved = ?";
            $params[] = (int)$resolved;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM app_security_events se {$whereClause}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                se.id,
                se.event_type,
                se.severity,
                se.message,
                se.details,
                se.user_id,
                u.name as user_name,
                u.email as user_email,
                se.ip_address,
                se.user_agent,
                se.is_resolved,
                se.resolved_by,
                se.resolved_at,
                se.created_at
            FROM app_security_events se
            LEFT JOIN app_users u ON se.user_id = u.id
            {$whereClause}
            ORDER BY se.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($events as &$event) {
            $event['is_resolved'] = (bool)$event['is_resolved'];
            if ($event['details']) {
                $event['details'] = json_decode($event['details'], true);
            }
        }

        $statsStmt = $pdo->query("
            SELECT 
                severity,
                COUNT(*) as count
            FROM app_security_events
            WHERE is_resolved = 0
            GROUP BY severity
        ");
        $stats = $statsStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        ApiResponse::success([
            'events' => $events,
            'stats' => [
                'critical' => (int)($stats['critical'] ?? 0),
                'high' => (int)($stats['high'] ?? 0),
                'medium' => (int)($stats['medium'] ?? 0),
                'low' => (int)($stats['low'] ?? 0),
                'info' => (int)($stats['info'] ?? 0)
            ],
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents GET error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleCreateEvent(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        ApiResponse::error('INVALID_INPUT', 400);
        return;
    }

    $eventType = $input['event_type'] ?? null;
    $message = $input['message'] ?? null;

    if (!$eventType || !$message) {
        ApiResponse::error('MISSING_FIELDS', 400, ['message' => 'event_type e message são obrigatórios']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $stmt = $pdo->prepare("
            INSERT INTO app_security_events 
            (event_type, severity, message, details, user_id, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $eventType,
            $input['severity'] ?? 'info',
            $message,
            isset($input['details']) ? json_encode($input['details']) : null,
            $input['user_id'] ?? $_SESSION['user_id'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        ApiResponse::success([
            'message' => 'Evento registrado com sucesso',
            'event_id' => $pdo->lastInsertId()
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents POST error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleUpdateEvent(): void {
    $validator = InputValidator::fromGet();
    $input = json_decode(file_get_contents('php://input'), true);
    $eventId = $input['id'] ?? $validator->id('id', false);

    if (!$eventId) {
        ApiResponse::error('MISSING_EVENT_ID', 400);
        return;
    }

    $action = $input['action'] ?? 'resolve';

    try {
        $pdo = getConnection('DSHOWDASH');

        if ($action === 'resolve') {
            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 1, resolved_by = ?, resolved_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$_SESSION['user_id'] ?? null, $eventId]);

            if ($stmt->rowCount() === 0) {
                ApiResponse::error('EVENT_NOT_FOUND', 404);
                return;
            }

            ApiResponse::success(['message' => 'Evento marcado como resolvido']);
            return;
        }

        if ($action === 'unresolve') {
            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 0, resolved_by = NULL, resolved_at = NULL
                WHERE id = ?
            ");
            $stmt->execute([$eventId]);

            if ($stmt->rowCount() === 0) {
                ApiResponse::error('EVENT_NOT_FOUND', 404);
                return;
            }

            ApiResponse::success(['message' => 'Evento reaberto']);
            return;
        }

        if ($action === 'bulk_resolve' && isset($input['ids'])) {
            $ids = $input['ids'];
            if (empty($ids)) {
                ApiResponse::error('EMPTY_IDS', 400);
                return;
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge([$_SESSION['user_id'] ?? null], $ids);

            $stmt = $pdo->prepare("
                UPDATE app_security_events 
                SET is_resolved = 1, resolved_by = ?, resolved_at = NOW()
                WHERE id IN ({$placeholders})
            ");
            $stmt->execute($params);

            ApiResponse::success([
                'message' => 'Eventos marcados como resolvidos',
                'count' => $stmt->rowCount()
            ]);
            return;
        }

        ApiResponse::error('INVALID_ACTION', 400);

    } catch (Exception $e) {
        error_log("SecurityEvents UPDATE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}

function handleDeleteEvents(): void {
    $input = json_decode(file_get_contents('php://input'), true);

    $olderThan = $input['older_than'] ?? null;
    $severity = $input['severity'] ?? null;
    $onlyResolved = $input['only_resolved'] ?? true;

    if (!$olderThan) {
        ApiResponse::error('MISSING_DATE', 400, ['message' => 'older_than é obrigatório']);
        return;
    }

    try {
        $pdo = getConnection('DSHOWDASH');

        $where = ["created_at < ?"];
        $params = [$olderThan];

        if ($severity) {
            $where[] = "severity = ?";
            $params[] = $severity;
        }

        if ($onlyResolved) {
            $where[] = "is_resolved = 1";
        }

        $whereClause = implode(' AND ', $where);

        $stmt = $pdo->prepare("DELETE FROM app_security_events WHERE {$whereClause}");
        $stmt->execute($params);

        ApiResponse::success([
            'message' => 'Eventos excluídos com sucesso',
            'deleted_count' => $stmt->rowCount()
        ]);

    } catch (Exception $e) {
        error_log("SecurityEvents DELETE error: " . $e->getMessage());
        ApiResponse::error('DATABASE_ERROR', 500);
    }
}
