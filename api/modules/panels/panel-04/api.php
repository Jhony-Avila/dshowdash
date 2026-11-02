<?php
declare(strict_types=1);

// Panel-04 API - Tabela de Incidentes Enterprise
// @version 8.5.0-P06-ENTERPRISE
// v8.5.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$validator = InputValidator::fromGet();
$period = $validator->enum('period', '24h', ['1h', '6h', '12h', '24h']);
$validPeriods = ['1h' => 1, '6h' => 6, '12h' => 12, '24h' => 24];
$hours = $validPeriods[$period];

$cacheKey = "panel:04:incidents:v8:{$period}";
$cacheTTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

require_once '/opt/dshow_secure/config/database.php';

try {
    $stmt = $pdo->prepare("SELECT id, job_name, CASE WHEN alert_type = 'CRITICAL' THEN 'alert-critical' WHEN alert_type = 'ERROR' THEN 'alert-high' WHEN alert_type = 'WARNING' THEN 'alert-medium' ELSE 'alert-low' END as type, alert_type as original_type, message, created_at FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) AND deleted = 0 ORDER BY created_at DESC LIMIT 200");
    $stmt->execute([$hours]);
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT CASE WHEN alert_type = 'CRITICAL' THEN 'critical' WHEN alert_type = 'ERROR' THEN 'high' WHEN alert_type = 'WARNING' THEN 'medium' ELSE 'low' END as severity, COUNT(*) as count FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) AND deleted = 0 GROUP BY severity");
    $stmt->execute([$hours]);
    $countsBySeverity = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $countsBySeverity[$row['severity']] = (int)$row['count']; }

    $stmt = $pdo->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour, CASE WHEN alert_type = 'CRITICAL' THEN 'critical' WHEN alert_type = 'ERROR' THEN 'high' WHEN alert_type = 'WARNING' THEN 'medium' ELSE 'low' END as severity, COUNT(*) as count FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR) AND deleted = 0 GROUP BY hour, severity ORDER BY hour ASC");
    $stmt->execute([$hours]);
    $timeline = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $h = $row['hour'];
        if (!isset($timeline[$h])) { $timeline[$h] = ['hour' => $h, 'critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0, 'total' => 0]; }
        $timeline[$h][$row['severity']] = (int)$row['count'];
        $timeline[$h]['total'] += (int)$row['count'];
    }
    $timeline = array_values($timeline);

    $topJobs = $pdo->query("SELECT job_name, COUNT(*) as total_alerts, SUM(CASE WHEN alert_type = 'CRITICAL' THEN 1 ELSE 0 END) as critical, SUM(CASE WHEN alert_type = 'ERROR' THEN 1 ELSE 0 END) as high, MAX(created_at) as last_alert FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND deleted = 0 GROUP BY job_name ORDER BY total_alerts DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

    $recentCount = (int)$pdo->query("SELECT COUNT(*) FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND deleted = 0")->fetchColumn();
    $criticalNewCount = (int)$pdo->query("SELECT COUNT(*) FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) AND deleted = 0 AND alert_type = 'CRITICAL'")->fetchColumn();

    $sparklineRaw = $pdo->query("SELECT DATE_FORMAT(created_at, '%H') as hour, CASE WHEN alert_type = 'CRITICAL' THEN 'critical' WHEN alert_type = 'ERROR' THEN 'high' WHEN alert_type = 'WARNING' THEN 'medium' ELSE 'low' END as severity, COUNT(*) as count FROM sync_job_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR) AND deleted = 0 GROUP BY hour, severity ORDER BY hour ASC")->fetchAll(PDO::FETCH_ASSOC);
    $sparklines = ['critical' => [], 'high' => [], 'medium' => [], 'low' => [], 'total' => []];
    $hourlyTotals = [];
    foreach ($sparklineRaw as $row) {
        $sparklines[$row['severity']][] = (int)$row['count'];
        $hourlyTotals[$row['hour']] = ($hourlyTotals[$row['hour']] ?? 0) + (int)$row['count'];
    }
    $sparklines['total'] = array_values($hourlyTotals);

    $groupedByJob = [];
    foreach ($alerts as $alert) {
        $job = $alert['job_name'];
        if (!isset($groupedByJob[$job])) {
            $groupedByJob[$job] = ['job_name' => $job, 'count' => 0, 'types' => ['alert-critical' => 0, 'alert-high' => 0, 'alert-medium' => 0, 'alert-low' => 0], 'last_alert' => null, 'last_message' => null, 'alerts' => []];
        }
        $groupedByJob[$job]['count']++;
        $groupedByJob[$job]['types'][$alert['type']]++;
        if (!$groupedByJob[$job]['last_alert'] || $alert['created_at'] > $groupedByJob[$job]['last_alert']) {
            $groupedByJob[$job]['last_alert'] = $alert['created_at'];
            $groupedByJob[$job]['last_message'] = $alert['message'];
        }
        if (count($groupedByJob[$job]['alerts']) < 5) { $groupedByJob[$job]['alerts'][] = $alert; }
    }
    usort($groupedByJob, fn($a, $b) => $b['count'] - $a['count']);

    $totalAlerts = array_sum($countsBySeverity);
    $data = [
        'data' => $alerts,
        'grouped' => array_values($groupedByJob),
        'summary' => [
            'total' => $totalAlerts, 'critical' => $countsBySeverity['critical'] ?? 0, 'high' => $countsBySeverity['high'] ?? 0,
            'medium' => $countsBySeverity['medium'] ?? 0, 'low' => $countsBySeverity['low'] ?? 0,
            'recent_5min' => $recentCount, 'critical_new' => $criticalNewCount, 'unique_jobs' => count($groupedByJob)
        ],
        'timeline' => $timeline,
        'top_jobs' => $topJobs,
        'sparklines' => $sparklines
    ];

    $output = ApiResponse::buildSuccess($data, ['period' => $period, 'hours' => $hours, 'version' => '8.5.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($cacheKey, $output, $cacheTTL);

} catch (Throwable $e) {
    RedisHelper::close();
    error_log("panel-04 error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
