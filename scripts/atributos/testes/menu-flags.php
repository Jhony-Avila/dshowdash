<?php
// Teste puro do filtro do menu por feature flag (api/ui/nav-flags.php). Sem banco: o resolvedor de flags é injetado.
// Rodar: php scripts/atributos/testes/menu-flags.php
declare(strict_types=1);
require_once __DIR__ . '/../../../api/ui/nav-flags.php';
$n = 0; $f = 0;
$ok = function (string $nome, bool $c) use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome\n"; } };
$it = static fn(string $k, ?string $req = null, ?array $esconde = null) => ['item_key' => $k, 'required_feature_flags' => $req, 'metadata' => $esconde === null ? null : json_encode(['hide_when_flags' => $esconde])];
$menu = [$it('sidebar.produtos.visao-geral', null, ['panel_atributos_enabled']), $it('sidebar.produtos.precificacao'), $it('sidebar.atributos.kits', 'panel_atributos_enabled')];
$liga = static fn(array $on) => static fn(string $fl, int $u) => ['enabled' => in_array($fl, $on, true)];
$chaves = static fn(array $xs) => array_column($xs, 'item_key');
$ok('com a flag (75): itens novos aparecem e os antigos somem', $chaves(navFiltrarPorFlags(null, $menu, 75, $liga(['panel_atributos_enabled']))) === ['sidebar.produtos.precificacao', 'sidebar.atributos.kits']);
$ok('sem a flag: menu como hoje (antigos aparecem, novos não)', $chaves(navFiltrarPorFlags(null, $menu, 12, $liga([]))) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.precificacao']);
$ok('anônimo: menu como hoje', $chaves(navFiltrarPorFlags(null, $menu, null, $liga(['panel_atributos_enabled']))) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.precificacao']);
$erroR = static function (string $fl, int $u): array { throw new RuntimeException('x'); };
$ok('erro no resolvedor: menu como hoje (novos somem, antigos ficam)', $chaves(@navFiltrarPorFlags(null, $menu, 75, $erroR)) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.precificacao']);
$semFlag = [$it('a'), $it('b')]; $chamou = false;
$ok('sem nenhum item com flag: não consulta o resolvedor e devolve igual', navFiltrarPorFlags(null, $semFlag, 75, function () use (&$chamou) { $chamou = true; return ['enabled' => true]; }) === $semFlag && !$chamou);
$ok('JSON em required_feature_flags também vale', $chaves(navFiltrarPorFlags(null, [$it('x', '["f1","f2"]')], 75, $liga(['f1']))) === [] && $chaves(navFiltrarPorFlags(null, [$it('x', '["f1","f2"]')], 75, $liga(['f1', 'f2']))) === ['x']);
$assoc = [3 => $it('a'), 7 => $it('b', 'f1')];
$ok('formato preservado: chaves de entrada associativa ficam', array_keys(navFiltrarPorFlags(null, $assoc, 75, $liga(['f1']))) === [3, 7]);
$ok('formato preservado: lista continua lista', array_is_list(navFiltrarPorFlags(null, [$it('a', 'f1'), $it('b')], 75, $liga([]))));
echo ($f === 0 ? '[OK]  ' : '[FALHA]') . " menu-flags (visibilidade do menu por feature flag): $n casos, $f falha(s)\n";
exit($f === 0 ? 0 : 1);
