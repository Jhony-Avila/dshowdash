<?php
// Produtos & Atributos — PROVA da migração 012_kit_prioridade (P1 "precedência de kit independente do nome", 18/11/2026). SÓ LEITURA.
// Calcula a ficha efetiva de TODOS os produtos do catálogo (não excluídos; os ATIVOS contados à parte) com a MESMA função da tela/app
// (Aplicabilidade::ficha sobre AtributosRepoPdo::retratoModelo, como ProdutosLeitura::fichaProduto) duas vezes:
//   ANTES = regra antiga (kits na posição de (nome, id) do MySQL — `prioridade` retirada do retrato);
//   DEPOIS = regra nova (`prioridade` explícita). Fonte da prioridade:
//     · coluna eq_grupo.prioridade, se a 012 já estiver aplicada (prova "depois do APLICAR", rodar logo após a migração);
//     · senão, SIMULADA pelo MESMO SELECT que o UPDATE da 012 usa (ROW_NUMBER() OVER (ORDER BY nome, id)) — nada é gravado.
// Compara, por produto: ordem dos kits; por atributo: ordem na ficha, kit dono (grupo_id), posição, obrigatório, visível, destaque,
// importância, unidade do kit, unidade do produto, unidade EFETIVA (sem valor e com a unidade do valor vivo), origens; exclusões.
// Sessão READ ONLY numa transação de leitura consistente (nenhuma escrita possível). Credenciais por arquivo de opções [client] (só o
// caminho; o conteúdo nunca é impresso).
// Uso: php scripts/atributos/kit-prioridade-prova.php --schema DSHOW_EQUIPAMENTOS --credenciais <ini> [--catalogo APP_DSHOW] [--json]
// Saída: 0 = todas as fichas idênticas · 1 = há diferença (listadas) · 2 = não executado (erro de entrada/conexão/leitura).
declare(strict_types=1);
require_once __DIR__ . '/../../api/atributos/AtributosRepo.php';

$o = getopt('', ['schema:', 'credenciais:', 'catalogo:', 'json']);
$schema = (string) ($o['schema'] ?? ''); $cnf = (string) ($o['credenciais'] ?? ''); $catalogo = (string) ($o['catalogo'] ?? $schema); $json = isset($o['json']);
$sair = function (int $cod, string $msg) { fwrite(STDERR, "[NÃO EXECUTADO] kit-prioridade-prova: $msg\n"); exit($cod); };
if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $schema) || !preg_match('/^[A-Za-z0-9_]{1,64}$/', $catalogo)) $sair(2, 'use --schema <schema> [--catalogo <schema do catálogo>]');
if ($cnf === '' || !is_readable($cnf)) $sair(2, '--credenciais <arquivo de opções [client]> ilegível');

