<?php
// datatables-monitor.php - rotina periodica do DataTables (CLI)
// @version 1.0.0
// @created 2026-07-20
// @app DataTables
//
// Modos:
//   --mode=check      verificacao de conexoes (§14) - a cada 5 min
//   --mode=inventory  inventario estrutural (§36) - frequencia menor
//   --mode=quality    analise de qualidade e score (§24/25) - JANELA CONFIGURADA
//   --mode=maintain   expurgo de retencao e decaimento de contadores (§41) - diario
//
// Uso no cron (ver /etc/cron.d/datatables):
//   */5 * * * * www-data /usr/bin/php .../datatables-monitor.php --mode=check
//
// Trava por modo via flock: uma execucao lenta nunca se sobrepoe a proxima.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI apenas\n");
}

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../api/datatables/repositories/ConnectionRepository.php';
require_once __DIR__ . '/../api/datatables/repositories/StatusRepository.php';
require_once __DIR__ . '/../api/datatables/services/HealthCheckService.php';
require_once __DIR__ . '/../api/datatables/services/InventoryService.php';
require_once __DIR__ . '/../api/datatables/services/AlertService.php';
require_once __DIR__ . '/../api/datatables/services/QualityService.php';
require_once __DIR__ . '/../api/datatables/services/ExternalSourceService.php';
require_once __DIR__ . '/../api/datatables/services/MetricsService.php';
require_once __DIR__ . '/../api/datatables/lib/Crypto.php';
require_once __DIR__ . '/../api/datatables/lib/ConnectionFactory.php';
require_once __DIR__ . '/../api/datatables/services/DiscoveryScanService.php';
require_once __DIR__ . '/../api/datatables/services/DiscoveryService.php';

$opts = getopt('', ['mode::', 'connection::', 'verbose']);
$mode    = $opts['mode'] ?? 'check';
$onlyId  = isset($opts['connection']) ? (int)$opts['connection'] : null;
$verbose = isset($opts['verbose']);

// ── Trava ───────────────────────────────────────────────────────
// Fica em storage/ (dono www-data), NAO em /tmp: um lock de /tmp criado por
// outro usuario torna-se inabrivel e o cron sairia calado para sempre.
$lockDir = __DIR__ . '/../storage/locks';
if (!is_dir($lockDir)) {
    @mkdir($lockDir, 0775, true);
    @chmod($lockDir, 0775);
}
$lockFile = $lockDir . "/datatables-{$mode}.lock";

$lock = @fopen($lockFile, 'c');

// A trava e compartilhada entre o cron (www-data) e execucoes manuais (root,
// ex.: o runner de regressao). Sem permissao de GRUPO, o arquivo criado por um
// usuario fica inabrivel pelo outro e o cron para de rodar em silencio.
if ($lock !== false) {
    @chmod($lockFile, 0664);
}

if ($lock === false) {
    // NAO confundir com "ja rodando": aqui a trava esta inacessivel e a rotina
    // jamais executaria. Precisa falhar alto para aparecer no log e no exit code.
    logLine("FATAL: nao foi possivel abrir a trava {$lockFile} - verifique dono/permissao");
    exit(1);
}
if (!flock($lock, LOCK_EX | LOCK_NB)) {
    logLine("modo={$mode} ja em execucao - saindo");
    fclose($lock);
    exit(0);
}

$t0 = microtime(true);

try {
    $pdo = getConnection('DSHOWDASH');
} catch (Throwable $e) {
    logLine('FATAL: sem conexao com DSHOWDASH: ' . $e->getMessage());
    exit(1);
}

switch ($mode) {
    case 'check':     runCheck($pdo, $onlyId, $verbose);     break;
    case 'inventory': runInventory($pdo, $onlyId, $verbose); break;
    case 'quality':   runQuality($pdo, $onlyId, $verbose);   break;
    case 'maintain':  runMaintain($pdo, $verbose);           break;
    case 'discovery': runDiscovery($pdo, $verbose);          break;
    default:
        logLine("modo desconhecido: {$mode}");
        exit(2);
}

logLine(sprintf('modo=%s concluido em %.1fs', $mode, microtime(true) - $t0));
flock($lock, LOCK_UN);
fclose($lock);
exit(0);

// ═══════════════════════════════════════════════════════════════
// MODOS
// ═══════════════════════════════════════════════════════════════

