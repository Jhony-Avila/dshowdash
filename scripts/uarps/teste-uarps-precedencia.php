<?php
// UARPS · tabela de precedência do GPT Warps (entrega (a), precedencia.json, base P89j) executada em PHP contra o UARPSGate/UARPSPadrao
// REAIS deste ramo (AZUL, 27/11). 30 casos de decisão + 12 de aplicação = 42.
// MySQL LOCAL descartável (esq_uarpsp_<pid>; criado e apagado no fim pela regra das 05:00) com o relógio
// do banco FIXO no "agora" do JSON (SET TIMESTAMP): "agora" = igualdade exata (vencida), passado/futuro = ±1 min. Cada caso usa um usuário
// próprio (o cache do Gate é por usuário). Falha de leitura de nível/regras = tabela renomeada só durante aquele caso.
// Aplicação: cada caso num processo próprio (403 + exit não pode derrubar o teste), com shouldEnforce() ligado/desligado.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
$J = json_decode((string) file_get_contents(__DIR__ . '/precedencia-gpt-warps.json'), true);
$falhas = []; $n = 0; $linhas = [];
try { $root = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); }
catch (Throwable) { echo "[PULADO] teste-uarps-precedencia: MySQL local indisponível\n"; exit(0); }
$db = 'esq_uarpsp_' . getmypid();
$root->exec("CREATE DATABASE $db");
$tmp = sys_get_temp_dir() . '/esq-uarpsp-' . getmypid();
foreach (['api/core/UARPSGate.php', 'api/core/UARPSPadrao.php', 'api/core/AccessLevels.php', 'api/core/UARPSEnforcer.php'] as $a) { @mkdir(dirname("$tmp/$a"), 0700, true); copy("$raiz/$a", "$tmp/$a"); }
@mkdir("$tmp/config", 0700, true);
file_put_contents("$tmp/config/uarps.php", "<?php final class UARPSConfig { public static function getMode(): string { return getenv('T_ENFORCE') ? 'enforced' : 'shadow'; } public static function isActive(): bool { return true; } public static function shouldEnforce(): bool { return (bool) getenv('T_ENFORCE'); } public static function shouldLogDivergence(): bool { return true; } public static function get(\$k, \$d = null) { return \$d; } }\n");
$agora = (string) $J['agora'];
file_put_contents("$tmp/config/db_connection.php", "<?php function getConnection(string \$b): PDO { \$p = new PDO('mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); \$p->exec(\"SET TIMESTAMP = UNIX_TIMESTAMP('$agora')\"); return \$p; }\n");
$pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach ([
    "CREATE TABLE app_users (id INT PRIMARY KEY, status ENUM('active','disabled','locked','pending') DEFAULT 'active', deleted_at DATETIME NULL)",
    "CREATE TABLE app_roles (id INT PRIMARY KEY, level INT, deleted_at DATETIME NULL)",
    "CREATE TABLE app_user_roles (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, role_id INT, expires_at DATETIME(3) NULL, deleted_at DATETIME NULL)",
    "CREATE TABLE app_user_trigger_permissions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, trigger_id VARCHAR(100), state ENUM('allow','deny','inherit'), expires_at DATETIME(3) NULL, deleted_at DATETIME(3) NULL)",
    "CREATE TABLE app_user_region_permissions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, region_id VARCHAR(100), state ENUM('allow','deny','inherit'), expires_at DATETIME(3) NULL, deleted_at DATETIME(3) NULL)",
    "CREATE TABLE app_uarps_divergence_log (id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NOT NULL, trigger_id VARCHAR(100), region_id VARCHAR(100), endpoint VARCHAR(255) NOT NULL DEFAULT '', legacy_result ENUM('allow','deny') NOT NULL, uarps_result ENUM('allow','deny') NOT NULL, user_level INT NOT NULL DEFAULT 0, required_level INT NULL, context JSON NULL, ip_address VARCHAR(45) NULL, created_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3))",
    "INSERT INTO app_roles VALUES (20, 20, NULL), (80, 80, NULL), (100, 100, NULL)",
] as $q) { $pdo->exec($q); }
$prazo = static fn (string $p): ?string => match ($p) { 'futuro' => date('Y-m-d H:i:s', strtotime($agora) + 60), 'passado' => date('Y-m-d H:i:s', strtotime($agora) - 60), 'agora' => $agora, default => null };
$prep = static function (int $uid, int $nivel, string $rec, ?string $linha, string $pz, bool $excl) use ($pdo, $J, $prazo): string {
    $pdo->prepare('INSERT INTO app_users (id) VALUES (?)')->execute([$uid]);
    $pdo->prepare('INSERT INTO app_user_roles (user_id, role_id) VALUES (?, ?)')->execute([$uid, $nivel]);
    $chave = $J['chaves_sinteticas'][$rec];
    if ($linha !== null) {
        $t = $rec === 'REGIAO' ? 'app_user_region_permissions' : 'app_user_trigger_permissions'; $c = $rec === 'REGIAO' ? 'region_id' : 'trigger_id';
        $pdo->prepare("INSERT INTO $t (user_id, $c, state, expires_at, deleted_at) VALUES (?, ?, ?, ?, ?)")->execute([$uid, $chave, $linha, $prazo($pz), $excl ? '2029-12-31 00:00:00' : null]);
    }
    return $chave;
};
putenv("T_DB=$db");
require "$tmp/api/core/UARPSGate.php";
$uid = 5000;
foreach ($J['casos'] as $c) {
    $uid++;
    $chave = $prep($uid, (int) $c['nivel'], $c['recurso'], $c['linha'], (string) $c['prazo'], (bool) $c['excluida']);
    $renomear = $c['falha'] === 'consulta_nivel' ? 'app_roles' : ($c['falha'] === 'consulta_regras' ? ($c['recurso'] === 'REGIAO' ? 'app_user_region_permissions' : 'app_user_trigger_permissions') : null);
    if ($renomear) { $pdo->exec("RENAME TABLE $renomear TO {$renomear}__fora"); }
    $r = $c['recurso'] === 'REGIAO' ? UARPSGate::checkRegion($uid, $chave) : UARPSGate::checkTrigger($uid, $chave);
    if ($renomear) { $pdo->exec("RENAME TABLE {$renomear}__fora TO $renomear"); }
    $okC = ($r['allowed'] ?? null) === $c['permitido'] && ($r['state'] ?? null) === $c['estado_esperado'] && ($r['source'] ?? null) === $c['origem'];
    $n++; if (!$okC) { $falhas[] = "{$c['id']}: obtido allowed=" . var_export($r['allowed'] ?? null, true) . " state=" . ($r['state'] ?? '?') . " source=" . ($r['source'] ?? '?') . " · esperado {$c['permitido']}/{$c['estado_esperado']}/{$c['origem']}"; }
    $linhas[] = sprintf('%s %-9s nível %3d · %-8s %-9s%s%s → %s', $okC ? 'ok   ' : 'FALHA', $c['recurso'], $c['nivel'], (string) ($c['linha'] ?? 'ausente'), $c['prazo'], $c['excluida'] ? ' excluída' : '', $c['falha'] ? " falha:{$c['falha']}" : '', ($r['allowed'] ? 'permite' : 'nega') . " ({$r['state']}, {$r['source']})");
}
// aplicação: um processo por caso
$run = "$tmp/aplicar.php";
file_put_contents($run, '<?php require "' . $tmp . '/api/core/UARPSGate.php"; register_shutdown_function(static function () { fwrite(STDERR, "HTTP=" . (int) http_response_code() . ";"); });'
    . ' $u = (int) getenv("T_UID"); $k = (string) getenv("T_CHAVE"); $e = (string) getenv("T_ENTRADA");'
    . ' $r = match ($e) { "enforceTrigger" => UARPSGate::enforceTrigger($u, $k, "/teste"), "enforceRegion" => UARPSGate::enforceRegion($u, $k, "/teste"), "sombraTrigger" => UARPSGate::sombraTrigger($u, $k, "/teste") };'
    . ' echo "RET=" . var_export($r, true);');
