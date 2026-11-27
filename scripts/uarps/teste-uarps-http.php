<?php
// UARPS · reenvio após PERDA DA RESPOSTA pela ENTRADA HTTP SERVIDA (GPT Warps A1, parecer R25-A1-A3-B6) — AZUL (ESQUERDA), 27/11/2026.
// A entrada é o controlador REAL api/permissions/uarps.php servido por `php -S`, com o UARPSGate REAL (modo enforce), o GuardaDono REAL,
// o serviço/escritor REAIS e um MySQL LOCAL descartável (esq_uarpsh_<pid>). Dublês SÓ de sessão/CSRF (identidade sintética por cabeçalho),
// CorsPolicy e Redis. Dono FICTÍCIO = 990075 (definido antes de carregar o GuardaDono; nunca o id 75 em teste). Sem rede externa.
//  H1 POST set-trigger enviado e a conexão FECHADA sem ler a resposta → a regra foi gravada uma vez, com 1 evento
//  H2 reenvio com a MESMA Idempotency-Key e o mesmo corpo → 200 com X/“replay”, nenhuma linha nova, nenhum evento novo
//  H3 mesma chave com OUTRO corpo → 409, nada muda · H4 sem chave → 400 OPERACAO_ID_OBRIGATORIO, nada muda
//  H5 sem CSRF → 403, nada muda · H6 não-Dono sem gate → 403, nada muda
//  H7 remoção perdida + reenvio (DELETE com operacao_id) → 1 exclusão lógica e 1 evento; reenvio = mesma resposta
//  H8 lista fixa ausente NÃO se aplica aqui (constante de produção carregada): a entrada servida identifica o escritor (sha do serviço)
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
$f = []; $n = 0; $detalhe = getenv('DETALHE') === '1';
$ok = static function (bool $c, string $nome) use (&$f, &$n, $detalhe): void { $n++; if (!$c) { $f[] = $nome; } elseif ($detalhe) { echo '[ok] ', $nome, "\n"; } };
try { $root = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (Throwable) { echo "[PULADO] teste-uarps-http: MySQL local indisponível\n"; exit(0); }
$db = 'esq_uarpsh_' . getmypid();
$tmp = sys_get_temp_dir() . '/esq-uarpsh-' . getmypid();
$srv = null;
register_shutdown_function(static function () use ($root, $db, $tmp, &$srv): void {
    if (is_resource($srv)) { proc_terminate($srv); proc_close($srv); }
    $root->exec("DROP DATABASE IF EXISTS $db");   // banco de teste descartável (regra das 05:00)
    if (is_dir($tmp)) { exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-uarps-http-tmp')); }
});
// árvore temporária: api/ INTEIRA do candidato + dublês + config/ de teste (nunca a config real)
exec('mkdir -p ' . escapeshellarg($tmp) . ' && cp -a ' . escapeshellarg("$raiz/api") . ' ' . escapeshellarg("$tmp/api"));
@mkdir("$tmp/config", 0700, true);
// db_connection de teste com as MESMAS opções do real (ERRMODE exceção, FETCH_ASSOC, sem prepares emulados)
file_put_contents("$tmp/config/db_connection.php", "<?php\nif (!function_exists('getConnection')) { function getConnection(string \$b): PDO { \$p = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]); return \$p; } }\n");
file_put_contents("$tmp/config/uarps.php", "<?php\nif (!class_exists('UARPSConfig')) { final class UARPSConfig { public static function getMode(): string { return 'enforce'; } public static function isActive(): bool { return true; } public static function shouldEnforce(): bool { return true; } public static function shouldLog(): bool { return false; } public static function __callStatic(\$n, \$a) { return null; } } }\n");
file_put_contents("$tmp/api/core/CorsPolicy.php", "<?php\nif (!class_exists('CorsPolicy')) { final class CorsPolicy { public static function setupApiEndpoint(array \$o = []): void { header('Content-Type: application/json; charset=utf-8'); } public static function __callStatic(\$n, \$a) { return null; } } }\n");
file_put_contents("$tmp/api/core/helpers/RedisHelper.php", "<?php\nif (!class_exists('RedisConfig')) { final class RedisConfig { public const TTL_MODULES = 60; public const TTL_SHORT = 30; } }\nif (!class_exists('RedisHelper')) { final class RedisHelper { public static function __callStatic(\$n, \$a) { return null; } } }\n");
file_put_contents("$tmp/api/_helpers/AuthHelpers.php", <<<'PHP'
<?php
// DUBLÊ DE TESTE: identidade sintética por cabeçalho (X-Teste-User) e CSRF por cabeçalho (X-CSRF-Token = csrf-teste). Nada mais.
require_once __DIR__ . '/ApiResponse.php';
if (!function_exists('getCurrentUser')) {
    function getCurrentUser(): ?array { $u = (int) ($_SERVER['HTTP_X_TESTE_USER'] ?? 0); return $u > 0 ? ['id' => $u] : null; }
    function requireAuth(int $minLevel = 0): array { $u = getCurrentUser(); if ($u === null) { ApiResponse::error('UNAUTHORIZED', 401); exit; } return $u; }
    function getCurrentUserId(): int { return (int) (getCurrentUser()['id'] ?? 0); }
    function getCurrentUserLevel(): int { return 0; }
    function getClientIp(): string { return '127.0.0.1'; }
    function requireCsrf(): void { if (($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '') !== 'csrf-teste') { ApiResponse::error('CSRF_INVALID', 403); exit; } }
    function requireCsrfForWrite(): void { requireCsrf(); }
}
if (!class_exists('AuthHelpers')) { final class AuthHelpers { public static function __callStatic($n, $a) { return $n(...$a); } } }
PHP);
file_put_contents("$tmp/roteador.php", "<?php\nif (!defined('DSHOW_DONO_ID')) { define('DSHOW_DONO_ID', 990075); }   // Dono FICTÍCIO (o auto_prepend_file NÃO vale para o roteador do php -S)\n\$p = parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH);\nif (\$p === '/api/permissions/uarps.php') { chdir(__DIR__ . '/api/permissions'); require __DIR__ . '/api/permissions/uarps.php'; return true; }\nif (\$p === '/__dono') { echo DSHOW_DONO_ID; return true; }\nhttp_response_code(404); echo '{}';\n");
// banco descartável com a estrutura da validação + migração do escritor
$root->exec("CREATE DATABASE $db");
foreach (['app_user_trigger_permissions', 'app_user_region_permissions', 'app_roles', 'app_user_roles', 'app_users', 'app_uarps_divergence_log'] as $t) { $root->exec("CREATE TABLE $db.$t LIKE ATRWEB_VAL_DASH.$t"); }
$root->exec("CREATE TABLE $db.app_uarps_audit_log (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, action VARCHAR(50) NOT NULL,
    entity_type ENUM('trigger','region') NOT NULL, entity_id VARCHAR(100) NOT NULL, target_user_id INT UNSIGNED NOT NULL, old_state VARCHAR(20) NULL,
    new_state VARCHAR(20) NULL, reason VARCHAR(255) NULL, ip_address VARCHAR(45) NULL, created_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB");
$pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$mig = (string) file_get_contents("$raiz/scripts/uarps/migracao-uarps-escrita-20261127.sql");
foreach (array_filter(array_map('trim', explode(";\n", $mig))) as $q) { if (!str_starts_with($q, '--') || str_contains($q, "\n")) { $pdo->exec(preg_replace('/^--.*$/m', '', $q)); } }
$D = 990075;
$pdo->exec("INSERT INTO app_roles (id, role_key, role_name, level) VALUES (1, 'super_admin', 'Super', 100), (2, 'equipe', 'Equipe', 20)");
foreach ([$D => 1, 601 => 2, 602 => 2] as $u => $r) {
    $pdo->exec("INSERT INTO app_users (id, email, password, username, status) VALUES ($u, 'u$u@sintetico.invalid', 'x', 'u$u', 'active')");
    $pdo->exec("INSERT INTO app_user_roles (user_id, role_id) VALUES ($u, $r)");
}
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, granted_by, granted_at) VALUES ($D, 'gate:admin:permissions', 'allow', 'r', $D, '2026-11-20 10:00:00')");
// servidor
$porta = 18300 + (getmypid() % 500);
$srv = proc_open([PHP_BINARY, '-S', "127.0.0.1:$porta", "$tmp/roteador.php"], [1 => ['file', '/dev/null', 'w'], 2 => ['file', "$tmp/servidor.log", 'w']], $pp, $tmp);
for ($i = 0; $i < 50 && !@fsockopen('127.0.0.1', $porta); $i++) { usleep(100000); }
$req = static function (string $metodo, string $qs, ?array $corpo, array $cab) use ($porta): array {
    $h = ['Content-Type: application/json'];
    foreach ($cab as $k => $v) { $h[] = "$k: $v"; }
    $ctx = stream_context_create(['http' => ['method' => $metodo, 'header' => implode("\r\n", $h), 'content' => $corpo === null ? '' : json_encode($corpo), 'ignore_errors' => true, 'timeout' => 20]]);
    $b = @file_get_contents("http://127.0.0.1:$porta/api/permissions/uarps.php?$qs", false, $ctx);
    preg_match('#HTTP/\S+ (\d+)#', $http_response_header[0] ?? '', $m);
    return [(int) ($m[1] ?? 0), json_decode((string) $b, true), (string) $b];
};
// envia e FECHA a conexão sem ler nada da resposta (a "perda da resposta" do lado do cliente)
$perder = static function (string $metodo, string $qs, ?array $corpo, array $cab) use ($porta): void {
    $c = $corpo === null ? '' : json_encode($corpo);
    $s = fsockopen('127.0.0.1', $porta);
    $h = "$metodo /api/permissions/uarps.php?$qs HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: " . strlen($c) . "\r\n";
    foreach ($cab as $k => $v) { $h .= "$k: $v\r\n"; }
    fwrite($s, $h . "Connection: close\r\n\r\n" . $c); fclose($s);
};
$esperar = static function (callable $cond): bool { for ($i = 0; $i < 60; $i++) { if ($cond()) { return true; } usleep(100000); } return false; };
$linhas = static fn (int $u, string $k) => (int) $pdo->query("SELECT COUNT(*) FROM app_user_trigger_permissions WHERE user_id = $u AND trigger_id = " . $pdo->quote($k) . ' AND deleted_at IS NULL')->fetchColumn();
$ev = static fn () => (int) $pdo->query('SELECT COUNT(*) FROM app_uarps_audit_log')->fetchColumn();
$foto = static fn () => $pdo->query("SELECT COALESCE(SUM(CRC32(CONCAT_WS('|', id, user_id, trigger_id, state, COALESCE(expires_at,''), COALESCE(reason,''), COALESCE(deleted_at,''), granted_by, granted_at))), 0) FROM app_user_trigger_permissions")->fetchColumn();
$dono = ['X-Teste-User' => (string) $D, 'X-CSRF-Token' => 'csrf-teste'];
$corpo = ['user_id' => 601, 'trigger_id' => 'trigger:panel:http', 'state' => 'allow', 'reason' => 'teste http'];

// H0 a entrada servida usa o Dono FICTÍCIO (nunca a constante de produção 75)
$ok(trim((string) @file_get_contents("http://127.0.0.1:$porta/__dono")) === (string) $D, 'H0 · Dono da entrada servida = 990075 (fictício), não o 75 da produção');
// H1 perda da resposta
$e0 = $ev();
$perder('POST', 'action=set-trigger', $corpo, $dono + ['Idempotency-Key' => 'op-http-00000001']);
$gravou = $esperar(fn () => $linhas(601, 'trigger:panel:http') === 1 && $ev() === $e0 + 1);
$ok($gravou, 'H1 · POST set-trigger com a conexão fechada sem ler a resposta → a regra foi gravada UMA vez, com 1 evento');
// H2 reenvio
$f1 = $foto(); $e1 = $ev();
[$c2, $j2, $b2] = $req('POST', 'action=set-trigger', $corpo, $dono + ['Idempotency-Key' => 'op-http-00000001']);
[$c2b, $j2b] = $req('POST', 'action=set-trigger', $corpo, $dono + ['Idempotency-Key' => 'op-http-00000001']);
$ok($c2 === 200 && $c2b === 200 && ($j2['data'] ?? null) == ($j2b['data'] ?? null) && $foto() === $f1 && $ev() === $e1 && $linhas(601, 'trigger:panel:http') === 1,
    'H2 · reenvio (2×) com a MESMA Idempotency-Key e o mesmo corpo pela entrada servida → 200, mesma resposta, nenhuma linha nem evento novo · ' . substr($b2, 0, 160));
// H3 mesma chave, outro corpo
[$c3, $j3] = $req('POST', 'action=set-trigger', ['state' => 'deny'] + $corpo, $dono + ['Idempotency-Key' => 'op-http-00000001']);
$ok($c3 === 409 && $foto() === $f1 && $ev() === $e1, 'H3 · mesma chave com OUTRO corpo → 409, nada muda · ' . ($j3['error'] ?? json_encode($j3)));
// H4 sem chave
[$c4, $j4] = $req('POST', 'action=set-trigger', ['trigger_id' => 'trigger:panel:sem-chave'] + $corpo, $dono);
$ok($c4 === 400 && ($j4['error'] ?? '') === 'OPERACAO_ID_OBRIGATORIO' && $foto() === $f1 && $ev() === $e1, 'H4 · sem Idempotency-Key → 400 OPERACAO_ID_OBRIGATORIO, nada muda');
// H5 sem CSRF / H6 não-Dono sem gate
[$c5] = $req('POST', 'action=set-trigger', ['trigger_id' => 'trigger:panel:sem-csrf'] + $corpo, ['X-Teste-User' => (string) $D, 'Idempotency-Key' => 'op-http-00000005']);
[$c6] = $req('POST', 'action=set-trigger', ['user_id' => 602] + $corpo, ['X-Teste-User' => '601', 'X-CSRF-Token' => 'csrf-teste', 'Idempotency-Key' => 'op-http-00000006']);
$ok($c5 === 403 && $c6 === 403 && $foto() === $f1 && $ev() === $e1, "H5/H6 · sem CSRF → $c5; não-Dono sem gate:admin:permissions (gate REAL, enforce) → $c6; nada muda");
// H7 remoção perdida + reenvio
$perder('DELETE', 'action=remove-trigger&user_id=601&trigger_id=trigger:panel:http&operacao_id=op-http-00000007', null, $dono);
$removeu = $esperar(fn () => $linhas(601, 'trigger:panel:http') === 0 && $ev() === $e1 + 1);
$f7 = $foto();
[$c7, $j7] = $req('DELETE', 'action=remove-trigger&user_id=601&trigger_id=trigger:panel:http&operacao_id=op-http-00000007', null, $dono);
$ok($removeu && $c7 === 200 && $foto() === $f7 && $ev() === $e1 + 1, 'H7 · DELETE com a conexão fechada → 1 exclusão lógica e 1 evento; reenvio com o mesmo operacao_id → 200, nada novo · ' . json_encode($j7['data'] ?? null, JSON_UNESCAPED_UNICODE));
// H9 leitura pela entrada servida (antes: TypeError `id('user_id', false)` sob strict_types = 500 em 9 ações, inclusive as 2 remoções)
[$c9a, $j9a] = $req('GET', 'action=user-permissions&user_id=601', null, $dono);
[$c9b, $j9b] = $req('GET', 'action=check-trigger&trigger_id=gate:admin:permissions', null, $dono);
$ok($c9a === 200 && $c9b === 200, "H9 · GET user-permissions e check-trigger pela entrada servida → 200 (na P118: 500 por TypeError) · $c9a/$c9b");
// H10 prévia só de leitura pela entrada servida (VERDE E2 (3)): Dono 200 sem gravar; sem o gate 403
$f10 = $foto(); $e10 = $ev();
[$c10, $j10] = $req('GET', 'action=preview-trigger&user_id=' . $D . '&trigger_id=gate:admin:permissions&state=deny', null, $dono);
[$c10b] = $req('GET', 'action=preview-trigger&user_id=602&trigger_id=trigger:panel:x&state=allow', null, ['X-Teste-User' => '601']);
$ok($c10 === 200 && ($j10['data']['bloqueio']['codigo'] ?? '') === 'ANTIBLOQUEIO' && ($j10['data']['gravaria'] ?? true) === false && $c10b === 403 && $foto() === $f10 && $ev() === $e10,
    "H10 · preview-trigger servido: Dono → 200 com o bloqueio ANTIBLOQUEIO e nada gravado; não-Dono sem gate → 403 · $c10/$c10b");
// H11 (B6 J11): histórico pela entrada servida SEM IP e sem e-mail · H12 (B6 J8): vencida NUNCA aparece como vigente (servidor decide)
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, expires_at, granted_by) VALUES
  (602, 'trigger:panel:venceu', 'allow', 'x', DATE_SUB(NOW(3), INTERVAL 1 DAY), $D), (602, 'trigger:panel:vale', 'allow', 'x', DATE_ADD(NOW(3), INTERVAL 30 DAY), $D), (602, 'trigger:panel:sem-prazo', 'allow', 'x', NULL, $D)");
[$c11, $j11, $b11] = $req('GET', 'action=audit&limit=50', null, $dono);
$temIp = preg_match('/"ip_address"|"ip"|email/i', $b11) === 1;
$ok($c11 === 200 && count($j11['data']['logs'] ?? []) > 0 && !$temIp, 'H11 · action=audit servido (HTTP ' . $c11 . ' ' . substr($b11, 0, 120) . '): ' . count($j11['data']['logs'] ?? []) . ' eventos, nenhum com IP ou e-mail');
[$c12, $j12] = $req('GET', 'action=user-permissions&user_id=602', null, $dono);
$t = array_column($j12['data']['triggers'] ?? [], null, 'trigger_id');
$ok($c12 === 200 && ($t['trigger:panel:venceu']['vencida'] ?? null) === true && ($t['trigger:panel:venceu']['vigente'] ?? null) === false && ($t['trigger:panel:venceu']['estado_efetivo'] ?? '') === 'expirada'
    && (int) ($t['trigger:panel:venceu']['granted_by'] ?? 0) === $D && array_key_exists('concedente_nivel_atual', $t['trigger:panel:venceu'] ?? []) && ($t['trigger:panel:vale']['vigente'] ?? null) === true && ($t['trigger:panel:sem-prazo']['vigente'] ?? null) === true && ($t['trigger:panel:sem-prazo']['estado_efetivo'] ?? '') === 'allow',
    'H12 · user-permissions servido: a vencida vem vencida/expirada (não vigente); a de prazo futuro e a sem prazo vêm vigentes; o concedente ORIGINAL (granted_by) e o nível atual dele vêm na leitura (J7) · ' . json_encode(array_map(fn ($x) => $x['estado_efetivo'] ?? null, $t)));
// H13 (Nota 2): o motivo do DELETE vai no CORPO, fora da URL — e chega ao evento
$pdo->exec("INSERT INTO app_user_trigger_permissions (user_id, trigger_id, state, reason, granted_by) VALUES (602, 'trigger:panel:motivo-corpo', 'allow', 'x', $D)");
$ctxD = stream_context_create(['http' => ['method' => 'DELETE', 'header' => "Content-Type: application/json\r\nX-Teste-User: $D\r\nX-CSRF-Token: csrf-teste\r\nIdempotency-Key: op-http-00000013", 'content' => json_encode(['reason' => 'motivo sintético no corpo']), 'ignore_errors' => true]]);
$b13 = @file_get_contents("http://127.0.0.1:$porta/api/permissions/uarps.php?action=remove-trigger&user_id=602&trigger_id=trigger:panel:motivo-corpo", false, $ctxD);
$m13 = (string) $pdo->query("SELECT reason FROM app_uarps_audit_log ORDER BY id DESC LIMIT 1")->fetchColumn();
$ok(str_contains((string) $http_response_header[0], '200') && $m13 === 'motivo sintético no corpo', 'H13 · DELETE com o motivo no CORPO (URL sem motivo) → 200 e o evento registra o motivo · ' . $m13);
// H8 identificação do escritor servido: o sha dos arquivos do escritor na árvore servida = os do candidato
$arqs = ['api/permissions/uarps.php', 'api/permissions/services/UarpsService.php', 'api/core/UarpsRegrasDono.php', 'api/core/UarpsEscrita.php', 'api/core/repositories/UARPSRepository.php'];
$ident = []; foreach ($arqs as $a) { $ident[$a] = substr(hash_file('sha256', "$tmp/$a"), 0, 12); }
$ok(array_reduce($arqs, fn ($c, $a) => $c && hash_file('sha256', "$tmp/$a") === hash_file('sha256', "$raiz/$a"), true), 'H8 · escritor servido = candidato (sha256 por arquivo) · ' . json_encode($ident));

if ($f) { echo "[ERRO] teste-uarps-http:\n"; foreach ($f as $x) { echo " - $x\n"; } echo "--- servidor.log (últimas linhas)\n"; echo implode("\n", array_slice(file("$tmp/servidor.log", FILE_IGNORE_NEW_LINES) ?: [], -15)), "\n"; exit(1); }
echo "[OK]   teste-uarps-http: $n verificações (reenvio após perda da resposta pela entrada SERVIDA: set e remoção; mesma chave/outro corpo 409; sem chave 400; CSRF e gate reais 403; escritor servido identificado)\n";
