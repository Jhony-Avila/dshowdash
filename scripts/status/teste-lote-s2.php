<?php
// SEC-002 · lote S2 (AZUL, 27/11) — cards 01–10 do painel principal (dados de jobs) que respondiam SEM sessão (triagem SEC-TRIAGEM-ENDPOINTS.md).
// (1) decisão do AcessoSessao: CLI/loopback passam · externo sem sessão = 401 · $sistema e nível baixo = 403 · com sessão passa
// (2) integração REAL pelo servidor embutido do PHP (cli-server): cópia do api/ deste ramo numa pasta temporária própria, com dublês SÓ de
//     SessionGate (perfil do teste), RedisHelper (cache quente devolve payload sintético) e CorsPolicy; REMOTE_ADDR externo simulado.
//     Nada de Redis local nem config real (o caminho /var/www/dshowdash não existe aqui).
// (3) estático: o portão vem ANTES do cache e do banco em cada arquivo do lote
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$LOTE = ['modules/cards/card-01/api.php' => false, 'modules/cards/card-02/api.php' => false, 'modules/cards/card-03/api.php' => false, 'modules/cards/card-04/api.php' => false, 'modules/cards/card-05/api.php' => false, 'modules/cards/card-06/api.php' => false, 'modules/cards/card-07/api.php' => false, 'modules/cards/card-08/api.php' => false, 'modules/cards/card-09/api.php' => false, 'modules/cards/card-10/api.php' => false];
require $raiz . '/api/core/AcessoSessao.php';
$ok(AcessoSessao::decidir('cli', '', null, true) === null && AcessoSessao::decidir('fpm-fcgi', '127.0.0.1', null, true) === null, 'CLI e loopback passam (interno)');
$ok(AcessoSessao::decidir('fpm-fcgi', '203.0.113.9', null, false) === [401, 'NOT_AUTHENTICATED'], 'externo sem sessão = 401');
$ok(AcessoSessao::decidir('fpm-fcgi', '203.0.113.9', ['user_id' => 8, 'level' => 20], true) === [403, 'FORBIDDEN'] && AcessoSessao::decidir('fpm-fcgi', '203.0.113.9', ['user_id' => 8, 'level' => 20], false) === null, 'nível baixo: 403 só onde exige sistema; passa nos demais');
// (2)
$tmp = sys_get_temp_dir() . '/esq-s2-' . getmypid();
exec('cp -a ' . escapeshellarg("$raiz/api") . ' ' . escapeshellarg("$tmp/api") . ' 2>&1', $o, $rc);
if ($rc !== 0) { @mkdir($tmp, 0700, true); exec('cp -a ' . escapeshellarg("$raiz/api") . ' ' . escapeshellarg("$tmp/api")); }
file_put_contents("$tmp/api/core/SessionGate.php", "<?php final class SessionGate { public static function readOnly(): array { return match (\$_SERVER['HTTP_X_TESTE_PERFIL'] ?? '') { 'admin' => ['user_id' => 7, 'level' => 80], 'baixo' => ['user_id' => 8, 'level' => 20], default => [] }; } public static function __callStatic(\$n, \$a) { return null; } }\n");
file_put_contents("$tmp/api/core/helpers/RedisHelper.php", "<?php final class RedisConfig { const TTL_STATUS = 30; const TTL_MODULES = 60; const TTL_CONFIG = 60; const TTL_EXTERNAL_API = 60; const TTL_METRICS = 60; const TTL_REALTIME = 10; const TTL_SHORT = 10; const TTL_MEDIUM = 60; const TTL_LONG = 300; } final class RedisHelper { public static function serveIfCached(string \$k): bool { header('Content-Type: application/json'); echo json_encode(['ok' => true, 'data' => ['sintetico' => true], 'error' => null]); return true; } public static function cacheAndReturn(...\$a): void {} public static function close(): void {} public static function getInstance() { return null; } }\n");
file_put_contents("$tmp/api/core/CorsPolicy.php", "<?php final class CorsPolicy { public static function __callStatic(\$n, \$a) { return null; } }\n");
file_put_contents("$tmp/roteador.php", "<?php \$_SERVER['REMOTE_ADDR'] = \$_SERVER['HTTP_X_TESTE_REMOTO'] ?? '203.0.113.9'; \$u = parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH); \$p = __DIR__ . \$u; if (!preg_match('#^/api/[a-z0-9_/-]+\\.php\$#', \$u) || !is_file(\$p)) { http_response_code(404); return true; } \$_SERVER['SCRIPT_FILENAME'] = \$p; chdir(dirname(\$p)); require \$p; return true;\n");
$sock = stream_socket_server('tcp://127.0.0.1:0'); $porta = (int) substr(strrchr(stream_socket_get_name($sock, false), ':'), 1); fclose($sock);
$srv = proc_open([PHP_BINARY, '-S', "127.0.0.1:$porta", "$tmp/roteador.php"], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pp, $tmp);
for ($i = 0; $i < 50 && @fsockopen('127.0.0.1', $porta) === false; $i++) { usleep(100000); }
$get = static function (string $arq, string $perfil, ?string $remoto = null) use ($porta): array {
    $h = "X-Teste-Perfil: $perfil\r\n" . ($remoto !== null ? "X-Teste-Remoto: $remoto\r\n" : '');
    $c = @file_get_contents("http://127.0.0.1:$porta/api/$arq", false, stream_context_create(['http' => ['header' => $h, 'ignore_errors' => true, 'timeout' => 10]]));
    return [(int) (preg_match('#HTTP/\S+ (\d{3})#', $http_response_header[0] ?? '', $m) ? $m[1] : 0), (string) $c];
};
$f401 = $f403 = $fadm = $fbaixo = [];
foreach ($LOTE as $arq => $sist) {
    [$s0, $c0] = $get($arq, 'nenhum'); if ($s0 !== 401 || !str_contains($c0, 'NOT_AUTHENTICATED')) { $f401[] = "$arq=$s0"; }
    [$s1, $c1] = $get($arq, 'baixo');
    if ($sist && ($s1 !== 403 || !str_contains($c1, 'FORBIDDEN'))) { $f403[] = "$arq=$s1"; }
    if (!$sist && (in_array($s1, [401, 403], true) || str_contains($c1, 'NOT_AUTHENTICATED'))) { $fbaixo[] = "$arq=$s1"; }
    [$s2, $c2] = $get($arq, 'admin'); if (in_array($s2, [401, 403], true) || str_contains($c2, 'NOT_AUTHENTICATED') || str_contains($c2, 'FORBIDDEN')) { $fadm[] = "$arq=$s2"; }
}
$ok($f401 === [], 'externo sem sessão: 401 nos 10 · falhas ' . implode(',', $f401));
$ok($f403 === [], 'nenhum card exige permissão de sistema (403 não se aplica) · ' . implode(',', $f403));
$ok($fbaixo === [], 'os 10 cards: sessão de nível baixo passa (painel principal de quem está logado) · falhas ' . implode(',', $fbaixo));
$ok($fadm === [], 'admin passa nos 10 · falhas ' . implode(',', $fadm));
[$sl] = $get('modules/cards/card-01/api.php', 'nenhum', '127.0.0.1');
$ok(!in_array($sl, [401, 403], true), 'loopback sem sessão passa (caminho interno) · ' . $sl);
[$sp] = $get('modules/cards/card-11/api.php', 'nenhum');
$ok($sp !== 401, 'card-11 (fica para o lote S3) NÃO foi alterado por este degrau · ' . $sp);
proc_terminate($srv); proc_close($srv);
exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-s2-tmp'));   // nada de rm: o temporário vai para o backup
// (3)
$sem = [];
foreach (array_keys($LOTE) as $arq) {
    $t = (string) file_get_contents("$raiz/api/$arq"); $pg = strpos($t, 'AcessoSessao::exigir(');
    foreach (['serveIfCached', 'getConnection', 'db_connection', 'file_put_contents'] as $x) { $q = strpos($t, $x); if ($pg === false || ($q !== false && $q < $pg)) { $sem[] = "$arq:$x"; break; } }
}
$ok($sem === [], 'portão antes do cache, do banco e da gravação em cada arquivo · ' . implode(',', $sem));
if ($f) { echo "[ERRO] teste-lote-s2:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-lote-s2: $n verificações (cards 01–10: 401 sem sessão; logado passa; interno CLI/loopback; card-11 intacto)\n";