foreach ($J['aplicacao'] as $a) {
    $uid++;
    $rec = $a['entrada'] === 'enforceRegion' ? 'REGIAO' : 'UI0';
    $chave = $prep($uid, 20, $rec, $a['check'] ? 'allow' : 'deny', 'sem_prazo', false);
    $env = 'T_UID=' . $uid . ' T_CHAVE=' . escapeshellarg($chave) . ' T_ENTRADA=' . $a['entrada'] . ($a['enforced'] ? ' T_ENFORCE=1' : '');
    $p = proc_open("$env " . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg($run), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pp);
    $o = stream_get_contents($pp[1]); $er = stream_get_contents($pp[2]); fclose($pp[1]); fclose($pp[2]); proc_close($p);
    $obt = str_contains($er, 'HTTP=403') && !str_contains($o, 'RET=') ? '403_e_encerra' : (str_contains($o, 'RET=true') ? 'retorna_true' : (str_contains($o, 'RET=false') ? 'retorna_false' : 'erro'));
    $okA = $obt === $a['resultado']; $n++;
    if (!$okA) { $falhas[] = "aplicação {$a['entrada']} check=" . var_export($a['check'], true) . " enforced=" . var_export($a['enforced'], true) . ": obtido $obt · esperado {$a['resultado']}"; }
    $linhas[] = sprintf('%s aplicação %-14s check=%-5s enforced=%-5s → %s', $okA ? 'ok   ' : 'FALHA', $a['entrada'], var_export($a['check'], true), var_export($a['enforced'], true), $obt);
}
// nada de rm (regra da janela 27/11): o banco de teste é renomeado e o temporário vai para o backup
$root->exec("DROP DATABASE IF EXISTS `$db`");   // regra das 05:00: banco descartável deste teste é apagado
exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-precedencia-tmp'));
$saida = getenv('PRECEDENCIA_SAIDA');
if ($saida) { file_put_contents($saida, "# Precedência do GPT Warps × UARPSGate real (" . date('Y-m-d H:i') . ")\n\n" . implode("\n", $linhas) . "\n\n" . ($falhas ? "FALHAS:\n- " . implode("\n- ", $falhas) : "42/42 ok") . "\n"); }
if ($falhas) { echo "[ERRO] teste-uarps-precedencia: " . count($falhas) . "/$n\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "[OK]   teste-uarps-precedencia: $n/$n casos do GPT Warps (30 de decisão + 12 de aplicação) iguais ao UARPSGate real\n";
