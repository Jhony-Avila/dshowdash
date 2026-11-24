<?php
declare(strict_types=1);
// scripts/bling-itens-ausentes-teste.php — RESPOSTA SEM ITENS não apaga itens nem zera totais (risco da 711fcedc:700) · ACIMA_DIREITA 23/11 noite.
//
//     BLING_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> BLING_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/bling-itens-ausentes-teste.php
//
// SEGURANÇA (molde do bling-situacao-teste.php): só num banco ^ATRWEB_VAL_T_[0-9]+$; recusa se já houver tabela bling_*; cria só as tabelas
// do DDL oficial e as remove no fim, mesmo em falha. Segredos SINTÉTICOS; Bling = transporte FALSO (nenhuma rede).

$raiz = dirname(__DIR__);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('BLING_ENTRADA', true);
foreach (['lib/BlingSituacoes', 'lib/BlingCrypto', 'lib/BlingTransporte', 'lib/BlingOAuth', 'lib/BlingVersionAdapter', 'lib/BlingNormalizer',
          'repositories/BlingRepository', 'lib/BlingClient', 'services/BlingAuthService', 'services/BlingSyncService'] as $f) {
    require_once $raiz . '/api/bling/' . $f . '.php';
}
$cnf = (string) getenv('BLING_TESTE_CNF'); $db = (string) getenv('BLING_TESTE_DB');
if ($cnf === '' || !is_file($cnf) || !preg_match('/^ATRWEB_VAL_T_[0-9]+$/', $db)) { fwrite(STDERR, "[ERRO] defina BLING_TESTE_CNF e BLING_TESTE_DB=ATRWEB_VAL_T_<n> — ABORTADO\n"); exit(2); }
$cli = []; $sec = '';
foreach (preg_split('/\r?\n/', (string) file_get_contents($cnf)) as $l) {
    $l = trim($l);
    if ($l === '' || $l[0] === '#' || $l[0] === ';') { continue; }
    if (preg_match('/^\[(.+)\]$/', $l, $m)) { $sec = trim($m[1]); continue; }
    if ($sec !== 'client' || !str_contains($l, '=')) { continue; }
    [$k, $v] = explode('=', $l, 2); $cli[trim($k)] = trim(trim($v), "\"'");
}
$dsn = isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306);
$pdo = new PDO($dsn . ';dbname=' . $db . ';charset=utf8mb4', $cli['user'] ?? '', $cli['password'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
unset($cli);
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { fwrite(STDERR, "[ERRO] banco conectado difere — ABORTADO\n"); exit(2); }
if ((int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn() > 0) {
    fwrite(STDERR, "[ERRO] $db já tem tabela(s) bling_* — não mexo no que não criei. ABORTADO\n"); exit(2);
}
foreach (['BLING_CRYPTO_KEY' => str_repeat('5e', 32), 'BLING_CLIENT_ID' => 'teste-sintetico-client', 'BLING_CLIENT_SECRET' => 'teste-sintetico-secret',
          'BLING_REDIRECT_URI' => 'https://exemplo.invalid/api/bling/oauth/callback'] as $k => $v) { putenv("$k=$v"); $_ENV[$k] = $v; }
$SONOS = [];
BlingClient::$dormirParaTeste = static function (int $ms) use (&$SONOS): void { $SONOS[] = $ms; };

$ddl = (string) file_get_contents($raiz . '/docs/BLING/02-banco-BLING.sql');
preg_match_all('/CREATE TABLE IF NOT EXISTS (bling_[a-z_]+) \(/', $ddl, $mm);
$TABELAS = array_values(array_unique($mm[1]));
$criadas = []; $falhas = 0; $total = 0;
function ok(string $nome, bool $cond, string $det = ''): void { global $falhas, $total; $total++; if (!$cond) { $falhas++; } echo ($cond ? 'ok    ' : 'FALHA ') . $nome . ($det !== '' ? "  ($det)" : '') . "\n"; }
function n(PDO $p, string $sql, array $a = []): int { $s = $p->prepare($sql); $s->execute($a); return (int) $s->fetchColumn(); }
function v(PDO $p, string $sql, array $a = []): mixed { $s = $p->prepare($sql); $s->execute($a); return $s->fetchColumn(); }


function pedido(int $i, bool $comItens, array $extra = []): array {
    $p = ['id' => 900000 + $i, 'numero' => (string) (21000 + $i), 'data' => '2026-11-20', 'situacao' => ['id' => 9, 'valor' => 0], 'loja' => ['id' => 205001],
          'contato' => ['id' => 1], 'total' => 0, 'totalProdutos' => 0, 'desconto' => ['valor' => 10], 'transporte' => ['frete' => 55.5]];
    $p = $extra + $p;   // o caso sobrescreve o padrão
    if ($comItens) {
        $p['itens'] = [['id' => 7000 + $i * 10 + 1, 'codigo' => 'SKU-A', 'descricao' => 'Painel', 'quantidade' => 2, 'valor' => 500.00, 'produto' => ['id' => 31]],
                       ['id' => 7000 + $i * 10 + 2, 'codigo' => 'SKU-B', 'descricao' => 'Cabo', 'quantidade' => 1, 'valor' => 234.56, 'produto' => ['id' => 32]]];
    }
    return $p;
}
function compra(int $i, bool $comItens): array {
    $c = ['id' => 800000 + $i, 'numero' => (string) (5000 + $i), 'data' => '2026-11-20', 'situacao' => ['valor' => 0], 'fornecedor' => ['id' => 2], 'total' => 300];
    if ($comItens) { $c['itens'] = [['codigo' => 'SKU-C', 'descricao' => 'Fonte', 'quantidade' => 3, 'valor' => 100, 'produto' => ['id' => 33]]]; }
    return $c;
}
$VENDAS = []; $COMPRAS = [];
$pagina = static function (array $todos, string $url): BlingResposta {
    parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $p = (int) ($q['pagina'] ?? 1); $l = (int) ($q['limite'] ?? 100);
    return new BlingResposta(200, ['data' => array_slice($todos, ($p - 1) * $l, $l)]);
};
$retrato = static function (PDO $pdo, string $blingId): array {
    $o = $pdo->prepare('SELECT id, subtotal, desconto, frete, total, custo_total, qtd_itens FROM bling_sales_orders WHERE bling_id = ?'); $o->execute([$blingId]);
    $ped = $o->fetch() ?: [];
    $it = $pdo->prepare('SELECT bling_id, sku, quantidade, valor_unitario, valor_total FROM bling_sales_order_items WHERE sales_order_id = ? ORDER BY bling_id');
    $it->execute([(int) ($ped['id'] ?? 0)]);
    return ['pedido' => $ped, 'itens' => $it->fetchAll()];
};
try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($TABELAS as $t) {
        $ini = strpos($ddl, "CREATE TABLE IF NOT EXISTS $t ("); $eng = $ini === false ? false : strpos($ddl, "\n) ENGINE", $ini); $fim = $eng === false ? false : strpos($ddl, ';', $eng);
        if ($fim === false) { throw new RuntimeException("DDL de $t não encontrada"); }
        $pdo->exec('CREATE TABLE ' . substr($ddl, $ini + strlen('CREATE TABLE IF NOT EXISTS '), $fim - $ini - strlen('CREATE TABLE IF NOT EXISTS ')));
        $criadas[] = $t;
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    $api = new BlingTransporteFalso();
    $api->responder('oauth/token', new BlingResposta(200, ['access_token' => 'acesso-sintetico', 'refresh_token' => 'refresh-sintetico', 'expires_in' => 3600, 'token_type' => 'Bearer']));
    $api->responder('pedidos/vendas', static function ($m, $url) use (&$VENDAS, $pagina) { return $pagina($VENDAS, $url); });
    $api->responder('pedidos/compras', static function ($m, $url) use (&$COMPRAS, $pagina) { return $pagina($COMPRAS, $url); });
    $repo = new BlingRepository($pdo); $auth = new BlingAuthService($repo, $api);
    $url = $auth->iniciarConexao(75, '#/panel-bling'); parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $conta = (int) $auth->concluirConexao('codigo-sintetico', (string) $q['state'], ['nome' => 'Conta de teste', 'cnpj' => '00000000000191'])['account_id'];
    $sync = new BlingSyncService($repo, $auth);

    echo "== 1. pedido COM itens (como o detalhe do Bling): grava itens e totais dos itens\n";
    $VENDAS = [pedido(1, true), pedido(2, true)];
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 'i1');
    $a = $retrato($pdo, '900001');
    ok('2 itens gravados; subtotal 1234.56; qtd_itens 2; total = subtotal − desconto + frete', count($a['itens']) === 2 && (float) $a['pedido']['subtotal'] === 1234.56
        && (int) $a['pedido']['qtd_itens'] === 2 && (float) $a['pedido']['total'] === 1280.06, json_encode($a['pedido']));

    echo "== 2. DECISIVO: a MESMA venda chega SEM itens (como na listagem) → itens e totais intactos\n";
    $VENDAS = [pedido(1, false, ['situacao' => ['id' => 12, 'valor' => 0]]), pedido(2, false, ['itens' => []])];
    $r = $sync->sincronizar($conta, 'pedidos', 'incremental', 'i2');
    $b = $retrato($pdo, '900001'); $b2 = $retrato($pdo, '900002'); $a2 = $a; 
    ok('DECISIVO: itens da venda 1 intactos (nenhum DELETE)', $b['itens'] === $a['itens'] && count($b['itens']) === 2, json_encode($b['itens']));
    ok('DECISIVO: subtotal, custo, qtd_itens e total intactos (ausência ≠ zero)', $b['pedido'] === $a['pedido'], json_encode([$a['pedido'], $b['pedido']]));
    ok('`itens: []` explícito também não apaga', count($b2['itens']) === 2 && (int) $b2['pedido']['qtd_itens'] === 2);
    ok('o resto do cabeçalho segue atualizando (situação nova: id 12 gravado)', (string) v($pdo, 'SELECT situacao_bling_id FROM bling_sales_orders WHERE bling_id = ?', ['900001']) === '12'
        && n($pdo, 'SELECT COUNT(*) FROM bling_sales_order_status_history') >= 2, json_encode(array_intersect_key($r, array_flip(['situacao', 'atualizados', 'erros']))));
    ok('nenhum erro na rodada', (int) ($r['erros'] ?? 0) === 0, json_encode($r));

    echo "== 3. a venda volta COM itens diferentes → regrava (a regra antiga continua para resposta completa)\n";
    $novo = pedido(1, true); $novo['itens'] = [['id' => 7999, 'codigo' => 'SKU-Z', 'descricao' => 'Outro', 'quantidade' => 1, 'valor' => 10, 'produto' => ['id' => 34]]];
    $VENDAS = [$novo];
    $sync->sincronizar($conta, 'pedidos', 'incremental', 'i3');
    $c = $retrato($pdo, '900001');
    ok('itens trocados pelo novo (1 item, SKU-Z); qtd 1; subtotal 10', count($c['itens']) === 1 && $c['itens'][0]['sku'] === 'SKU-Z' && (int) $c['pedido']['qtd_itens'] === 1 && (float) $c['pedido']['subtotal'] === 10.0);

    echo "== 4. venda NOVA sem itens: entra, sem itens, sem inventar\n";
    $VENDAS = [pedido(3, false, ['total' => 99.9])];
    $sync->sincronizar($conta, 'pedidos', 'incremental', 'i4');
    $d = $retrato($pdo, '900003');
    ok('venda nova gravada com o total do cabeçalho (99.90), sem itens', (float) $d['pedido']['total'] === 99.9 && $d['itens'] === []);

    echo "== 5. compras: mesma regra\n";
    $COMPRAS = [compra(1, true)];
    $sync->sincronizar($conta, 'compras', 'carga_inicial', 'c1');
    $ci = n($pdo, "SELECT COUNT(*) FROM bling_purchase_order_items i JOIN bling_purchase_orders o ON o.id = i.purchase_order_id WHERE o.bling_id = '800001'");
    $q1 = $pdo->query("SELECT qtd_itens, qtd_total FROM bling_purchase_orders WHERE bling_id = '800001'")->fetch();
    $COMPRAS = [compra(1, false)];
    $sync->sincronizar($conta, 'compras', 'incremental', 'c2');
    $ci2 = n($pdo, "SELECT COUNT(*) FROM bling_purchase_order_items i JOIN bling_purchase_orders o ON o.id = i.purchase_order_id WHERE o.bling_id = '800001'");
    $q2 = $pdo->query("SELECT qtd_itens, qtd_total FROM bling_purchase_orders WHERE bling_id = '800001'")->fetch();
    ok('compra sem itens na resposta: item e quantidades intactos', $ci === 1 && $ci2 === 1 && $q1 == $q2 && (int) $q2['qtd_itens'] === 1, json_encode([$ci, $ci2, $q1, $q2]));

    echo "== 6. varredura do código\n";
    $codigo = (string) file_get_contents($raiz . '/api/bling/services/BlingSyncService.php');
    ok('o DELETE de itens de venda vem DEPOIS da guarda de lista vazia', (bool) preg_match('/if \(\$itens === \[\]\) \{\s*return;[^}]*\}\s*\$this->repo->pdo\(\)->prepare\(\'DELETE FROM bling_sales_order_items/s', $codigo));
} catch (Throwable $e) {
    $falhas++; echo 'FALHA exceção: ', get_class($e), ': ', $e->getMessage(), ' @', basename($e->getFile()), ':', $e->getLine(), "\n";
} finally {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (array_reverse(array_unique($criadas)) as $t) { if (preg_match('/^bling_[a-z_]+$/', $t)) { $pdo->exec("DROP TABLE IF EXISTS `$t`"); } }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    $sobra = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn();
    echo "== limpeza: $sobra tabela(s) bling_* restante(s)\n";
}
echo "== $total verificações, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
