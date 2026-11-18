<?php
// Menu "Produtos" por feature flag (api/ui/nav-flags.php).
//  Parte 1 (pura): o filtro, com o resolvedor de flags injetado.
//  Parte 2 (dados reais, opcional): ui_nav_items da VALIDAÇÃO com o menu-aplicar.sql do pacote aplicado → o menu do 75 (com a flag) e o de
//  quem não tem a flag, como a API monta. Rodar: php menu-flags.php  ·  com dados: NAV_TEST_CNF=<ini> NAV_TEST_DB=ATRWEB_VAL_DASH php menu-flags.php
declare(strict_types=1);
require_once __DIR__ . '/../../../api/ui/nav-flags.php';
$n = 0; $f = 0;
$ok = function (string $nome, bool $c, string $extra = '') use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome" . ($extra !== '' ? " · $extra" : '') . "\n"; } };
$FLAG = 'panel_atributos_enabled';
$liga = static fn(array $on) => static fn(string $fl, int $u) => ['enabled' => in_array($fl, $on, true)];
$chaves = static fn(array $xs) => array_column(array_values($xs), 'item_key');

// ---- parte 1: filtro puro --------------------------------------------------------------------------------------------------------
$it = static fn(string $k, ?string $req = null, ?array $esconde = null) => ['item_key' => $k, 'required_feature_flags' => $req, 'metadata' => $esconde === null ? null : json_encode(['hide_when_flags' => $esconde])];
$menu = [$it('sidebar.produtos.visao-geral', null, [$FLAG]), $it('sidebar.produtos.atributos.produtos', $FLAG), $it('sidebar.produtos.cadastro'), $it('sidebar.produtos.precificacao')];
$ok('com a flag (75): o Geral Produtos do MÓDULO aparece e o provisório some; Cadastro e Precificação ficam', $chaves(navFiltrarPorFlags(null, $menu, 75, $liga([$FLAG]))) === ['sidebar.produtos.atributos.produtos', 'sidebar.produtos.cadastro', 'sidebar.produtos.precificacao']);
$ok('sem a flag: menu como hoje (provisório aparece, item do módulo não)', $chaves(navFiltrarPorFlags(null, $menu, 12, $liga([]))) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.cadastro', 'sidebar.produtos.precificacao']);
$ok('anônimo: menu como hoje', $chaves(navFiltrarPorFlags(null, $menu, null, $liga([$FLAG]))) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.cadastro', 'sidebar.produtos.precificacao']);
$erroR = static function (string $fl, int $u): array { throw new RuntimeException('x'); };
$ok('erro no resolvedor: menu como hoje (fail-closed para o item novo, fail-open para o antigo)', $chaves(@navFiltrarPorFlags(null, $menu, 75, $erroR)) === ['sidebar.produtos.visao-geral', 'sidebar.produtos.cadastro', 'sidebar.produtos.precificacao']);
$semFlag = [$it('a'), $it('b')]; $chamou = false;
$ok('sem nenhum item com flag: não consulta o resolvedor e devolve igual', navFiltrarPorFlags(null, $semFlag, 75, function () use (&$chamou) { $chamou = true; return ['enabled' => true]; }) === $semFlag && !$chamou);
$ok('JSON em required_feature_flags também vale', $chaves(navFiltrarPorFlags(null, [$it('x', '["f1","f2"]')], 75, $liga(['f1']))) === [] && $chaves(navFiltrarPorFlags(null, [$it('x', '["f1","f2"]')], 75, $liga(['f1', 'f2']))) === ['x']);
$ok('formato preservado: chaves de entrada associativa ficam', array_keys(navFiltrarPorFlags(null, [3 => $it('a'), 7 => $it('b', 'f1')], 75, $liga(['f1']))) === [3, 7]);
$ok('formato preservado: lista continua lista', array_is_list(navFiltrarPorFlags(null, [$it('a', 'f1'), $it('b')], 75, $liga([]))));

// ---- parte 2: dados reais da validação (o menu como a API monta) -----------------------------------------------------------------
$cnf = getenv('NAV_TEST_CNF'); $db = getenv('NAV_TEST_DB');
if ($cnf && $db) {
    if (!str_starts_with($db, 'ATRWEB_VAL_')) { echo "[RECUSADO] NAV_TEST_DB fora de ATRWEB_VAL_*\n"; exit(3); }
    $c = parse_ini_file($cnf, true, INI_SCANNER_RAW)['client'];
    $dsn = isset($c['socket']) ? "mysql:unix_socket={$c['socket']};dbname=$db;charset=utf8mb4" : "mysql:host=" . ($c['host'] ?? '127.0.0.1') . ";port=" . ($c['port'] ?? 3306) . ";dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $todos = $pdo->query("SELECT * FROM ui_nav_items WHERE is_active = 1 AND is_visible = 1 AND FIND_IN_SET('sidebar', display_context) > 0 ORDER BY order_index, id")->fetchAll();
    $m75 = navFiltrarPorFlags($pdo, $todos, 75, $liga([$FLAG]));
    $mSem = navFiltrarPorFlags($pdo, $todos, 12, $liga([]));
    $grp = static fn(array $xs) => array_values(array_filter($xs, static fn($i) => ($i['parent_key'] ?? null) === 'sidebar.grp-produtos'));
    $rot = static fn(array $xs) => array_map(static fn($i) => $i['label'], $xs);
    $p75 = $grp($m75); $pSem = $grp($mSem);
    $geral = array_values(array_filter($p75, static fn($i) => $i['label'] === 'Geral Produtos'));
    $ok('dados: 75 vê "Geral Produtos" UMA vez', count($geral) === 1, json_encode($rot($p75), JSON_UNESCAPED_UNICODE));
    $ok('dados: esse "Geral Produtos" aponta para o módulo (panel-atributos, #/panel-atributos, chave estável)', ($geral[0]['panel_id'] ?? '') === 'panel-atributos' && ($geral[0]['route_path'] ?? '') === '#/panel-atributos' && ($geral[0]['item_key'] ?? '') === 'sidebar.produtos.atributos.produtos');
    $ok('dados: nenhuma chave e nenhuma rota repetida no menu do 75', count(array_unique(array_column($m75, 'item_key'))) === count($m75)
        && count(array_unique(array_filter(array_column($p75, 'route_path')))) === count($p75));
    $ok('dados: subitens do módulo no 75, cada um com a própria rota', array_column(array_values(array_filter($p75, static fn($i) => $i['panel_id'] === 'panel-atributos')), 'route_path') === ['#/panel-atributos', '#/panel-atributos/visao-geral', '#/panel-atributos/vincular', '#/panel-atributos/preencher', '#/panel-atributos/kits', '#/panel-atributos/atributos', '#/panel-atributos/unidades', '#/panel-atributos/conferencia']);
    $antigos = static fn(array $xs) => array_map(static fn($i) => [$i['item_key'], $i['label'], $i['route_path'], $i['panel_id'], (int) $i['order_index']], array_values(array_filter($xs, static fn($i) => in_array($i['item_key'], ['sidebar.produtos.cadastro', 'sidebar.produtos.categorias', 'sidebar.produtos.precificacao', 'sidebar.produtos.custos'], true))));
    $ok('dados: Cadastro, Categorias, Precificação e Custos e Margens idênticos para o 75 e para quem não tem a flag', count($antigos($m75)) === 4 && $antigos($m75) === $antigos($mSem));
    $hoje = array_values(array_filter($todos, static fn($i) => !str_starts_with((string) $i['item_key'], 'sidebar.produtos.atributos.')));
    $ok('dados: sem a flag, o menu INTEIRO é o de hoje (o mesmo conjunto, mesma ordem, sem os itens do módulo)', $chaves($mSem) === $chaves($hoje));
    $ok('dados: sem a flag, seção Produtos = Geral/Cadastro/Categorias Produtos, Precificação, Custos e Margens', $rot($pSem) === ['Geral Produtos', 'Cadastro Produtos', 'Categorias Produtos', 'Precificacao', 'Custos e Margens'], json_encode($rot($pSem), JSON_UNESCAPED_UNICODE));
    // caminho Compras → Produtos: o shell resolve o título do cabeçalho pelo 1º item do menu com o MESMO panel_id (_resolvePanelTitle).
    // O "Geral Produtos" provisório divide o panel-stub-dev com o "Geral Compras" (1º no DOM, em Favoritos) → título errado. O do módulo não.
    $titulo = static function (array $menu, string $panel): ?string { foreach ($menu as $i) if (($i['panel_id'] ?? null) === $panel) return $i['display_title'] ?: $i['label']; return null; };
    $compras = array_values(array_filter($m75, static fn($i) => $i['item_key'] === 'sidebar.compras.visao-geral'))[0] ?? null;
    $ok('dados: Compras → Geral Compras mostra "Geral Compras" no cabeçalho', $compras !== null && $titulo($m75, $compras['panel_id']) === 'Geral Compras');
    $ok('dados: Compras → Produtos → Geral Produtos mostra o título do MÓDULO, não "Geral Compras" (painel próprio, sem colisão)', $titulo($m75, $geral[0]['panel_id']) === 'Produtos & Atributos'
        && !in_array('panel-atributos', array_column(array_filter($m75, static fn($i) => !str_starts_with((string) $i['item_key'], 'sidebar.produtos.atributos.')), 'panel_id'), true));
    $ok('dados: diagnóstico do defeito de hoje — sem a flag, o Geral Produtos provisório resolveria o título "Geral Compras" (painel compartilhado; não muda aqui)', $titulo($mSem, 'panel-stub-dev') === 'Geral Compras');
} else {
    echo "[info] parte 2 (dados reais) não executada: defina NAV_TEST_CNF e NAV_TEST_DB=ATRWEB_VAL_*\n";
}
echo ($f === 0 ? '[OK]  ' : '[FALHA]') . " menu-flags (menu Produtos por feature flag" . ($cnf && $db ? ' + dados reais' : '') . "): $n casos, $f falha(s)\n";
exit($f === 0 ? 0 : 1);
