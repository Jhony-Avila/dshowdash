<?php
declare(strict_types=1);
// scripts/status-estado-real-teste.php — cartões de status com ESTADO REAL (23/11/2026)
//
//     STATUS_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> STATUS_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/status-estado-real-teste.php
//
// Prova StatusEstadoReal (api/status/_estado-real.php): Pipedrive/Calendar/Bling lidos das tabelas de sincronização (ok, atrasado,
// erro, parcial, escopo ausente), integrações inexistentes = 'nao_integrado', cartões sem fonte = 'sem_fonte', Google Ads simulado;
// sem sessão a resposta NÃO traz data nem erro; texto cru da API externa NUNCA sai na resposta.
// SEGURANÇA: só em ^ATRWEB_VAL_T_[0-9]+$; recusa se já existir qualquer tabela que ele cria; cria tabelas MÍNIMAS e as remove no fim.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = dirname(__DIR__);
require_once $raiz . '/api/status/_estado-real.php';
date_default_timezone_set('America/Sao_Paulo');
// falsos do ambiente HTTP (no Dash vêm de _init.php); só existem neste processo de teste
final class RedisHelper { public static array $m = [];
    public static function tryGetCache(string $k): ?string { return self::$m[$k] ?? null; }
    public static function setCache(string $k, string $v, int $t = 60): bool { self::$m[$k] = $v; return true; }
    public static function close(): void {} }
final class ApiResponse { public static function buildSuccess($d = null, ?array $m = null): string { return (string) json_encode(['ok' => true, 'data' => $d]); } }

