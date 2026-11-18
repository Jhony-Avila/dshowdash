<?php
// UI - Navigation API
// @version 2.4.0-P06-FIX
// @changelog v2.4.0-P06-FIX - Fixed ApiResponse require path

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/SessionGate.php';
require_once __DIR__ . '/../core/UARPSGate.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../../config/db_connection.php';
require_once __DIR__ . '/nav-flags.php';   // 18/11: visibilidade do menu por feature flag

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

SessionGate::start();
$userId = SessionGate::validate() ? ($_SESSION['user_id'] ?? null) : null;

$context = $_GET['context'] ?? 'all';
$action = $_GET['action'] ?? 'items';

$cacheKey = $userId ? "ui:nav:{$context}:{$action}:u{$userId}" : "ui:nav:{$context}:{$action}:anon";
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

try {
    $pdo = getConnection('DSHOWDASH');
    
    if ($action === 'items' || $action === 'tree' || $action === 'manifest') {
        $items = getNavItems($pdo, $context, $userId, false);
        if ($action === 'tree') {
            $data = ['tree' => buildNavTree($items), 'context' => $context];
        } elseif ($action === 'manifest') {
            $data = ['items' => $items, 'triggers' => getTriggerMappings($pdo, $context), 'tree' => buildNavTree($items)];
        } else {
            $sections = getNavSections($pdo, $context);
        $data = ['items' => $items, 'sections' => $sections, 'context' => $context, 'count' => count($items)];
        }
        $output = ApiResponse::buildSuccess($data, ['version' => '2.4.0-P06-FIX']);
        RedisHelper::cacheAndReturn($cacheKey, $output, $CACHE_TTL);
    } elseif ($action === 'available_routes') {
        // v2.5.0: Returns all available routes and panels for inline dropdown
        $routes = getAvailableRoutes($pdo);
        $output = ApiResponse::buildSuccess($routes, ['version' => '2.5.0']);
        RedisHelper::cacheAndReturn($cacheKey, $output, 60); // TTL curto — rotas mudam
    } else {
        ApiResponse::error('INVALID_ACTION', 400);
    }
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function getNavItems($pdo, $context, $userId, $includeInactive) {
    $where = ['1=1'];
    $params = [];
    if (!$includeInactive) { $where[] = 'is_active = 1'; $where[] = 'is_visible = 1'; }
    if ($context !== 'all') { $where[] = 'FIND_IN_SET(:context, display_context) > 0'; $params[':context'] = $context; }
    $sql = "SELECT * FROM ui_nav_items WHERE " . implode(' AND ', $where) . " ORDER BY order_index, id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $allItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if ($userId === null) { return navFiltrarPorFlags($pdo, array_filter($allItems, fn($item) => empty($item['uarps_trigger_id'])), null); }
    $filteredItems = [];
    foreach ($allItems as $item) {
        if (empty($item['uarps_trigger_id'])) { $filteredItems[] = $item; continue; }
        $check = UARPSGate::checkTrigger($userId, $item['uarps_trigger_id']);
        if ($check['allowed']) { $filteredItems[] = $item; }
    }
    return navFiltrarPorFlags($pdo, $filteredItems, $userId);
}