function runCheck(PDO $pdo, ?int $onlyId, bool $verbose): void
{
    $repo  = new DtConnectionRepository($pdo);
    $svc   = new DtHealthCheckService($pdo);
    $ext   = new DtExternalSourceService($pdo);
    $alert = new DtAlertService($pdo);

    $conns = $onlyId !== null
        ? array_filter([$repo->findForConnect($onlyId)])
        : $repo->findMonitorable();

    if ($conns === []) {
        logLine('nenhuma conexao monitoravel');
        return;
    }

    $tally = [];
    $alerted = 0;
    foreach ($conns as $c) {
        try {
            // Fonte MySQL usa o probe de banco; API/arquivo/cache usam o
            // verificador de fonte externa. Ambos gravam no mesmo pipeline de
            // status, entao disponibilidade e alertas funcionam igual.
            $r = (($c['source_type'] ?? 'mysql') === 'mysql')
                ? $svc->check($c)
                : $ext->check($c);
            $tally[$r['status']] = ($tally[$r['status']] ?? 0) + 1;

            // Avaliacao de alertas: levanta o que se aplica e resolve o que
            // deixou de valer. Falha aqui nao pode abortar a verificacao.
            try {
                $raised = $alert->evaluateCheck((int)$c['id'], (string)$c['name'], $r);
                $alerted += count(array_filter($raised, fn($a) => !empty($a['created'])));
            } catch (Throwable $ae) {
                logLine("  conn={$c['id']} alerta ERRO: " . substr($ae->getMessage(), 0, 140));
            }

            if ($verbose) {
                logLine(sprintf('  conn=%-4d %-20s %-18s %sms',
                    $c['id'], substr((string)$c['name'], 0, 20), $r['status'], $r['latency_ms'] ?? '-'));
            }
        } catch (Throwable $e) {
            // Uma conexao problematica nao pode derrubar o ciclo inteiro.
            logLine("  conn={$c['id']} ERRO: " . substr($e->getMessage(), 0, 160));
            $tally['erro_interno'] = ($tally['erro_interno'] ?? 0) + 1;
        }
    }

    $parts = [];
    foreach ($tally as $k => $v) {
        $parts[] = "{$k}={$v}";
    }
    logLine('verificadas ' . count($conns) . ' conexoes: ' . implode(' ', $parts)
        . ($alerted > 0 ? " | {$alerted} alerta(s) novo(s)" : ''));
}

function runInventory(PDO $pdo, ?int $onlyId, bool $verbose): void
{
    $repo = new DtConnectionRepository($pdo);
    $svc  = new DtInventoryService($pdo);

    $conns = $onlyId !== null
        ? array_filter([$repo->findForConnect($onlyId)])
        : $repo->findMonitorable();

    foreach ($conns as $c) {
        // So inventaria fonte de banco; API/arquivo tem rotina propria.
        if (($c['source_type'] ?? 'mysql') !== 'mysql') {
            continue;
        }
        try {
            $r = $svc->runForConnection($c);
            logLine(sprintf('  conn=%-4d %s: %s bancos=%d tabelas=%d campos=%d amostras=%d (%dms)',
                $c['id'], substr((string)$c['name'], 0, 20), $r['status'],
                $r['databases'], $r['tables'], $r['fields'], $r['samples'] ?? 0, $r['duration_ms']));

            // Crescimento anormal (§18.4): so faz sentido DEPOIS de coletar a
            // amostra desta rodada. Exige >=2 amostras separadas por 24h.
            try {
                $met    = new DtMetricsService($pdo);
                $alert  = new DtAlertService($pdo);
                $growth = $met->detectAbnormalGrowth((int)$c['id']);
                foreach ($growth as $g) {
                    $alert->raise('abnormal_growth', 'table', $g['table_id'],
                        "Crescimento anormal: {$g['database_name']}.{$g['table_name']}",
                        sprintf('%s cresceu %.1f%% em %d dias (limite %.0f%%): %s -> %s',
                            ucfirst($g['metric']), $g['pct'], $g['window_days'],
                            $g['limit_pct'], $g['from'], $g['to']),
                        (int)$c['id']);
                }
                if ($growth !== []) {
                    logLine('    crescimento anormal em ' . count($growth) . ' tabela(s)');
                }
            } catch (Throwable $ge) {
                logLine('    aviso crescimento: ' . substr($ge->getMessage(), 0, 120));
            }

            // Mudancas estruturais (§36): nova/removida tabela, novo/removido campo,
            // tipo alterado. O diff vem do proprio inventario (snapshot antes x depois).
            try {
                if (!empty($r['diff'])) {
                    $alertEstrut = new DtAlertService($pdo);
                    $levantados  = $alertEstrut->evaluateInventoryDiff((int)$c['id'], $r['diff']);
                    $novos = count(array_filter($levantados, static fn($a) => !empty($a['created'])));
                    $d = $r['diff'];
                    $tot = count($d['new_tables']) + count($d['removed_tables'])
                         + count($d['new_fields']) + count($d['removed_fields']) + count($d['type_changed']);
                    if ($tot > 0) {
                        logLine(sprintf('    estrutural: +%dtab -%dtab +%dcampo -%dcampo ~%dtipo -> %d alerta(s)',
                            count($d['new_tables']), count($d['removed_tables']),
                            count($d['new_fields']), count($d['removed_fields']),
                            count($d['type_changed']), $novos));
                    }
                }
            } catch (Throwable $se) {
                logLine('    aviso estrutural: ' . substr($se->getMessage(), 0, 120));
            }
        } catch (Throwable $e) {
            logLine("  conn={$c['id']} ERRO: " . substr($e->getMessage(), 0, 160));
        }
    }
}