$cnf = (string) getenv('STATUS_TESTE_CNF'); $db = (string) getenv('STATUS_TESTE_DB');
if ($cnf === '' || !is_file($cnf) || !preg_match('/^ATRWEB_VAL_T_[0-9]+$/', $db)) { fwrite(STDERR, "[ERRO] defina STATUS_TESTE_CNF e STATUS_TESTE_DB=ATRWEB_VAL_T_<n> — ABORTADO\n"); exit(2); }
$cli = []; $sec = '';
foreach (preg_split('/\r?\n/', (string) file_get_contents($cnf)) as $l) {   // [client] em memória; valores nunca impressos
    $l = trim($l);
    if ($l === '' || $l[0] === '#' || $l[0] === ';') { continue; }
    if (preg_match('/^\[(.+)\]$/', $l, $m)) { $sec = trim($m[1]); continue; }
    if ($sec !== 'client' || !str_contains($l, '=')) { continue; }
    [$k, $v] = explode('=', $l, 2); $cli[trim($k)] = trim(trim($v), "\"'");
}
$dsn = isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306);
$pdo = new PDO($dsn . ';dbname=' . $db . ';charset=utf8mb4', $cli['user'] ?? '', $cli['password'] ?? '',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
unset($cli);
$pdo->exec("SET time_zone = '-03:00'");   // o relógio local do servidor (pipe_* grava hora local)

$DDL = [
  'pipe_sync_runs'    => 'id INT AUTO_INCREMENT PRIMARY KEY, status VARCHAR(20), finished_at DATETIME NULL',
  'pipe_api_requests' => 'id INT AUTO_INCREMENT PRIMARY KEY, http_status INT, result VARCHAR(10), created_at DATETIME',
  'gcal_accounts'     => 'id INT AUTO_INCREMENT PRIMARY KEY, connection_status VARCHAR(20), is_active TINYINT, is_default TINYINT',
  'gcal_sync_runs'    => 'id INT AUTO_INCREMENT PRIMARY KEY, errors_n INT, finished_at DATETIME NULL',
  'gcal_sync_errors'  => 'id INT AUTO_INCREMENT PRIMARY KEY, http_status INT NULL, error_code VARCHAR(64) NULL, message TEXT, occurred_at DATETIME',
  'bling_accounts'    => 'id INT AUTO_INCREMENT PRIMARY KEY, estado_conexao VARCHAR(30), is_ativo TINYINT, is_padrao TINYINT',
  'bling_sync_state'  => 'id INT AUTO_INCREMENT PRIMARY KEY, account_id INT, recurso VARCHAR(40), situacao VARCHAR(20), ultima_execucao_em DATETIME NULL',
  'bling_sync_errors' => 'id INT AUTO_INCREMENT PRIMARY KEY, account_id INT, recurso VARCHAR(40), codigo VARCHAR(64), mensagem TEXT',
  'bling_sync_jobs'   => 'id INT AUTO_INCREMENT PRIMARY KEY, account_id INT, recurso VARCHAR(40), situacao VARCHAR(20), terminado_em DATETIME NULL',
];
$ja = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name IN ('"
    . implode("','", array_keys($DDL)) . "')")->fetchColumn();
if ($ja > 0) { fwrite(STDERR, "[ERRO] $db já tem tabela(s) com esses nomes — não mexo no que não criei. ABORTADO\n"); exit(2); }

$criadas = []; $falhas = 0; $total = 0;
function ok(string $n, bool $c, string $d = ''): void { global $falhas, $total; $total++; if (!$c) { $falhas++; } echo ($c ? 'ok    ' : 'FALHA ') . $n . ($d !== '' ? "  ($d)" : '') . "\n"; }
$con = static fn(string $esquema): PDO => $pdo;
$est = static fn(string $c) => StatusEstadoReal::estado($c, $con);
$loc = static fn(int $min) => date('Y-m-d H:i:s', time() - $min * 60);
$utc = static fn(int $min) => gmdate('Y-m-d H:i:s', time() - $min * 60);

try {
    foreach ($DDL as $t => $cols) { $pdo->exec("CREATE TABLE `$t` ($cols)"); $criadas[] = $t; }

    echo "== Pipedrive\n";
    $pdo->prepare("INSERT INTO pipe_sync_runs (status, finished_at) VALUES ('completed', ?)")->execute([$loc(3)]);
    $pdo->exec("INSERT INTO pipe_api_requests (http_status, result, created_at) VALUES (404, 'error', NOW())");
    $e = $est('pipedrive');
    ok('ok e em dia (404 de lead apagado não conta)', $e['estado'] === 'ok' && $e['erro'] === null, $e['estado']);
    $pub = StatusEstadoReal::montar('pipedrive', $e, false); $log = StatusEstadoReal::montar('pipedrive', $e, true);
    ok('status online', $pub['status'] === 'online' && $pub['configured'] === true);
    ok('SEM sessão: sem data, sem erro, sem resumo', !isset($pub['ultima_sincronizacao_ok']) && !isset($pub['erro_atual']) && !isset($pub['resumo']));
    ok('COM sessão: data ISO + resumo', is_string($log['ultima_sincronizacao_ok']) && str_contains($log['resumo'], 'Última sincronização concluída em'),
        (string) $log['ultima_sincronizacao_ok']);
    $pdo->exec('UPDATE pipe_sync_runs SET finished_at = NOW() - INTERVAL 2 HOUR');
    $e = $est('pipedrive');
    ok('2 h sem sucesso → atrasado / degraded', $e['estado'] === 'atrasado' && StatusEstadoReal::montar('pipedrive', $e, false)['status'] === 'degraded');
    $pdo->exec("UPDATE pipe_sync_runs SET finished_at = NOW() - INTERVAL 1 MINUTE");
    $pdo->exec("INSERT INTO pipe_api_requests (http_status, result, created_at) VALUES (500, 'error', NOW())");
    $e = $est('pipedrive');
    ok('500 na última hora → erro HTTP_500', $e['estado'] === 'erro' && $e['erro']['codigo'] === 'HTTP_500');

    echo "== Google Calendar\n";
    $pdo->exec("INSERT INTO gcal_accounts (connection_status, is_active, is_default) VALUES ('connected', 1, 1)");
    $pdo->prepare('INSERT INTO gcal_sync_runs (errors_n, finished_at) VALUES (0, ?)')->execute([$utc(4)]);   // UTC
    $e = $est('calendar');
    ok('ok (hora UTC convertida certo)', $e['estado'] === 'ok', $e['estado'] . ' ' . $e['ultima_ok']);
    ok('ISO com fuso', (bool) preg_match('/[+-]\d\d:\d\d$|Z$/', (string) $e['ultima_ok']));
    $pdo->prepare("INSERT INTO gcal_sync_errors (http_status, error_code, message, occurred_at) VALUES (403, 'rate<Limit>Exceeded', 'TEXTO-CRU-DO-GOOGLE token=abc', ?)")->execute([$utc(10)]);
    $e = $est('calendar'); $j = json_encode(StatusEstadoReal::montar('calendar', $e, true));
    ok('erro nas últimas 24 h, código saneado', $e['estado'] === 'erro' && $e['erro']['codigo'] === 'rateLimitExceeded', $e['erro']['codigo'] ?? '-');
    ok('texto cru do Google NUNCA sai', !str_contains($j, 'TEXTO-CRU') && !str_contains($j, 'token=abc'));
    $pdo->exec("UPDATE gcal_accounts SET connection_status = 'expired'");
    ok('conta expirada → CONTA_EXPIRED', $est('calendar')['erro']['codigo'] === 'CONTA_EXPIRED');

    echo "== Bling\n";
    $pdo->exec("INSERT INTO bling_accounts (id, estado_conexao, is_ativo, is_padrao) VALUES (44, 'conectado', 1, 1)");
    foreach (['produtos', 'pedidos', 'contatos'] as $r) { $pdo->prepare("INSERT INTO bling_sync_state (account_id, recurso, situacao, ultima_execucao_em) VALUES (44, ?, 'ok', ?)")->execute([$r, $utc(5)]); }
    $pdo->prepare("INSERT INTO bling_sync_state (account_id, recurso, situacao, ultima_execucao_em) VALUES (44, 'estoque', 'atencao', ?)")->execute([$utc(5)]);
    $pdo->exec("INSERT INTO bling_sync_errors (account_id, recurso, codigo, mensagem) VALUES (44, 'estoque', 'NORMALIZACAO', 'item ruim')");
    $e = $est('bling');
    ok("'atencao' comum (poucos itens) não é falha → ok", $e['estado'] === 'ok', $e['estado']);
    $pdo->prepare("INSERT INTO bling_sync_state (account_id, recurso, situacao, ultima_execucao_em) VALUES (44, 'canais', 'atencao', ?)")->execute([$utc(5)]);
    $pdo->exec("INSERT INTO bling_sync_errors (account_id, recurso, codigo, mensagem) VALUES (44, 'canais', 'ESCOPO_AUSENTE', '{\"error\":{\"type\":\"insufficient_scope\"}} CRU-DO-BLING')");
    $e = $est('bling'); $m = StatusEstadoReal::montar('bling', $e, true); $j = json_encode($m, JSON_UNESCAPED_UNICODE);
    ok('canais com escopo ausente → parcial / degraded', $e['estado'] === 'parcial' && $m['status'] === 'degraded');
    ok('erro ESCOPO_AUSENTE com texto NOSSO', $m['erro_atual']['codigo'] === 'ESCOPO_AUSENTE' && str_contains($m['erro_atual']['mensagem'], 'Reautorize'));
    ok('recursos_com_problema = canais de venda', ($m['recursos_com_problema'] ?? []) === ['canais de venda']);
    ok('texto cru do Bling NUNCA sai', !str_contains($j, 'CRU-DO-BLING') && !str_contains($j, 'insufficient_scope'));
    $pdo->exec("UPDATE bling_sync_state SET situacao = 'erro' WHERE recurso = 'pedidos'");
    $pdo->exec("INSERT INTO bling_sync_errors (account_id, recurso, codigo, mensagem) VALUES (44, 'pedidos', 'SYNC_FALHOU', 'x')");
    ok('dois recursos com problema', count($est('bling')['problemas']) === 2);
    $pdo->prepare("INSERT INTO bling_sync_jobs (account_id, recurso, situacao, terminado_em) VALUES (44, 'produtos', 'concluido', ?)")->execute([$utc(90)]);
    $pdo->exec("UPDATE bling_sync_state SET situacao = 'erro', ultima_execucao_em = UTC_TIMESTAMP() WHERE recurso <> 'canais'");
    $e = $est('bling');
    ok('falha em tudo: a última CONCLUÍDA (há 90 min, dos jobs) continua no cartão', $e['ultima_ok'] !== null
        && abs(time() - strtotime($e['ultima_ok']) - 5400) < 120, (string) $e['ultima_ok']);
    $m = StatusEstadoReal::montar('bling', $e, true, null, true);
    ok('último estado válido marcado como desatualizado', ($m['desatualizado'] ?? false) === true && str_contains($m['message'], 'último estado válido'));
    $pdo->exec("UPDATE bling_accounts SET estado_conexao = 'reauth_necessaria'");
    $e = $est('bling');
    ok('conta precisa reconectar → erro / error', $e['estado'] === 'erro' && $e['erro']['codigo'] === 'CONTA_REAUTH_NECESSARIA'
        && StatusEstadoReal::montar('bling', $e, false)['status'] === 'error');

    echo "== Sem integração, sem fonte, simulado\n";
    $e = $est('mercadolivre'); $m = StatusEstadoReal::montar('mercadolivre', $e, true);
    ok('Mercado Livre = nao_integrado, com o motivo', $e['estado'] === 'nao_integrado' && $m['status'] === 'not_configured' && str_contains($m['message'], 'Bling'));
    ok('nao_integrado não inventa data', !isset($m['ultima_sincronizacao_ok']) || $m['ultima_sincronizacao_ok'] === null);
    ok('logs = sem_fonte', $est('logs')['estado'] === 'sem_fonte');
    putenv('ADS_PROVIDER=mock');
    ok('Google Ads com ADS_PROVIDER=mock = simulado', $est('adwords')['estado'] === 'simulado');
    putenv('ADS_PROVIDER');
    $todos = StatusEstadoReal::cartoes();
    ok('22 cartões, sem repetição', count($todos) === 22 && count(array_unique($todos)) === 22, (string) count($todos));
    $bons = 0; foreach ($todos as $c) { $x = StatusEstadoReal::montar($c, $est($c), false); if (isset($x['status'], $x['estado'], $x['message'])) { $bons++; } }
    ok('os 22 respondem com status/estado/message', $bons === 22, (string) $bons);
    echo "== Falha de leitura: o cartão mostra o ÚLTIMO estado válido (Redis e ApiResponse falsos, em memória)\n";
    $pdo->exec("UPDATE pipe_sync_runs SET status = 'completed', finished_at = NOW() - INTERVAL 2 MINUTE");
    $pdo->exec('DELETE FROM pipe_api_requests');
    $chama = static function (callable $con): array { ob_start(); StatusEstadoReal::responder('pipedrive', $con); return json_decode((string) ob_get_clean(), true)['data'] ?? []; };
    $falha = static function (string $esq): PDO { throw new RuntimeException('banco fora'); };
    $a = $chama($con);
    ok('leitura OK: online', ($a['status'] ?? null) === 'online', (string) ($a['status'] ?? '-'));
    unset(RedisHelper::$m['status:real:v1:pipedrive']);   // venceu o cache curto
    $b = $chama($falha);
    ok('leitura FALHA depois: mantém o último válido (online + desatualizado), não zera', ($b['status'] ?? null) === 'online' && ($b['desatualizado'] ?? false) === true);
    RedisHelper::$m = [];
    $c = $chama($falha);
    ok('sem nenhum estado válido guardado: "unknown", nunca um erro inventado', ($c['status'] ?? null) === 'unknown');
    foreach (glob($raiz . '/api/status/*.php') as $f) {
        if (str_contains((string) file_get_contents($f), "\$isConfigured = false;\n")) { ok('nenhum $isConfigured fixo restante: ' . basename($f), false); }
    }
    ok('nenhum endpoint com $isConfigured = false fixo', true);
} catch (Throwable $e) {
    $falhas++; echo 'FALHA (exceção) ' . get_class($e) . ': ' . $e->getMessage() . "\n";
} finally {
    foreach (array_reverse($criadas) as $t) { $pdo->exec('DROP TABLE IF EXISTS `' . $t . '`'); }
}
echo "== $total verificações, $falhas falha(s); tabelas do teste removidas: " . count($criadas) . "\n";
exit($falhas === 0 ? 0 : 1);
