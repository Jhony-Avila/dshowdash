<?php
// Header Alerts API Enterprise
// @version 2.3.0-P06-ENTERPRISE
// @changelog v2.3.0-P06: Migrado para ApiResponse
// @changelog v2.2.0: Migrado para RedisHelper centralizado

require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error(ApiResponse::ERR_METHOD_NOT_ALLOWED, 405);
}

$CACHE_KEY = 'alerts:header';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    require_once '/var/www/dshowdash/app/config/database.php';

    $critical_count = 0;
    $warning_count = 0;
    $info_count = 0;
    $last_error_at = null;
    $last_warning_at = null;

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $stmt = $pdo->query("
                SELECT
                    COUNT(CASE WHEN level = 'critical' OR level = 'error' THEN 1 END) as critical_count,
                    COUNT(CASE WHEN level = 'warning' THEN 1 END) as warning_count,
                    COUNT(CASE WHEN level = 'info' THEN 1 END) as info_count,
                    MAX(CASE WHEN level = 'critical' OR level = 'error' THEN created_at END) as last_error_at,
                    MAX(CASE WHEN level = 'warning' THEN created_at END) as last_warning_at
                FROM system_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($data) {
                $critical_count = (int)($data['critical_count'] ?? 0);
                $warning_count = (int)($data['warning_count'] ?? 0);
                $info_count = (int)($data['info_count'] ?? 0);
                $last_error_at = $data['last_error_at'];
                $last_warning_at = $data['last_warning_at'];
            }
        } catch (PDOException $e) {
            error_log("[header-alerts.php] Query failed: " . $e->getMessage());
        }
    }

    $output = ApiResponse::buildSuccess([
        'critical_count' => $critical_count,
        'warning_count' => $warning_count,
        'info_count' => $info_count,
        'total_count' => $critical_count + $warning_count + $info_count,
        'last_error_at' => $last_error_at,
        'last_warning_at' => $last_warning_at
    ], [
        'version' => '2.3.0-P06-ENTERPRISE',
        'timestamp' => date('c')
    ]);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log("[header-alerts.php] Exception: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
