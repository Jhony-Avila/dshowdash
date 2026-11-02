<?php
/**
 * Panel Screenshots History API
 * @version 1.0.0
 * @created 2026-03-30
 *
 * GET /api/admin/panels/:id/screenshots → Lista ultimos 5 screenshots de um painel
 * Retorna: array de { id, created_at, file_size, path }
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

header('Content-Type: application/json; charset=utf-8');

if (!defined('UARPS_TRIGGER_PANELS_READ')) {
    define('UARPS_TRIGGER_PANELS_READ', 'gate:admin:panels');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

try {
    handleGetScreenshots();
} catch (Throwable $e) {
    ApiResponse::exception($e);
}

function handleGetScreenshots(): void {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::checkTrigger($userId, UARPS_TRIGGER_PANELS_READ);
    }

    // Get panel_id from query param or PATH_INFO
    $panelId = $_GET['panel_id'] ?? '';
    if ($panelId === '') {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        if (preg_match('#/api/admin/panels/([a-zA-Z0-9_-]+)/screenshots#', $uri, $m)) {
            $panelId = $m[1];
        }
    }

    if ($panelId === '') {
        ApiResponse::error(ApiResponse::ERR_ID_REQUIRED, 400, ['message' => 'panel_id obrigatorio']);
    }

    $pdo = getConnection('DSHOWDASH');

    // Verify panel exists
    $check = $pdo->prepare("SELECT panel_id FROM panel_registry WHERE panel_id = ?");
    $check->execute([$panelId]);
    if (!$check->fetch()) {
        ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => "Painel '$panelId' nao encontrado"]);
    }

    // Fetch last 5 screenshots
    $stmt = $pdo->prepare("
        SELECT
            id,
            captured_at AS created_at,
            COALESCE(file_size, 0) AS file_size,
            screenshot_path AS path
        FROM panel_screenshots
        WHERE panel_id = ?
          AND status = 'completed'
        ORDER BY captured_at DESC
        LIMIT 5
    ");
    $stmt->execute([$panelId]);
    $screenshots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast types
    foreach ($screenshots as &$row) {
        $row['id'] = (int)$row['id'];
        $row['file_size'] = (int)$row['file_size'];
    }
    unset($row);

    ApiResponse::success($screenshots);
}
