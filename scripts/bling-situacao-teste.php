<?php
declare(strict_types=1);
// scripts/bling-situacao-teste.php — PORTÃO BLING SITUAÇÃO (23/11/2026): ensaio da migração + releitura + lista de situações.
//
//     BLING_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> BLING_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/bling-situacao-teste.php
//
// SEGURANÇA (molde do bling-escopo-ausente-teste.php): só num banco ^ATRWEB_VAL_T_[0-9]+$; recusa se já houver tabela bling_*; cria só
// as tabelas do DDL oficial e as remove no fim, mesmo em falha. Segredos SINTÉTICOS; Bling = transporte FALSO (nenhuma rede).

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

// Bling FALSO: N pedidos; situacao {id real, valor 0 — como a produção de hoje}; loja.id
function pedidosFalsos(int $n, callable $sitId): array {
    $out = [];
    for ($i = 1; $i <= $n; $i++) {
        $id = $sitId($i);
        $out[] = ['id' => 900000 + $i, 'numero' => (string) (21000 + $i), 'data' => '2026-11-' . str_pad((string) (1 + $i % 22), 2, '0', STR_PAD_LEFT),
                  'situacao' => $id === null ? ['valor' => 0] : ['id' => $id, 'valor' => 0], 'loja' => ['id' => 205000 + ($i % 3)], 'contato' => ['id' => 1],
                  'total' => 100 + $i, 'totalProdutos' => 100 + $i];
    }
    return $out;
}
$PEDIDOS = pedidosFalsos(250, static fn(int $i) => $i % 5 === 0 ? 12 : 9);   // 50 "12", 200 "9"
$paginaDe = static function (array $todos, string $url): BlingResposta {
    parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $p = (int) ($q['pagina'] ?? 1); $l = (int) ($q['limite'] ?? 100);
    return new BlingResposta(200, ['data' => array_slice($todos, ($p - 1) * $l, $l)]);
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
    // começa como a PRODUÇÃO de hoje: sem situacao_bling_id, sem bling_situacoes, sem loja_bling_id
    $pdo->exec('ALTER TABLE bling_sales_orders DROP COLUMN situacao_bling_id');
    $pdo->exec('ALTER TABLE bling_sales_orders DROP COLUMN loja_bling_id');
    $pdo->exec('DROP TABLE bling_situacoes'); $criadas = array_values(array_diff($criadas, ['bling_situacoes']));

    $api = new BlingTransporteFalso();
    $api->responder('oauth/token', new BlingResposta(200, ['access_token' => 'acesso-sintetico', 'refresh_token' => 'refresh-sintetico', 'expires_in' => 3600, 'token_type' => 'Bearer']));
    $api->responder('pedidos/vendas', static fn($m, $url) => $paginaDe($GLOBALS['PEDIDOS'], $url));
    $repo = new BlingRepository($pdo);
    $auth = new BlingAuthService($repo, $api);
    $url = $auth->iniciarConexao(75, '#/panel-bling'); parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
    $conta = (int) $auth->concluirConexao('codigo-sintetico', (string) $q['state'], ['nome' => 'Conta de teste', 'cnpj' => '00000000000191'])['account_id'];
    $sync = new BlingSyncService($repo, $auth);

    echo "== 1. hoje (sem migração): a sincronização normal segue igual e não quebra\n";
    $r = $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 't1');
    ok('250 pedidos gravados sem a coluna nova', n($pdo, 'SELECT COUNT(*) FROM bling_sales_orders') === 250, json_encode(array_intersect_key($r, array_flip(['situacao', 'criados', 'erros']))));
    ok('campo antigo = situacao.valor (0), como hoje', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling = '0'") === 250);
    $c0 = $sync->contagemSituacao($conta);
    ok('contagem: sem as colunas, sem inventar', $c0['tem_coluna_situacao_id'] === false && $c0['com_situacao_id'] === null && $c0['com_loja'] === null && $c0['pedidos'] === 250);
    $rx = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null);
    ok('releitura recusa sem a coluna (sem chamar o Bling)', $rx['situacao'] === 'sem_coluna' && $api->contar('pedidos/vendas') === 3);

    echo "== 2. ordem mais exigente: portão BLING LOJA ANTES (+ sincronização normal regrava tudo com a loja), depois a migração da situação\n";
    $sqlLoja = preg_replace('/^--.*$/m', '', str_replace('BLING.', '', (string) file_get_contents($raiz . '/scripts/deploy/bling-migracao-20261123-loja.sql')));
    foreach (array_filter(array_map('trim', explode(';', $sqlLoja))) as $st) { $pdo->exec($st); }
    $repo = new BlingRepository($pdo); $auth = new BlingAuthService($repo, $api); $sync = new BlingSyncService($repo, $auth);
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 't2-loja');
    ok('com o portão da loja, a sincronização normal já gravou a loja', n($pdo, 'SELECT COUNT(*) FROM bling_sales_orders WHERE loja_bling_id IS NOT NULL') === 250);
    $hashAntes = (string) v($pdo, 'SELECT payload_hash FROM bling_sales_orders WHERE bling_id = ?', ['900001']);
    $antigoAntes = $pdo->query('SELECT bling_id, situacao, situacao_bling, total, loja_bling_id FROM bling_sales_orders ORDER BY bling_id')->fetchAll();
    $sqlMig = (string) file_get_contents($raiz . '/scripts/deploy/bling-migracao-20261123-situacao.sql');
    $sqlMig = preg_replace('/^--.*$/m', '', str_replace('BLING.', '', $sqlMig));
    foreach (array_filter(array_map('trim', explode(';', $sqlMig))) as $st) { $pdo->exec($st); }
    $criadas[] = 'bling_situacoes';
    ok('migração só aditiva: coluna e tabela existem', n($pdo, "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='bling_sales_orders' AND COLUMN_NAME='situacao_bling_id'") === 1
        && n($pdo, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='bling_situacoes'") === 1);
    ok('migração não tocou em nenhum dado', $pdo->query('SELECT bling_id, situacao, situacao_bling, total, loja_bling_id FROM bling_sales_orders ORDER BY bling_id')->fetchAll() === $antigoAntes);
    ok('SQL da migração não tem DROP/DELETE/TRUNCATE/UPDATE', !preg_match('/\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i', preg_replace('/^--.*$/m', '', (string) file_get_contents($raiz . '/scripts/deploy/bling-migracao-20261123-situacao.sql'))));

    echo "== 3. releitura: para no meio e retoma\n";
    $repo = new BlingRepository($pdo); $auth = new BlingAuthService($repo, $api); $sync = new BlingSyncService($repo, $auth);   // nova instância vê as colunas
    // ── TESTE DECISIVO (Codex DSHOW-111 A2): pedido de validação COM itens, valores e frete; a releitura só pode mudar situação e loja ──
    $pid = (int) v($pdo, "SELECT id FROM bling_sales_orders WHERE bling_id = '900001'");
    $pdo->prepare("UPDATE bling_sales_orders SET subtotal=1234.56, desconto=10.00, frete=55.50, total=1280.06, custo_total=800.00, qtd_itens=2,
        vendedor='Vendedor Teste', forma_pagamento='Boleto Teste', situacao='aprovado', payload_hash='hash-de-validacao', loja_bling_id=NULL WHERE id=?")->execute([$pid]);
    $insItem = $pdo->prepare('INSERT INTO bling_sales_order_items (account_id, sales_order_id, bling_id, sku, descricao, quantidade, valor_unitario, valor_total, custo_unitario) VALUES (?,?,?,?,?,?,?,?,?)');
    $insItem->execute([$conta, $pid, 'it-1', 'SKU-A', 'Item de validação A', 2, 500.00, 1000.00, 300.00]);
    $insItem->execute([$conta, $pid, 'it-2', 'SKU-B', 'Item de validação B', 1, 234.56, 234.56, 200.00]);
    $retrato = static function () use ($pdo, $pid): array {
        $r = $pdo->query("SELECT * FROM bling_sales_orders WHERE id = $pid")->fetch();
        unset($r['situacao_bling_id'], $r['loja_bling_id'], $r['atualizado_em']);   // só estas podem mudar (atualizado_em é do próprio MySQL)
        return ['pedido' => $r, 'itens' => $pdo->query("SELECT * FROM bling_sales_order_items WHERE sales_order_id = $pid ORDER BY id")->fetchAll(),
                'historico' => (int) $pdo->query("SELECT COUNT(*) FROM bling_sales_order_status_history WHERE sales_order_id = $pid")->fetchColumn()];
    };
    $retratoAntes = $retrato();
    $hashes = $pdo->query('SELECT bling_id, payload_hash FROM bling_sales_orders ORDER BY bling_id')->fetchAll(PDO::FETCH_KEY_PAIR);
    $GLOBALS['PEDIDOS'][] = ['id' => 999999, 'numero' => '99999', 'data' => '2026-11-23', 'situacao' => ['id' => 9, 'valor' => 0], 'loja' => ['id' => 205000]];   // não existe na base
    $antes = $sync->contagemSituacao($conta);
    ok('contagem ANTES: 0 com id; loja em 249 (a do pedido decisivo foi zerada de propósito)', $antes['com_situacao_id'] === 0 && $antes['com_loja'] === 249 && $antes['pedidos'] === 250);
    $chamadas0 = $api->contar('pedidos/vendas'); $pausas = [];
    $paradas = 0;
    $r1 = $sync->releituraPedidos($conta, static function () use (&$paradas): bool { return ++$paradas >= 1; }, static function (int $ms) use (&$pausas): void { $pausas[] = $ms; }, 1500);
    ok('parou a pedido depois da 1ª página', $r1['situacao'] === 'interrompida' && $r1['paginas'] === 1, json_encode($r1));
    ok('progresso gravado: parcial, página 1', ($e = $repo->estadoSync($conta, BlingSyncService::RECURSO_RELEITURA)) && $e['situacao'] === 'parcial' && (int) $e['pagina_atual'] === 1);
    ok('100 pedidos já com id real', n($pdo, 'SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id IS NOT NULL') === 100);
    $r2 = $sync->releituraPedidos($conta, static fn() => false, static function (int $ms) use (&$pausas): void { $pausas[] = $ms; }, 1500);
    ok('retomou da página 1 e concluiu', $r2['situacao'] === 'concluida' && $r2['pagina_inicial'] === 1 && $r2['paginas'] === 3, json_encode($r2));
    ok('páginas de 100, uma por vez (4 chamadas: 1 + 3 na retomada)', $api->contar('pedidos/vendas') - $chamadas0 === 4);
    ok('pausa de 1500 ms entre páginas cheias', $pausas === [1500, 1500], json_encode($pausas));
    $depois = $sync->contagemSituacao($conta);
    ok('contagem DEPOIS: 250 com id real, 250 com loja', $depois['com_situacao_id'] === 250 && $depois['com_loja'] === 250);
    $porId = array_column($depois['por_situacao_id'], 'n', 'id');
    ok('ids reais por situação: 9 = 200, 12 = 50', (int) $porId['9'] === 200 && (int) $porId['12'] === 50, json_encode($porId));
    ok('campo ANTIGO intacto (situacao_bling = 0 em todos)', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling = '0'") === 250);
    ok('situação interna intacta (nenhuma linha nova no histórico)', n($pdo, 'SELECT COUNT(*) FROM bling_sales_order_status_history') === 250);
    $retratoDepois = $retrato();
    ok('DECISIVO: situação e loja do pedido de validação atualizadas', (string) v($pdo, "SELECT situacao_bling_id FROM bling_sales_orders WHERE id = $pid") === '9'
        && (string) v($pdo, "SELECT loja_bling_id FROM bling_sales_orders WHERE id = $pid") === '205001');
    ok('DECISIVO: itens intactos (2 itens, quantidades e valores iguais)', $retratoDepois['itens'] === $retratoAntes['itens'] && count($retratoDepois['itens']) === 2);
    ok('DECISIVO: valores, desconto, frete, total, custo, qtd, vendedor, pagamento, situação interna e hash intactos', $retratoDepois['pedido'] === $retratoAntes['pedido'],
        json_encode(array_diff_assoc((array) $retratoDepois['pedido'], (array) $retratoAntes['pedido'])));
    ok('DECISIVO: histórico de situação intacto', $retratoDepois['historico'] === $retratoAntes['historico']);
    ok('releitura não mexe no hash de NENHUM pedido', $pdo->query('SELECT bling_id, payload_hash FROM bling_sales_orders ORDER BY bling_id')->fetchAll(PDO::FETCH_KEY_PAIR) === $hashes);
    ok('pedido que não existe na base NÃO é criado (conta como ausente)', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE bling_id = '999999'") === 0 && $r2['ausentes'] >= 1, json_encode($r2));
    ok('releitura não grava NENHUM item', n($pdo, 'SELECT COUNT(*) FROM bling_sales_order_items') === 2);
    ok('estado final: ok', $repo->estadoSync($conta, BlingSyncService::RECURSO_RELEITURA)['situacao'] === 'ok');
    ok('estado da sincronização normal de pedidos NÃO foi tocado', $repo->estadoSync($conta, 'pedidos')['situacao'] !== 'parcial');
    ok('nenhum POST/PUT/DELETE ao Bling', count(array_filter($api->chamadas, static fn($c) => $c['metodo'] !== 'GET' && !str_contains($c['url'], 'oauth/token'))) === 0);

    echo "== 4. id ausente numa resposta posterior nunca apaga o id conhecido; 429 respeitado\n";
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => null);
    $api->responder('pedidos/vendas', [new BlingResposta(429, ['error' => 'rate'], ['Retry-After' => '2']),
        ...array_map(static fn($p) => new BlingResposta(200, ['data' => array_slice($GLOBALS['PEDIDOS'], ($p - 1) * 100, 100)]), [1, 2, 3])]);
    $SONOS = [];
    $r3 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('429: esperou o Retry-After e seguiu', $r3['situacao'] === 'concluida' && in_array(2000, $SONOS, true), json_encode($SONOS));
    ok('id conhecido preservado (250 continuam com id)', n($pdo, 'SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id IS NOT NULL') === 250);
    ok('o id NUNCA vem do `valor` (nenhum id "0"; continuam 9 e 12)', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id = '0'") === 0
        && n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id = '9'") === 200);

    echo "== 5. falha no meio: fica parcial na última página gravada; rodar de novo retoma\n";
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $api->responder('pedidos/vendas', [new BlingResposta(200, ['data' => array_slice($GLOBALS['PEDIDOS'], 0, 100)]), new BlingResposta(500, []), new BlingResposta(500, []),
        new BlingResposta(500, []), new BlingResposta(500, []), new BlingResposta(500, []), new BlingResposta(500, [])]);
    $r4 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('5xx persistente: erro, sem derrubar', $r4['situacao'] === 'erro');
    ok('parcial na página 1', ($e = $repo->estadoSync($conta, BlingSyncService::RECURSO_RELEITURA)) && $e['situacao'] === 'parcial' && (int) $e['pagina_atual'] === 1);
    $api->responder('pedidos/vendas', static fn($m, $url) => $paginaDe($GLOBALS['PEDIDOS'], $url));
    $r5 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('retomou e concluiu; todos com o id novo (15)', $r5['situacao'] === 'concluida' && n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id = '15'") === 250);

    echo "== 6. lista de situações do módulo de vendas\n";
    $api->responder('situacoes/modulos/98310', new BlingResposta(200, ['data' => [['id' => 6, 'nome' => 'Em aberto', 'idHerdado' => 0, 'cor' => '#E9DC40'],
        ['id' => 9, 'nome' => 'Atendido', 'idHerdado' => 0, 'cor' => '#3FB57A'], ['id' => 12, 'nome' => 'Cancelado', 'idHerdado' => 0, 'cor' => '#CACACA'],
        ['id' => 'x', 'nome' => 'inválido']]]));
    $api->responder('situacoes/modulos', new BlingResposta(200, ['data' => [['id' => 1, 'nome' => 'Compras'], ['id' => 98310, 'nome' => 'Vendas']]]));
    $s = $sync->lerSituacoesVendas($conta);
    ok('módulo de vendas achado e 3 situações válidas', $s['situacao'] === 'ok' && $s['modulo']['id'] === '98310' && count($s['situacoes']) === 3, json_encode($s, JSON_UNESCAPED_UNICODE));
    ok('gravadas em bling_situacoes (id e nome)', n($pdo, 'SELECT COUNT(*) FROM bling_situacoes') === 3 && v($pdo, "SELECT nome FROM bling_situacoes WHERE situacao_id='9'") === 'Atendido');
    ok('só 2 GETs', $api->contar('situacoes/modulos') === 2);
    $tok0 = $api->contar('oauth/token');
    $api2 = new BlingTransporteFalso();
    $api2->responder('oauth/token', new BlingResposta(200, ['access_token' => 'a', 'refresh_token' => 'r', 'expires_in' => 3600, 'token_type' => 'Bearer']));
    $api2->responder('situacoes/modulos', new BlingResposta(403, ['error' => ['type' => 'insufficient_scope', 'message' => 'insufficient_scope']]));
    $s403 = (new BlingSyncService($repo, new BlingAuthService($repo, $api2)))->lerSituacoesVendas($conta);
    ok('403 de escopo: informa escopo_ausente e para', $s403['situacao'] === 'escopo_ausente' && $api2->contar('situacoes/modulos') === 1, json_encode($s403));
    ok('403 de escopo: nenhuma reautorização tentada', $api2->contar('oauth/token') === 0 && $api2->contar('oauth/authorize') === 0);
    $api3 = new BlingTransporteFalso();
    $api3->responder('situacoes/modulos', new BlingResposta(200, ['data' => [['id' => 1, 'nome' => 'Compras']]]));
    $sx = (new BlingSyncService($repo, new BlingAuthService($repo, $api3)))->lerSituacoesVendas($conta);
    ok('sem módulo de vendas: devolve a lista para o Jhony, sem chutar', $sx['situacao'] === 'modulo_nao_encontrado' && $sx['modulos'][0]['nome'] === 'Compras');

    echo "== 7. PARA-STATUS §132 · releitura SÓ dos pedidos indicados (--pedidos) — Codex DSHOW-112 condição 4\n";
    // estado de partida: 250 pedidos com situação 15 e loja; checkpoint da releitura inteira 'ok'. Pedido decisivo 900001 com 2 itens e valores.
    $ckAntes = $pdo->query("SELECT * FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'")->fetch();
    $retratoAntes7 = $retrato();
    $lojaAntes = static fn(string $b) => (string) v($pdo, 'SELECT loja_bling_id FROM bling_sales_orders WHERE bling_id = ?', [$b]);
    $sitDe = static fn(string $b) => (string) v($pdo, 'SELECT situacao_bling_id FROM bling_sales_orders WHERE bling_id = ?', [$b]);
    $loja900006 = $lojaAntes('900006');
    $E0 = (int) $pdo->query('SELECT COALESCE(MAX(id),0) FROM bling_sync_errors')->fetchColumn();
    $DET = [
        '900001' => new BlingResposta(200, ['data' => ['id' => 900001, 'situacao' => ['id' => 21, 'valor' => 0], 'loja' => ['id' => 205009],
                     'itens' => [], 'total' => 1, 'frete' => 0]]),                                   // decisivo: o detalhe traz itens/valores diferentes — nada disso pode entrar
        '900002' => new BlingResposta(404, ['error' => ['type' => 'RESOURCE_NOT_FOUND']]),
        '900003' => new BlingResposta(200, ['data' => ['id' => 900004, 'situacao' => ['id' => 21], 'loja' => ['id' => 205009]]]),   // resposta de OUTRO pedido
        '900005' => new BlingResposta(503, []),
        '900006' => new BlingResposta(200, ['data' => ['id' => '900006', 'situacao' => ['id' => '21', 'valor' => 0]]]),             // sem loja: COALESCE preserva
        '999998' => new BlingResposta(200, ['data' => ['id' => 999998, 'situacao' => ['id' => 21], 'loja' => ['id' => 205000]]]),   // não existe na base
    ];
    $api4 = new BlingTransporteFalso();
    $api4->responder('pedidos/vendas/', static function ($m, $url) use (&$DET) {
        $id = (string) preg_replace('/\D.*$/', '', substr((string) strrchr((string) parse_url($url, PHP_URL_PATH), '/'), 1));
        return $DET[$id] ?? new BlingResposta(404, []);
    });
    $api4->responder('pedidos/vendas', new BlingResposta(200, ['data' => []]));   // listagem: NÃO pode ser chamada
    $sync4 = new BlingSyncService($repo, new BlingAuthService($repo, $api4));
    $pausas7 = []; $SONOS = [];
    $lista = ['900001', '900002', '900003', '900005', '900006', '999998'];
    $r7 = $sync4->releituraPedidosIds($conta, $lista, static fn() => false, static function (int $ms) use (&$pausas7): void { $pausas7[] = $ms; }, 1500);
    ok('com erro: situação concluida_com_erros (não "concluida")', $r7['situacao'] === 'concluida_com_erros', json_encode($r7));
    ok('contagens: 6 consultados, 2 atualizados, 1 ausente, 3 erros', $r7['consultados'] === 6 && $r7['atualizados'] === 2 && $r7['ausentes'] === 1 && $r7['erros'] === 3, json_encode($r7));
    ok('afetados = 404, resposta de outro pedido, 5xx', $r7['afetados_com_erro'] === ['900002', '900003', '900005'], json_encode($r7['afetados_com_erro']));
    ok('um GET por pedido, pelo id (listagem NUNCA chamada)', $api4->contar('pedidos/vendas?') === 0 && $api4->contar('pedidos/vendas/900001') === 1 && $api4->contar('pedidos/vendas/900006') === 1);
    ok('pausa de 1500 ms entre pedidos (5 pausas para 6)', $pausas7 === [1500, 1500, 1500, 1500, 1500], json_encode($pausas7));
    ok('5xx: o cliente tentou de novo com espera antes de desistir', $api4->contar('pedidos/vendas/900005') > 1 && $SONOS !== []);
    ok('nenhum POST/PUT/DELETE ao Bling', count(array_filter($api4->chamadas, static fn($c) => $c['metodo'] !== 'GET' && !str_contains($c['url'], 'oauth/token'))) === 0);
    ok('900001: situação 21 e loja 205009 gravadas', $sitDe('900001') === '21' && $lojaAntes('900001') === '205009');
    ok('900006: situação 21; loja ausente na resposta NÃO apagou a conhecida', $sitDe('900006') === '21' && $lojaAntes('900006') === $loja900006 && $loja900006 !== '');
    ok('com erro: 900002, 900003 e 900005 intocados (situação 15)', $sitDe('900002') === '15' && $sitDe('900003') === '15' && $sitDe('900005') === '15');
    ok('resposta de outro pedido não gravou no 900004', $sitDe('900004') === '15');
    ok('pedido fora da base não foi criado', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE bling_id = '999998'") === 0);
    $retratoDepois7 = $retrato();
    ok('DECISIVO: itens, valores, frete, total, hash e histórico do 900001 intactos', $retratoDepois7 === $retratoAntes7, json_encode(array_diff_assoc((array) $retratoDepois7['pedido'], (array) $retratoAntes7['pedido'])));
    ok('DECISIVO: checkpoint da releitura inteira NÃO foi tocado', $pdo->query("SELECT * FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'")->fetch() === $ckAntes);
    $errs = $pdo->query("SELECT bling_id FROM bling_sync_errors WHERE recurso = '" . BlingSyncService::RECURSO_RELEITURA . "' AND id > $E0 ORDER BY bling_id")->fetchAll(PDO::FETCH_COLUMN);
    ok('erros em bling_sync_errors com o recurso da releitura (o portão lista os afetados por ali)', $errs === ['900002', '900003', '900005'], json_encode($errs));
    $est7 = $repo->estadoSync($conta, BlingSyncService::RECURSO_REPROCESSO);
    ok('estado próprio do reprocesso: erros = 3, situação erro', $est7 && (int) $est7['erros'] === 3 && $est7['situacao'] === 'erro', json_encode($est7));
    $DET['900002'] = new BlingResposta(200, ['data' => ['id' => 900002, 'situacao' => ['id' => 21], 'loja' => ['id' => 205002]]]);
    $r7b = $sync4->releituraPedidosIds($conta, ['900002'], static fn() => false, static fn(int $ms) => null, 1500);
    ok('2ª rodada só com o afetado corrigido: concluida, 0 erro', $r7b['situacao'] === 'concluida' && $r7b['erros'] === 0 && $sitDe('900002') === '21', json_encode($r7b));
    $est7b = $repo->estadoSync($conta, BlingSyncService::RECURSO_REPROCESSO);
    ok('estado do reprocesso volta a ok com erros = 0 (não NULL)', $est7b['situacao'] === 'ok' && $est7b['erros'] !== null && (int) $est7b['erros'] === 0, json_encode($est7b));
    $r7c = $sync4->releituraPedidosIds($conta, ['900001', '900006'], static fn() => true, static fn(int $ms) => null, 1500);
    ok('parada a pedido entre pedidos: interrompida depois de 1', $r7c['situacao'] === 'interrompida' && $r7c['consultados'] === 1, json_encode($r7c));
    foreach ([[], ['SEM-ID'], ['900001', '900001'], ['0123'], [900001], array_map('strval', range(1, 1001))] as $ruim) {
        $chamou = count($api4->chamadas);
        try { $sync4->releituraPedidosIds($conta, $ruim, static fn() => false, static fn(int $ms) => null); $rec = false; } catch (InvalidArgumentException $e) { $rec = true; }
        ok('lista inválida recusada sem chamar o Bling: ' . mb_substr(json_encode($ruim), 0, 30), $rec && count($api4->chamadas) === $chamou);
    }

    echo "== 8. PARA-STATUS §132 (P2) · releitura inteira que termina COM erro não diz 'concluida'\n";
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $GLOBALS['PEDIDOS'][120] = ['numero' => 'sem-id', 'situacao' => ['id' => 15]];   // item sem id na listagem → erro daquele item
    $r8 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('situação concluida_com_erros, 1 erro', $r8['situacao'] === 'concluida_com_erros' && $r8['erros'] === 1, json_encode($r8));
    ok('checkpoint fica ok (a passada terminou) e o contador de erros = 1', ($e8 = $repo->estadoSync($conta, BlingSyncService::RECURSO_RELEITURA)) && $e8['situacao'] === 'ok' && (int) $e8['erros'] === 1);

    echo "== 9. script: --pedidos validado ANTES de qualquer coisa (rc 2, nada feito)\n";
    $script = $raiz . '/scripts/bling-releitura-situacao.php';
    ok("o portão detecta a opção ('pedidos:' no getopt)", str_contains((string) file_get_contents($script), "'pedidos:'"));
    $roda = static function (array $args): array {
        $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($GLOBALS['raiz'] . '/scripts/bling-releitura-situacao.php') . ' ' . implode(' ', array_map('escapeshellarg', $args)) . ' 2>&1';
        exec($cmd, $out, $rc); return [$rc, implode("\n", $out)];
    };
    $F = '--confirmo=RELER PEDIDOS DO BLING';
    [$rc, $o] = $roda(['--executar', $F, '--pedidos=900001,SEM-ID']);       ok('SEM-ID na lista → rc 2', $rc === 2 && str_contains($o, 'SEM-ID'), $o);
    [$rc, $o] = $roda(['--pedidos=900001']);                                ok('sem --executar → rc 2', $rc === 2 && str_contains($o, '--executar'), $o);
    [$rc, $o] = $roda(['--executar', $F, '--pedidos=']);                    ok('lista vazia → rc 2', $rc === 2, $o);
    [$rc, $o] = $roda(['--executar', $F, '--pedidos=' . implode(',', range(1, 1001))]); ok('1001 pedidos → rc 2', $rc === 2 && str_contains($o, '1000'), $o);
    [$rc, $o] = $roda(['--executar', $F, '--pedidos=1', '--pedidos=2']);    ok('--pedidos repetido → rc 2', $rc === 2, $o);
    [$rc, $o] = $roda(['--executar', '--pedidos=1']);                       ok('sem a frase → rc 2 (regra antiga continua)', $rc === 2 && str_contains($o, 'confirmo'), $o);

    echo "== 10. Codex DSHOW-113 (1) · argumentos validados ANTES de qualquer efeito; modos mutuamente exclusivos; P2 parada depois de erro\n";
    // caixa de areia: cópia do script com o marcador de parada e a trava DENTRO dela, sem .env e sem api/ — passar da validação = falha
    // ruidosa (rc ≠ 2) no 1º efeito (ler o .env); qualquer arquivo novo na caixa = efeito.
    $CX = trim((string) shell_exec('mktemp -d /srv/dshow-work/bling-args-teste.XXXXXX'));
    if (!preg_match('#^/srv/dshow-work/bling-args-teste\.[A-Za-z0-9]{6}$#', $CX) || !is_dir($CX)) { throw new RuntimeException('mktemp da caixa de areia falhou'); }
    try {
        mkdir("$CX/scripts");
        $src = (string) file_get_contents($script);
        $src = str_replace("'/var/lib/bling/releitura-situacao.parar'", var_export("$CX/marcador.parar", true), $src, $n1);
        $src = str_replace("'/var/lib/bling/releitura-situacao.lock'", var_export("$CX/trava.lock", true), $src, $n2);
        ok('caixa de areia: marcador e trava redirecionados (1 + 1 troca)', $n1 === 1 && $n2 === 1);
        file_put_contents("$CX/scripts/bling-releitura-situacao.php", $src);
        $listar = static fn(): array => array_values(array_diff(scandir($CX), ['.', '..']));
        $base = $listar();
        $caixa = static function (array $args) use ($CX): array {
            $cmd = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$CX/scripts/bling-releitura-situacao.php") . ' ' . implode(' ', array_map('escapeshellarg', $args)) . ' 2>&1';
            $out = []; exec($cmd, $out, $rc); return [$rc, implode("\n", $out)];
        };
        $F = '--confirmo=RELER PEDIDOS DO BLING';
        $mil = implode(',', range(1, 1000)); $milEum = implode(',', range(1, 1001));
        $ruins = [
            'parar + pedidos vazio (o caso do Codex)' => ['--parar', '--pedidos='],
            'parar + pedidos'                         => ['--parar', '--pedidos=900001'],
            'parar + executar'                        => ['--parar', '--executar', $F],
            'parar + situacoes'                       => ['--parar', '--situacoes'],
            'parar + conta'                           => ['--parar', '--conta=1'],
            'parar com valor'                         => ['--parar=agora'],
            'parar repetido'                          => ['--parar', '--parar'],
            'situacoes + executar'                    => ['--situacoes', '--executar', $F],
            'situacoes + pedidos'                     => ['--situacoes', '--pedidos=1'],
            'pedidos vazio'                           => ['--executar', $F, '--pedidos='],
            'pedidos só espaços'                      => ['--executar', $F, '--pedidos=  '],
            'pedidos sem ='                           => ['--executar', $F, '--pedidos'],
            'pedidos repetido (opção)'                => ['--executar', $F, '--pedidos=1', '--pedidos=2'],
            'pedidos com id repetido'                 => ['--executar', $F, '--pedidos=7,7'],
            'pedidos com item vazio'                  => ['--executar', $F, '--pedidos=1,,2'],
            'pedidos com SEM-ID'                      => ['--executar', $F, '--pedidos=900001,SEM-ID'],
            'pedidos com zero à esquerda'             => ['--executar', $F, '--pedidos=0123'],
            '1001 pedidos'                            => ['--executar', $F, "--pedidos=$milEum"],
            'pedidos sem executar'                    => ['--pedidos=1'],
            'executar sem frase'                      => ['--executar', '--pedidos=1'],
            'frase errada'                            => ['--executar', '--confirmo=sim', '--pedidos=1'],
            'confirmo sem executar'                   => [$F],
            'executar repetido'                       => ['--executar', '--executar', $F],
            'pausa vazia'                             => ['--executar', $F, '--pausa-ms='],
            'pausa não numérica'                      => ['--executar', $F, '--pausa-ms=1e3'],
            'pausa abaixo de 500'                     => ['--executar', $F, '--pausa-ms=499'],
            'pausa sem executar'                      => ['--pausa-ms=1500'],
            'conta vazia'                             => ['--conta='],
            'conta zero'                              => ['--conta=0'],
            'opção desconhecida'                      => ['--tudo'],
            'argumento solto'                         => ['pedidos'],
            'forma com espaço (só --x=valor)'         => ['--executar', $F, '--pedidos', '900001'],
        ];
        foreach ($ruins as $nome => $args) {
            [$rc, $o] = $caixa($args);
            ok("rc 2, zero efeitos: $nome", $rc === 2 && str_contains($o, 'nada feito') && $listar() === $base, "rc=$rc " . mb_substr($o, 0, 140));
        }
        [$rc, $o] = $caixa(['--parar', '--pedidos=']);
        ok('DECISIVO: "--parar --pedidos=" não cria o marcador e sai com 2 (antes: criava e saía com 0)', $rc === 2 && !is_file("$CX/marcador.parar"), "rc=$rc");
        // válidos: passam da validação e param no 1º efeito da caixa (sem .env) — rc ≠ 2 e sem "nada feito"
        foreach (['1000 pedidos' => ['--executar', $F, "--pedidos=$mil"], 'releitura inteira' => ['--executar', $F, '--pausa-ms=500', '--conta=1'],
                  'situacoes + conta' => ['--situacoes', '--conta=1'], 'contagem' => []] as $nome => $args) {
            [$rc, $o] = $caixa($args);
            ok("válido passa da validação: $nome", $rc !== 2 && !str_contains($o, 'nada feito'), "rc=$rc " . mb_substr($o, 0, 100));
        }
        [$rc, $o] = $caixa(['--parar']);
        ok('--parar sozinho: rc 0 e cria SÓ o marcador (o portão usa assim)', $rc === 0 && $listar() === (static function (array $x): array { sort($x); return $x; })(array_merge($base, ['marcador.parar'])), "rc=$rc " . json_encode($listar()));
    } finally {
        if (preg_match('#^/srv/dshow-work/bling-args-teste\.[A-Za-z0-9]{6}$#', $CX)) { shell_exec('rm -rf -- ' . escapeshellarg($CX)); }
    }

    // P2 no serviço: erro seguido de parada voluntária = falha, nos dois caminhos
    $DET['900003'] = new BlingResposta(503, []);
    $r10 = $sync4->releituraPedidosIds($conta, ['900003', '900001', '900006'], static fn() => true, static fn(int $ms) => null, 1500);
    ok('P2 --pedidos: erro no 1º e parada → interrompida_com_erros (não "interrompida")', $r10['situacao'] === 'interrompida_com_erros' && $r10['erros'] === 1 && $r10['consultados'] === 1, json_encode($r10));
    $e10 = $repo->estadoSync($conta, BlingSyncService::RECURSO_REPROCESSO);
    ok('P2 --pedidos: estado do reprocesso = erro (o portão conta erros por ali)', $e10['situacao'] === 'erro' && (int) $e10['erros'] === 1, json_encode($e10));
    $r10b = $sync4->releituraPedidosIds($conta, ['900001', '900006'], static fn() => true, static fn(int $ms) => null, 1500);
    ok('P2 --pedidos: parada SEM erro continua interrompida (sucesso) e estado parcial', $r10b['situacao'] === 'interrompida' && $repo->estadoSync($conta, BlingSyncService::RECURSO_REPROCESSO)['situacao'] === 'parcial', json_encode($r10b));
    $pdo->exec("DELETE FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'");   // releitura nova (tabela do próprio teste)
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $GLOBALS['PEDIDOS'][40] = ['numero' => 'sem-id', 'situacao' => ['id' => 15]];   // erro na 1ª página
    $r10c = $sync->releituraPedidos($conta, static fn() => true, static fn(int $ms) => null, 1500);
    ok('P2 releitura inteira: erro na página e parada → interrompida_com_erros', $r10c['situacao'] === 'interrompida_com_erros' && $r10c['erros'] === 1 && $r10c['paginas'] === 1, json_encode($r10c));
    ok('P2 releitura inteira: checkpoint continua parcial (rodar de novo retoma)', ($e10c = $repo->estadoSync($conta, BlingSyncService::RECURSO_RELEITURA)) && $e10c['situacao'] === 'parcial' && (int) $e10c['pagina_atual'] === 1, json_encode($e10c));

    echo "== 11. revisão da ACIMA_ESQUERDA (24/11) · achado 4 (--conta) e pergunta 6 (reprocesso com sucesso não fica como afetado)\n";
    $E6 = (int) $pdo->query('SELECT COALESCE(MAX(id),0) FROM bling_sync_errors')->fetchColumn();
    $DET['900003'] = new BlingResposta(200, ['data' => ['id' => 900003, 'situacao' => ['id' => 21], 'loja' => ['id' => 205003]]]);
    $r11 = $sync4->releituraPedidosIds($conta, ['900003'], static fn() => false, static fn(int $ms) => null, 1500);
    ok('6) o afetado de antes (900003) reprocessado com sucesso: concluida, 0 erro', $r11['situacao'] === 'concluida' && $r11['erros'] === 0, json_encode($r11));
    ok('6) nenhuma linha NOVA de erro → o fechamento (erros depois da marca do reprocesso) não o lista mais', (int) $pdo->query("SELECT COUNT(*) FROM bling_sync_errors WHERE id > $E6")->fetchColumn() === 0);
    ok('6) contador do reprocesso = 0 e estado ok (o que o fechamento lê em releitura_situacao_pedidos)', ($e11 = $repo->estadoSync($conta, BlingSyncService::RECURSO_REPROCESSO)) && (int) $e11['erros'] === 0 && $e11['situacao'] === 'ok');
    $cp = $sync->contaParaReleitura(null, true);
    ok('4) sem --conta e 1 conta ativa com token: escolhe a conta', ($cp['conta'] ?? null) === $conta, json_encode($cp));
    ok('4) --conta = a conta ativa: aceita', ($sync->contaParaReleitura($conta, true)['conta'] ?? null) === $conta);
    $cx = $sync->contaParaReleitura(987654, true);
    ok('4) --conta inexistente: erro claro (antes: rc 255 com stack trace)', isset($cx['erro']) && str_contains($cx['erro'], '987654') && str_contains($cx['erro'], 'ativa'), json_encode($cx));
    $tok = $pdo->query("SELECT * FROM bling_oauth_tokens WHERE account_id = $conta")->fetchAll();
    $pdo->exec("DELETE FROM bling_oauth_tokens WHERE account_id = $conta");   // tabela do próprio teste
    $cs = $sync->contaParaReleitura($conta, true);
    ok('4) conta sem token, modo que vai ao Bling: erro claro', isset($cs['erro']) && str_contains($cs['erro'], 'token'), json_encode($cs));
    ok('4) conta sem token, só contagem (não vai ao Bling): aceita', ($sync->contaParaReleitura($conta, false)['conta'] ?? null) === $conta);
    foreach ($tok as $t) { $cols = array_keys($t); $pdo->prepare('INSERT INTO bling_oauth_tokens (`' . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')->execute(array_values($t)); }
    $pdo->exec("UPDATE bling_oauth_tokens SET access_token_enc = 'lixo-sintetico' WHERE account_id = $conta");
    ok('4) só o access ilegível (o refresh ainda renova): aceita', ($sync->contaParaReleitura($conta, true)['conta'] ?? null) === $conta);
    $pdo->exec("UPDATE bling_oauth_tokens SET refresh_token_enc = 'lixo-sintetico' WHERE account_id = $conta");
    $ci = $sync->contaParaReleitura($conta, true);
    ok('4) access E refresh ilegíveis: erro claro (sem exceção)', isset($ci['erro']) && str_contains($ci['erro'], 'ilegível'), json_encode($ci));
    $pdo->exec("UPDATE bling_accounts SET is_ativo = 0 WHERE id = $conta");
    $cn = $sync->contaParaReleitura($conta, false);
    ok('4) conta INATIVA com --conta: erro (a guarda de conta ativa não é mais pulada)', isset($cn['erro']), json_encode($cn));
    $pdo->exec("UPDATE bling_accounts SET is_ativo = 1 WHERE id = $conta");
    $src = (string) file_get_contents($script);
    $pConta = strpos($src, '$sync->contaParaReleitura('); $pTrava = strpos($src, "fopen('/var/lib/bling/releitura-situacao.lock'"); $pMarca = strpos($src, '@unlink(ARQ_PARAR)');
    ok('4) no script a conta é conferida ANTES da trava e de apagar o marcador antigo (zero efeitos), com rc 2', $pConta !== false && $pTrava !== false && $pMarca !== false
        && $pConta < $pTrava && $pConta < $pMarca && (bool) preg_match('/if \(isset\(\$escolha\[\'erro\'\]\)\) \{[^}]*exit\(2\);/', $src));
    ok('4) todas as chamadas ao Bling no script passam pelo envoltório (sem stack trace)', substr_count($src, '$comBling(static fn() => $sync->') === 3);

    echo "== 12. Codex DSHOW-114 (P6.1) · loja.id ausente, ilegível, 0 e \"0\" NUNCA trocam a loja conhecida; id positivo válido atualiza — geral e seletivo\n";
    $pdo->exec("DELETE FROM bling_oauth_tokens WHERE account_id = $conta");   // a seção 11 deixou os tokens SINTÉTICOS ilegíveis: repõe os do começo
    foreach ($tok as $t) { $cols = array_keys($t); $pdo->prepare('INSERT INTO bling_oauth_tokens (`' . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')->execute(array_values($t)); }
    $variantes = ['ausente' => null, 'ilegivel' => ['id' => 'abc'], 'zero-numerico' => ['id' => 0], 'zero-texto' => ['id' => '0'], 'valida' => ['id' => 205777]];
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $alvosG = []; $k = 0;
    foreach ($variantes as $nome => $loja) {   // modo GERAL: pedidos 900031..900035 com situação 22 (para haver o que gravar)
        $i = 31 + $k++; $alvosG[$nome] = (string) (900000 + $i);
        $GLOBALS['PEDIDOS'][$i - 1]['situacao'] = ['id' => 22, 'valor' => 0];
        if ($loja === null) { unset($GLOBALS['PEDIDOS'][$i - 1]['loja']); } else { $GLOBALS['PEDIDOS'][$i - 1]['loja'] = $loja; }
    }
    $lojaG = []; foreach ($alvosG as $nome => $b) { $lojaG[$nome] = $lojaAntes($b); }
    $api->responder('pedidos/vendas', static fn($m, $url) => $paginaDe($GLOBALS['PEDIDOS'], $url));
    $pdo->exec("DELETE FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'");   // releitura nova do zero
    $r12 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('geral: releitura concluída', $r12['situacao'] === 'concluida', json_encode($r12));
    foreach (['ausente', 'ilegivel', 'zero-numerico', 'zero-texto'] as $nome) {
        ok("geral, loja $nome: loja conhecida PRESERVADA (situação 22 gravada)", $lojaAntes($alvosG[$nome]) === $lojaG[$nome] && $lojaG[$nome] !== ''
            && $sitDe($alvosG[$nome]) === '22', $alvosG[$nome] . ': ' . $lojaG[$nome] . ' → ' . $lojaAntes($alvosG[$nome]));
    }
    ok('geral, loja válida 205777: atualiza', $lojaAntes($alvosG['valida']) === '205777');
    $alvosS = []; $k = 0;
    foreach ($variantes as $nome => $loja) {   // modo SELETIVO (--pedidos): 900041..900045
        $b = (string) (900041 + $k++); $alvosS[$nome] = $b;
        $dado = ['id' => (int) $b, 'situacao' => ['id' => 23, 'valor' => 0]] + ($loja === null ? [] : ['loja' => $loja]);
        $DET[$b] = new BlingResposta(200, ['data' => $dado]);
    }
    $lojaS = []; foreach ($alvosS as $nome => $b) { $lojaS[$nome] = $lojaAntes($b); }
    $r12s = $sync4->releituraPedidosIds($conta, array_values($alvosS), static fn() => false, static fn(int $ms) => null, 1500);
    ok('seletivo: concluída, 5 atualizados (situação 23)', $r12s['situacao'] === 'concluida' && $r12s['atualizados'] === 5, json_encode($r12s));
    foreach (['ausente', 'ilegivel', 'zero-numerico', 'zero-texto'] as $nome) {
        ok("seletivo, loja $nome: loja conhecida PRESERVADA", $lojaAntes($alvosS[$nome]) === $lojaS[$nome] && $lojaS[$nome] !== '' && $sitDe($alvosS[$nome]) === '23',
            $alvosS[$nome] . ': ' . $lojaS[$nome] . ' → ' . $lojaAntes($alvosS[$nome]));
    }
    ok('seletivo, loja válida 205777: atualiza', $lojaAntes($alvosS['valida']) === '205777');
    ok('nenhuma loja "0" gravada em lugar nenhum', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE loja_bling_id = '0'") === 0);

    echo "== 13. revisão da ACIMA_ESQUERDA (P6.1, 24/11) · situacao.id ausente, ilegível, 0 e \"0\" NUNCA trocam a situação conhecida — geral, seletivo e sincronização normal\n";
    $varSit = ['ausente' => null, 'ilegivel' => 'abc', 'zero-numerico' => 0, 'zero-texto' => '0', 'valida' => 24];
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $alvosG = []; $k = 0;
    foreach ($varSit as $nome => $sid) {   // GERAL: 900051..900055, loja nova 205888 (para haver o que gravar)
        $i = 51 + $k++; $alvosG[$nome] = (string) (900000 + $i);
        $GLOBALS['PEDIDOS'][$i - 1]['loja'] = ['id' => 205888];
        if ($sid === null) { unset($GLOBALS['PEDIDOS'][$i - 1]['situacao']['id']); } else { $GLOBALS['PEDIDOS'][$i - 1]['situacao']['id'] = $sid; }
    }
    $sitG = []; foreach ($alvosG as $nome => $b) { $sitG[$nome] = $sitDe($b); }
    $api->responder('pedidos/vendas', static fn($m, $url) => $paginaDe($GLOBALS['PEDIDOS'], $url));
    $pdo->exec("DELETE FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'");
    $r13 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('geral: releitura concluída', $r13['situacao'] === 'concluida', json_encode($r13));
    foreach (['ausente', 'ilegivel', 'zero-numerico', 'zero-texto'] as $nome) {
        ok("geral, situação $nome: situação conhecida PRESERVADA (loja 205888 gravada)", $sitDe($alvosG[$nome]) === $sitG[$nome] && $sitG[$nome] !== ''
            && $sitG[$nome] !== '0' && $lojaAntes($alvosG[$nome]) === '205888', $alvosG[$nome] . ': ' . $sitG[$nome] . ' → ' . $sitDe($alvosG[$nome]));
    }
    ok('geral, situação válida 24: atualiza', $sitDe($alvosG['valida']) === '24');
    $alvosS = []; $k = 0;
    foreach ($varSit as $nome => $sid) {   // SELETIVO (--pedidos): 900061..900065, loja nova 205999
        $b = (string) (900061 + $k++); $alvosS[$nome] = $b;
        $dado = ['id' => (int) $b, 'loja' => ['id' => 205999], 'situacao' => ['valor' => 0] + ($sid === null ? [] : ['id' => $sid])];
        $DET[$b] = new BlingResposta(200, ['data' => $dado]);
    }
    $sitS = []; foreach ($alvosS as $nome => $b) { $sitS[$nome] = $sitDe($b); }
    $r13s = $sync4->releituraPedidosIds($conta, array_values($alvosS), static fn() => false, static fn(int $ms) => null, 1500);
    ok('seletivo: concluída, 5 atualizados (loja 205999)', $r13s['situacao'] === 'concluida' && $r13s['atualizados'] === 5, json_encode($r13s));
    foreach (['ausente', 'ilegivel', 'zero-numerico', 'zero-texto'] as $nome) {
        ok("seletivo, situação $nome: situação conhecida PRESERVADA", $sitDe($alvosS[$nome]) === $sitS[$nome] && $sitS[$nome] !== '' && $sitS[$nome] !== '0'
            && $lojaAntes($alvosS[$nome]) === '205999', $alvosS[$nome] . ': ' . $sitS[$nome] . ' → ' . $sitDe($alvosS[$nome]));
    }
    ok('seletivo, situação válida 24: atualiza', $sitDe($alvosS['valida']) === '24');
    // sincronização NORMAL (mesma regra): 900071 com situação "0" e 900072 com 0 na listagem não apagam a conhecida
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $GLOBALS['PEDIDOS'][70]['situacao']['id'] = '0'; $GLOBALS['PEDIDOS'][71]['situacao']['id'] = 0;
    $GLOBALS['PEDIDOS'][70]['total'] = $GLOBALS['PEDIDOS'][70]['totalProdutos'] = 777.01; $GLOBALS['PEDIDOS'][71]['total'] = $GLOBALS['PEDIDOS'][71]['totalProdutos'] = 777.02;   // muda o hash → o pedido é regravado
    $sn71 = $sitDe('900071'); $sn72 = $sitDe('900072');
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 't13-normal');
    ok('normal: pedidos regravados (total novo)', (string) v($pdo, 'SELECT total FROM bling_sales_orders WHERE bling_id = ?', ['900071']) === '777.01'
        && (string) v($pdo, 'SELECT total FROM bling_sales_orders WHERE bling_id = ?', ['900072']) === '777.02');
    ok('normal, situação "0" e 0: situação conhecida PRESERVADA', $sitDe('900071') === $sn71 && $sitDe('900072') === $sn72 && $sn71 !== '' && $sn71 !== '0',
        "$sn71 → " . $sitDe('900071') . "; $sn72 → " . $sitDe('900072'));
    ok('nenhuma situação "0" gravada em lugar nenhum', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE situacao_bling_id = '0'") === 0);

    echo "== 14. Codex DSHOW-115 (P6.1) · valor BRUTO validado antes de qualquer coerção — booleano, float, array, vazio, \"0\", \"01\", espaço… preservam; id válido atualiza — normal, geral e seletivo\n";
    $ruins = ['true' => true, 'false' => false, 'float-1' => 1.0, 'float-id' => 205777.0, 'array-vazio' => [], 'array' => ['205777'], 'vazio' => '', 'zero-texto' => '0',
              'zero-esquerda' => '01', 'espaco' => ' 205777', 'negativo' => -3, 'zero' => 0];
    $bons = ['int' => 205991, 'texto' => '205992'];
    $variantes14 = $ruins + $bons;
    $preparar = static function (array $ids) use ($pdo): void {   // ids conhecidos: loja 205000, situação 15
        $st = $pdo->prepare("UPDATE bling_sales_orders SET loja_bling_id = '205000', situacao_bling_id = '15' WHERE bling_id = ?");
        foreach ($ids as $b) { $st->execute([$b]); }
    };
    $conferir = static function (string $modo, array $alvos) use ($ruins, $bons, $sitDe, $lojaAntes): void {
        foreach ($ruins as $nome => $_) {
            ok("$modo, $nome: loja 205000 e situação 15 PRESERVADAS", $lojaAntes($alvos[$nome]) === '205000' && $sitDe($alvos[$nome]) === '15',
                $alvos[$nome] . ': loja ' . $lojaAntes($alvos[$nome]) . ', situação ' . $sitDe($alvos[$nome]));
        }
        foreach ($bons as $nome => $v) {
            ok("$modo, id válido ($nome $v): loja e situação ATUALIZADAS", $lojaAntes($alvos[$nome]) === (string) $v && $sitDe($alvos[$nome]) === (string) $v,
                $alvos[$nome] . ': loja ' . $lojaAntes($alvos[$nome]) . ', situação ' . $sitDe($alvos[$nome]));
        }
    };
    // (a) SINCRONIZAÇÃO NORMAL (listagem → gravarPedido): pedidos 900101..
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $alvosN = []; $k = 0;
    foreach ($variantes14 as $nome => $v) {
        $i = 101 + $k++; $alvosN[$nome] = (string) (900000 + $i);
        $GLOBALS['PEDIDOS'][$i - 1]['situacao'] = ['id' => $v, 'valor' => 0]; $GLOBALS['PEDIDOS'][$i - 1]['loja'] = ['id' => $v];
        $GLOBALS['PEDIDOS'][$i - 1]['total'] = $GLOBALS['PEDIDOS'][$i - 1]['totalProdutos'] = 3000 + $i;   // muda o hash → regrava
    }
    $preparar(array_values($alvosN));
    $api->responder('pedidos/vendas', static fn($m, $url) => $paginaDe($GLOBALS['PEDIDOS'], $url));
    $sync->sincronizar($conta, 'pedidos', 'carga_inicial', 't14-normal');
    ok('normal: pedidos regravados (total novo)', (string) v($pdo, 'SELECT total FROM bling_sales_orders WHERE bling_id = ?', [$alvosN['true']]) === '3101.00'
        || (float) v($pdo, 'SELECT total FROM bling_sales_orders WHERE bling_id = ?', [$alvosN['true']]) === 3101.0);
    $conferir('normal', $alvosN);
    // (b) RELEITURA GERAL (listagem → gravarSituacaoLoja): pedidos 900121..
    $GLOBALS['PEDIDOS'] = pedidosFalsos(250, static fn(int $i) => 15);
    $alvosG = []; $k = 0;
    foreach ($variantes14 as $nome => $v) {
        $i = 121 + $k++; $alvosG[$nome] = (string) (900000 + $i);
        $GLOBALS['PEDIDOS'][$i - 1]['situacao'] = ['id' => $v, 'valor' => 0]; $GLOBALS['PEDIDOS'][$i - 1]['loja'] = ['id' => $v];
    }
    $preparar(array_values($alvosG));
    $pdo->exec("DELETE FROM bling_sync_state WHERE account_id = $conta AND recurso = '" . BlingSyncService::RECURSO_RELEITURA . "'");
    $r14 = $sync->releituraPedidos($conta, static fn() => false, static fn(int $ms) => null, 1500);
    ok('geral: releitura concluída', $r14['situacao'] === 'concluida', json_encode($r14));
    $conferir('geral', $alvosG);
    // (c) RELEITURA DE PEDIDOS (--pedidos, detalhe → gravarSituacaoLoja): pedidos 900141..
    $alvosS = []; $k = 0;
    foreach ($variantes14 as $nome => $v) {
        $b = (string) (900141 + $k++); $alvosS[$nome] = $b;
        $DET[$b] = new BlingResposta(200, ['data' => ['id' => (int) $b, 'situacao' => ['id' => $v, 'valor' => 0], 'loja' => ['id' => $v]]]);
    }
    $preparar(array_values($alvosS));
    $r14s = $sync4->releituraPedidosIds($conta, array_values($alvosS), static fn() => false, static fn(int $ms) => null, 1500);
    ok('seletivo: concluída', $r14s['situacao'] === 'concluida', json_encode($r14s));
    $conferir('seletivo', $alvosS);
    ok('nenhuma loja/situação "1" vinda de booleano em lugar nenhum', n($pdo, "SELECT COUNT(*) FROM bling_sales_orders WHERE loja_bling_id = '1' OR situacao_bling_id = '1'") === 0);
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
