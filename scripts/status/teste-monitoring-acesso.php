<?php
// SEC-002 · guarda do api/monitoring/ (AZUL, 27/11) — 14 endpoints (+ _init) que respondiam SEM sessão.
// (1) decisão: CLI e loopback passam (caminho interno) · externo sem sessão = 401 · sessão sem permissão de sistema = 403 · admin passa ·
//     X-Forwarded-For forjado não conta (vale o REMOTE_ADDR)
// (2) integração REAL dos arquivos do diretório pelo servidor embutido do PHP (SAPI cli-server, não CLI), numa pasta temporária própria:
//     ApiResponse real; dublês de CorsPolicy, SessionGate (perfil escolhido pelo teste) e RedisHelper (cache quente devolve um payload
//     sintético = "o mesmo formato de hoje"); REMOTE_ADDR simulado como externo pelo roteador de teste. Nada de config real: o caminho
//     /var/www/dshowdash não existe aqui, então um handler que o inclua só falha (e já passou da guarda).
// (3) estático: todo arquivo de entrada passa pelo portão ANTES do cache.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
// (1)
require $raiz . '/api/monitoring/_acesso.php';
$adm = ['user_id' => 7, 'level' => 80]; $baixo = ['user_id' => 8, 'level' => 20]; $papel = ['user_id' => 9, 'level' => 20, 'roles' => ['admin']];
$ok(MonitoramentoAcesso::decidir('cli', '', null) === null, 'CLI (cron com php) passa sem sessão: caminho interno');
$ok(MonitoramentoAcesso::decidir('fpm-fcgi', '127.0.0.1', null) === null && MonitoramentoAcesso::decidir('fpm-fcgi', '::1', null) === null, 'loopback passa sem sessão: caminho interno');
$ok(MonitoramentoAcesso::decidir('fpm-fcgi', '203.0.113.9', null) === [401, 'NOT_AUTHENTICATED'], 'externo sem sessão = 401');
$ok(MonitoramentoAcesso::decidir('fpm-fcgi', '203.0.113.9', $baixo) === [403, 'FORBIDDEN'], 'sessão de nível baixo = 403');
$ok(MonitoramentoAcesso::decidir('fpm-fcgi', '203.0.113.9', $adm) === null && MonitoramentoAcesso::decidir('fpm-fcgi', '203.0.113.9', $papel) === null, 'nível 80 ou papel admin passam');
// (2) integração
$tmp = sys_get_temp_dir() . '/esq-mon-' . getmypid();
$arqs = ['api/_helpers/ApiResponse.php' => (string) file_get_contents("$raiz/api/_helpers/ApiResponse.php"),
         'api/status/_acesso.php' => (string) file_get_contents("$raiz/api/status/_acesso.php"),
         'api/core/CorsPolicy.php' => "<?php final class CorsPolicy { public static function setupApiEndpoint(array \$o = []): void {} public static function handle(...\$a): void {} public static function __callStatic(\$n, \$a) {} }\n",
         'api/core/SessionGate.php' => "<?php final class SessionGate { public static function readOnly(): array { return match (\$_SERVER['HTTP_X_TESTE_PERFIL'] ?? '') { 'admin' => ['user_id' => 7, 'level' => 80], 'baixo' => ['user_id' => 8, 'level' => 20], default => [] }; } }\n",
         'api/core/helpers/RedisHelper.php' => "<?php final class RedisConfig { const TTL_STATUS = 30; const TTL_MODULES = 60; const TTL_CONFIG = 60; const TTL_EXTERNAL_API = 60; const TTL_METRICS = 60; const TTL_REALTIME = 10; } final class RedisHelper { public static function serveIfCached(string \$k): bool { header('Content-Type: application/json'); echo json_encode(['ok' => true, 'data' => ['sintetico' => true, 'chave' => \$k], 'error' => null]); return true; } public static function cacheAndReturn(...\$a): void {} public static function close(): void {} public static function getInstance() { return null; } }\n",
         'roteador.php' => "<?php \$_SERVER['REMOTE_ADDR'] = \$_SERVER['HTTP_X_TESTE_REMOTO'] ?? '203.0.113.9'; \$u = parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH); \$p = __DIR__ . \$u; if (!preg_match('#^/api/monitoring/[a-z_]+\\.php\$#', \$u) || !is_file(\$p)) { http_response_code(404); return true; } \$_SERVER['SCRIPT_FILENAME'] = \$p; chdir(dirname(\$p)); require \$p; return true;\n"];
