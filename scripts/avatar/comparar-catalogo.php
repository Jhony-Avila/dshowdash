<?php
declare(strict_types=1);

/**
 * scripts/avatar/comparar-catalogo.php — HOMOLOGAÇÃO TS × banco (etapa 8
 * do plano de migração da Expansão). CLI apenas.
 * @version 1.0.0  @created 2026-07-30
 *
 * Compara sql/avatar/catalogo_dump.json (gerado do TS pelo mesmo script dos
 * seeds) com avatar_assets no banco: ausentes de um lado, divergências de
 * categoria/raridade/nome. Sai com código 1 quando divergir — a flag
 * avatar_catalog_db SÓ deve ligar com este script imprimindo CONSISTENTE.
 * Teste local: AVST_MIG_DSN/USER/PASS como no aplicar-migracoes.php.
 */
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Somente CLI.\n");
    exit(1);
}
$raiz = dirname(__DIR__, 2);
$dumpArq = $raiz . '/sql/avatar/catalogo_dump.json';
if (!is_file($dumpArq)) {
    fwrite(STDERR, "Rode antes: node scripts/avatar/gerar-seed-assets.mjs\n");
    exit(1);
}
$dump = json_decode((string) file_get_contents($dumpArq), true);
if (!is_array($dump)) {
    fwrite(STDERR, "catalogo_dump.json inválido.\n");
    exit(1);
}

$dsn = getenv('AVST_MIG_DSN');
if ($dsn !== false && $dsn !== '') {
    $pdo = new PDO($dsn, getenv('AVST_MIG_USER') ?: 'root', getenv('AVST_MIG_PASS') ?: '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} else {
    require_once $raiz . '/config/db_connection.php';
    $pdo = getConnection('DSHOWDASH');
}

$st = $pdo->query("
    SELECT a.`key`, c.`key` AS categoria, r.`key` AS raridade, a.name
    FROM avatar_assets a
    JOIN avatar_categories c ON c.id = a.category_id
    JOIN avatar_rarities r ON r.id = a.rarity_id
    WHERE a.asset_type IN ('parte2d','titulo','arquetipo')
");
$banco = [];
foreach ($st as $l) {
    $banco[$l['key']] = ['categoria' => $l['categoria'], 'raridade' => $l['raridade'], 'nome' => $l['name']];
}

$faltamBanco = array_diff_key($dump, $banco);
$faltamTs = array_diff_key($banco, $dump);
$divergentes = [];
foreach ($dump as $key => $ts) {
    if (!isset($banco[$key])) {
        continue;
    }
    foreach (['categoria', 'raridade', 'nome'] as $campo) {
        if ((string) $ts[$campo] !== (string) $banco[$key][$campo]) {
            $divergentes[] = "$key.$campo: TS='{$ts[$campo]}' banco='{$banco[$key][$campo]}'";
        }
    }
}

echo 'TS: ' . count($dump) . ' · banco: ' . count($banco) . "\n";
if ($faltamBanco !== []) {
    echo 'FALTAM NO BANCO (' . count($faltamBanco) . '): ' . implode(', ', array_slice(array_keys($faltamBanco), 0, 20)) . "\n";
}
if ($faltamTs !== []) {
    echo 'SÓ NO BANCO (' . count($faltamTs) . '): ' . implode(', ', array_slice(array_keys($faltamTs), 0, 20)) . "\n";
}
foreach (array_slice($divergentes, 0, 20) as $d) {
    echo "DIVERGE $d\n";
}
if ($faltamBanco === [] && $faltamTs === [] && $divergentes === []) {
    echo "== CATALOGO CONSISTENTE (TS × banco) ==\n";
    exit(0);
}
echo "== CATALOGO DIVERGENTE — flag avatar_catalog_db deve permanecer OFF ==\n";
exit(1);
