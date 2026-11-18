<?php
// Equipamentos › Atributos — V5 Lote 3, ATR-10 (D4 + P1-07): a ficha do PHP (AtributosService::ficha) sobre a massa dourada SINTÉTICA
// compartilhada com o app (app-dshow backend/api/test/fixtures/atributos/golden-ficha.json, byte a byte; sha256 conferido aqui e lá).
// Normaliza a ficha no MESMO formato que o Node (attributes.ts::fichaAplicavel) e compara com `esperado_ficha`. Sem banco. exit 1 em falha.
declare(strict_types=1);
require_once __DIR__ . '/_memoria.php';

require_once __DIR__ . '/_golden.php';
$falhas = 0; $n = 0;
$ok = function (string $nome, bool $c, string $det = '') use (&$falhas, &$n): void { $n++; if (!$c) { $falhas++; echo "[ERRO] $nome" . ($det !== '' ? "\n       $det" : '') . "\n"; } };
[$fx, $shaOk] = golden_carregar();
$ok('fixture idêntica à do app (sha256)', $shaOk);

$repo = new RepoMemoria();
$cat = new CatalogoMemoria();
$cat->p = [];
foreach ($fx['produtos'] as $p) $cat->p[$p['id']] = ['id' => $p['id'], 'nome' => "Produto {$p['id']} (sintético)", 'categoria' => $p['categoria'], 'subcategoria' => $p['subcategoria'], 'ativo' => true, 'excluido' => false, 'sincronizado_em' => null];
foreach ($fx['atributos'] as $a) $repo->a[$a['id']] = ['id' => $a['id'], 'codigo' => $a['codigo'], 'rotulo' => $a['rotulo'], 'tipo' => $a['tipo'], 'unidade_id' => null, 'unidade' => $a['unidade'], 'casas' => $a['casas'],
    'minimo' => null, 'maximo' => null, 'descricao' => null, 'ativo' => $a['ativo'], 'versao' => 1, 'autoridade' => $a['autoridade'], 'precifica_ref' => $a['autoridade'] === 'precifica' ? 'led_module.pitch' : null, 'aceita_nao_se_aplica' => $a['aceita_nao_se_aplica'] ?? 1];
foreach ($fx['grupos'] as $g) { $repo->g[$g['id']] = ['id' => $g['id'], 'nome' => $g['nome'], 'ativo' => $g['ativo'], 'versao' => 1]; $repo->ge[$g['id']] = $g['escopos']; }
$itens = $fx['itens'];
usort($itens, fn($x, $y) => [$x['grupo_id'], $x['posicao'], $x['atributo_id']] <=> [$y['grupo_id'], $y['posicao'], $y['atributo_id']]);   // = ORDER BY ga.posicao, ga.atributo_id do repositório PDO
foreach ($itens as $i) $repo->ga[$i['grupo_id']][] = ['atributo_id' => $i['atributo_id'], 'posicao' => $i['posicao'], 'obrigatorio' => $i['obrigatorio'], 'visivel' => $i['visivel']];
foreach ($fx['opcoes'] as $o) $repo->o[$o['id']] = $o;
foreach ($fx['valores'] as $v) $repo->v["{$v['product_id']}:{$v['atributo_id']}:{$v['opcao_chave']}"] = ['product_id' => $v['product_id'], 'atributo_id' => $v['atributo_id'], 'opcao_id' => $v['opcao_id'], 'opcao_chave' => $v['opcao_chave'],
    'valor_texto' => $v['valor_texto'], 'valor_num' => $v['valor_num'], 'valor_bool' => $v['valor_bool'], 'valor_data' => $v['valor_data'], 'estado' => $v['estado'], 'origem' => 'manual', 'versao' => 1, 'excluido_em' => $v['excluido'] ? 'agora' : null];
$svc = new AtributosService($repo, 80, 'golden@exemplo.invalid', $cat);

foreach ($fx['esperado_ficha'] as $pid => $esperado) {
    $got = golden_normalizar($svc->ficha((int) $pid, true));
    $ok("ATR-10 produto $pid: ficha do PHP = esperado da massa dourada (o mesmo que o Node produz)", $got === $esperado, 'diferença: ' . golden_diferencas($got, $esperado));
}
// 3.7 (04/11): completude (não se aplica só quando aceito; desconhecido pendente) — o Node compara o MESMO esperado_completude
foreach ($fx['esperado_completude'] ?? [] as $pid => $esperado) {
    $got = golden_completude($svc->ficha((int) $pid, true));
    $ok("3.7 produto $pid: completude do PHP = esperado_completude da massa dourada", $got === $esperado, 'obtido: ' . json_encode($got));
}
$ok('3.7: massa dourada traz esperado_completude', isset($fx['esperado_completude']));
if (getenv('GOLDEN_IMPRIMIR_COMPLETUDE') === '1') { foreach ($fx['produtos'] as $p) echo json_encode([(string) $p['id'] => golden_completude($svc->ficha((int) $p['id'], true))]) . "\n"; }
echo ($falhas ? '[ERRO]' : '[OK]  ') . " golden-ficha (PHP × Node, D4 + P1-07): $n casos, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
