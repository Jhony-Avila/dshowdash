<?php
declare(strict_types=1);

/**
 * scripts/avatar/aplicar-migracoes.php — aplica as migrações do catálogo
 * do Avatar Studio (Expansão, Trilha A) usando a PRÓPRIA conexão da app.
 * @version 1.0.0  @created 2026-07-30
 *
 * Uso (CLI apenas, na raiz do projeto):
 *   php scripts/avatar/aplicar-migracoes.php            → aplica schema+seeds
 *   php scripts/avatar/aplicar-migracoes.php --dry-run  → só lista os passos
 *
 * Idempotente por construção (IF NOT EXISTS / ON DUPLICATE KEY). Para testes
 * fora do servidor: AVST_MIG_DSN/AVST_MIG_USER/AVST_MIG_PASS sobrescrevem a
 * conexão (nunca usados em produção).
 */
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Somente CLI.\n");
    exit(1);
}

$raiz = dirname(__DIR__, 2);
$arquivos = [
    $raiz . '/sql/avatar/catalogo_schema.sql',
    $raiz . '/sql/avatar/catalogo_seed_taxonomia.sql',
    $raiz . '/sql/avatar/catalogo_seed_assets.sql',
    $raiz . '/sql/avatar/historico_schema.sql',
];
$dryRun = in_array('--dry-run', $argv, true);

$dsn = getenv('AVST_MIG_DSN');
if ($dsn !== false && $dsn !== '') {
    $pdo = new PDO($dsn, getenv('AVST_MIG_USER') ?: 'root', getenv('AVST_MIG_PASS') ?: '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} else {
    require_once $raiz . '/config/db_connection.php';
    $pdo = getConnection('DSHOWDASH');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

/** Divide o arquivo em comandos: ';' no fim de linha encerra o statement. */
function avstmig_comandos(string $sql): array
{
    $linhas = preg_split('/\R/', $sql) ?: [];
    $comandos = [];
    $atual = '';
    foreach ($linhas as $linha) {
        $aparada = trim($linha);
        if ($aparada === '' || str_starts_with($aparada, '--')) {
            continue; // comentários e vazios nunca entram no buffer
        }
        $atual .= $linha . "\n";
        if (str_ends_with(rtrim($linha), ';')) {
            $comandos[] = trim($atual);
            $atual = '';
        }
    }
    if (trim($atual) !== '') {
        $comandos[] = trim($atual);
    }
    return $comandos;
}

$totalOk = 0;
foreach ($arquivos as $arquivo) {
    if (!is_file($arquivo)) {
        fwrite(STDERR, "AUSENTE: {$arquivo}\n");
        exit(1);
    }
    $comandos = avstmig_comandos((string) file_get_contents($arquivo));
    echo basename($arquivo) . ' — ' . count($comandos) . " comandos\n";
    if ($dryRun) {
        continue;
    }
    foreach ($comandos as $i => $cmd) {
        try {
            $pdo->exec($cmd);
            $totalOk++;
        } catch (Throwable $e) {
            fwrite(STDERR, sprintf("ERRO em %s (comando %d): %s\n",
                basename($arquivo), $i + 1, $e->getMessage()));
            fwrite(STDERR, substr($cmd, 0, 220) . "…\n");
            exit(1);
        }
    }
}

if (!$dryRun) {
    $tabelas = (int) $pdo->query("
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name LIKE 'avatar\\_%'
    ")->fetchColumn();
    $assets = (int) $pdo->query('SELECT COUNT(*) FROM avatar_assets')->fetchColumn();
    $cats = (int) $pdo->query('SELECT COUNT(*) FROM avatar_categories')->fetchColumn();
    echo "== MIGRACOES OK == comandos: {$totalOk} · tabelas avatar_*: {$tabelas}"
        . " · categorias: {$cats} · assets: {$assets}\n";
}
