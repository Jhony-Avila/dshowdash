<?php
// DataTables / catalogacao dos bancos do displaysolutions via credencial de auditoria.
// @version 1.0.0  @created 2026-07-21  @app DataTables
//
// Le a credencial do bloco .env DB_DSAUDIT_* (UNICO lugar de rotacao), enumera os
// schemas visiveis (SOMENTE LEITURA) e cataloga cada um pelo fluxo normal do modulo
// (DT_Conexao cifrada + InventoryService). Idempotente (upsert por host+db_name).
//
// Modos:
//   (default)   cataloga: cria conexao (se nao existe) + inventario de cada schema alvo.
//   --resync    apenas ATUALIZA a senha cifrada das conexoes DSAUDIT (apos rotacao do .env).
//   --dry-run   so lista os alvos, nao escreve nada.
//
// SEGURANCA: apenas SHOW DATABASES / information_schema / SELECT. Nenhuma escrita no
// servidor remoto. A senha nunca e impressa; vem so do .env; e cifrada AES-GCM ao gravar.
declare(strict_types=1);

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../api/datatables/lib/Crypto.php';
require_once __DIR__ . '/../api/datatables/lib/ConnectionFactory.php';
require_once __DIR__ . '/../api/datatables/lib/FieldClassifier.php';
require_once __DIR__ . '/../api/datatables/repositories/ConnectionRepository.php';
require_once __DIR__ . '/../api/datatables/services/HealthCheckService.php';
require_once __DIR__ . '/../api/datatables/services/InventoryService.php';

$opts    = getopt('', ['resync', 'dry-run']);
$resync  = isset($opts['resync']);
$dry     = isset($opts['dry-run']);

/** Le o bloco DB_DSAUDIT_* do .env. */
function dsauditCreds(): array
{
    $env = [];
    foreach (@file('/var/www/dshowdash/.env', FILE_IGNORE_NEW_LINES) ?: [] as $ln) {
        if (preg_match('/^(DB_DSAUDIT_[A-Z]+)\s*=\s*(.*)$/', trim($ln), $m)) {
            $env[$m[1]] = trim($m[2], " \t\"'");
        }
    }
    return [
        'host' => $env['DB_DSAUDIT_HOST'] ?? '',
        'port' => (int) ($env['DB_DSAUDIT_PORT'] ?? 3306),
        'user' => $env['DB_DSAUDIT_USER'] ?? '',
        'pass' => $env['DB_DSAUDIT_PASS'] ?? '',
    ];
}

// Nunca catalogados como negocio: internos do MySQL (o dono NAO listou estes) + os
// ja catalogados por outra conexao (DSHOW_PROD/INTEGRACAO via dshow_ro).
// APP DSHOW Lote 30 (D3): + schemas administrativos do servidor (sys, phpMyAdmin, CyberPanel) — nao sao bancos de negocio e so geram ruido.
const SKIP = ['information_schema', 'mysql', 'performance_schema', 'sys', 'phpmyadmin', 'cyberpanel', 'DSHOW_PROD', 'INTEGRACAO'];

function log_(string $s): void { fwrite(STDOUT, '[' . date('H:i:s') . "] $s\n"); }

$cred = dsauditCreds();
if ($cred['host'] === '' || $cred['user'] === '' || $cred['pass'] === '') {
    log_('FATAL: bloco DB_DSAUDIT_* ausente/incompleto no .env'); exit(1);
}

$pdo  = getConnection('DSHOWDASH');
$repo = new DtConnectionRepository($pdo);

// ── Modo RESYNC: so re-cifra a senha das conexoes DSAUDIT (rotacao) ──
if ($resync) {
    $ids = $pdo->query('SELECT id, name FROM DT_Conexao WHERE created_by = "dsaudit-catalog"')->fetchAll(PDO::FETCH_ASSOC);
    log_('resync: ' . count($ids) . ' conexoes DSAUDIT');
    foreach ($ids as $r) {
        if (!$dry) { $repo->update((int) $r['id'], [], $cred['pass']); }
        log_("  senha atualizada: #{$r['id']} {$r['name']}");
    }
    log_('resync concluido' . ($dry ? ' (dry-run)' : ''));
    exit(0);
}

// ── Enumeracao read-only (SHOW DATABASES) ──
$remote = new PDO(
    "mysql:host={$cred['host']};port={$cred['port']};charset=utf8mb4",
    $cred['user'], $cred['pass'],
    [PDO::ATTR_TIMEOUT => 15, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$schemas = $remote->query('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME')->fetchAll(PDO::FETCH_COLUMN);
$remote = null;

$alvos = array_values(array_filter($schemas, static fn($s) => !in_array($s, SKIP, true)));
log_('schemas visiveis: ' . count($schemas) . ' | alvos a catalogar: ' . count($alvos) . ' (' . implode(', ', $alvos) . ')');
if ($dry) { log_('dry-run: nada gravado'); exit(0); }

$hc  = new DtHealthCheckService($pdo);
$inv = new DtInventoryService($pdo);
$ok = 0; $falhas = 0;

foreach ($alvos as $db) {
    // idempotente: conexao ja existe p/ host+db?
    $ex = $pdo->prepare('SELECT id FROM DT_Conexao WHERE host = :h AND port = :p AND db_name = :d LIMIT 1');
    $ex->execute([':h' => $cred['host'], ':p' => $cred['port'], ':d' => $db]);
    $id = $ex->fetchColumn();
    if ($id) {
        log_("= {$db}: conexao #{$id} ja existe");
    } else {
        $id = $repo->create([
            'name' => $db, 'source_type' => 'mysql',
            'host' => $cred['host'], 'port' => $cred['port'], 'db_name' => $db,
            'username' => $cred['user'], 'classification' => 'active',
            'monitoring_enabled' => 1, 'is_active' => 1, 'ssl_enabled' => 0,
        ], $cred['pass'], 'dsaudit-catalog');
        log_("+ {$db}: conexao #{$id} criada");
    }
    $conn = $repo->findForConnect((int) $id);
    try {
        $chk = $hc->check($conn);
        $r   = $inv->runForConnection($conn);
        log_(sprintf('  %s: check=%s | inventario tabelas=%d campos=%d puladas=%d erros=%d',
            $db, $chk['status'] ?? '?', $r['tables'] ?? 0, $r['fields'] ?? 0, $r['skipped'] ?? 0, $r['errors'] ?? 0));
        $ok++;
    } catch (Throwable $e) {
        log_("  {$db}: FALHOU — " . mb_substr($e->getMessage(), 0, 140));
        $falhas++;
    }
}
log_("CONCLUIDO: {$ok} catalogados, {$falhas} falhas");
