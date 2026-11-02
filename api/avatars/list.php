<?php
// Avatars List API
// @version 2.2.0-P06-ENTERPRISE

declare(strict_types=1);

require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$CACHE_KEY = 'avatars:list';
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$avatarsDir = __DIR__ . '/../../public/assets/avatars';

if (!is_dir($avatarsDir)) {
    echo json_encode(['ok' => false, 'error' => 'AVATARS_DIR_NOT_FOUND', 'avatars' => []]);
    exit;
}

$allowedExtensions = ['svg', 'png', 'jpg', 'jpeg', 'webp'];
$avatars = [];

$files = scandir($avatarsDir);
foreach ($files as $file) {
    if ($file === '.' || $file === '..') continue;
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions)) continue;
    $avatars[] = ['filename' => $file, 'url' => '/assets/avatars/' . $file, 'name' => pathinfo($file, PATHINFO_FILENAME)];
}

usort($avatars, fn($a, $b) => strcmp($a['name'], $b['name']));

$output = ApiResponse::buildSuccess(['avatars' => $avatars, 'total' => count($avatars)], ['version' => '2.2.0-P06-ENTERPRISE']);
RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
