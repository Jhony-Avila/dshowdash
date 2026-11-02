<?php
// Painel 06 - Status do Servidor Enterprise
// @version 2.4.0-P06-ENTERPRISE
// @changelog v2.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'panel:06:server';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $current = $conn->query("
        SELECT id, cpu_percent, ram_percent, ram_used_mb, ram_total_mb, disk_percent,
            disk_used_gb, disk_total_gb, uptime_hours, uptime_text, server_name,
            server_ip, server_status, created_at
        FROM mon_server WHERE deleted = 0 ORDER BY created_at DESC LIMIT 1
    ")->fetch(PDO::FETCH_ASSOC);

    $history = [];
    $stmt = $conn->query("
        SELECT id, cpu_percent, ram_percent, disk_percent, created_at
        FROM mon_server WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0 ORDER BY created_at ASC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $history[] = $row; }

    $trends = $conn->query("
        SELECT AVG(cpu_percent) as avg_cpu, AVG(ram_percent) as avg_mem, AVG(disk_percent) as avg_disk,
            MAX(cpu_percent) as max_cpu, MAX(ram_percent) as max_mem, MAX(disk_percent) as max_disk,
            MIN(cpu_percent) as min_cpu, MIN(ram_percent) as min_mem, COUNT(*) as total_samples
        FROM mon_server WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);

    $output = ApiResponse::buildSuccess(
        ['current' => $current, 'history' => $history, 'trends' => $trends],
        ['rows_affected' => 1, 'version' => '2.4.0-P06-ENTERPRISE']
    );

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
