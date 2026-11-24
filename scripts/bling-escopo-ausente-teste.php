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
$DBENV = ['DB_BLING_HOST' => $cli['host'] ?? '127.0.0.1', 'DB_BLING_PORT' => (string) ($cli['port'] ?? 3306), 'DB_BLING_NAME' => $db,
          'DB_BLING_USER' => $cli['user'] ?? '', 'DB_BLING_PASS' => $cli['password'] ?? ''];
$NOVA_PDO = static fn(): PDO => new PDO($dsn . ';dbname=' . $db . ';charset=utf8mb4', $DBENV['DB_BLING_USER'], $DBENV['DB_BLING_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
unset($cli);
if ((string) $pdo->query('SELECT DATABASE()')->fetchColumn() !== $db) { fwrite(STDERR, "[ERRO] banco conectado difere — ABORTADO\n"); exit(2); }
$existentes = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name LIKE 'bling\\_%'")->fetchColumn();
if ($existentes > 0) { fwrite(STDERR, "[ERRO] $db já tem $existentes tabela(s) bling_* — não mexo no que não criei. ABORTADO\n"); exit(2); }

// segredos SINTÉTICOS (nunca do .env)
foreach (['BLING_CRYPTO_KEY' => str_repeat('5e', 32), 'BLING_CLIENT_ID' => 'teste-sintetico-client', 'BLING_CLIENT_SECRET' => 'teste-sintetico-secret',
          'BLING_REDIRECT_URI' => 'https://exemplo.invalid/api/bling/oauth/callback'] as $k => $v) { putenv("$k=$v"); $_ENV[$k] = $v; }
$SONOS = [];
BlingClient::$dormirParaTeste = static function (int $ms) use (&$SONOS): void { $SONOS[] = $ms; };

$ddl = (string) file_get_contents($raiz . '/docs/BLING/02-banco-BLING.sql');
preg_match_all('/CREATE TABLE IF NOT EXISTS (bling_[a-z_]+) \(/', $ddl, $mm);
$TABELAS = array_values(array_unique($mm[1]));   // todas as do DDL oficial (o worker real exige o esquema completo)
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
    $pdo->exec('ALTER TABLE bling_sales_orders DROP COLUMN loja_bling_id');   // começa como a PRODUÇÃO de hoje (antes da migração 20261123)

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

    echo "== 3. fila: enquanto canais está suspenso, NADA de canais entra ou sai da fila (DSHOW-106 — decisivo na seção 12)\n";
    ok('enfileirar(canais) devolve 0 (recusado)', $repo->enfileirar($conta, 'sync', 'canais', null, ['estrategia' => 'incremental', 'correlation_id' => 'teste-3'], 30) === 0);
    $d = $fila->drenar(50, 30);
    ok('fila não processa nada de canais', $d['processados'] === 0 && (int) $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'canais'")->fetchColumn() === 0, json_encode($d));
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
    ok('reautorizou + canais OK → releitura dos pedidos agendada (1)', (int) $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'pedidos' AND situacao = 'pendente'")->fetchColumn() === 1);
    $pdo->exec('DELETE FROM bling_queue');   // a seção 6 olha só a fila dela

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

    echo "== 10. canais disponíveis → releitura dos pedidos agendada; pedido IGUAL ganha o canal (hash com as referências resolvidas)\n";
    $pedido = ['id' => 9001, 'numero' => '1', 'data' => '2026-11-20', 'situacao' => ['id' => 6], 'loja' => ['id' => 777], 'total' => 10, 'itens' => []];
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$pedido]]));
    $pdo->exec("UPDATE bling_sync_state SET situacao = 'atencao', proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE recurso = 'canais'");
    $pdo->exec("DELETE FROM bling_sales_channels");
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-10a');
    $canal = static fn() => $pdo->query("SELECT sales_channel_id FROM bling_sales_orders WHERE bling_id = '9001'")->fetchColumn();
    ok('sem canais: pedido gravado sem canal', $canal() === null);
    $pdo->exec("DELETE FROM bling_queue");
    $api->responder('canais-venda', new BlingResposta(200, ['data' => [['id' => 777, 'descricao' => 'Mercado Livre (teste)']]]));
    $sync->sincronizar($conta, 'canais', 'incremental', 'teste-10b');
    $agendada = $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'pedidos' AND situacao = 'pendente' AND payload LIKE '%reconciliacao%'")->fetchColumn();
    ok('1ª sincronização OK dos canais AGENDA a releitura dos pedidos', (int) $agendada === 1);
    $sync->sincronizar($conta, 'canais', 'incremental', 'teste-10b2');
    ok('canais já OK: não reagenda de novo', (int) $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'pedidos'")->fetchColumn() === 1);
    $d = $fila->drenar(10, 30);
    $idCanal = (int) $pdo->query("SELECT id FROM bling_sales_channels WHERE bling_id = '777'")->fetchColumn();
    ok('a releitura regrava o pedido IGUAL com o canal', $idCanal > 0 && (int) $canal() === $idCanal, json_encode($d) . ' canal=' . $canal());
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-10c');
    ok('releitura seguinte: nada a regravar (ignorado)', (int) $canal() === $idCanal
        && (int) $pdo->query("SELECT registros_ignorados FROM bling_sync_state WHERE recurso = 'pedidos'")->fetchColumn() === 1);

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

    echo "== 12. DSHOW-106 (1) DECISIVO: 403 suspende SÓ 'canais' — ciclos REAIS do worker (incremental, reconciliação, dlq) + fila\n";
    $pdo->exec('DELETE FROM bling_queue');
    $api->responder('canais-venda', $escopo403);
    $pdo->exec("UPDATE bling_sync_state SET proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE recurso = 'canais'");
    $r = $sync->sincronizar($conta, 'canais', 'incremental', 'teste-12');
    ok('403 → canais suspenso', $r['situacao'] === 'escopo_ausente' && $repo->escopoSuspenso($conta, 'canais'));
    // itens de canais que JÁ existiam: 1 pendente e 1 na DLQ (inseridos direto: enfileirar() já recusa)
    $pdo->exec("INSERT INTO bling_queue (account_id, tipo, recurso, payload, prioridade, situacao, tentativas, max_tentativas, disponivel_em)
                VALUES ($conta, 'sync', 'canais', '{\"estrategia\":\"incremental\"}', 30, 'pendente', 1, 5, UTC_TIMESTAMP()),
                       ($conta, 'sync', 'canais', '{\"estrategia\":\"incremental\"}', 30, 'dlq', 5, 5, UTC_TIMESTAMP())");
    $marco = (int) $pdo->query('SELECT MAX(id) FROM bling_queue')->fetchColumn();
    $c0 = $chamadas();
    ok('enfileirar(canais) RECUSADO enquanto suspenso', $repo->enfileirar($conta, 'sync', 'canais', null, [], 30) === 0);
    // os demais recursos estão vencidos → o worker deve agendá-los
    $pdo->exec("UPDATE bling_sync_state SET proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE, situacao = 'ok' WHERE recurso <> 'canais'");
    // cópia do worker REAL deste ramo; ÚNICA diferença: o diretório da trava (o de produção é /var/lib/bling — nunca tocado)
    $W = (string) shell_exec('mktemp -d /srv/dshow-work/bling-worker-teste.XXXXXX');
    $W = trim($W);
    if (!preg_match('#^/srv/dshow-work/bling-worker-teste\.[A-Za-z0-9]{6}$#', $W) || !is_dir($W)) { throw new RuntimeException('mktemp do worker falhou'); }
    mkdir("$W/scripts"); mkdir("$W/trava");
    shell_exec('cp -r ' . escapeshellarg($raiz . '/api') . ' ' . escapeshellarg("$W/api"));
    $wsrc = str_replace("\$dirTrava = '/var/lib/bling';", '$dirTrava = ' . var_export("$W/trava", true) . ';', (string) file_get_contents($raiz . '/scripts/bling-worker.php'), $nTrava);
    file_put_contents("$W/scripts/bling-worker.php", $wsrc); file_put_contents("$W/.env", '');
    ok('cópia do worker com a trava fora de /var/lib/bling', $nTrava === 1);
    $worker = static function (string $modo) use ($W, $DBENV): string {
        $env = array_merge(getenv(), $DBENV);
        $pr = proc_open(['php', "$W/scripts/bling-worker.php", "--modo=$modo"], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp, $W, $env);
        $o = stream_get_contents($pp[1]) . stream_get_contents($pp[2]); proc_close($pr); return $o;
    };
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => []]));
    $saidas = [];
    foreach (['incremental', 'reconciliacao', 'dlq'] as $ciclo) {
        $saidas[] = $worker($ciclo);
        for ($i = 0; $i < 3; $i++) { $fila->drenar(50, 30); }   // a fila (in-process, Bling FALSO) roda entre os ciclos
    }
    $saidas[] = $worker('incremental'); $fila->drenar(50, 30);
    $novosCanais = (int) $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'canais' AND id > $marco")->fetchColumn();
    ok('worker: ZERO itens novos de canais na fila (4 ciclos)', $novosCanais === 0, implode(' | ', array_map(fn($x) => trim(substr($x, -90)), $saidas)));
    $pend = $pdo->query("SELECT situacao, tentativas FROM bling_queue WHERE recurso = 'canais' AND id <= $marco ORDER BY id")->fetchAll();
    ok('item pendente de canais NÃO foi tentado (pendente, tentativas 1)', ($pend[0]['situacao'] ?? '') === 'pendente' && (int) $pend[0]['tentativas'] === 1);
    ok('item de canais na DLQ NÃO foi devolvido (dlq)', ($pend[1]['situacao'] ?? '') === 'dlq');
    ok('ZERO chamadas novas a canais-venda', $chamadas() === $c0, ($chamadas() - $c0) . ' novas');
    $pedOk = (int) $pdo->query("SELECT COUNT(*) FROM bling_queue WHERE recurso = 'pedidos' AND situacao = 'concluido' AND id > $marco")->fetchColumn();
    ok('pedidos SEGUEM sincronizando (agendados pelo worker e concluídos)', $pedOk >= 2 && $repo->estadoSync($conta, 'pedidos')['situacao'] === 'ok', "$pedOk concluídos");
    // tentativa diária: a espera venceu → o pendente roda UMA vez e o recurso volta a ficar suspenso
    $pdo->exec("UPDATE bling_sync_state SET proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE recurso = 'canais'");
    $fila->drenar(50, 30);
    ok('na tentativa diária: 1 chamada e suspenso de novo', $chamadas() === $c0 + 1 && $repo->escopoSuspenso($conta, 'canais'));
    shell_exec('rm -rf -- ' . escapeshellarg($W));

    echo "== 13. DSHOW-106 (2) pedidos\n";
    $pdo->exec("DELETE FROM bling_queue");
    $api->responder('canais-venda', new BlingResposta(200, ['data' => [['id' => 777, 'descricao' => 'Mercado Livre (teste)'], ['id' => 888, 'descricao' => 'Loja (teste)']]]));
    $pdo->exec("UPDATE bling_sync_state SET proxima_execucao_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE WHERE recurso = 'canais'");
    $sync->sincronizar($conta, 'canais', 'reconciliacao', 'teste-13a');
    $p2 = ['id' => 9200, 'numero' => '2', 'data' => '2026-11-21', 'situacao' => ['id' => 6], 'loja' => ['id' => 777], 'total' => 30,
           'itens' => [['codigo' => 'A1', 'descricao' => 'Item 1', 'quantidade' => 1, 'valor' => 10], ['codigo' => 'A2', 'descricao' => 'Item 2', 'quantidade' => 2, 'valor' => 10]]];
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$p2]]));
    $sync->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13b');
    $sync->gravarPedidoDetalhe($conta, $p2);   // Codex DSHOW-113 (2): itens só pelo DETALHE (contrato de coleção completa); a listagem não substitui itens
    $ped = static fn() => $pdo->query("SELECT id, sales_channel_id, payload_hash FROM bling_sales_orders WHERE bling_id = '9200'")->fetch();
    $itens = static fn() => $pdo->query("SELECT sku FROM bling_sales_order_items i JOIN bling_sales_orders o ON o.id = i.sales_order_id WHERE o.bling_id = '9200' ORDER BY sku")->fetchAll(PDO::FETCH_COLUMN);
    $c777 = (int) $pdo->query("SELECT id FROM bling_sales_channels WHERE bling_id = '777'")->fetchColumn();
    ok('a) sem a coluna (produção de hoje): grava normal, com canal', (int) $ped()['sales_channel_id'] === $c777 && $itens() === ['A1', 'A2']);
    $pdo->exec("ALTER TABLE bling_sales_orders ADD COLUMN loja_bling_id VARCHAR(64) NULL AFTER sales_channel_id");   // = a migração 20261123
    $repo2 = new BlingRepository($pdo); $sync2 = new BlingSyncService($repo2, $auth);   // processo novo (cache de colunas limpo)
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13c');
    ok('a) com a coluna: o MESMO pedido (JSON igual) passa a guardar a loja (777)', $pdo->query("SELECT loja_bling_id FROM bling_sales_orders WHERE bling_id = '9200'")->fetchColumn() === '777');
    $p2['total'] = 31; $p2['loja']['id'] = 999;   // pedido MUDOU e cita uma loja que NÃO resolve (canal 999 inexistente)
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$p2]]));
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13d');
    ok('c) resolução falhou: a associação válida NÃO virou NULL', (int) $ped()['sales_channel_id'] === $c777, (string) $ped()['sales_channel_id']);
    $h0 = $ped()['payload_hash']; $w0 = $repo2->estadoSync($conta, 'pedidos')['watermark'];
    $p2['loja']['id'] = 777; $p2['total'] = 32; $p2['situacao'] = ['valor' => 24]; $p2['transporte'] = ['transportador' => ['nome' => str_repeat('X', 300)]];   // 'enviado': cabeçalho e histórico GRAVAM, depois o envio NÃO cabe (VARCHAR(190)) → falha no MEIO do registro
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$p2]]));
    $pdo->exec("UPDATE bling_sync_state SET watermark = UTC_TIMESTAMP() - INTERVAL 3 DAY WHERE recurso = 'pedidos'");
    $w0 = $repo2->estadoSync($conta, 'pedidos')['watermark'];
    $r = $sync2->sincronizar($conta, 'pedidos', 'incremental', 'teste-13e');
    ok('d) item com falha: cabeçalho E itens ficam como estavam (nada pela metade)', $itens() === ['A1', 'A2'] && $ped()['payload_hash'] === $h0, implode(',', $itens()));
    ok('d) falha registrada', $r['erros'] === 1);
    ok('e) cursor NÃO avança com item em falha', $repo2->estadoSync($conta, 'pedidos')['watermark'] === $w0);
    $p2['transporte'] = ['transportador' => ['nome' => 'Correios']]; $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$p2]]));
    $sync2->sincronizar($conta, 'pedidos', 'incremental', 'teste-13f');
    // achado 1 da ACIMA_ESQUERDA (24/11): loja ausente ou 0 na listagem NUNCA apaga a loja conhecida (guarda igual à do situacao_bling_id)
    $lojaDe = static fn() => $pdo->query("SELECT loja_bling_id FROM bling_sales_orders WHERE bling_id = '9200'")->fetchColumn();
    $semLoja = $p2; unset($semLoja['loja']); $semLoja['total'] = 33;
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$semLoja]]));
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13g');
    ok('f) listagem SEM loja.id: a loja conhecida (777) fica — não vira NULL', $lojaDe() === '777' && (float) $pdo->query("SELECT total FROM bling_sales_orders WHERE bling_id = '9200'")->fetchColumn() === 33.0, var_export($lojaDe(), true));
    $zero = $p2; $zero['loja'] = ['id' => 0]; $zero['total'] = 34;
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$zero]]));
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13h');
    ok('f) listagem com loja.id = 0: a loja conhecida fica — não vira "0"', $lojaDe() === '777', var_export($lojaDe(), true));
    $outra = $p2; $outra['loja'] = ['id' => 888]; $outra['total'] = 35;
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$outra]]));
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13i');
    ok('f) loja.id VÁLIDO e diferente: atualiza (a guarda só protege a ausência)', $lojaDe() === '888', var_export($lojaDe(), true));
    $p2['loja']['id'] = 777;
    $api->responder('pedidos/vendas', new BlingResposta(200, ['data' => [$p2]]));
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13j');
    ok('e) depois de corrigido: grava e o cursor avança', $repo2->estadoSync($conta, 'pedidos')['watermark'] !== $w0 && (float) $pdo->query("SELECT total FROM bling_sales_orders WHERE bling_id = '9200'")->fetchColumn() === 32.0);
    $d1 = (new BlingReal($repo2))->disponibilidade('pedidos');
    ok('f) última TENTATIVA e última sincronização CONCLUÍDA são campos separados', array_key_exists('ultima_tentativa', $d1) && array_key_exists('ultimo_sucesso', $d1));
    $n1 = (int) $pdo->query("SELECT COUNT(*) FROM bling_sales_orders")->fetchColumn();
    $sync2->sincronizar($conta, 'pedidos', 'reconciliacao', 'teste-13g');
    ok('g) backfill idempotente: repetir não cria nem regrava', (int) $pdo->query("SELECT COUNT(*) FROM bling_sales_orders")->fetchColumn() === $n1
        && (int) $repo2->estadoSync($conta, 'pedidos')['registros_ignorados'] === 1);

    echo "== 14. DSHOW-106 (3) renovação CONCORRENTE do token (2 processos reais)\n";
    $pdo->exec("UPDATE bling_oauth_tokens SET expira_em = UTC_TIMESTAMP() - INTERVAL 1 MINUTE");
    $TD = trim((string) shell_exec('mktemp -d /srv/dshow-work/bling-token-teste.XXXXXX'));
    if (!preg_match('#^/srv/dshow-work/bling-token-teste\.[A-Za-z0-9]{6}$#', $TD) || !is_dir($TD)) { throw new RuntimeException('mktemp do token falhou'); }
    file_put_contents("$TD/renovacoes", '');
    $filhos = [];
    for ($k = 0; $k < 2; $k++) {
        $pid = pcntl_fork();
        if ($pid === 0) {   // FILHO: conexão própria, transporte falso próprio; sai sem destrutores (não fecha a conexão do pai)
            try {
                $pf = $NOVA_PDO(); $rf = new BlingRepository($pf);
                $tf = new BlingTransporteFalso();
                $tf->responder('oauth/token', function () use ($TD): BlingResposta {
                    $n = count(file("$TD/renovacoes")) + 1; file_put_contents("$TD/renovacoes", getmypid() . "\n", FILE_APPEND);
                    usleep(800000);   // a renovação demora: o outro processo chega no meio
                    return new BlingResposta(200, ['access_token' => "acesso-novo-$n", 'refresh_token' => "refresh-novo-$n", 'expires_in' => 3600, 'token_type' => 'Bearer']);
                });
                $tok = (new BlingAuthService($rf, $tf))->tokenValido($GLOBALS['conta']);
                file_put_contents("$TD/filho-" . getmypid(), $tok);
            } catch (Throwable $e) { file_put_contents("$TD/filho-" . getmypid(), 'ERRO ' . $e->getMessage()); }
            posix_kill(getmypid(), SIGKILL);
        }
        $filhos[] = $pid;
    }
    foreach ($filhos as $f) { pcntl_waitpid($f, $st); }
    $ren = array_filter(explode("\n", (string) file_get_contents("$TD/renovacoes")));
    $res = array_map(fn($f) => (string) file_get_contents($f), glob("$TD/filho-*"));
    $final = $repo->tokens($conta)['access_token'];
    ok('2 processos ao mesmo tempo → UMA renovação', count($ren) === 1, count($ren) . ' renovações');
    ok('os dois usam o MESMO par novo, que é o gravado', count($res) === 2 && $res[0] === $res[1] && $res[0] === $final, implode(' / ', $res) . " | gravado=$final");
    shell_exec('rm -rf -- ' . escapeshellarg($TD));
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
