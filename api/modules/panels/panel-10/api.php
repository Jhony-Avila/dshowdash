<?php
/**
 * Panel 10 - Saúde Completa do Servidor Enterprise
 * @job_name api-painel-10
 * @version 2.4.3-ENTERPRISE
 * @description API Hostinger + Dados locais com Redis Cache
 * @updated 2026-01-21
 *
 * v2.4.3: Padronizado para usar InputValidator (sem parâmetros GET nesta API)
 * v2.4.2: FIX - Corrigido erro de sintaxe (barra invertida na URL linha 43)
 * v2.4.1: FIX - Corrigido caminho do _init.php (era ../../ agora é ../)
 * v2.4.0: Migrado para RedisHelper (conexão centralizada)
 * v2.3.0: P3.5 FIX - Adicionado CORS centralizado
 * v2.2.0: P1.1 - Migrado para ApiResponse (contrato ok/data/error/meta)
 * v2.1.0: Token movido para .env seguro, erro genérico
 * v2.0.0: Adicionado Redis cache (TTL 60s), padronizado estrutura
 * v1.0.1: Corrigido para usar DSHOWSESS
 */

require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../../_helpers/ApiResponse.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private');
header('Pragma: no-cache');
header('Expires: 0');

$CACHE_KEY = 'panel:10:health';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

// FIX: Migrado para SessionGate (padronização de sessão)
require_once __DIR__ . '/../../../core/SessionGate.php';
SessionGate::start();

if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401, ['message' => 'Sessão inválida ou expirada']);
    exit;
}

// Carregar configuração (token vem do .env seguro)
$serverConfig = require __DIR__ . '/../../../server/config.php';

function getHostingerData($config) {
    $token = $config['hostinger']['token'] ?? '';
    $baseUrl = $config['hostinger']['base_url'] ?? 'https://developers.hostinger.com/api/vps/v1';
    $timeout = $config['hostinger']['timeout'] ?? 10;

    if (empty($token)) {
        return [
            'ok' => false,
            'error' => 'Token não configurado'
        ];
    }

    $url = $baseUrl . '/virtual-machines';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return [
            'ok' => false,
            'error' => $error ? $error : 'HTTP ' . $httpCode
        ];
    }

    $vms = json_decode($response, true);
    $currentHostname = gethostname();
    $currentVM = null;

    foreach ($vms as $vm) {
        if (strpos($vm['hostname'], $currentHostname) !== false ||
            strpos($currentHostname, (string)$vm['id']) !== false) {
            $currentVM = $vm;
            break;
        }
    }

    if (!$currentVM) {
        foreach ($vms as $vm) {
            if ($vm['state'] === 'running') {
                $currentVM = $vm;
                break;
            }
        }
    }

    return [
        'ok' => true,
        'data' => $currentVM ? $currentVM : (isset($vms[0]) ? $vms[0] : null),
        'all_vms' => $vms
    ];
}

function getLocalServerData() {
    $data = [];

    if (function_exists('sys_getloadavg')) {
        $load = sys_getloadavg();
        $data['cpu_load_1'] = round($load[0], 2);
        $data['cpu_load_5'] = round($load[1], 2);
        $data['cpu_load_15'] = round($load[2], 2);

        $cpus = (int)shell_exec('nproc');
        if (!$cpus) $cpus = 1;
        $data['cpu_percent'] = round(($load[0] / $cpus) * 100, 2);
        $data['cpu_cores'] = $cpus;
    }

    if (file_exists('/proc/meminfo')) {
        $meminfo = file_get_contents('/proc/meminfo');
        preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
        preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $available);

        if ($total && $available) {
            $totalMB = round($total[1] / 1024, 2);
            $availableMB = round($available[1] / 1024, 2);
            $usedMB = $totalMB - $availableMB;

            $data['ram_total_mb'] = $totalMB;
            $data['ram_used_mb'] = $usedMB;
            $data['ram_available_mb'] = $availableMB;
            $data['ram_percent'] = round(($usedMB / $totalMB) * 100, 2);
        }
    }

    $diskTotal = disk_total_space('/');
    $diskFree = disk_free_space('/');
    $diskUsed = $diskTotal - $diskFree;

    $data['disk_total_gb'] = round($diskTotal / 1073741824, 2);
    $data['disk_used_gb'] = round($diskUsed / 1073741824, 2);
    $data['disk_free_gb'] = round($diskFree / 1073741824, 2);
    $data['disk_percent'] = round(($diskUsed / $diskTotal) * 100, 2);

    if (file_exists('/proc/uptime')) {
        $uptime = file_get_contents('/proc/uptime');
        $uptimeSeconds = (int)explode(' ', $uptime)[0];

        $days = floor($uptimeSeconds / 86400);
        $hours = floor(($uptimeSeconds % 86400) / 3600);
        $minutes = floor(($uptimeSeconds % 3600) / 60);

        $data['uptime_seconds'] = $uptimeSeconds;
        $data['uptime_days'] = $days;
        $data['uptime_hours'] = $hours;
        $data['uptime_minutes'] = $minutes;
        $data['uptime_text'] = sprintf('up %d days, %d hours, %d minutes', $days, $hours, $minutes);
    }

    $data['hostname'] = gethostname();
    $data['server_ip'] = isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : 'N/A';
    $data['collected_at'] = date('Y-m-d H:i:s');

    return $data;
}

try {
    $startTime = microtime(true);

    $hostingerResult = getHostingerData($serverConfig);
    $localData = getLocalServerData();

    $combinedData = [
        'hostinger' => isset($hostingerResult['data']) ? $hostingerResult['data'] : null,
        'local' => $localData,
        'status' => 'online',
        'server_name' => isset($localData['hostname']) ? $localData['hostname'] : 'unknown'
    ];

    if (($hostingerResult['ok'] ?? false) && isset($hostingerResult['data'])) {
        $vm = $hostingerResult['data'];
        $combinedData['vm_id'] = $vm['id'];
        $combinedData['vm_state'] = $vm['state'];
        $combinedData['vm_plan'] = $vm['plan'];
        $combinedData['vm_cpus'] = $vm['cpus'];
        $combinedData['vm_memory_mb'] = $vm['memory'];
        $combinedData['vm_disk_mb'] = $vm['disk'];
        $combinedData['vm_bandwidth_mb'] = $vm['bandwidth'];
        $combinedData['vm_ipv4'] = isset($vm['ipv4'][0]['address']) ? $vm['ipv4'][0]['address'] : null;
        $combinedData['vm_template'] = isset($vm['template']['name']) ? $vm['template']['name'] : null;
        $combinedData['status'] = $vm['state'] === 'running' ? 'online' : 'offline';
    }

    $output = json_encode([
        'ok' => true,
        'data' => $combinedData,
        'error' => null,
        'meta' => [
            'run_id' => date('Ymd-His') . '-' . substr(md5(uniqid()), 0, 6),
            'execution_time' => round(microtime(true) - $startTime, 3),
            'timestamp' => date('c'),
            'status_code' => 200
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log("Panel-10 error: " . $e->getMessage());
    ApiResponse::error('INTERNAL_ERROR', 500, ['message' => 'Erro ao processar requisição']);
}