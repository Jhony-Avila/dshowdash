<?php
declare(strict_types=1);
// scripts/bling-escopo-ausente-teste.php — BLING-ESCOPO-AUSENTE (23/11/2026)
//
//     BLING_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> BLING_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/bling-escopo-ausente-teste.php
//
// Prova que um 403 `insufficient_scope` (o token não tem o escopo do recurso, ex.: canais de venda) NÃO vira mais o laço
// "erro → reagenda → DLQ → devolve 50/h": registra UMA vez, marca o recurso em 'atencao' e só tenta de novo 1 vez por dia ou logo
// depois de a conta ser reautorizada. Um 403 que NÃO é de escopo continua com o comportamento antigo (erro → reagenda).
//
// SEGURANÇA: só roda num banco cujo nome casa ^ATRWEB_VAL_T_[0-9]+$ (base de validação); recusa se já houver qualquer tabela bling_*
// nele; cria só as tabelas de que precisa (DDL de docs/BLING/02-banco-BLING.sql) e as remove no fim, mesmo em falha. NUNCA lê .env:
// a chave de cifra e o cliente OAuth são SINTÉTICOS deste teste; a API do Bling é um transporte FALSO (nenhuma chamada de rede).

$raiz = dirname(__DIR__);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('BLING_ENTRADA', true);   // a mesma entrada do worker (as libs recusam inclusão sem ela)
foreach (['lib/BlingSituacoes', 'lib/BlingCrypto', 'lib/BlingTransporte', 'lib/BlingOAuth', 'lib/BlingVersionAdapter', 'lib/BlingNormalizer',
          'repositories/BlingRepository', 'lib/BlingClient', 'services/BlingAuthService', 'services/BlingSyncService', 'services/BlingQueueService',
          'lib/BlingProviderBase', 'lib/BlingProvider', 'lib/BlingReal'] as $f) {
    require_once $raiz . '/api/bling/' . $f . '.php';
}

