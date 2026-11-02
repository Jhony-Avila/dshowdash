<?php
/**
 * Navigation Admin Audit API — Fetch recent audit trail entries
 * @version 1.0.0-AUDIT-TRAIL
 * @description Returns the last N audit log entries for navigation mutations.
 *
 * GET /api/admin/navigation/audit?limit=50
 *   → Returns last 50 navigation-related audit entries from app_audit_log
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');

const UARPS_TRIGGER_NAV_READ = 'gate:admin:navigation';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
    exit;
}

try {
    // Auth
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::checkTrigger($userId, UARPS_TRIGGER_NAV_READ);
    }

    $input = InputValidator::fromGet();
    $limit = max(1, min(200, (int)($input->int('limit') ?? 50)));

    $pdo = getDbConnection('DSHOWDASH');

    $stmt = $pdo->prepare("
        SELECT
            al.id,
            al.actor_id,
            COALESCE(u.username, u.email, CONCAT('User #', al.actor_id)) AS actor_name,
            al.event_type,
            al.resource_type,
            al.resource_id,
            al.before_state,
            al.after_state,
            al.context_json,
            al.ip_address,
            DATE_FORMAT(al.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM app_audit_log al
        LEFT JOIN app_users u ON u.id = al.actor_id
        WHERE al.event_type LIKE 'navigation.%'
        ORDER BY al.created_at DESC
        LIMIT :lim
    ");
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse JSON fields
    foreach ($entries as &$entry) {
        if ($entry['before_state']) {
            $entry['before_state'] = json_decode($entry['before_state'], true);
        }
        if ($entry['after_state']) {
            $entry['after_state'] = json_decode($entry['after_state'], true);
        }
        if ($entry['context_json']) {
            $entry['context_json'] = json_decode($entry['context_json'], true);
        }
    }
    unset($entry);

    ApiResponse::success($entries, [
        'total' => count($entries),
        'limit' => $limit,
        'version' => '1.0.0-AUDIT-TRAIL',
    ]);

} catch (Throwable $e) {
    error_log("[NavAdmin:Audit] Error: " . $e->getMessage());
    ApiResponse::exception($e);
}
