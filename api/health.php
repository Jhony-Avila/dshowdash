<?php
// /api/health.php
// Health Check Endpoint - Sistema DshowDash
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P3.2: Adicionado IP whitelist para proteger informações sensíveis
// P2.1: Migrado para ApiResponse

require_once __DIR__ . '/_helpers/ApiResponse.php';

header('Cache-Control: no-cache, no-store, must-revalidate');

// Detalhe completo SÓ para loopback (decisão do Jhony, 27/11: não há monitor externo). O público vê só o resumo, como antes.
// O IP é o de quem abriu a conexão (ClienteIp, sem proxies de confiança): X-Forwarded-For não autoriza nada.
require_once __DIR__ . '/core/ClienteIp.php';
$clientIp = ClienteIp::resolver($_SERVER, []);
$isAuthorized = ClienteIp::naLista($clientIp, ['127.0.0.1', '::1']);

// Para IPs não autorizados, retorna apenas status básico
if (!$isAuthorized) {
    $status = 'HEALTHY';
    
    try {
        require_once '/var/www/dshowdash/config/db_connection.php';
        $result = DatabaseManager::testConnection('DSHOWDASH');
        if (!$result['success']) {
            $status = 'UNHEALTHY';
        }
    } catch (Exception $e) {
        $status = 'UNHEALTHY';
    }

    if ($status === 'UNHEALTHY') {
        ApiResponse::error('UNHEALTHY', 503, [
            'status' => $status,
            'timestamp' => date('c'),
            'version' => '3.1.0-ENTERPRISE'
        ]);
    } else {
        ApiResponse::success([
            'status' => $status,
            'timestamp' => date('c'),
            'version' => '3.1.0-ENTERPRISE'
        ]);
    }
    exit;
}

// HL-001 (LOTE9; AZUL, 27/11): contrato v4 OPT-IN, só para IPs autorizados (portão do IP real acima). Lê UMA fotografia local (≤ 16 KiB)
// do coletor; não abre conexão. Crítico ausente/vencido/inválido ou build ≠ release servida → 503; identidade desconhecida = só aviso.
if (($_GET['contract'] ?? '') === '4') {
    require_once __DIR__ . '/core/HealthOperacionalV4.php';
    require_once __DIR__ . '/core/ReleaseIdentidade.php';   // identidade = RELEASE_SHA da release servida (sem variável no php-fpm)
    HealthOperacionalV4::responder(getenv('HEALTH_SAMPLES_V4_FILE') ?: '/var/www/dshowdash/storage/health/samples-v4.json', ReleaseIdentidade::sha(__DIR__ . '/..'));
    exit;
}

// Resposta completa para IPs autorizados
$startTime = microtime(true);

$health = [
    'status' => 'HEALTHY',
    'timestamp' => date('c'),
    'version' => '3.1.0-ENTERPRISE',
    'environment' => 'production',
    'checks' => [],
    'metrics' => []
];
// HL-001-R1 (27/11): agregado MONOTÔNICO (nunca rebaixa UNHEALTHY), crítico ausente = falha, decisão pelo valor NÃO arredondado,
// duração de cada check registrada e comparada com o orçamento (HealthAgregado::ORCAMENTO_MS). Regras puras em core/HealthAgregado.php.
require_once __DIR__ . '/core/HealthAgregado.php';
require_once __DIR__ . '/core/ReleaseIdentidade.php';
$piorar = static function (string $novo) use (&$health): void { $health['status'] = HealthAgregado::piorar($health['status'], $novo); };
$avisos = [];
$tCheck = microtime(true);
$dur = static function (string $k) use (&$health, &$tCheck, &$avisos): void {
    $ms = round((microtime(true) - $tCheck) * 1000, 1);
    if (isset($health['checks'][$k]) && is_array($health['checks'][$k])) { $health['checks'][$k]['duration_ms'] = $ms; }
    if ($ms > (HealthAgregado::ORCAMENTO_MS[$k] ?? PHP_INT_MAX)) { $avisos[] = 'orcamento_excedido:' . $k; }
    $tCheck = microtime(true);
};

// 1. PHP Status
$health['checks']['php'] = [
    'status' => 'OK',
    'version' => PHP_VERSION,
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time')
];
$dur('php');

// 2. Session Status
try {
    require_once __DIR__ . '/_session_init.php';
    $ativa = session_status() === PHP_SESSION_ACTIVE;
    $health['checks']['session'] = ['status' => $ativa ? 'OK' : 'ERROR', 'criticality' => 'critical', 'name' => session_name()];
    if (!$ativa) { $piorar('UNHEALTHY'); }   // sessão é crítica (HL-001-R1)
} catch (Throwable $e) {
    $health['checks']['session'] = ['status' => 'ERROR', 'criticality' => 'critical'];
    $piorar('UNHEALTHY');
    error_log('health.php session error: ' . get_class($e));
}
$dur('session');

