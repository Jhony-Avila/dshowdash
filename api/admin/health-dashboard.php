<?php
/**
 * Health Dashboard API — Navigation Statistics
 * @version 1.0.0-ENTERPRISE
 * @created 2026-03-27
 * @description Retorna estatísticas de navegação para o painel admin:
 *   - Total de itens por contexto (sidebar/navrail/header/footer)
 *   - Itens ativos vs inativos por contexto
 *   - Última modificação por contexto
 *   - Top 5 itens mais recentemente alterados
 *
 * GET /api/admin/health-dashboard.php
 * Requer autenticação admin (gate:admin:navigation)
 */

declare(strict_types=1);

require_once __DIR__ . '/../admin/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');

const API_VERSION_HD = '1.0.0-ENTERPRISE';
const UARPS_TRIGGER_HD = 'gate:admin:navigation';
const CACHE_KEY = 'admin:health-dashboard';
const CACHE_TTL = 30; // 30s — dados mudam pouco

// ─── Auth ───
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'GET') {
    ApiResponse::error('METHOD_NOT_ALLOWED', 405);
}

$session = SessionGate::requireAuth();
$userId = (int)($session['user_id'] ?? $session['id'] ?? 0);
if ($userId > 0) {
    UARPSGate::checkTrigger($userId, UARPS_TRIGGER_HD);
}

// ─── Cache check ───
$cached = RedisHelper::tryGetCache(CACHE_KEY);
if ($cached !== null) {
    header('X-Cache: HIT');
    echo $cached;
    RedisHelper::close();
    exit;
}
header('X-Cache: MISS');

// ─── Database queries ───
try {
    $pdo = DatabaseManager::getConnection('DSHOWDASH');
} catch (Exception $e) {
    error_log('[health-dashboard] DB connection failed: ' . $e->getMessage());
    ApiResponse::error('DATABASE_ERROR', 503, ['message' => 'Database connection failed']);
}

$startTime = microtime(true);

// Source tables and their display_context mapping
$contexts = [
    'sidebar' => ['table' => 'ui_nav_items',      'active_col' => 'is_active', 'updated_col' => 'updated_at', 'filter' => "item_type != 'group'"],
    'navrail' => ['table' => 'navrail_items',      'active_col' => 'is_active', 'updated_col' => 'updated_at', 'filter' => '1=1'],
    'header'  => ['table' => 'header_components',   'active_col' => 'is_active', 'updated_col' => 'updated_at', 'filter' => '1=1'],
    'footer'  => ['table' => 'footer_items',        'active_col' => 'is_active', 'updated_col' => 'updated_at', 'filter' => '1=1'],
];

$stats = [];

foreach ($contexts as $contextName => $cfg) {
    $table = $cfg['table'];
    $activeCol = $cfg['active_col'];
    $updatedCol = $cfg['updated_col'];
    $filter = $cfg['filter'];

    try {
        // Total + active/inactive counts
        $sql = "SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN {$activeCol} = 1 THEN 1 ELSE 0 END) AS active,
                    SUM(CASE WHEN {$activeCol} = 0 THEN 1 ELSE 0 END) AS inactive,
                    MAX({$updatedCol}) AS last_modified
                FROM {$table}
                WHERE {$filter}";
        $stmt = $pdo->query($sql);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $stats[$contextName] = [
            'total'         => (int)($row['total'] ?? 0),
            'active'        => (int)($row['active'] ?? 0),
            'inactive'      => (int)($row['inactive'] ?? 0),
            'last_modified' => $row['last_modified'] ?? null,
        ];
    } catch (Exception $e) {
        error_log("[health-dashboard] Query failed for {$table}: " . $e->getMessage());
        $stats[$contextName] = [
            'total' => 0, 'active' => 0, 'inactive' => 0,
            'last_modified' => null, 'error' => 'query_failed',
        ];
    }
}

// ─── Totals ───
$grandTotal = 0;
$grandActive = 0;
$grandInactive = 0;
foreach ($stats as $s) {
    $grandTotal += $s['total'];
    $grandActive += $s['active'];
    $grandInactive += $s['inactive'];
}

// ─── Top 5 most recently modified items (UNION across all tables) ───
$top5 = [];
try {
    $unionSql = "
        (SELECT id AS source_id, 'sidebar' AS context, label, updated_at
         FROM ui_nav_items WHERE item_type != 'group' ORDER BY updated_at DESC LIMIT 5)
        UNION ALL
        (SELECT id AS source_id, 'navrail' AS context, label, updated_at
         FROM navrail_items ORDER BY updated_at DESC LIMIT 5)
        UNION ALL
        (SELECT id AS source_id, 'header' AS context, label, updated_at
         FROM header_components ORDER BY updated_at DESC LIMIT 5)
        UNION ALL
        (SELECT id AS source_id, 'footer' AS context, label, updated_at
         FROM footer_items ORDER BY updated_at DESC LIMIT 5)
        ORDER BY updated_at DESC
        LIMIT 5
    ";
    $stmt = $pdo->query($unionSql);
    $top5 = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    error_log('[health-dashboard] Top 5 query failed: ' . $e->getMessage());
}

// ─── Build response ───
$data = [
    'version'     => API_VERSION_HD,
    'timestamp'   => date('c'),
    'summary'     => [
        'total_items'    => $grandTotal,
        'active_items'   => $grandActive,
        'inactive_items' => $grandInactive,
        'coverage'       => $grandTotal > 0 ? round(($grandActive / $grandTotal) * 100, 1) : 0,
    ],
    'by_context'  => $stats,
    'top5_recent' => $top5,
    'response_ms' => round((microtime(true) - $startTime) * 1000, 2),
];

$json = ApiResponse::buildSuccess($data, ['api_version' => API_VERSION_HD]);
RedisHelper::setCache(CACHE_KEY, $json, CACHE_TTL);
header('X-Cache: MISS');
echo $json;
RedisHelper::close();
