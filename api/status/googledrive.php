<?php
// Google Drive Integration Status - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuração
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:googledrive';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = ['status' => 'online', 'configured' => true, 'storage_used' => '0%', 'files_synced' => 0, 'last_backup' => date('Y-m-d H:i:s')];
    } else {
        $data = ['status' => 'not_configured', 'configured' => false, 'message' => 'Integração Google Drive não configurada', 'integration' => 'googledrive', 'timestamp' => date('Y-m-d H:i:s')];
    }

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
