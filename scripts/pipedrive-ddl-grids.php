<?php
// pipedrive-ddl-grids.php — 2o lote de indices: grids de pessoas/orgs/atividades/notas (CLI)
// @version 1.0.0
// @created 2026-07-29
// @app Pipedrive Analytics
//
// Continuacao do #46/#62. Cada indice aqui tem CAUSA MEDIDA, nao suposta:
//
//   persons  494 ms -> ordenacao e' 14 ms; as 2 subconsultas correlacionadas
//            (COUNT de deals por person_id) somam ~509 ms. pipe_deals NAO tem indice
//            em person_id -> cada uma das 25 linhas varre 20 mil negocios.
//   orgs     499 ms -> ordenacao e' 20 ms; as 3 subconsultas somam ~516 ms. Idem org_id.
//   activities 429 ms -> aqui a ordenacao E' o custo (277 ms sozinha). O ix_del_done_due
//            que existe NAO serve: `done` fica no meio e quebra a ordem por due_date.
//   notes     35 ms -> ordenacao 27 ms.
//
// ⚠️ A licao do lote anterior: `ix_update_time` de coluna unica foi criado e o otimizador
// o ignorou, porque o ORDER BY dos grids tem desempate (`, pipedrive_id DESC`). Todo
// indice de ordenacao aqui e' COMPOSTO e termina em pipedrive_id.
//
// LOCK=NONE de proposito: se o MySQL nao puder fazer online, ele ERRA em vez de bloquear.
//
// Uso:
//   php scripts/pipedrive-ddl-grids.php            # seco: mostra o DDL e sai
//   php scripts/pipedrive-ddl-grids.php --apply    # aplica
//
// Rollback: /backup/pipedrive-ddl-grids-2026-07-29/ROLLBACK.sql
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(403); exit("CLI apenas\n"); }

require_once dirname(__DIR__) . '/config/db_connection.php';

$apply = isset(getopt('', ['apply'])['apply']);
$pdo   = getConnection('PIPE_DSHOW');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

$ddl = [
    // Subconsultas correlacionadas: chave = o FK, depois o filtro fixo. `value` no fim
    // torna o SUM da organizacao coberto pelo indice (index-only).
    'pipe_deals' => 'ALTER TABLE pipe_deals'
        . ' ADD INDEX ix_person_del_status (person_id, is_deleted, status),'
        . ' ADD INDEX ix_org_del_status (org_id, is_deleted, status, value),'
        . ' ALGORITHM=INPLACE, LOCK=NONE',
    'pipe_activities' => 'ALTER TABLE pipe_activities'
        . ' ADD INDEX ix_del_due_pd (is_deleted, due_date, pipedrive_id),'
        . ' ALGORITHM=INPLACE, LOCK=NONE',
    'pipe_notes' => 'ALTER TABLE pipe_notes'
        . ' ADD INDEX ix_del_upd_pd (is_deleted, update_time, pipedrive_id),'
        . ' ALGORITHM=INPLACE, LOCK=NONE',
    // Hoje type=ALL (varredura total): nem is_deleted tem indice nestas duas.
    'pipe_persons' => 'ALTER TABLE pipe_persons'
        . ' ADD INDEX ix_del_upd_pd (is_deleted, update_time, pipedrive_id),'
        . ' ALGORITHM=INPLACE, LOCK=NONE',
    'pipe_organizations' => 'ALTER TABLE pipe_organizations'
        . ' ADD INDEX ix_del_upd_pd (is_deleted, update_time, pipedrive_id),'
        . ' ALGORITHM=INPLACE, LOCK=NONE',
];

$indicesDe = static function (PDO $pdo, string $t): array {
    $ix = [];
    foreach ($pdo->query("SHOW INDEX FROM {$t}") as $r) {
        $ix[$r['Key_name']][(int)$r['Seq_in_index']] = $r['Column_name'];
    }
    $out = [];
    foreach ($ix as $k => $cols) { ksort($cols); $out[$k] = implode(',', $cols); }
    return $out;
};

echo "== estado atual ==\n";
foreach (array_keys($ddl) as $t) {
    $mb = $pdo->query("SELECT ROUND(index_length/1048576,1) mb FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='{$t}'")->fetch()['mb'];
    printf("  %-20s indices=%5s MB  %s\n", $t, $mb, implode(' ', array_keys($indicesDe($pdo, $t))));
}

if (!$apply) {
    echo "\n== DDL que seria aplicado ==\n";
    foreach ($ddl as $t => $sql) { echo "  {$sql};\n"; }
    echo "\nSECO — nada aplicado. Rode com --apply.\n";
    exit(0);
}

echo "\n== aplicando ==\n";
foreach ($ddl as $t => $sql) {
    $t0 = microtime(true);
    try {
        $pdo->exec($sql);
        printf("  %-20s OK em %.2f s\n", $t, microtime(true) - $t0);
    } catch (\Throwable $e) {
        printf("  %-20s FALHOU: %s\n", $t, $e->getMessage());
        fwrite(STDERR, "abortado — nada mais sera aplicado. Rollback em /backup/pipedrive-ddl-grids-2026-07-29/\n");
        exit(1);
    }
}

foreach (array_keys($ddl) as $t) { $pdo->query("ANALYZE TABLE {$t}")->fetchAll(); }
echo "\nestatisticas do otimizador atualizadas\n";

echo "\n== estado depois ==\n";
foreach (array_keys($ddl) as $t) {
    $mb = $pdo->query("SELECT ROUND(index_length/1048576,1) mb FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='{$t}'")->fetch()['mb'];
    printf("  %-20s indices=%5s MB  %s\n", $t, $mb, implode(' ', array_keys($indicesDe($pdo, $t))));
}
