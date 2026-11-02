<?php
// Painel 15 - Active Jobs
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'panel:15:active-jobs';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $result = $conn->query("SELECT COUNT(*) as active_jobs FROM sync_jobs WHERE is_deleted = 0 AND is_active = 1")->fetch(PDO::FETCH_ASSOC);
    $data = ['metric' => 'active_jobs', 'value' => (int)$result['active_jobs'], 'label' => 'Ativos'];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) { RedisHelper::close(); ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500); }