foreach (glob("$raiz/api/monitoring/*.php") as $x) { $arqs['api/monitoring/' . basename($x)] = (string) file_get_contents($x); }
foreach ($arqs as $p => $c) { @mkdir(dirname("$tmp/$p"), 0700, true); file_put_contents("$tmp/$p", $c); }
$sock = stream_socket_server('tcp://127.0.0.1:0'); $porta = (int) substr(strrchr(stream_socket_get_name($sock, false), ':'), 1); fclose($sock);
$srv = proc_open([PHP_BINARY, '-S', "127.0.0.1:$porta", "$tmp/roteador.php"], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pp, $tmp);
for ($i = 0; $i < 50 && @fsockopen('127.0.0.1', $porta) === false; $i++) { usleep(100000); }
$get = static function (string $arq, string $perfil, ?string $remoto = null) use ($porta): array {
    $h = "X-Teste-Perfil: $perfil\r\n" . ($remoto !== null ? "X-Teste-Remoto: $remoto\r\n" : '');
    $corpo = @file_get_contents("http://127.0.0.1:$porta/api/monitoring/$arq", false, stream_context_create(['http' => ['header' => $h, 'ignore_errors' => true, 'timeout' => 10]]));
    $st = (int) (preg_match('#HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m) ? $m[1] : 0);
    return [$st, (string) $corpo];
};
$entradas = array_values(array_filter(array_map('basename', glob("$raiz/api/monitoring/*.php")), static fn ($x) => !in_array($x, ['_init.php', '_acesso.php'], true)));
$ok(count($entradas) === 15, '15 arquivos de entrada no diretório (14 do inventário + collect.php, invólucro) · ' . count($entradas));
$falhas401 = $falhas403 = $falhasAdm = $semFormato = []; $formato = 0;
foreach ($entradas as $e) {
    [$s0, $c0] = $get($e, 'nenhum');
    if ($s0 !== 401 || !str_contains($c0, 'NOT_AUTHENTICATED')) { $falhas401[] = "$e=$s0"; }
    [$s1, $c1] = $get($e, 'baixo');
    if ($s1 !== 403 || !str_contains($c1, 'FORBIDDEN')) { $falhas403[] = "$e=$s1"; }
    [$s2, $c2] = $get($e, 'admin');
    if (in_array($s2, [401, 403], true) || str_contains($c2, 'NOT_AUTHENTICATED') || str_contains($c2, 'FORBIDDEN')) { $falhasAdm[] = "$e=$s2"; }
    if ($s2 === 200 && str_contains($c2, '"sintetico":true')) { $formato++; } elseif (str_contains((string) file_get_contents("$raiz/api/monitoring/$e"), 'serveIfCached')) { $semFormato[] = "$e=$s2:" . substr(trim(strip_tags($c2)), 0, 90); }
}
$ok($falhas401 === [], 'externo sem sessão: 401 NOT_AUTHENTICATED nos 15 · falhas ' . implode(',', $falhas401));
$ok($falhas403 === [], 'sessão de nível baixo: 403 FORBIDDEN nos 15 · falhas ' . implode(',', $falhas403));
$ok($falhasAdm === [], 'admin: passa da guarda nos 15 · falhas ' . implode(',', $falhasAdm));
$ok($semFormato === [], "admin: $formato endpoints com cache quente devolvem o payload de hoje, intacto (200, mesmo envelope) · " . implode(' | ', $semFormato));
[$sl, $cl] = $get('get_jobs_status.php', 'nenhum', '127.0.0.1');
$ok($sl === 200 && str_contains($cl, '"sintetico":true'), 'loopback sem sessão (cron interno com curl): passa, mesmo formato');
[$sx] = (function () use ($porta) { $c = @file_get_contents("http://127.0.0.1:$porta/api/monitoring/get_jobs_status.php", false, stream_context_create(['http' => ['header' => "X-Teste-Perfil: nenhum\r\nX-Forwarded-For: 127.0.0.1\r\n", 'ignore_errors' => true]])); return [(int) (preg_match('#HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m) ? $m[1] : 0)]; })();
$ok($sx === 401, 'X-Forwarded-For: 127.0.0.1 forjado de fora NÃO abre (vale o REMOTE_ADDR)');
proc_terminate($srv); proc_close($srv);
foreach (array_reverse(array_keys($arqs)) as $p) { @unlink("$tmp/$p"); }
foreach (['api/monitoring', 'api/_helpers', 'api/status', 'api/core/helpers', 'api/core', 'api'] as $d) { @rmdir("$tmp/$d"); } @rmdir($tmp);   // só o temporário deste teste
// (3) estático
$semPortao = [];
foreach ($entradas as $e) {
    $t = (string) file_get_contents("$raiz/api/monitoring/$e");
    $pg = min(array_filter([strpos($t, "require_once __DIR__ . '/_init.php'"), strpos($t, 'MonitoramentoAcesso::exigir()')], 'is_int') ?: [PHP_INT_MAX]);
    $pc = strpos($t, 'serveIfCached'); $pb = strpos($t, 'db_connection');
    if ($pg === PHP_INT_MAX || ($pc !== false && $pc < $pg) || ($pb !== false && $pb < $pg)) { $semPortao[] = $e; }
}
$ok($semPortao === [], 'todo arquivo de entrada passa pelo portão antes do cache e do banco · ' . implode(',', $semPortao));
if ($f) { echo "[ERRO] teste-monitoring-acesso:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-monitoring-acesso: $n verificações (15 arquivos: 401 sem sessão, 403 nível baixo, admin passa com o formato de hoje; interno só por CLI/loopback; XFF forjado não abre)\n";
