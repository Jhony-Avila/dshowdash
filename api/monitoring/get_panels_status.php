<?php
// Monitoring - Get Panels Status
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:panels-status';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $panelsDir = '/var/www/dshowdash/api/modules/panels';
    $panels = [];
    if (is_dir($panelsDir)) {
        $dirs = scandir($panelsDir);
        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..') continue;
            $apiFile = "$panelsDir/$dir/api.php";
            if (file_exists($apiFile)) {
                $panels[] = ['id' => $dir, 'api_exists' => true, 'path' => $apiFile, 'size' => filesize($apiFile), 'modified' => date('c', filemtime($apiFile))];
            }
        }
    }
    $output = ApiResponse::buildSuccess(['panels' => $panels, 'total' => count($panels)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
