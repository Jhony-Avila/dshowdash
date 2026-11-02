<?php
// Painel 15 - Success Rate
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'panel:15:success-rate';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $result = $conn->query("SELECT AVG(success_rate) as avg_success_rate FROM sync_jobs WHERE is_deleted = 0")->fetch(PDO::FETCH_ASSOC);
    $data = ['metric' => 'success_rate', 'value' => round((float)$result['avg_success_rate'], 1), 'label' => 'Taxa Sucesso'];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) { RedisHelper::close(); ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500); }