$ini = parse_ini_file($cnf, true, INI_SCANNER_RAW) ?: []; $c = $ini['client'] ?? [];
$tira = fn($v) => trim((string) $v, " \t\"'");
$dsn = 'mysql:' . (isset($c['socket']) ? 'unix_socket=' . $tira($c['socket']) : 'host=' . $tira($c['host'] ?? '127.0.0.1') . ';port=' . (int) ($c['port'] ?? 3306)) . ';charset=utf8mb4';
try {
    $pdo = new PDO($dsn, $tira($c['user'] ?? ''), $tira($c['password'] ?? ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('SET SESSION TRANSACTION READ ONLY');
    $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY');
} catch (PDOException $e) { $sair(2, 'conexão/sessão READ ONLY recusada (código ' . $e->getCode() . ')'); }

try {
    $repo = new AtributosRepoPdo($pdo, $schema);
    $temColuna = $repo->temPrioridadeKit();
    $m = $repo->retratoModelo(null);
    // ANTES: regra antiga (sem prioridade no retrato)
    $gAntes = array_map(static function ($g) { unset($g['prioridade']); return $g; }, $m->grupos);
    // DEPOIS: coluna real ou o SELECT do UPDATE da 012
    if ($temColuna) { $gDepois = $m->grupos; $fonte = 'coluna eq_grupo.prioridade (012 aplicada)'; }
    else {
        $gDepois = $gAntes;
        foreach ($pdo->query("SELECT `id`, ROW_NUMBER() OVER (ORDER BY `nome`, `id`) AS `rn` FROM `$schema`.`eq_grupo`")->fetchAll(PDO::FETCH_ASSOC) as $r) $gDepois[(int) $r['id']]['prioridade'] = (int) $r['rn'];
        $fonte = 'simulada pelo SELECT do UPDATE da 012 (coluna ausente; nada gravado)';
    }
    $nulos = count(array_filter($gDepois, static fn($g) => !isset($g['prioridade'])));
    $mA = new RetratoModelo($gAntes, $m->escopos, $m->itens, $m->diretos, $m->ajustes, $m->atributos);
    $mD = new RetratoModelo($gDepois, $m->escopos, $m->itens, $m->diretos, $m->ajustes, $m->atributos);
    $cat = [];
    foreach ($pdo->query("SELECT id, category, subcategory, active FROM `$catalogo`.`product_catalog` WHERE deleted = 0 ORDER BY id")->fetchAll(PDO::FETCH_ASSOC) as $p)
        $cat[(int) $p['id']] = ['id' => (int) $p['id'], 'categoria' => (string) $p['category'], 'subcategoria' => $p['subcategory'] === null ? null : (string) $p['subcategory'], 'ativo' => (int) $p['active'] === 1];
    $uValor = [];
    foreach ($pdo->query("SELECT product_id, atributo_id, unidade_id FROM `$schema`.`eq_valor` WHERE excluido_em IS NULL AND opcao_chave = 0 AND unidade_id IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC) as $v)
        $uValor[(int) $v['product_id']][(int) $v['atributo_id']] = (int) $v['unidade_id'];
    $pdo->exec('COMMIT');
} catch (Throwable $t) { $sair(2, 'leitura falhou: ' . get_class($t) . ' ' . ($t instanceof PDOException ? (string) ($t->errorInfo[1] ?? $t->getCode()) : $t->getMessage())); }

/** Forma comparável da ficha efetiva de um produto (tudo o que a precedência pode mudar). */
$forma = function (RetratoModelo $mm, array $p) use ($uValor): array {
    $excl = [];
    $f = Aplicabilidade::ficha($mm, $p, $excl);
    $out = ['kits' => array_keys(Aplicabilidade::kits($mm, $p)), 'atributos' => [], 'excluidos' => $excl];
    foreach ($f as $aid => $it) {
        $out['atributos'][] = ['atributo_id' => (int) $aid, 'grupo_id' => (int) $it['grupo_id'], 'posicao' => (int) $it['posicao'],
            'obrigatorio' => (bool) $it['obrigatorio'], 'visivel' => (bool) $it['visivel'], 'destaque' => (bool) $it['destaque'], 'importancia' => $it['importancia'],
            'unidade_kit_id' => $it['unidade_kit_id'], 'unidade_produto_id' => $it['unidade_produto_id'],
            'unidade_efetiva' => Aplicabilidade::unidadeEfetiva($it, null), 'unidade_efetiva_com_valor' => Aplicabilidade::unidadeEfetiva($it, $uValor[(int) $p['id']][(int) $aid] ?? null),
            'origens' => array_map(static fn($x) => [$x['tipo'], $x['grupo_id'] ?? null], $it['origens'])];
    }
    return $out;
};

$tot = ['produtos' => 0, 'identicos' => 0, 'ativos' => 0, 'ativos_identicos' => 0, 'diferentes' => 0];
$difs = [];
foreach ($cat as $pid => $p) {
    $a = $forma($mA, $p); $d = $forma($mD, $p);
    $tot['produtos']++; if ($p['ativo']) $tot['ativos']++;
    if ($a === $d) { $tot['identicos']++; if ($p['ativo']) $tot['ativos_identicos']++; continue; }
    $tot['diferentes']++;
    $campos = [];
    if ($a['kits'] !== $d['kits']) $campos[] = 'ordem dos kits ' . implode(',', $a['kits']) . ' → ' . implode(',', $d['kits']);
    $ia = array_column($a['atributos'], null, 'atributo_id'); $id = array_column($d['atributos'], null, 'atributo_id');
    if (array_keys($ia) !== array_keys($id)) $campos[] = 'ordem/conjunto de atributos';
    foreach ($ia as $aid => $x) foreach ($x as $k => $v) if (($id[$aid][$k] ?? null) !== $v) $campos[] = "atributo $aid.$k " . json_encode($v) . ' → ' . json_encode($id[$aid][$k] ?? null);
    if ($a['excluidos'] !== $d['excluidos']) $campos[] = 'exclusões';
    $difs[] = ['product_id' => $pid, 'ativo' => $p['ativo'], 'diferencas' => array_slice($campos, 0, 20)];
}

$res = ['schema' => $schema, 'catalogo' => $catalogo, 'fonte_prioridade' => $fonte, 'kits' => count($m->grupos), 'kits_sem_prioridade' => $nulos] + $tot + ['diferencas' => $difs];
if ($json) echo json_encode($res, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), "\n";
else {
    echo "kit-prioridade-prova · schema=$schema catalogo=$catalogo · prioridade: $fonte · kits={$res['kits']} (sem prioridade: $nulos)\n";
    echo "produtos (não excluídos)={$tot['produtos']} idênticos={$tot['identicos']} · ativos={$tot['ativos']} idênticos={$tot['ativos_identicos']} · diferentes={$tot['diferentes']}\n";
    foreach ($difs as $x) echo '  ≠ produto ' . $x['product_id'] . ($x['ativo'] ? '' : ' (inativo)') . ': ' . implode(' | ', $x['diferencas']) . "\n";
    echo $tot['diferentes'] === 0 ? "[OK] fichas efetivas idênticas antes/depois\n" : "[DIFERENTE] {$tot['diferentes']} produto(s) com ficha diferente\n";
}
exit($tot['diferentes'] === 0 ? 0 : 1);
