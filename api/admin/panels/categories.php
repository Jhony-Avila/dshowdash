<?php
/**
 * Panel Categories API — List categories with counts
 * @version 1.0.0
 * @created 2026-03-29
 *
 * GET /api/admin/panels/categories → Lista categorias com contagem
 */

declare(strict_types=1);

require_once __DIR__ . '/../../admin/_init.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../config/db_connection.php';
require_once __DIR__ . '/../../core/SessionGate.php';
require_once __DIR__ . '/../../core/UARPSGate.php';

header('Content-Type: application/json; charset=utf-8');

const UARPS_TRIGGER_PANELS_READ = 'gate:admin:panels';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

try {
    handleGetCategories();
} catch (Throwable $e) {
    ApiResponse::exception($e);
}

function handleGetCategories(): void {
    $session = SessionGate::requireAuth();
    $userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
    if ($userId > 0) {
        UARPSGate::checkTrigger($userId, UARPS_TRIGGER_PANELS_READ);
    }

    $pdo = getConnection('DSHOWDASH');

    $stmt = $pdo->query("
        SELECT
            category,
            COUNT(*) as total,
            SUM(is_active) as active_count,
            COUNT(*) - SUM(is_active) as inactive_count
        FROM panel_registry
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY category ASC
    ");

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast counts to int
    $totalPanels = 0;
    $data = array_map(function (array $row) use (&$totalPanels): array {
        $total = (int)$row['total'];
        $totalPanels += $total;
        return [
            'category'       => $row['category'],
            'total'          => $total,
            'active_count'   => (int)$row['active_count'],
            'inactive_count' => (int)$row['inactive_count'],
        ];
    }, $categories);

    ApiResponse::success($data, [
        'total_categories' => count($data),
        'total_panels'     => $totalPanels,
    ]);
}
