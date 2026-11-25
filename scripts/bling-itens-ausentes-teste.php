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

    $S = BlingSyncService::class;
    $erros = static fn(string $b) => n($pdo, "SELECT COUNT(*) FROM bling_sync_errors WHERE recurso = 'pedidos' AND bling_id = ?", [$b]);

    echo "== 0. Codex DSHOW-113 (2) · classificador conservador (tabela de decisão)\n";
    $it2 = pedido(0, true)['itens'];
    $casos = [
        ['ausente → preserva (listagem)',                     [],                                                   'listagem', 'ausente'],
        ['ausente → preserva (detalhe)',                      [],                                                   'detalhe',  'ausente'],
        ['null na listagem → preserva',                       ['itens' => null],                                    'listagem', 'preservar'],
        ['null no detalhe → preserva (sem contrato de [])',   ['itens' => null],                                    'detalhe',  'preservar'],
        ['[] sem total na listagem → preserva',               ['itens' => []],                                      'listagem', 'preservar'],
        ['[] com totalProdutos 0 na LISTAGEM → preserva',     ['itens' => [], 'totalProdutos' => 0],                'listagem', 'preservar'],
        ['[] sem totalProdutos no detalhe → preserva',        ['itens' => []],                                      'detalhe',  'preservar'],
        ['[] no detalhe com totalProdutos 0 → esvazia',       ['itens' => [], 'totalProdutos' => 0],                'detalhe',  'vazia'],
        ['[] no detalhe com totalProdutos > 0 → rejeita',     ['itens' => [], 'totalProdutos' => 12.5],             'detalhe',  'invalida'],
        ['lista válida na LISTAGEM → preserva (sem contrato)',['itens' => $it2],                                    'listagem', 'preservar'],
        ['lista completa e válida no detalhe → atualiza',     ['itens' => $it2],                                    'detalhe',  'com_itens'],
        ['parcialmente inválida (quantidade 0) → rejeita',    ['itens' => [$it2[0], ['codigo' => 'X', 'quantidade' => 0, 'valor' => 1]]], 'detalhe', 'invalida'],
        ['parcialmente inválida (elemento texto) → rejeita',  ['itens' => [$it2[0], 'lixo']],                       'detalhe',  'invalida'],
        ['item sem valor → rejeita',                          ['itens' => [['codigo' => 'X', 'quantidade' => 1]]],  'detalhe',  'invalida'],
        ['item sem identificação → rejeita',                  ['itens' => [['quantidade' => 1, 'valor' => 1]]],     'detalhe',  'invalida'],
        ['itens não é lista → rejeita',                       ['itens' => 'texto'],                                 'detalhe',  'invalida'],
    ];
    foreach ($casos as [$nome, $bruto, $origem, $esperado]) {
        $got = $S::classificarItens($bruto, $origem);
        ok("classificador: $nome", $got === $esperado, "veio $got");
    }

    echo "== 1. detalhe completo e válido → grava itens e totais dos itens\n";
    $VENDAS = [pedido(1, false), pedido(2, false)];
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 'i1');                  // cabeçalhos pela listagem (sem itens, como no Bling)
    $sync->gravarPedidoDetalhe($conta, pedido(1, true)); $sync->gravarPedidoDetalhe($conta, pedido(2, true));
    $a = $retrato($pdo, '900001'); $retratoAntes2 = $retrato($pdo, '900002');
    ok('CONTRAPROVA detalhe completo válido → atualiza: 2 itens; subtotal 1234.56; qtd_itens 2; total = subtotal − desconto + frete', count($a['itens']) === 2
        && (float) $a['pedido']['subtotal'] === 1234.56 && (int) $a['pedido']['qtd_itens'] === 2 && (float) $a['pedido']['total'] === 1280.06, json_encode($a['pedido']));

    echo "== 2. DECISIVO: pedido com 2 itens recebe [] sem total → nada apagado (e as outras formas sem prova de completude)\n";
    $VENDAS = [pedido(1, false, ['itens' => [], 'situacao' => ['id' => 12, 'valor' => 0]]), pedido(2, false, ['itens' => null])];
    unset($VENDAS[0]['totalProdutos']);                                            // [] SEM total: a ausência de totalProdutos não prova nada
    $r = $sync->sincronizar($conta, 'pedidos', 'incremental', 'i2');
    $b = $retrato($pdo, '900001'); $b2 = $retrato($pdo, '900002');
    ok('CONTRAPROVA DECISIVA: 2 itens + [] sem total (listagem) → itens intactos, nenhum DELETE', $b['itens'] === $a['itens'] && count($b['itens']) === 2, json_encode($b['itens']));
    ok('DECISIVO: subtotal, custo, qtd_itens e total intactos (ausência ≠ zero)', $b['pedido'] === $a['pedido'], json_encode([$a['pedido'], $b['pedido']]));
    ok('`itens: null` → preserva', count($b2['itens']) === 2 && $b2['pedido'] == $retratoAntes2['pedido']);
    ok('o resto do cabeçalho segue atualizando (situação nova: id 12 gravado)', (string) v($pdo, 'SELECT situacao_bling_id FROM bling_sales_orders WHERE bling_id = ?', ['900001']) === '12');
    ok('nenhum erro na rodada', (int) ($r['erros'] ?? 0) === 0, json_encode($r));
    $semTotal = pedido(1, false, ['itens' => []]); unset($semTotal['totalProdutos']);
    $sync->gravarPedidoDetalhe($conta, $semTotal);
    ok('[] sem totalProdutos nem no DETALHE prova vazio → itens intactos', $retrato($pdo, '900001')['itens'] === $a['itens']);
    $sync->gravarPedidoDetalhe($conta, pedido(1, false, ['totalProdutos' => 1234.56]));   // detalhe sem o campo itens
    ok('detalhe SEM o campo itens → preserva', $retrato($pdo, '900001')['itens'] === $a['itens']);
    $VENDAS = [pedido(1, true, ['situacao' => ['id' => 12, 'valor' => 0]])]; $VENDAS[0]['itens'] = [$VENDAS[0]['itens'][0]];   // listagem com 1 item só
    $sync->sincronizar($conta, 'pedidos', 'incremental', 'i2b');
    ok('lista NÃO vazia vinda da LISTAGEM não substitui (pode ser parcial) → 2 itens intactos', $retrato($pdo, '900001')['itens'] === $a['itens']);

    echo "== 3. detalhe com itens diferentes → regrava\n";
    $novo = pedido(1, true); $novo['itens'] = [['id' => 7999, 'codigo' => 'SKU-Z', 'descricao' => 'Outro', 'quantidade' => 1, 'valor' => 10, 'produto' => ['id' => 34]]];
    $sync->gravarPedidoDetalhe($conta, $novo);
    $c = $retrato($pdo, '900001');
    ok('itens trocados pelo novo (1 item, SKU-Z); qtd 1; subtotal 10', count($c['itens']) === 1 && $c['itens'][0]['sku'] === 'SKU-Z' && (int) $c['pedido']['qtd_itens'] === 1 && (float) $c['pedido']['subtotal'] === 10.0);

    echo "== 4. venda NOVA sem itens (listagem): entra, sem itens, sem inventar\n";
    $VENDAS = [pedido(3, false, ['total' => 99.9])];
    $sync->sincronizar($conta, 'pedidos', 'incremental', 'i4');
    $d = $retrato($pdo, '900003');
    ok('venda nova gravada com o total do cabeçalho (99.90), sem itens', (float) $d['pedido']['total'] === 99.9 && $d['itens'] === []);

    echo "== 4b. vazia SÓ com contrato; lista parcialmente inválida → nada substituído\n";
    foreach ([11, 12, 13, 14] as $k) { $sync->gravarPedidoDetalhe($conta, pedido($k, true)); }
    $antes11 = $retrato($pdo, '900011'); $antes12 = $retrato($pdo, '900012'); $antes13 = $retrato($pdo, '900013'); $antes14 = $retrato($pdo, '900014');
    $sync->gravarPedidoDetalhe($conta, pedido(11, false, ['itens' => [], 'total' => 0, 'totalProdutos' => 0]));
    $v11 = $retrato($pdo, '900011');
    ok('vazia confirmada pelo DETALHE (totalProdutos 0): itens removidos, qtd_itens 0, subtotal 0, custo 0', $v11['itens'] === [] && (int) $v11['pedido']['qtd_itens'] === 0
        && (float) $v11['pedido']['subtotal'] === 0.0 && (float) $v11['pedido']['custo_total'] === 0.0, json_encode($v11));
    ok('vazia confirmada: total do cabeçalho 0 não sobrescreve o total gravado', (float) $v11['pedido']['total'] === (float) $antes11['pedido']['total']);
    $e12 = $erros('900012');
    try { $sync->gravarPedidoDetalhe($conta, pedido(12, false, ['itens' => [], 'totalProdutos' => 1234.56])); $rej = false; } catch (UnexpectedValueException $e) { $rej = true; }
    ok('[] no detalhe contradizendo totalProdutos > 0 → rejeitado, tudo intacto, erro registrado', $rej && $retrato($pdo, '900012') == $antes12 && $erros('900012') === $e12 + 1);
    $parcial = pedido(13, true); $parcial['itens'][1]['quantidade'] = 0;          // 1 válido + 1 inválido
    $e13 = $erros('900013');
    try { $sync->gravarPedidoDetalhe($conta, $parcial + ['observacoes' => 'mudou']); $rej = false; } catch (UnexpectedValueException $e) { $rej = true; }
    ok('CONTRAPROVA coleção parcialmente inválida → NADA substituído (nem o item válido, nem o cabeçalho)', $rej && $retrato($pdo, '900013') == $antes13, json_encode($retrato($pdo, '900013')['itens']));
    ok('… e o erro fica registrado (recurso pedidos, id do pedido), sem dado do item', $erros('900013') === $e13 + 1
        && !str_contains((string) v($pdo, "SELECT mensagem FROM bling_sync_errors WHERE bling_id = '900013' ORDER BY id DESC LIMIT 1"), 'SKU'));
    $lixo = pedido(14, true); $lixo['itens'][] = 'lixo';
    try { $sync->gravarPedidoDetalhe($conta, $lixo); $rej = false; } catch (UnexpectedValueException $e) { $rej = true; }
    ok('elemento ilegível no meio da lista → rejeita a substituição', $rej && $retrato($pdo, '900014') == $antes14);
    $VENDAS = [pedido(14, false, ['itens' => [], 'totalProdutos' => 0])];
    $sync->sincronizar($conta, 'pedidos', 'incremental', 'v4');
    ok('[] + totalProdutos 0 vindo da LISTAGEM NÃO esvazia (a listagem não prova coleção)', $retrato($pdo, '900014') == $antes14);

    echo "== 5. compras: mesma regra (itens semeados direto na base de teste; a listagem nunca substitui)\n";
    $COMPRAS = [compra(1, false)];
    $sync->sincronizar($conta, 'compras', 'carga_inicial', 'c1');
    $cid = (int) v($pdo, "SELECT id FROM bling_purchase_orders WHERE bling_id = '800001'");
    $pdo->prepare('INSERT INTO bling_purchase_order_items (account_id, purchase_order_id, sku, descricao, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$conta, $cid, 'SKU-C', 'Fonte', 3, 100, 300]);
    $pdo->prepare('UPDATE bling_purchase_orders SET qtd_itens = 1, qtd_total = 3 WHERE id = ?')->execute([$cid]);
    $q1 = $pdo->query("SELECT qtd_itens, qtd_total FROM bling_purchase_orders WHERE id = $cid")->fetch();
    foreach (['sem o campo' => compra(1, false), '[]' => compra(1, false) + ['itens' => []], 'null' => compra(1, false) + ['itens' => null], 'lista' => compra(1, true)] as $nome => $cmp) {
        $COMPRAS = [$cmp + ['observacoes' => $nome]];
        $sync->sincronizar($conta, 'compras', 'incremental', 'c-' . md5($nome));
        $ci = n($pdo, "SELECT COUNT(*) FROM bling_purchase_order_items WHERE purchase_order_id = $cid");
        $q2 = $pdo->query("SELECT qtd_itens, qtd_total FROM bling_purchase_orders WHERE id = $cid")->fetch();
        ok("compra pela listagem ($nome): item e quantidades intactos", $ci === 1 && $q1 == $q2, json_encode([$ci, $q2]));
    }

    echo "== 5b. CONTRAPROVA erro no meio da página → registro e checkpoint recuperáveis\n";
    foreach ([31, 32, 33] as $k) { $sync->gravarPedidoDetalhe($conta, pedido($k, true)); }
    $antes32 = $retrato($pdo, '900032');
    $pdo->exec("UPDATE bling_sync_state SET watermark = UTC_TIMESTAMP() - INTERVAL 3 DAY WHERE recurso = 'pedidos'");
    $w0 = $repo->estadoSync($conta, 'pedidos')['watermark'];
    $hist32 = n($pdo, "SELECT COUNT(*) FROM bling_sales_order_status_history h JOIN bling_sales_orders o ON o.id = h.sales_order_id WHERE o.bling_id = '900032'");
    // o do meio: 'enviado' (24) → cabeçalho e histórico são ESCRITOS e só depois o envio falha (transportadora > VARCHAR(190)): o SAVEPOINT tem de desfazer tudo
    $VENDAS = [pedido(31, false, ['total' => 501]), pedido(32, false, ['total' => 502, 'situacao' => ['valor' => 24], 'transporte' => ['frete' => 55.5, 'transportador' => ['nome' => str_repeat('X', 300)]]]), pedido(33, false, ['total' => 503])];
    $e32 = $erros('900032');
    $r5 = $sync->sincronizar($conta, 'pedidos', 'incremental', 'm1');
    ok('os vizinhos da mesma página gravaram (31 e 33 com o total novo)', (float) v($pdo, "SELECT total FROM bling_sales_orders WHERE bling_id = '900031'") === 501.0
        && (float) v($pdo, "SELECT total FROM bling_sales_orders WHERE bling_id = '900033'") === 503.0);
    ok('o do meio ficou EXATAMENTE como estava (cabeçalho, itens e histórico — a falha veio DEPOIS de escrever o cabeçalho)', $retrato($pdo, '900032') == $antes32
        && n($pdo, "SELECT COUNT(*) FROM bling_sales_order_status_history h JOIN bling_sales_orders o ON o.id = h.sales_order_id WHERE o.bling_id = '900032'") === $hist32);
    ok('erro registrado com o id do pedido (recuperável)', $r5['erros'] === 1 && $erros('900032') === $e32 + 1, json_encode($r5));
    ok('checkpoint: o watermark NÃO avançou (o incremental relê o trecho)', $repo->estadoSync($conta, 'pedidos')['watermark'] === $w0);
    $VENDAS[1]['transporte']['transportador']['nome'] = 'Correios';
    $r5b = $sync->sincronizar($conta, 'pedidos', 'incremental', 'm2');
    ok('depois de corrigido: o do meio grava, 0 erro, watermark avança, itens intactos', $r5b['erros'] === 0 && (float) v($pdo, "SELECT total FROM bling_sales_orders WHERE bling_id = '900032'") === 502.0
        && $repo->estadoSync($conta, 'pedidos')['watermark'] !== $w0 && $retrato($pdo, '900032')['itens'] === $antes32['itens'], json_encode($r5b));

    echo "== 6. varredura do código\n";
    $codigo = (string) file_get_contents($raiz . '/api/bling/services/BlingSyncService.php');
    ok('o DELETE de itens de venda vem DEPOIS da guarda (vazia só se CONFIRMADA)', (bool) preg_match('/if \(\$itens === \[\] && !\$vaziaConfirmada\) \{\s*return;[^}]*\}\s*\$this->repo->pdo\(\)->prepare\(\'DELETE FROM bling_sales_order_items/s', $codigo));
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
