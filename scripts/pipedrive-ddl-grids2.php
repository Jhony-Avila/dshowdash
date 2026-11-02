<?php
// pipedrive-ddl-grids2.php — 3o lote: o que sobrou no grid de ATIVIDADES (CLI)
// @version 1.0.0
// @created 2026-07-29
// @app Pipedrive Analytics
//
// Depois do 2o lote o grid de atividades caiu 429 -> 174 ms. A decomposicao mostrou onde
// estao os 174 ms, e NAO era a ordenacao (que ficou em 0,8 ms):
//
//   facet `types` (DISTINCT em 105k linhas)  176,8 ms  <- todo o resto
//   COUNT(*) da paginacao                     20,9 ms
//   consulta principal                         0,8 ms
//
// O DISTINCT usava ix_del_done_due e caia em `Using temporary; Using filesort` sobre
// 52.959 linhas. Com (is_deleted, type) ele vira leitura ordenada de indice.
//
// ⚠️ O outro lado desta correcao e' de CODIGO (nao DDL): activitiesPage() calculava o
// facet em TODA pagina, ignorando o `facets=0` que o grid de Negocios ja respeita. Isso
// foi corrigido em SyncRepository::activitiesPage().
//
// Uso:
//   php scripts/pipedrive-ddl-grids2.php            # seco
//   php scripts/pipedrive-ddl-grids2.php --apply
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(403); exit("CLI apenas\n"); }

require_once dirname(__DIR__) . '/config/db_connection.php';

$apply = isset(getopt('', ['apply'])['apply']);
$pdo   = getConnection('PIPE_DSHOW');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$sql = 'ALTER TABLE pipe_activities'
     . ' ADD INDEX ix_del_type (is_deleted, type),'
     . ' ALGORITHM=INPLACE, LOCK=NONE';

$mb = static fn(): string => (string)$pdo->query(
    "SELECT ROUND(index_length/1048576,1) mb FROM information_schema.tables
      WHERE table_schema=DATABASE() AND table_name='pipe_activities'"
)->fetch()['mb'];

printf("pipe_activities indices: %s MB\n", $mb());

if (!$apply) {
    echo "\nDDL:\n  {$sql};\n\nSECO — nada aplicado. Rode com --apply.\n";
    exit(0);
}

$t0 = microtime(true);
try {
    $pdo->exec($sql);
    printf("\nOK em %.2f s\n", microtime(true) - $t0);
} catch (\Throwable $e) {
    fwrite(STDERR, 'FALHOU: ' . $e->getMessage() . "\n");
    exit(1);
}
$pdo->query('ANALYZE TABLE pipe_activities')->fetchAll();
printf("pipe_activities indices: %s MB\n", $mb());
echo "\nRollback: ALTER TABLE pipe_activities DROP INDEX ix_del_type;\n";
