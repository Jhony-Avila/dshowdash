<?php
// COLUNAS DE CAMPOS PERSONALIZADOS (#11) — prova do backend contra a base REAL.
//
// Roda os métodos do PipeSyncRepository sem passar por rota/ACL/sessão, para separar
// "SQL/resolução quebrada" de "módulo quebrado". Só LEITURA: nada aqui escreve.
//
// O que exige:
//   1. o catálogo separa PERSONALIZADO de NATIVO — `pipe_custom_fields` espelha
//      dealFields/personFields e traz `id`, `add_time`, `currency`, `label` junto. Sem o
//      filtro de hash(40) o seletor ofereceria colunas que o grid já tem;
//   2. `cf=` do cliente só ESCOLHE chaves do catálogo: chave inventada é descartada, e o
//      que sobreviveu é declarado em `cf_aplicados` (a UI não pode desenhar coluna que o
//      backend ignorou);
//   3. quem NÃO pede colunas personalizadas não paga por elas (custom_fields fora do SELECT);
//   4. `set` multi-valor vira lista de rótulos, e `enum` resolve o id da opção para texto —
//      mesmo caminho dos drawers (`formatCfValue`), não uma segunda implementação;
//   5. a cobertura usa `JSON_TYPE(...) <> 'NULL'`, não `JSON_LENGTH > 0` (num JSON `null`
//      JSON_LENGTH devolve 1 → 100% de cobertura falsa, a armadilha que o #31 pagou);
//   6. 'activity' e 'lead' ficam de fora por AUSÊNCIA DE DADO, e isso é dito.
declare(strict_types=1);

