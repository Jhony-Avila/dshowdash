<?php
// teste-nav-nivel.php — 26/11 (ROXO/CIMA). metadata.nivel_minimo no menu (navFiltrarPorNivel): só o item que declarar muda; fail-closed.
// Rodar: php scripts/atributos/testes/nav-nivel.php   ·   com dados: NAV_TEST_CNF=<ini> NAV_TEST_DB=ATRWEB_VAL_DASH php scripts/atributos/testes/nav-nivel.php
declare(strict_types=1);
require_once __DIR__ . '/../../../api/ui/nav-flags.php';
$n = 0; $f = 0; $ok = function (string $nome, bool $c) use (&$n, &$f) { $n++; if (!$c) { $f++; echo "[ERRO] $nome\n"; } };
$it = static fn(string $k, ?array $meta = null, int $min = 0) => ['item_key' => $k, 'min_level' => $min, 'metadata' => $meta === null ? null : json_encode($meta)];
$menu = [$it('sidebar.principal'), $it('sidebar.integracoes', ['nivel_minimo' => 80]), $it('sidebar.compras.visao-geral'), $it('sidebar.bling', null, 50), $it('sidebar.admin.uarps', null, 100)];
$ch = static fn(array $xs) => array_column(array_values($xs), 'item_key');
$niv = static fn(?int $l) => static fn(int $u) => $l;
$todos = ['sidebar.principal', 'sidebar.integracoes', 'sidebar.compras.visao-geral', 'sidebar.bling', 'sidebar.admin.uarps'];
$sem = ['sidebar.principal', 'sidebar.compras.visao-geral', 'sidebar.bling', 'sidebar.admin.uarps'];
$ok('nível 80: vê Integrações (logo depois do Geral) e todo o resto', $ch(navFiltrarPorNivel($menu, 7, $niv(80))) === $todos);
$ok('nível 100: vê tudo', $ch(navFiltrarPorNivel($menu, 75, $niv(100))) === $todos);
$ok('nível 79: só Integrações some; Bling (min_level 50) e UARPS (100) ficam como hoje', $ch(navFiltrarPorNivel($menu, 9, $niv(79))) === $sem);
$ok('nível 10: idem (a coluna min_level continua sem efeito)', $ch(navFiltrarPorNivel($menu, 9, $niv(10))) === $sem);
$ok('anônimo: Integrações some (fail-closed)', $ch(navFiltrarPorNivel($menu, null, $niv(100))) === $sem);
$ok('nível ilegível (null): some', $ch(navFiltrarPorNivel($menu, 9, $niv(null))) === $sem);
$ok('erro ao ler o nível: some, o resto fica', $ch(@navFiltrarPorNivel($menu, 9, static function (int $u): ?int { throw new RuntimeException('x'); })) === $sem);
$lido = false; $semItem = [$it('a'), $it('b', ['hide_when_flags' => ['f']])];
$ok('sem item com nivel_minimo: não lê o nível e devolve igual', navFiltrarPorNivel($semItem, 9, function () use (&$lido) { $lido = true; return 0; }) === $semItem && !$lido);
$ok('nivel_minimo em texto ("80") também vale', $ch(navFiltrarPorNivel([$it('x', ['nivel_minimo' => '80'])], 9, $niv(79))) === []);
$ok('nivel_minimo inválido ("alto") é ignorado (item como hoje)', $ch(navFiltrarPorNivel([$it('x', ['nivel_minimo' => 'alto'])], 9, $niv(1))) === ['x']);
$ok('formato: lista continua lista; associativa mantém chaves', array_is_list(navFiltrarPorNivel($menu, 9, $niv(79))) && array_keys(navFiltrarPorNivel([3 => $it('a'), 7 => $it('b', ['nivel_minimo' => 80])], 9, $niv(79))) === [3]);
$_SESSION = ['level' => 80]; $ok('resolvedor padrão = sessão (level 80 vê)', in_array('sidebar.integracoes', $ch(navFiltrarPorNivel($menu, 7)), true));
$_SESSION = ['user' => ['level' => 50]]; $ok('resolvedor padrão = sessão (user.level 50 não vê)', !in_array('sidebar.integracoes', $ch(navFiltrarPorNivel($menu, 7)), true));
$_SESSION = []; $ok('sessão sem nível: some', !in_array('sidebar.integracoes', $ch(navFiltrarPorNivel($menu, 7)), true));
// dados reais da validação: o menu de hoje (sem nenhum nivel_minimo) passa IDÊNTICO, para qualquer nível
$cnf = getenv('NAV_TEST_CNF'); $db = getenv('NAV_TEST_DB');
if ($cnf && $db) {
    if (!str_starts_with($db, 'ATRWEB_VAL_')) { echo "[RECUSADO] NAV_TEST_DB fora de ATRWEB_VAL_*\n"; exit(3); }
    $c = parse_ini_file($cnf, true, INI_SCANNER_RAW)['client'];
    $dsn = isset($c['socket']) ? "mysql:unix_socket={$c['socket']};dbname=$db;charset=utf8mb4" : 'mysql:host=' . ($c['host'] ?? '127.0.0.1') . ';port=' . ($c['port'] ?? 3306) . ";dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $c['user'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $reais = $pdo->query("SELECT * FROM ui_nav_items WHERE is_active = 1 AND is_visible = 1 AND FIND_IN_SET('sidebar', display_context) > 0 ORDER BY order_index, id")->fetchAll();
    foreach ([null, 0, 50, 79, 80, 100] as $l) $ok("validação (" . count($reais) . " itens): menu idêntico com nível " . var_export($l, true), navFiltrarPorNivel($reais, $l === null ? null : 7, $niv($l)) === $reais);
}
echo "teste-nav-nivel: " . ($n - $f) . " ok, $f falha(s)\n"; exit($f ? 1 : 0);
