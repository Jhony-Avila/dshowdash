<?php
declare(strict_types=1);
// Painel-08 API - Alertas Recentes Enterprise
// @version 3.5.0-P06-ENTERPRISE
// @changelog v3.5.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$cacheKey = 'panel:08:alerts-recent';
$cacheTTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

require_once '/opt/dshow_secure/config/database.php';

try {
    $stmt = $pdo->query("
        SELECT id, job_name, alert_type, message,
            CASE WHEN alert_type = 'CRITICAL' THEN 'critical' WHEN alert_type = 'ERROR' THEN 'high' WHEN alert_type = 'WARNING' THEN 'medium' ELSE 'low' END as severity,
            created_at, acknowledged_at
        FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0 ORDER BY created_at DESC LIMIT 50
    ");
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countsBySeverity = ['critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0];
    foreach ($alerts as $alert) { $countsBySeverity[$alert['severity']]++; }

    $output = ApiResponse::buildSuccess([
        'alerts' => $alerts,
        'summary' => ['total' => count($alerts), 'critical' => $countsBySeverity['critical'], 'high' => $countsBySeverity['high'], 'medium' => $countsBySeverity['medium'], 'low' => $countsBySeverity['low']],
        'timestamp' => date('c')
    ], ['version' => '3.5.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($cacheKey, $output, $cacheTTL);

} catch (Throwable $e) {
    RedisHelper::close();
    error_log("panel-08 error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
