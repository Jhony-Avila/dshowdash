<?php
// Currencies Index - Redirect to get_all
// @version 1.1.0-ENTERPRISE
// v1.1.0: Migrado para RedisHelper centralizado

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$CACHE_KEY = 'currencies:all';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

// Carregar todas as moedas
$btc = json_decode(file_get_contents(__DIR__ . '/get_btc.php'), true);
$usdBrl = json_decode(file_get_contents(__DIR__ . '/get_usd_brl.php'), true);
$usdCny = json_decode(file_get_contents(__DIR__ . '/get_usd_cny.php'), true);

// Na verdade, vamos usar include para executar
ob_start();
include __DIR__ . '/get_all.php';
$output = ob_get_clean();

if ($output) {
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} else {
    echo $output;
}