// 3. Database Connection
try {
    require_once '/var/www/dshowdash/config/db_connection.php';
    $result = DatabaseManager::testConnection('DSHOWDASH');
    if ($result['success']) {
        $health['checks']['database'] = [
            'status' => 'OK',
            'database' => 'DSHOWDASH',
            'server_time' => $result['server_time']
        ];
    } else {
        $health['checks']['database'] = ['status' => 'ERROR', 'criticality' => 'critical'];
        $piorar('UNHEALTHY');
    }
} catch (Throwable $e) {
    $health['checks']['database'] = ['status' => 'ERROR', 'criticality' => 'critical'];
    $piorar('UNHEALTHY');
    error_log('health.php database error: ' . get_class($e));
}
$dur('database');

// 3b. Bancos REMOTOS — HL-001 / HL-001-R1 (AZUL, 27/11): NENHUMA sonda no caminho síncrono. O health só LÊ a fotografia local do coletor
// (scripts/health/coletor-health.php): escrita atômica, dono root sem escrita para grupo/outros, identidade da release e idade ≤ 60 s.
// Sempre INFORMATIVO: sem fotografia, vencida (coletor parado), insegura ou de outra release = UNKNOWN com o motivo em `coleta`, e o
// agregado no máximo DEGRADED (HTTP 200) — a exceção provisória do trem ("só remote_databases fora") segue igual. Host/erro não saem.
$foto = HealthAgregado::fotografiaRemota(getenv('HEALTH_REMOTE_V4_FILE') ?: '/var/www/dshowdash/storage/health/remote-v4.json', ReleaseIdentidade::sha(__DIR__ . '/..'), time());
$remote = ['status' => 'OK', 'criticality' => 'informational', 'coleta' => $foto['coleta'], 'age_seconds' => $foto['idade_s']];
foreach ($foto['bancos'] as $alias => $b) {
    $remote[$alias] = ['status' => $b['status']];
    if ($b['status'] !== 'OK') { $remote['status'] = 'DOWN'; }   // rótulo legado do agregado
}
$health['checks']['remote_databases'] = $remote;
if ($remote['status'] !== 'OK') { $piorar('DEGRADED'); }
$dur('remote_databases');

// 4. Disk Space — HL-001-R1: decisão pelo valor NÃO arredondado; ≥ 92% = BLOQUEIO (UNHEALTHY, 503); 85–92% = WARNING com aviso (o
// agregado não piora: a publicação segue com aviso, como no contrato v4); medição indisponível = crítico ausente = UNHEALTHY.
$diskFree = disk_free_space('/');
$diskTotal = disk_total_space('/');
$d = HealthAgregado::nivelUso('disco', $diskTotal, $diskFree);
$health['checks']['disk'] = [
    'status' => $d['rotulo'], 'criticality' => 'critical',
    'limiares' => ['aviso' => HealthAgregado::LIMIARES['disco'][0], 'bloqueio' => HealthAgregado::LIMIARES['disco'][1]],
    'used_percent' => $d['uso'] === null ? null : round($d['uso'], 1),   // exibição arredondada; a decisão usou o valor bruto
    'free_gb' => $diskFree === false ? null : round($diskFree / 1073741824, 2),
    'total_gb' => $diskTotal === false ? null : round($diskTotal / 1073741824, 2),
] + ($d['motivo'] ? ['motivo' => $d['motivo']] : []);
$piorar($d['agregado']);
if ($d['aviso']) { $avisos[] = 'disco_acima_de_' . HealthAgregado::LIMIARES['disco'][0]; }
$dur('disk');

// 5. Memory — HL-001-R1 (proposta): uso = 1 − MemAvailable/MemTotal; ≥ 95% = BLOQUEIO; 85–95% = WARNING com aviso; ilegível = UNHEALTHY.
[$memTotal, $memDisp] = HealthAgregado::memoria(@file_get_contents('/proc/meminfo'));
$m = HealthAgregado::nivelUso('memoria', $memTotal, $memDisp);
$health['checks']['memory'] = [
    'status' => $m['rotulo'], 'criticality' => 'critical',
    'limiares' => ['aviso' => HealthAgregado::LIMIARES['memoria'][0], 'bloqueio' => HealthAgregado::LIMIARES['memoria'][1]],
    'used_percent' => $m['uso'] === null ? null : round($m['uso'], 1),
    'available_mb' => $memDisp === false ? null : (int) round($memDisp / 1024),
    'total_mb' => $memTotal === false ? null : (int) round($memTotal / 1024),
] + ($m['motivo'] ? ['motivo' => $m['motivo']] : []);
$piorar($m['agregado']);
if ($m['aviso']) { $avisos[] = 'memoria_acima_de_' . HealthAgregado::LIMIARES['memoria'][0]; }
$dur('memory');

