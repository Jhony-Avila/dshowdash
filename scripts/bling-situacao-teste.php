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
    $antes = $sync->contagemSituacao($conta);
    ok('contagem ANTES: 0 com id (a loja já veio no passo 2)', $antes['com_situacao_id'] === 0 && $antes['com_loja'] === 250 && $antes['pedidos'] === 250);
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
    ok('hash mudou 1x (por isso a releitura grava)', (string) v($pdo, 'SELECT payload_hash FROM bling_sales_orders WHERE bling_id = ?', ['900001']) !== $hashAntes);
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
