<?php
declare(strict_types=1);
// scripts/status-acesso-teste.php — Codex DSHOW-106 item 4 (23/11/2026): PORTÃO DE ACESSO dos 42 handlers de api/status
//
//     STATUS_TESTE_CNF=<arquivo de opções do MySQL de VALIDAÇÃO> STATUS_TESTE_DB=ATRWEB_VAL_T_<n> php scripts/status-acesso-teste.php
//
// Roda CADA handler REAL de api/status como processo PHP próprio, numa cópia em /srv/dshow-work (nunca /tmp), trocando SÓ as
// dependências externas por dublês: CorsPolicy (sem efeito), RedisHelper (arquivo — para o cache QUENTE), SessionGate::readOnly (a
// sessão do cenário) e getConnection (a base de validação). O cache é SEMEADO, para cada handler, na(s) chave(s) que ele usa, com um
// marcador "DETALHE-SECRETO". Prova: anônimo e sessão vencida (frio e quente) NÃO recebem detalhe; QUALQUER sessão válida — inclusive
// nível baixo, sem permissão especial — passa pelo portão e vê o que vê hoje (decisão de 23/11); o estado real chega (Pipedrive da base).
// SEGURANÇA: só em ^ATRWEB_VAL_T_[0-9]+$; tabelas mínimas criadas e removidas pelo teste; a cópia é removida no fim.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$raiz = dirname(__DIR__);
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
$dsn = (isset($cli['socket']) ? 'mysql:unix_socket=' . $cli['socket'] : 'mysql:host=' . ($cli['host'] ?? '127.0.0.1') . ';port=' . (int) ($cli['port'] ?? 3306)) . ';dbname=' . $db . ';charset=utf8mb4';
$ENVDB = ['STATUS_TESTE_DSN' => $dsn, 'STATUS_TESTE_U' => $cli['user'] ?? '', 'STATUS_TESTE_P' => $cli['password'] ?? ''];
$pdo = new PDO($dsn, $ENVDB['STATUS_TESTE_U'], $ENVDB['STATUS_TESTE_P'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
unset($cli);
$pdo->exec("SET time_zone = '-03:00'");
$DDL = ['pipe_sync_runs' => 'id INT AUTO_INCREMENT PRIMARY KEY, status VARCHAR(20), finished_at DATETIME NULL',
        'pipe_api_requests' => 'id INT AUTO_INCREMENT PRIMARY KEY, http_status INT, result VARCHAR(10), created_at DATETIME'];
if ((int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name IN ('pipe_sync_runs','pipe_api_requests')")->fetchColumn() > 0) {
    fwrite(STDERR, "[ERRO] $db já tem pipe_sync_runs/pipe_api_requests — não mexo no que não criei. ABORTADO\n"); exit(2);
}
$falhas = 0; $total = 0; $criadas = [];
function ok(string $n, bool $c, string $d = ''): void { global $falhas, $total; $total++; if (!$c) { $falhas++; } echo ($c ? 'ok    ' : 'FALHA ') . $n . ($d !== '' ? "  ($d)" : '') . "\n"; }

$T = trim((string) shell_exec('mktemp -d /srv/dshow-work/status-acesso.XXXXXX'));
if (!preg_match('#^/srv/dshow-work/status-acesso\.[A-Za-z0-9]{6}$#', $T) || !is_dir($T)) { fwrite(STDERR, "[ERRO] mktemp falhou — ABORTADO\n"); exit(2); }
try {
    foreach ($DDL as $t => $c) { $pdo->exec("CREATE TABLE `$t` ($c)"); $criadas[] = $t; }
    $pdo->exec("INSERT INTO pipe_sync_runs (status, finished_at) VALUES ('completed', NOW() - INTERVAL 2 MINUTE)");

    // cópia: api/status e api/_helpers REAIS; dublês só de CorsPolicy, RedisHelper, SessionGate e config/db_connection.php
    foreach (['api/core/helpers', 'api/status', 'api/_helpers', 'config'] as $d) { mkdir("$T/$d", 0700, true); }
    shell_exec('cp -r ' . escapeshellarg("$raiz/api/status") . '/. ' . escapeshellarg("$T/api/status/"));
    shell_exec('cp -r ' . escapeshellarg("$raiz/api/_helpers") . '/. ' . escapeshellarg("$T/api/_helpers/"));
    file_put_contents("$T/api/core/CorsPolicy.php", '<?php final class CorsPolicy { public static function setupApiEndpoint(array $o = []): void {} }');
    file_put_contents("$T/api/core/SessionGate.php", '<?php final class SessionGate { public static function readOnly(?string $s = null): array { return json_decode((string) getenv("STATUS_TESTE_SESSAO"), true) ?: []; } }');
    file_put_contents("$T/api/core/helpers/RedisHelper.php", <<<'PHPR'
<?php
final class RedisConfig { const TTL_STATUS = 60; const TTL_METRICS = 60; const TTL_MODULES = 60; const TTL_EXTERNAL_API = 60; }
final class RedisHelper {
    private static function f(): string { return (string) getenv('STATUS_TESTE_REDIS'); }
    private static function m(): array { return is_file(self::f()) ? (json_decode((string) file_get_contents(self::f()), true) ?: []) : []; }
    public static function getInstance() { return null; }
    public static function tryGetCache(string $k): ?string { return self::m()[$k] ?? null; }
    public static function setCache(string $k, string $v, int $t = 60): bool { $m = self::m(); $m[$k] = $v; file_put_contents(self::f(), json_encode($m)); return true; }
    public static function serveIfCached(string $k): bool { $v = self::tryGetCache($k); if ($v === null) return false; echo $v; return true; }
    public static function cacheAndReturn(string $k, string $o, int $t = 60): void { self::setCache($k, $o, $t); echo $o; }
    public static function invalidateByPattern(string $p): int { return 0; }
    public static function close(): void {}
}
PHPR);
    file_put_contents("$T/config/db_connection.php", '<?php function getConnection(string $n): PDO { return new PDO(getenv("STATUS_TESTE_DSN"), getenv("STATUS_TESTE_U"), getenv("STATUS_TESTE_P"), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }');

    $handlers = [];
    foreach (glob("$T/api/status/*.php") as $f) { $b = basename($f, '.php'); if ($b[0] !== '_') { $handlers[] = $b; } }
    sort($handlers);
    ok('42 handlers em api/status', count($handlers) === 42, (string) count($handlers));
    // chaves de cache que CADA handler usa (literais do código) + a do estado real
    $chaves = [];
    foreach ($handlers as $h) {
        preg_match_all("/'(status:[A-Za-z0-9:_-]+)'/", (string) file_get_contents("$T/api/status/$h.php"), $m);
        $chaves[$h] = array_values(array_unique(array_merge($m[1], ["status:real:v1:$h", "status:real:v1:ultimo-valido:$h"])));
    }
    $redis = "$T/redis.json";
    $SEGREDO = '{"ok":true,"data":{"status":"online","DETALHE-SECRETO":"x","usage":"99%","integrations":[{"nome":"DETALHE-SECRETO"}]},"error":null}';
    $semear = static function () use ($chaves, $redis, $SEGREDO): void {
        $m = []; foreach ($chaves as $ks) { foreach ($ks as $k) { $m[$k] = str_starts_with($k, 'status:real:') ? '{"estado":"ok","integrado":true,"ultima_ok":null,"erro":{"codigo":"DETALHE-SECRETO","mensagem":"DETALHE-SECRETO"},"problemas":["DETALHE-SECRETO"],"fonte":"x"}' : $SEGREDO; } }
        file_put_contents($redis, json_encode($m));
    };
    $roda = static function (string $h, ?array $sessao) use ($T, $redis, $ENVDB): array {
        $env = array_merge(getenv(), $ENVDB, ['STATUS_TESTE_SESSAO' => json_encode($sessao ?? []), 'STATUS_TESTE_REDIS' => $redis]);
        $p = proc_open(['php', '-d', 'display_errors=stderr', '-d', 'error_reporting=0', "$T/api/status/$h.php"], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp, "$T/api/status", $env);
        $o = (string) stream_get_contents($pp[1]); stream_get_contents($pp[2]); proc_close($p);
        return [$o, json_decode($o, true)];
    };
    $minimo = static fn(?array $j, string $motivo): bool => is_array($j) && ($j['ok'] ?? null) === true && is_array($j['data'] ?? null)
        && ($j['data']['status'] ?? null) === 'unknown' && ($j['data']['requer'] ?? null) === $motivo
        && array_diff(array_keys($j['data']), ['status', 'estado', 'disponivel', 'requer', 'endpoint', 'timestamp']) === [];
    $agora = time();
    $CENARIOS = [
        'anônimo'               => null,
        'sessão vencida'        => ['user_id' => 7, 'level' => 100, 'roles' => ['admin'], 'expires_at' => $agora - 10],
        'sessão comum (nível 10)' => ['user_id' => 8, 'level' => 10, 'roles' => ['vendedor'], 'expires_at' => $agora + 3600],
        'autorizado (nível 100)'   => ['user_id' => 9, 'level' => 100, 'roles' => ['admin'], 'expires_at' => $agora + 3600],
    ];
    $sistema = [];   // restrição por permissão DESLIGADA (decisão de 23/11)
    foreach (['FRIO' => false, 'QUENTE' => true] as $rot => $quente) {
        echo "== cache $rot\n";
        foreach ($CENARIOS as $nome => $s) {
            $vaz = []; $passou = []; $bloqueio = [];
            foreach ($handlers as $h) {
                if ($quente) { $semear(); } else { @unlink($redis); }
                [$o, $j] = $roda($h, $s);
                if (str_contains($o, 'DETALHE-SECRETO')) { $vaz[] = $h; }
                $esperaBloqueio = $s === null || $nome === 'sessão vencida' ? 'login' : null;
                if ($esperaBloqueio !== null) { if (!$minimo($j, $esperaBloqueio)) { $bloqueio[] = $h; } }
                elseif (isset($j['data']['requer'])) { $passou[] = $h; }
            }
            if ($nome === 'autorizado (nível 100)' || $nome === 'sessão comum (nível 10)') {
                ok("$rot · $nome: TODOS os 42 passam pelo portão (vê o que vê hoje)", $passou === [] && $bloqueio === [], implode(',', $passou));
                if ($quente) { ok("$rot · $nome: o cache quente segue servido a quem tem sessão", count($vaz) > 0, count($vaz) . ' handlers'); }
            } else {
                ok("$rot · $nome: os 42 respondem só o mínimo", $bloqueio === [], implode(',', $bloqueio));
                ok("$rot · $nome: NENHUM detalhe vaza", $vaz === [], implode(',', $vaz));
            }
        }
    }
    echo "== autorizado recebe o ESTADO REAL\n";
    @unlink($redis);
    [$o, $j] = $roda('pipedrive', $CENARIOS['autorizado (nível 100)']);
    ok('pipedrive (frio): online, lido da base, com a última sincronização', ($j['data']['status'] ?? null) === 'online' && !empty($j['data']['ultima_sincronizacao_ok']), substr($o, 0, 140));
    [$o, $j] = $roda('mercadolivre', $CENARIOS['autorizado (nível 100)']);
    ok('mercadolivre: nao_integrado (estado real, não "configurado")', ($j['data']['estado'] ?? null) === 'nao_integrado');
    [$o, $j] = $roda('logs', $CENARIOS['autorizado (nível 100)']);
    ok('logs (sem fonte): DESCONHECIDO, não "não configurado"', ($j['data']['status'] ?? null) === 'unknown' && ($j['data']['estado'] ?? null) === 'sem_fonte', substr($o, 0, 120));
    [$o, $j] = $roda('integrations', $CENARIOS['autorizado (nível 100)']);
    ok('integrations: resumo REAL (não mais "nenhuma integração ativa")', is_array($j['data']['integrations'] ?? null) && count($j['data']['integrations']) === 3
        && $j['data']['integrations'][0]['status'] === 'online', substr($o, 0, 160));
    [$o, $j] = $roda('cpu', $CENARIOS['autorizado (nível 100)']);
    ok('cpu (autorizado, frio): handler roda e responde', ($j['ok'] ?? null) === true && !isset($j['data']['requer']), substr($o, 0, 100));
} catch (Throwable $e) {
    $falhas++; echo 'FALHA (exceção) ' . get_class($e) . ': ' . $e->getMessage() . "\n";
} finally {
    foreach (array_reverse($criadas) as $t) { $pdo->exec('DROP TABLE IF EXISTS `' . $t . '`'); }
    if (preg_match('#^/srv/dshow-work/status-acesso\.[A-Za-z0-9]{6}$#', $T) && is_dir($T) && !is_link($T)) { shell_exec('rm -rf -- ' . escapeshellarg($T)); }
}
echo "== $total verificações, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