// 6. Key directories
$dirs = [
    'public' => '/var/www/dshowdash/public',
    'backup' => '/backup',
    'logs' => '/var/www/dshowdash/storage/logs'
];
$health['checks']['directories'] = ['status' => 'OK'];
foreach ($dirs as $name => $path) {
    $exists = is_dir($path);
    $writable = is_writable($path);
    $health['checks']['directories'][$name] = ['exists' => $exists, 'writable' => $writable];
    if (!$exists) $health['checks']['directories']['status'] = 'DEGRADED';
}
$dur('directories');

// 7. Redis Status — HL-001-R1: crítico; um PING (sem INFO múltiplo); falha = UNHEALTHY; a mensagem de erro não é publicada.
try {
    require_once __DIR__ . '/core/helpers/RedisHelper.php';
    $redis = RedisHelper::getInstance();
    $pong = $redis ? $redis->ping() : false;
    $okRedis = $pong === true || $pong === '+PONG' || $pong === 'PONG';
    $health['checks']['redis'] = ['status' => $okRedis ? 'OK' : 'ERROR', 'criticality' => 'critical'];
    if (!$okRedis) { $piorar('UNHEALTHY'); }
    if ($redis) { RedisHelper::close(); }
} catch (Throwable $e) {
    $health['checks']['redis'] = ['status' => 'ERROR', 'criticality' => 'critical'];
    $piorar('UNHEALTHY');
    error_log('health.php redis error: ' . get_class($e));
}
$dur('redis');

// 8. Navigation item counts by table
try {
    $navTables = [
        'ui_nav_items' => "SELECT COUNT(*) AS cnt FROM ui_nav_items WHERE item_type != 'group'",
        'navrail_items' => "SELECT COUNT(*) AS cnt FROM navrail_items",
        'header_components' => "SELECT COUNT(*) AS cnt FROM header_components",
        'footer_items' => "SELECT COUNT(*) AS cnt FROM footer_items",
    ];
    $navCounts = [];
    $navTotal = 0;
    // Reuse DB connection from check #3
    if (isset($result) && $result['success']) {
        $pdo = DatabaseManager::getConnection('DSHOWDASH');
        foreach ($navTables as $tbl => $sql) {
            try {
                $row = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
                $count = (int)($row['cnt'] ?? 0);
                $navCounts[$tbl] = $count;
                $navTotal += $count;
            } catch (Exception $e) {
                $navCounts[$tbl] = -1;
            }
        }
    }
    $health['checks']['navigation'] = [
        'status' => 'OK',
        'total_items' => $navTotal,
        'by_table' => $navCounts,
    ];
} catch (Exception $e) {
    $health['checks']['navigation'] = ['status' => 'ERROR'];
    error_log('health.php navigation count error: ' . get_class($e));
}
$dur('navigation');

// 9. Last manifest rebuild
$manifestPath = '/var/www/dshowdash/public/core/ui-orchestrator/registry/manifest-generated.js';
if (file_exists($manifestPath)) {
    $mtime = filemtime($manifestPath);
    $health['checks']['manifest'] = [
        'status' => 'OK',
        'last_rebuild' => date('c', $mtime),
        'age_seconds' => time() - $mtime,
        'size_kb' => round(filesize($manifestPath) / 1024, 1),
    ];
} else {
    $health['checks']['manifest'] = [
        'status' => 'WARNING',
        'message' => 'Manifest file not found',
    ];
}

$dur('manifest');
$health['avisos'] = $avisos;
$health['orcamento_ms'] = HealthAgregado::ORCAMENTO_MS;

// Metrics
$health['metrics']['response_time_ms'] = round((microtime(true) - $startTime) * 1000, 2);
$health['metrics']['memory_usage_mb'] = round(memory_get_usage(true) / 1048576, 2);

// Final score
$okCount = 0;
$totalChecks = 0;
foreach ($health['checks'] as $check) {
    if (isset($check['status'])) {
        $totalChecks++;
        if ($check['status'] === 'OK') $okCount++;
    }
}
$health['score'] = "{$okCount}/{$totalChecks}";

if ($health['status'] === 'UNHEALTHY') {
    ApiResponse::error('UNHEALTHY', 503, $health);
} else {
    ApiResponse::success($health);
}