$cnf = (string) getenv('BLING_TESTE_CNF');
$db  = (string) getenv('BLING_TESTE_DB');
if ($cnf === '' || !is_file($cnf) || !preg_match('/^ATRWEB_VAL_T_[0-9]+$/', $db)) {
    fwrite(STDERR, "[ERRO] defina BLING_TESTE_CNF (arquivo existente) e BLING_TESTE_DB=ATRWEB_VAL_T_<n> — ABORTADO, nada feito\n");
    exit(2);
}
// seção [client] do arquivo de opções, lida em memória (valores NUNCA impressos) — o mesmo padrão dos testes do app
$cli = []; $sec = '';
foreach (preg_split('/\r?\n/', (string) file_get_contents($cnf)) as $l) {
    $l = trim($l);
    if ($l === '' || $l[0] === '#' || $l[0] === ';') { continue; }
    if (preg_match('/^\[(.+)\]$/', $l, $m)) { $sec = trim($m[1]); continue; }
    if ($sec !== 'client' || !str_contains($l, '=')) { continue; }
    [$k, $v] = explode('=', $l, 2);
    $cli[trim($k)] = trim(trim($v), "\"'");
}
$dsn = isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306);
$pdo = new PDO($dsn . ';dbname=' . $db . ';charset=utf8mb4', $cli['user'] ?? '', $cli['password'] ?? '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
unset($cli);
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { fwrite(STDERR, "[ERRO] banco conectado difere — ABORTADO\n"); exit(2); }
$existentes = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn();
if ($existentes > 0) { fwrite(STDERR, "[ERRO] $db já tem $existentes tabela(s) bling_* — não mexo no que não criei. ABORTADO\n"); exit(2); }

// segredos SINTÉTICOS (nunca do .env)
foreach (['BLING_CRYPTO_KEY' => str_repeat('5e', 32), 'BLING_CLIENT_ID' => 'teste-sintetico-client', 'BLING_CLIENT_SECRET' => 'teste-sintetico-secret',
          'BLING_REDIRECT_URI' => 'https://exemplo.invalid/api/bling/oauth/callback'] as $k => $v) { putenv("$k=$v"); $_ENV[$k] = $v; }
$SONOS = [];
BlingClient::$dormirParaTeste = static function (int $ms) use (&$SONOS): void { $SONOS[] = $ms; };

$TABELAS = ['bling_accounts', 'bling_oauth_states', 'bling_oauth_tokens', 'bling_sales_channels', 'bling_sync_state', 'bling_sync_jobs',
            'bling_sync_errors', 'bling_queue', 'bling_audit_logs', 'bling_contacts', 'bling_sales_orders', 'bling_sales_order_items',
            'bling_sales_order_status_history'];
$ddl = (string) file_get_contents($raiz . '/docs/BLING/02-banco-BLING.sql');
$criadas = [];
$falhas = 0; $total = 0;
function ok(string $nome, bool $cond, string $det = ''): void {
    global $falhas, $total; $total++;
    if (!$cond) { $falhas++; }
    echo ($cond ? 'ok    ' : 'FALHA ') . $nome . ($det !== '' ? "  ($det)" : '') . "\n";
}
function n(PDO $p, string $sql, array $a = []): int { $s = $p->prepare($sql); $s->execute($a); return (int) $s->fetchColumn(); }

try {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($TABELAS as $t) {
        // bloco = do "CREATE TABLE IF NOT EXISTS <t> (" até o ";" que fecha a linha ") ENGINE…" (comentários internos têm aspas e parênteses)
        $ini = strpos($ddl, "CREATE TABLE IF NOT EXISTS $t (");
        $eng = $ini === false ? false : strpos($ddl, "\n) ENGINE", $ini);
        $fim = $eng === false ? false : strpos($ddl, ';', $eng);
        if ($fim === false) { throw new RuntimeException("DDL de $t não encontrada"); }
        $pdo->exec('CREATE TABLE ' . substr($ddl, $ini + strlen('CREATE TABLE IF NOT EXISTS '), $fim - $ini - strlen('CREATE TABLE IF NOT EXISTS ')));
        $criadas[] = $t;
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    $repo = new BlingRepository($pdo);
    $api = new BlingTransporteFalso();
    $api->responder('oauth/token', new BlingResposta(200, ['access_token' => 'acesso-sintetico', 'refresh_token' => 'refresh-sintetico',
        'expires_in' => 3600, 'token_type' => 'Bearer']));
    $escopo403 = new BlingResposta(403, ['error' => ['type' => 'insufficient_scope', 'message' => 'insufficient_scope',
        'description' => 'The request requires higher privileges than provided by the access token']]);
    $api->responder('canais-venda', $escopo403);
    $auth = new BlingAuthService($repo, $api);
    $conecta = static function () use ($auth): int {
        $url = $auth->iniciarConexao(75, '#/panel-bling');
        parse_str((string) parse_url($url, PHP_URL_QUERY), $q);
        return (int) $auth->concluirConexao('codigo-sintetico', (string) $q['state'], ['nome' => 'Conta de teste', 'cnpj' => '00000000000191'])['account_id'];
    };
    $conta = $conecta();
    $sync = new BlingSyncService($repo, $auth);
    $fila = new BlingQueueService($repo, $sync);
    $chamadas = static fn(): int => $api->contar('canais-venda');
    $erros = static fn(string $codigo) => n($pdo, 'SELECT COUNT(*) FROM bling_sync_errors WHERE codigo = ?', [$codigo]);

    echo "== 1. primeiro 403 insufficient_scope\n";
    $r = $sync->sincronizar($conta, 'canais', 'incremental', 'teste-1');
    $st = $repo->estadoSync($conta, 'canais');
    ok('devolve escopo_ausente (não "erro")', $r['situacao'] === 'escopo_ausente', $r['situacao']);
    ok('estado atencao, retry 0', $st['situacao'] === 'atencao' && (int) $st['retry'] === 0);
    $espera = strtotime($st['proxima_execucao_em'] . ' UTC') - time();
    ok('próxima tentativa em ~24 h', $espera > 86000 && $espera <= 86400, "{$espera}s");
    ok('UM erro ESCOPO_AUSENTE', $erros('ESCOPO_AUSENTE') === 1);
    ok('nenhum SYNC_FALHOU', $erros('SYNC_FALHOU') === 0);
    ok('job cancelado (não "falhou")', n($pdo, "SELECT COUNT(*) FROM bling_sync_jobs WHERE recurso = 'canais' AND situacao = 'cancelado'") === 1
        && n($pdo, "SELECT COUNT(*) FROM bling_sync_jobs WHERE situacao = 'falhou'") === 0);
    ok('1 chamada ao Bling', $chamadas() === 1);

    echo "== 2. repetir (webhook, DLQ, reconciliação) dentro da espera\n";
    $jobs = n($pdo, 'SELECT COUNT(*) FROM bling_sync_jobs');
    for ($i = 0; $i < 5; $i++) { $r = $sync->sincronizar($conta, 'canais', $i % 2 ? 'reconciliacao' : 'incremental', "teste-2-$i"); }
    ok('continua escopo_ausente', $r['situacao'] === 'escopo_ausente');
    ok('NENHUMA chamada nova ao Bling', $chamadas() === 1, (string) $chamadas());
    ok('nenhum erro novo', $erros('ESCOPO_AUSENTE') === 1 && n($pdo, 'SELECT COUNT(*) FROM bling_sync_errors') === 2, 'ESCOPO_AUSENTE + o HTTP_403 do cliente');
    ok('nenhum job novo', n($pdo, 'SELECT COUNT(*) FROM bling_sync_jobs') === $jobs);

    echo "== 3. fila: item de canais (inclusive vindo da DLQ) conclui, sem reagendar nem DLQ\n";
    $repo->enfileirar($conta, 'sync', 'canais', null, ['estrategia' => 'incremental', 'correlation_id' => 'teste-3'], 30);
    $pdo->exec("INSERT INTO bling_queue (account_id, tipo, recurso, payload, prioridade, situacao, tentativas, max_tentativas, disponivel_em, criado_em, atualizado_em)
                SELECT account_id, tipo, recurso, payload, prioridade, 'dlq', max_tentativas, max_tentativas, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP() FROM bling_queue LIMIT 1");
    $fila->reprocessarDlq(50, null);
    $d = $fila->drenar(50, 30);
    ok('2 processados, 2 concluídos, 0 reagendados, 0 DLQ', $d['processados'] === 2 && $d['concluidos'] === 2 && ($d['reagendados'] ?? 0) === 0 && ($d['dlq'] ?? 0) === 0,
        json_encode($d));
    ok('fila vazia de canais pendentes/DLQ', n($pdo, "SELECT COUNT(*) FROM bling_queue WHERE situacao IN ('pendente','dlq','falhou')") === 0);
    ok('ainda 1 chamada ao Bling', $chamadas() === 1);

    echo "== 4. tentativa diária (a espera venceu)\n";
    $pdo->exec("UPDATE bling_sync_state SET proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE recurso = 'canais'");
    $r = $sync->sincronizar($conta, 'canais', 'incremental', 'teste-4');
    ok('tenta de novo (2ª chamada) e volta a marcar', $chamadas() === 2 && $r['situacao'] === 'escopo_ausente');
    ok('um registro por tentativa diária (2 no total)', $erros('ESCOPO_AUSENTE') === 2);

    echo "== 5. reautorização libera na hora; com o escopo, sincroniza\n";
    $api->responder('canais-venda', new BlingResposta(200, ['data' => []]));
    $conta2 = $conecta();
    ok('mesma conta reconectada', $conta2 === $conta, "$conta2");
    $prox = strtotime($repo->estadoSync($conta, 'canais')['proxima_execucao_em'] . ' UTC');
    ok('proxima_execucao_em = agora (liberado)', $prox <= time() + 1);
    ok('auditoria da liberação', n($pdo, "SELECT COUNT(*) FROM bling_audit_logs WHERE acao = 'sync.liberar_escopo_ausente'") === 1);
    $r = $sync->sincronizar($conta, 'canais', 'incremental', 'teste-5');
    ok('sincroniza OK com o escopo', $r['situacao'] === 'ok' && $chamadas() === 3, $r['situacao']);
    ok('sem nova marca', $erros('ESCOPO_AUSENTE') === 2 && $repo->estadoSync($conta, 'canais')['situacao'] === 'ok');

    echo "== 6. 403 que NÃO é de escopo mantém o comportamento antigo\n";
    $api->responder('pedidos/vendas', new BlingResposta(403, ['error' => ['type' => 'forbidden', 'message' => 'use api.bling.com.br']]));
    $r = $sync->sincronizar($conta, 'pedidos', 'incremental', 'teste-6');
    ok('devolve erro', $r['situacao'] === 'erro');
    ok('estado erro, SYNC_FALHOU registrado', $repo->estadoSync($conta, 'pedidos')['situacao'] === 'erro' && $erros('SYNC_FALHOU') === 1);
    $repo->enfileirar($conta, 'sync', 'pedidos', null, ['estrategia' => 'incremental', 'correlation_id' => 'teste-6'], 30);
    $d = $fila->drenar(10, 30);
    ok('a fila REAGENDA como antes', ($d['reagendados'] ?? 0) + ($d['dlq'] ?? 0) === 1, json_encode($d));
    ok('ehEscopoAusente só casa 403 + insufficient_scope', BlingSyncService::ehEscopoAusente(new RuntimeException('Falha ao paginar x (página 1, HTTP 403): {"error":{"type":"insufficient_scope"}}'))
        && !BlingSyncService::ehEscopoAusente(new RuntimeException('HTTP 401 insufficient_scope'))
        && !BlingSyncService::ehEscopoAusente(new RuntimeException('HTTP 403 forbidden')));
    echo "== 7. 401: UMA renovação e UMA repetição (sem laço)\n";
    $tok0 = $api->contar('oauth/token');
    $api->responder('contatos', [new BlingResposta(401, ['error' => ['type' => 'invalid_token']]), new BlingResposta(200, ['data' => []])]);
    $r = $sync->sincronizar($conta, 'contatos', 'incremental', 'teste-7');
    ok('401 → renova e repete → ok', $r['situacao'] === 'ok' && $api->contar('contatos') === 2 && $api->contar('oauth/token') === $tok0 + 1,
        $r['situacao'] . ' chamadas=' . $api->contar('contatos'));
    $api->responder('produtos', [new BlingResposta(401, ['error' => []]), new BlingResposta(401, ['error' => []]), new BlingResposta(200, ['data' => []])]);
    $r = $sync->sincronizar($conta, 'produtos', 'incremental', 'teste-7b');
    ok('401 de novo depois de renovar → para (2 chamadas, erro)', $r['situacao'] === 'erro' && $api->contar('produtos') === 2, (string) $api->contar('produtos'));

    echo "== 8. 5xx: poucas tentativas, espera crescente\n";
    $SONOS = [];
    $api->responder('pedidos/compras', new BlingResposta(503, ['error' => ['type' => 'indisponivel']]));
    $r = $sync->sincronizar($conta, 'compras', 'incremental', 'teste-8');
    ok('503 → 3 tentativas e erro', $r['situacao'] === 'erro' && $api->contar('pedidos/compras') === 3, (string) $api->contar('pedidos/compras'));
    ok('2 esperas, a 2ª maior que a base da 1ª', count($SONOS) === 2 && $SONOS[1] >= 500, json_encode($SONOS));

    echo "== 9. 429: respeita o prazo do servidor (Retry-After)\n";
    $SONOS = [];
    $api->responder('nfe', [new BlingResposta(429, ['error' => []], ['retry-after' => '7', 'Retry-After' => '7']), new BlingResposta(200, ['data' => []])]);
    $r = $sync->sincronizar($conta, 'notas', 'incremental', 'teste-9');
    ok('429 → espera 7 s (do servidor) e conclui', $r['situacao'] === 'ok' && $SONOS === [7000], json_encode($SONOS));

    echo "== 10. pedido IGUAL lido antes dos canais ganha o canal depois (sem trocar canal já gravado)\n";
    $pedido = ['id' => 9001, 'numero' => '1', 'data' => '2026-11-20', 'situacao' => ['id' => 6], 'loja' => ['id' => 777], 'total' => 10, 'itens' => []];
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$pedido]]));
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-10a');
    $canal = static fn() => $pdo->query("SELECT sales_channel_id FROM bling_sales_orders WHERE bling_id = '9001'")->fetchColumn();
    ok('sem canais sincronizados: pedido sem canal', $canal() === null);
    $api->responder('canais-venda', new BlingResposta(200, ['data' => [['id' => 777, 'descricao' => 'Mercado Livre (teste)']]]));
    $sync->sincronizar($conta, 'canais', 'reconciliacao', 'teste-10b');
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-10c');
    $idCanal = (int) $pdo->query("SELECT id FROM bling_sales_channels WHERE bling_id = '777'")->fetchColumn();
    ok('mesmo pedido (hash igual) agora COM o canal', $idCanal > 0 && (int) $canal() === $idCanal, (string) $canal());
    $pdo->exec("INSERT INTO bling_sales_channels (account_id, bling_id, nome, integrado) VALUES ($conta, '888', 'Outro', 1)");
    $pedido['loja']['id'] = 888; $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$pedido]]));
    $pdo->exec("UPDATE bling_sales_orders SET payload_hash = 'x' WHERE bling_id = '9001'");   // força regravação normal (pedido mudou)
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-10d');
    ok('pedido que MUDOU regrava normalmente (canal novo)', (int) $canal() !== $idCanal);

    echo "== 11. painel: a última sincronização CONCLUÍDA não some depois de uma falha\n";
    $real = new BlingReal($repo);
    $antes = $real->disponibilidade('produtos')['ultimo_sucesso'] ?? null;
    $pdo->exec("UPDATE bling_sync_jobs SET terminado_em = UTC_TIMESTAMP() - INTERVAL 2 HOUR WHERE situacao = 'concluido'");   // tudo concluído há 2 h
    $pdo->exec("INSERT INTO bling_sync_jobs (account_id, recurso, estrategia, situacao, iniciado_em, terminado_em) VALUES ($conta, 'produtos', 'incremental', 'concluido', UTC_TIMESTAMP() - INTERVAL 2 HOUR, UTC_TIMESTAMP() - INTERVAL 2 HOUR)");
    $api->responder('produtos', new BlingResposta(500, ['error' => []]));
    $sync->sincronizar($conta, 'produtos', 'incremental', 'teste-11');
    $d = $real->disponibilidade('produtos');
    ok('após a falha: ultimo_sucesso continua (há ~2 h)', $d['ultimo_sucesso'] !== null && abs(time() - strtotime($d['ultimo_sucesso']) - 7200) < 120, (string) $d['ultimo_sucesso']);
    ok('ultima_sync do cabeçalho = última CONCLUÍDA (há ~2 h), não a tentativa que falhou agora', $real->ultimaSync() !== null
        && abs(time() - strtotime((string) $real->ultimaSync()) - 7200) < 120, (string) $real->ultimaSync());
} catch (Throwable $e) {
    $falhas++;
    echo 'FALHA (exceção) ' . get_class($e) . ': ' . $e->getMessage() . "\n";
} finally {
    // remove SÓ as tabelas que este teste criou nesta execução (lista $criadas), no banco de validação conferido acima
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (array_reverse($criadas) as $t) { $pdo->exec('DROP TABLE IF EXISTS `' . $t . '`'); }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}
echo "== $total verificações, $falhas falha(s); tabelas do teste removidas: " . count($criadas) . "\n";
exit($falhas === 0 ? 0 : 1);
