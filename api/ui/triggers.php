<?php
// UI - Triggers API
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../../config/db_connection.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$context = $_GET['context'] ?? 'all';
$CACHE_KEY = "ui:triggers:{$context}";
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $pdo = getConnection('DSHOWDASH');
    $where = ['is_active = 1'];
    $params = [];
    if ($context !== 'all') { $where[] = 'component = :context'; $params[':context'] = $context; }
    $sql = "SELECT trigger_key, intent_id, component, label, icon_name, order_index FROM ui_triggers WHERE " . implode(' AND ', $where) . " ORDER BY component, order_index";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $triggers = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $triggers[$row['trigger_key']] = ['intentId' => $row['intent_id'], 'component' => $row['component'], 'label' => $row['label'], 'icon' => $row['icon_name']];
    }
    $output = ApiResponse::buildSuccess(['triggers' => $triggers, 'context' => $context, 'count' => count($triggers)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
