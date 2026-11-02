<?php
// Health Cards Panel
// @version 4.2.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$showHistory = isset($_GET['history']) && $_GET['history'] === 'true';
$CACHE_KEY = $showHistory ? 'health:cards-panel:history' : 'health:cards-panel';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

define('LOG_FILE', '/var/log/mfe-monitoring/cards-panel-health.log');

function checkMFEHealth() {
    $mfePath = '/var/www/dshowdash/public/mf/cards-panel/v1.0.1';
    $remoteEntryExists = file_exists("$mfePath/remoteEntry.js");
    $mainBundleExists = file_exists("$mfePath/797.e6666543.js");
    $remoteEntrySize = $remoteEntryExists ? filesize("$mfePath/remoteEntry.js") : 0;
    $mainBundleSize = $mainBundleExists ? filesize("$mfePath/797.e6666543.js") : 0;
    $remoteEntryContent = $remoteEntryExists ? file_get_contents("$mfePath/remoteEntry.js") : '';
    $containsLit = strpos($remoteEntryContent, 'lit') !== false;
    $healthy = $remoteEntryExists && $mainBundleExists && $remoteEntrySize > 2000 && $mainBundleSize > 10000 && !$containsLit;
    $issues = [];
    if (!$remoteEntryExists) $issues[] = 'remoteEntry.js not found';
    if (!$mainBundleExists) $issues[] = 'main bundle not found';
    if ($remoteEntrySize <= 2000) $issues[] = 'remoteEntry.js too small';
    if ($mainBundleSize <= 10000) $issues[] = 'main bundle too small';
    if ($containsLit) $issues[] = 'CRITICAL: lit found in bundle';
    return ['timestamp' => time(), 'date' => date('Y-m-d H:i:s'), 'healthy' => $healthy, 'files' => ['remoteEntry' => ['exists' => $remoteEntryExists, 'size' => $remoteEntrySize], 'mainBundle' => ['exists' => $mainBundleExists, 'size' => $mainBundleSize]], 'issues' => $issues, 'version' => '4.2.0-P06-ENTERPRISE'];
}

function getHealthHistory($limit = 10) {
    if (!file_exists(LOG_FILE)) return [];
    $lines = file(LOG_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    return array_map(fn($line) => json_decode($line, true), array_slice($lines, -$limit));
}

try {
    if ($showHistory) {
        $history = getHealthHistory(10);
        $output = ApiResponse::buildSuccess(['history' => $history, 'count' => count($history)], ['version' => '4.2.0-P06-ENTERPRISE']);
    } else {
        $health = checkMFEHealth();
        @file_put_contents(LOG_FILE, json_encode($health) . "\n", FILE_APPEND | LOCK_EX);
        $output = ApiResponse::buildSuccess(['health' => $health], ['version' => '4.2.0-P06-ENTERPRISE']);
    }
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