$env = [];
foreach (file('/var/www/dshowdash/.env') as $l) {
    if (preg_match('/^([A-Z0-9_]+)=(.*)$/', trim($l), $m)) { $env[$m[1]] = $m[2]; }
}
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $env['DB_PIPE_DSHOW_HOST'], $env['DB_PIPE_DSHOW_PORT'], $env['DB_PIPE_DSHOW_NAME']),
    $env['DB_PIPE_DSHOW_USER'], $env['DB_PIPE_DSHOW_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
     PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
require_once '/var/www/dshowdash/api/pipedrive/repositories/SyncRepository.php';
$repo = new PipeSyncRepository($pdo);

$falhas = 0; $checagens = 0;
function ok(string $t, bool $c, string $d = ''): void {
    global $falhas, $checagens; $checagens++;
    printf("  %s %s%s\n", $c ? '[ok]' : '[X] ', $t, $d !== '' ? "  $d" : '');
    if (!$c) { $falhas++; }
}

// ── 1. Catálogo: personalizado x nativo ────────────────────────────
echo "\n=== 1. o catálogo separa personalizado de nativo ===\n";
foreach (['deal' => 26, 'person' => 14, 'organization' => 15, 'product' => 10] as $ent => $esperado) {
    $cob = $repo->customFieldsCobertura($ent);
    ok("$ent: só os de chave-hash", count($cob['campos']) === $esperado,
        sprintf('%d personalizados (catálogo bruto tem %d)', count($cob['campos']),
            (int)$pdo->query("SELECT COUNT(*) FROM pipe_custom_fields WHERE entity='$ent'")->fetchColumn()));
    $todosHash = array_reduce($cob['campos'], static fn($a, $c) => $a && preg_match('/^[a-f0-9]{40}$/', $c['key']) === 1, true);
    ok("$ent: nenhuma chave nativa vazou", $todosHash);
}
$nativos = ['add_time', 'currency', 'label', 'id', 'status'];
$defsDeal = array_column($repo->customFieldsCobertura('deal')['campos'], 'key');
ok('campos nativos ficam fora do seletor', count(array_intersect($nativos, $defsDeal)) === 0);

// ── 2. Validação do cf= vindo do cliente ───────────────────────────
echo "\n=== 2. cf= só ESCOLHE, nunca injeta ===\n";
$k1 = $defsDeal[0]; $k2 = $defsDeal[1];
ok('chave válida é aceita',            $repo->cfKeysValidas('deal', $k1) === [$k1]);
ok('duas chaves, ordem preservada',    $repo->cfKeysValidas('deal', "$k1,$k2") === [$k1, $k2]);
ok('chave inventada é descartada',     $repo->cfKeysValidas('deal', 'nao_existe_123') === []);
ok('mistura: fica só a válida',        $repo->cfKeysValidas('deal', "lixo,$k1") === [$k1]);
ok('duplicada não repete',             $repo->cfKeysValidas('deal', "$k1,$k1") === [$k1]);
ok('vazio = nenhuma',                  $repo->cfKeysValidas('deal', '') === []);
ok('SQL injection é só uma string inválida',
    $repo->cfKeysValidas('deal', "' OR 1=1 --") === []);
ok('chave de OUTRA entidade não vale na deal',
    $repo->cfKeysValidas('deal', $repo->customFieldsCobertura('product')['campos'][0]['key']) === []);
ok('entidade sem personalizados devolve vazio', $repo->cfKeysValidas('activity', $k1) === []);
$muitas = implode(',', array_merge($defsDeal, $defsDeal));
ok('teto de 12 colunas extras',        count($repo->cfKeysValidas('deal', $muitas)) === 12);

// ── 3. Quem não pede, não paga ─────────────────────────────────────
echo "\n=== 3. custo só para quem usa ===\n";
$semCf = $repo->dealsPage(['per_page' => 25]);
ok('sem cf: cf_aplicados vazio',       $semCf['cf_aplicados'] === []);
ok('sem cf: cada linha traz cf vazio', ($semCf['rows'][0]['cf'] ?? null) === []);
$t0 = microtime(true); $repo->dealsPage(['per_page' => 25]); $msSem = (microtime(true) - $t0) * 1000;
$t0 = microtime(true); $comCf = $repo->dealsPage(['per_page' => 25, 'cf' => "$k1,$k2"]); $msCom = (microtime(true) - $t0) * 1000;
ok('com cf: as duas chaves aplicadas', $comCf['cf_aplicados'] === [$k1, $k2]);
printf("       tempo: sem cf %d ms · com 2 colunas %d ms\n", round($msSem), round($msCom));

// ── 4. Valores resolvidos, não ids crus ────────────────────────────
echo "\n=== 4. resolução de valores (mesmo caminho dos drawers) ===\n";
$porTipo = [];
foreach ($repo->customFieldsCobertura('deal')['campos'] as $c) { $porTipo[$c['type']][] = $c; }

// 'set' = multi-valor: o #31 provou que um negócio pode ter 2 origens.
$set = $porTipo['set'][0] ?? null;
if ($set) {
    $pg = $repo->dealsPage(['per_page' => 200, 'cf' => $set['key']]);
    $vals = array_filter(array_map(static fn($r) => $r['cf'][$set['key']] ?? null, $pg['rows']));
    ok("set '{$set['name']}': veio valor em texto", count($vals) > 0, count($vals) . ' linhas com valor');
    $temId = array_filter($vals, static fn($v) => preg_match('/^\d+(,\s*\d+)*$/', $v) === 1);
    ok('set: rótulos resolvidos, não ids crus', count($temId) === 0,
        $temId ? 'ainda cru: ' . reset($temId) : 'ex.: ' . reset($vals));
    $multi = array_filter($vals, static fn($v) => strpos($v, ', ') !== false);
    printf("       multi-valor visível em %d linhas (ex.: %s)\n", count($multi), $multi ? reset($multi) : '—');
}
$enum = $porTipo['enum'][0] ?? null;
if ($enum) {
    $pg = $repo->dealsPage(['per_page' => 200, 'cf' => $enum['key']]);
    $vals = array_filter(array_map(static fn($r) => $r['cf'][$enum['key']] ?? null, $pg['rows']));
    ok("enum '{$enum['name']}': rótulo resolvido", count($vals) > 0 && !ctype_digit((string)reset($vals)),
        'ex.: ' . ($vals ? reset($vals) : '—'));
    $semRotulo = array_filter($vals, static fn($v) => strpos($v, '#') === 0);
    ok('enum: nenhuma opção órfã (#id)', count($semRotulo) === 0);
}
// Campo pedido mas vazio naquela linha: a chave simplesmente não aparece (a UI mostra '—').
$vazio = null;
foreach ($repo->customFieldsCobertura('deal')['campos'] as $c) { if ($c['preenchidos'] === 0) { $vazio = $c; break; } }
if ($vazio) {
    $pg = $repo->dealsPage(['per_page' => 25, 'cf' => $vazio['key']]);
    $comValor = array_filter($pg['rows'], static fn($r) => isset($r['cf'][$vazio['key']]));
    ok("campo vazio '{$vazio['name']}' não inventa valor", count($comValor) === 0);
}

// ── 5. Cobertura: o número que evita coluna vazia ──────────────────
echo "\n=== 5. cobertura real (JSON_TYPE, não JSON_LENGTH) ===\n";
$cob = $repo->customFieldsCobertura('deal');
ok('base = negócios não excluídos', $cob['base'] > 19000, (string)$cob['base']);
ok('ordenado por preenchimento',
    $cob['campos'][0]['preenchidos'] >= $cob['campos'][count($cob['campos']) - 1]['preenchidos']);
$top = $cob['campos'][0];
printf("       topo: %s (%d, %.1f%%)\n", $top['name'], $top['preenchidos'], $top['cobertura']);
ok('cobertura do topo é plausível (<100%)', $top['cobertura'] > 50 && $top['cobertura'] <= 100);
$cem = array_filter($cob['campos'], static fn($c) => $c['cobertura'] == 100.0);
ok('NENHUM campo dá 100% (seria o sintoma do JSON_LENGTH)', count($cem) === 0, count($cem) . ' campos a 100%');

// Confere um campo contra contagem independente, escrita de outro jeito.
$alvo = $cob['campos'][0];
$conf = (int)$pdo->query(
    "SELECT COUNT(*) FROM pipe_deals
      WHERE is_deleted=0 AND JSON_CONTAINS_PATH(custom_fields, 'one', '$.\"{$alvo['key']}\"')
        AND JSON_EXTRACT(custom_fields, '$.\"{$alvo['key']}\"') IS NOT NULL
        AND JSON_TYPE(JSON_EXTRACT(custom_fields, '$.\"{$alvo['key']}\"')) <> 'NULL'"
)->fetchColumn();
ok('cobertura confere com contagem independente', $conf === $alvo['preenchidos'],
    "{$alvo['preenchidos']} vs {$conf}");

// A prova de que JSON_LENGTH mentiria — documenta a armadilha em vez de só evitá-la.
$mentira = (int)$pdo->query(
    "SELECT COUNT(*) FROM pipe_deals WHERE is_deleted=0
       AND JSON_LENGTH(JSON_EXTRACT(custom_fields, '$.\"{$alvo['key']}\"')) > 0"
)->fetchColumn();
printf("       JSON_LENGTH>0 diria %d (real: %d) — diferença de %d linhas\n",
    $mentira, $alvo['preenchidos'], abs($mentira - $alvo['preenchidos']));

// ── 6. Entidades sem campo personalizado ───────────────────────────
echo "\n=== 6. entidades fora por ausência de dado ===\n";
ok('activity não é entidade de cf',  PipeSyncRepository::cfEntidadeValida('activity') === false);
ok('lead não é entidade de cf',      PipeSyncRepository::cfEntidadeValida('lead') === false);
ok('deal/person/org/product são',
    PipeSyncRepository::cfEntidadeValida('deal') && PipeSyncRepository::cfEntidadeValida('person')
    && PipeSyncRepository::cfEntidadeValida('organization') && PipeSyncRepository::cfEntidadeValida('product'));
$semCF = (int)$pdo->query("SELECT COUNT(*) FROM pipe_activities WHERE JSON_TYPE(custom_fields) IN ('ARRAY','OBJECT')")->fetchColumn();
ok('pipe_activities segue 0% preenchida (o motivo da exclusão)', $semCF === 0, (string)$semCF);

// ── 7. As outras três entidades respondem ──────────────────────────
echo "\n=== 7. person / organization / product ===\n";
foreach ([['organization', 'organizationsPage'], ['person', 'personsPage'], ['product', 'productsPage']] as [$ent, $metodo]) {
    $cobE = $repo->customFieldsCobertura($ent);
    $key  = $cobE['campos'][0]['key'];
    $pg   = $repo->$metodo(['per_page' => 50, 'cf' => $key]);
    $vals = array_filter(array_map(static fn($r) => $r['cf'][$key] ?? null, $pg['rows']));
    ok("$ent: coluna '{$cobE['campos'][0]['name']}' traz valor", count($vals) > 0,
        sprintf('%d/%d linhas · ex.: %s', count($vals), count($pg['rows']),
            $vals ? mb_substr((string)reset($vals), 0, 30) : '—'));
    ok("$ent: declara cf_aplicados", ($pg['cf_aplicados'] ?? null) === [$key]);
}

printf("\n%s — %d checagens, %d falha(s)\n", $falhas === 0 ? 'PASSOU' : 'REPROVOU', $checagens, $falhas);
exit($falhas === 0 ? 0 : 1);
