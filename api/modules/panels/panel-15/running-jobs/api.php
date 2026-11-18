<?php
// Painel 15 - Running Jobs
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';
// PAINEIS-SESSAO-14 (18/11/2026): contenção — exigir sessão antes de qualquer cache/dado (mesmo mecanismo do panel-01/16).
require_once __DIR__ . '/../../../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../../core/SessionGate.php';
SessionGate::start();
AuthHelpers::requireAuth();

$CACHE_KEY = 'panel:15:running-jobs';
$CACHE_TTL = RedisConfig::TTL_REALTIME;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $result = $conn->query("SELECT COUNT(*) as running_jobs FROM sync_jobs WHERE is_deleted = 0 AND is_running = 1")->fetch(PDO::FETCH_ASSOC);
    $data = ['metric' => 'running_jobs', 'value' => (int)$result['running_jobs'], 'label' => 'Rodando'];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) { RedisHelper::close(); ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500); }