/**
 * Analise de qualidade (§24/25). E a rotina MAIS CARA do modulo - a unica que
 * consulta tabela de negocio. Roda em janela configurada, nunca no ciclo de 5 min.
 */
function runQuality(PDO $pdo, ?int $onlyId, bool $verbose): void
{
    $repo = new DtConnectionRepository($pdo);
    $svc  = new DtQualityService($pdo);

    $conns = $onlyId !== null
        ? array_filter([$repo->findForConnect($onlyId)])
        : $repo->findMonitorable();

    foreach ($conns as $c) {
        if (($c['source_type'] ?? 'mysql') !== 'mysql') {
            continue;
        }
        // Conexao fora do ar: nao adianta tentar varrer dados.
        if (in_array($c['status'] ?? '', ['offline', 'credential_expired'], true)) {
            logLine("  conn={$c['id']} pulada (status={$c['status']})");
            continue;
        }
        try {
            $t0 = microtime(true);
            $r  = $svc->runForConnection($c, true);
            logLine(sprintf('  conn=%-4d %s: estruturais=%d dados=%d tabelas=%d puladas=%d erros=%d (%.1fs)',
                $c['id'], substr((string)$c['name'], 0, 20),
                $r['structural'], $r['data'], $r['tables'], $r['skipped'], $r['errors'],
                microtime(true) - $t0));
        } catch (Throwable $e) {
            logLine("  conn={$c['id']} ERRO: " . substr($e->getMessage(), 0, 160));
        }
    }
}

function runMaintain(PDO $pdo, bool $verbose): void
{
    $sr = new DtStatusRepository($pdo);

    $purged = $sr->purgeOldAggregates();
    logLine(sprintf('retencao: %d linhas horarias e %d diarias removidas',
        $purged['hours_deleted'], $purged['days_deleted']));

    $sr->decayFlapCounters();

    $mp = (new DtMetricsService($pdo))->purge();
    logLine(sprintf('metricas: %d amostras de tabela e %d de banco removidas',
        $mp['table_metrics_deleted'], $mp['db_metrics_deleted']));

    // Ocorrencias de alerta antigas de incidentes ja resolvidos.
    $n = $pdo->exec(
        'DELETE o FROM DT_Alerta_Ocorrencia o
           JOIN DT_Alerta a ON a.id = o.alert_id
          WHERE a.status = "resolved" AND o.occurred_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );
    logLine("ocorrencias antigas removidas: " . (int)$n);

    // Descoberta: bancos desaparecidos ha muito tempo e nao triados (§22 retencao).
    // Mantem os triados (legado/ignorado) — sao decisao da equipe.
    $d = $pdo->exec(
        'DELETE FROM DT_Discovered_Database
          WHERE is_present = 0 AND user_status IS NULL
            AND disappeared_at IS NOT NULL
            AND disappeared_at < DATE_SUB(NOW(), INTERVAL 90 DAY)'
    );
    logLine("descoberta: bancos desaparecidos ha >90d removidos: " . (int)$d);
}

/**
 * Auditoria de descoberta recorrente (§7 automacao + §23 alertas). Roda a rodada
 * completa (camadas 1-9 + reconciliacao) e o proprio run() difere da anterior e
 * levanta alertas (novo banco/desaparecimento/so-backup/parcial/colisao...).
 */
function runDiscovery(PDO $pdo, bool $verbose): void
{
    $run = (new DtDiscoveryService($pdo))->run('cron');
    $stats = $run['stats'] ?? [];
    logLine(sprintf(
        'discovery run #%d status=%s: %d acessiveis, %d catalogados, %d pendentes, %d alertas',
        (int)($run['id'] ?? 0), (string)($run['status'] ?? '?'),
        (int)($run['databases_found'] ?? 0), (int)($run['databases_catalogued'] ?? 0),
        (int)($run['databases_pending'] ?? 0), (int)($stats['alerts_raised'] ?? 0)
    ));
    if ($verbose && !empty($stats['layers'])) {
        foreach ($stats['layers'] as $c) {
            logLine(sprintf('  camada %-11s %-11s (%d lidos, %d achados)',
                $c['layer'] ?? '?', $c['status'] ?? '?', (int)($c['scanned'] ?? 0), (int)($c['hits'] ?? 0)));
        }
    }
    if (!empty($run['error'])) {
        logLine('  erro: ' . $run['error']);
    }
}

// ═══════════════════════════════════════════════════════════════

function logLine(string $msg): void
{
    fwrite(STDOUT, '[' . date('Y-m-d H:i:s') . "] [datatables] {$msg}\n");
}
