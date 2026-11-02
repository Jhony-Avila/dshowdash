<?php
// DataTables / limpeza do artefato DT_Write_Probe criado pelo health-check nos
// bancos de producao (efeito colateral do CREATE TABLE com credencial privilegiada).
// @version 1.0.0  @created 2026-07-21  @app DataTables
//
// SEGURANCA (defesa em profundidade — so remove o NOSSO artefato, nunca dado de negocio):
//   - opera apenas sobre tabela chamada EXATAMENTE `DT_Write_Probe`;
//   - so remove se estiver VAZIA (COUNT(*) = 0);
//   - so remove se as COLUNAS baterem com o schema conhecido da sonda
//     (id, probe_uuid, probe_at, origin) — qualquer divergencia => PULA e avisa;
//   - captura `SHOW CREATE TABLE` antes de dropar (registro em /backup);
//   - --dry-run por padrao: nao escreve nada. Precisa de --apply para dropar.
//
// Credencial: bloco .env DB_DSAUDIT_* (a mesma da catalogacao; sera rotacionada).
declare(strict_types=1);

$opts  = getopt('', ['apply', 'dry-run']);
$apply = isset($opts['apply']);            // sem --apply => dry-run

const PROBE_TABLE   = 'DT_Write_Probe';
const EXPECTED_COLS = ['id', 'probe_uuid', 'probe_at', 'origin'];

/** Le o bloco DB_DSAUDIT_* do .env (unico lugar da credencial). */
function dsauditCreds(): array
{
    $env = [];
    foreach (@file('/var/www/dshowdash/.env', FILE_IGNORE_NEW_LINES) ?: [] as $ln) {
        if (preg_match('/^(DB_DSAUDIT_[A-Z]+)\s*=\s*(.*)$/', trim($ln), $m)) {
            $env[$m[1]] = trim($m[2], " \t\"'");
        }
    }
    foreach (['HOST', 'PORT', 'USER', 'PASS'] as $k) {
        if (($env['DB_DSAUDIT_' . $k] ?? '') === '') {
            fwrite(STDERR, "Credencial DB_DSAUDIT_$k ausente no .env\n");
            exit(2);
        }
    }
    return $env;
}

$env = dsauditCreds();
$dsn = "mysql:host={$env['DB_DSAUDIT_HOST']};port={$env['DB_DSAUDIT_PORT']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $env['DB_DSAUDIT_USER'], $env['DB_DSAUDIT_PASS'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT            => 10,
    ]);
} catch (Throwable $e) {
    fwrite(STDERR, 'Falha ao conectar: ' . $e->getMessage() . "\n");
    exit(2);
}

echo '== ' . ($apply ? 'APLICAR (DROP real)' : 'DRY-RUN (nada e escrito)') . " ==\n";
echo "Servidor: {$env['DB_DSAUDIT_HOST']}:{$env['DB_DSAUDIT_PORT']}  usuario: {$env['DB_DSAUDIT_USER']}\n\n";

// 1) todos os schemas com uma tabela chamada DT_Write_Probe
$alvos = $pdo->query(
    "SELECT TABLE_SCHEMA FROM information_schema.TABLES
      WHERE TABLE_NAME = " . $pdo->quote(PROBE_TABLE) . "
      ORDER BY TABLE_SCHEMA"
)->fetchAll(PDO::FETCH_COLUMN);

if (!$alvos) {
    echo "Nenhuma tabela DT_Write_Probe encontrada. Nada a fazer.\n";
    exit(0);
}

$backupDir = '/backup/datatables-writeprobe-cleanup-' . date('Ymd-His');
$backupFile = null;
if ($apply) {
    @mkdir($backupDir, 0775, true);
    $backupFile = $backupDir . '/show-create-antes.sql';
}

$dropar = [];
$pular  = [];

foreach ($alvos as $schema) {
    $qs = '`' . str_replace('`', '``', $schema) . '`.`' . PROBE_TABLE . '`';

    // colunas reais
    $cols = $pdo->query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = " . $pdo->quote($schema) . "
            AND TABLE_NAME   = " . $pdo->quote(PROBE_TABLE) . "
          ORDER BY ORDINAL_POSITION"
    )->fetchAll(PDO::FETCH_COLUMN);

    $colsOk = ($cols === EXPECTED_COLS);

    // contagem EXATA (nao a estimativa do information_schema)
    $rows = (int)$pdo->query("SELECT COUNT(*) FROM $qs")->fetchColumn();

    $motivo = [];
    if (!$colsOk) $motivo[] = 'colunas divergem (' . implode(',', $cols) . ')';
    if ($rows !== 0) $motivo[] = "tem $rows linha(s)";

    $verdito = empty($motivo) ? 'DROPAR' : 'PULAR';
    printf("  %-22s cols_ok=%s rows=%-3d -> %s%s\n",
        $schema, $colsOk ? 'sim' : 'NAO', $rows, $verdito,
        $motivo ? '  [' . implode('; ', $motivo) . ']' : '');

    if (empty($motivo)) $dropar[] = $schema; else $pular[] = $schema;
}

echo "\nResumo: " . count($dropar) . " a remover, " . count($pular) . " a pular (de " . count($alvos) . " encontradas).\n";

if (!$apply) {
    echo "\nDRY-RUN: nenhuma alteracao feita. Para aplicar: php " . basename(__FILE__) . " --apply\n";
    exit(0);
}

// APLICAR
$dropadas = 0;
foreach ($dropar as $schema) {
    $qs = '`' . str_replace('`', '``', $schema) . '`.`' . PROBE_TABLE . '`';
    try {
        // registro do DDL antes de dropar
        $create = $pdo->query("SHOW CREATE TABLE $qs")->fetch(PDO::FETCH_NUM)[1] ?? '';
        @file_put_contents($backupFile, "-- $schema\n$create;\n\n", FILE_APPEND);

        $pdo->exec("DROP TABLE $qs");
        echo "  DROP OK: $schema\n";
        $dropadas++;
    } catch (Throwable $e) {
        echo "  DROP FALHOU em $schema: " . $e->getMessage() . "\n";
    }
}
echo "\n$dropadas tabela(s) removida(s). Registro do DDL em: $backupFile\n";
