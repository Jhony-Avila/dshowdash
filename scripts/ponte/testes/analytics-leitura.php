<?php
declare(strict_types=1);
/**
 * Noite 2 (31/10/2026) — Ponte v2, módulo de LEITURA `analytics`: pelo NÚCLEO (pv2_executar com PDO falso e ambiente injetado) prova que
 * flag OFF = 404 (módulo inerte), nível 49 = 403 nos relatórios e 79 = 403 no "Status da integração", nível 50 lê a visão geral com
 * `meta.fonte` presente (mock aqui: GA_PROVIDER ausente), filtro inválido = 422, relatório fora da allowlist = 404. Sem rede.
 */
require_once __DIR__ . '/../../../api/ponte/PonteV2Core.php';
require_once __DIR__ . '/_pdo-falso-v2.php';
putenv('GA_PROVIDER');   // ausente = mock (padrão do módulo)
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/pv2-ga-' . getmypid(); @mkdir("$dir/nonces", 0700, true);
$segredo = str_repeat('k', 48); $agora = 1_800_000_000; $n = 0;
$pdo = static function (int $nivel): PdoFalsoV2 {
    $p = new PdoFalsoV2();
    $p->respostas = [
        '/^SELECT id, status, deleted_at FROM app_users WHERE id = \?/' => ['linhas' => [['id' => 7, 'status' => 'active', 'deleted_at' => null]]],
        '/^SELECT r\.id, r\.role_key, r\.role_name, r\.level FROM app_user_roles ur JOIN app_roles r/' => ['linhas' => [['id' => 1, 'role_key' => 'x', 'role_name' => 'X', 'level' => $nivel]]],
        '/^INSERT IGNORE INTO app_ponte_ops/' => ['afetadas' => 1],
    ];
    return $p;
};
$srv = static function (string $corpo) use ($segredo, $agora, &$n): array {
    $n++; $ts = (string)$agora; $nonce = sprintf('nonce-ga-%04d-0123456789', $n);
    return ['REMOTE_ADDR' => '127.0.0.1', 'REQUEST_METHOD' => 'POST', 'REQUEST_URI' => '/api/ponte/', 'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce,
        'HTTP_X_APP_SIG' => PonteAuth::assinar($segredo, $ts, $nonce, 'POST', '/api/ponte/', $corpo)];
};
$pedido = static fn (string $acao, array $payload = []): string => json_encode(['user_id' => 7, 'modulo' => 'analytics', 'acao' => $acao, 'payload' => $payload, 'request_id' => 'req-ga-' . bin2hex(random_bytes(6))]);
$amb = static fn (bool $flag): array => ['flagGeral' => true, 'flagsModulo' => ['ponte.analytics.leitura' => $flag], 'segredo' => $segredo, 'dirNonces' => "$dir/nonces", 'agora' => $agora, 'resolver' => "$dir/nao-existe.php"];
$exec = static function (int $nivel, string $corpo, bool $flag = true) use ($pdo, $srv, $amb): array { return pv2_executar($pdo($nivel), $srv($corpo), $corpo, $amb($flag)); };

[$s] = $exec(100, $pedido('visao_geral'), false); $ok($s === 404, "[1] flag OFF → 404 (tem $s)");
[$s, $e] = $exec(49, $pedido('visao_geral')); $ok($s === 403 && $e['error'] === 'PERMISSAO_NEGADA', "[2] nível 49 → 403 nos relatórios (tem $s)");
[$s, $e] = $exec(50, $pedido('visao_geral', ['filtros' => ['periodo' => '7d']])); $ok($s === 200 && ($e['data']['meta']['fonte'] ?? '') === 'mock' && count($e['data']['serie'] ?? []) === 7, "[3] nível 50 lê a visão geral com meta.fonte (tem $s)");
[$s] = $exec(79, $pedido('status')); $ok($s === 403, "[4] status da integração exige 80 (tem $s)");
[$s, $e] = $exec(80, $pedido('status')); $ok($s === 200 && isset($e['data']['pronto']), "[5] nível 80 lê o status (tem $s)");
[$s, $e] = $exec(50, $pedido('aquisicao', ['filtros' => ['inicio' => '31/10/2026', 'fim' => '2026-10-31']])); $ok($s === 422 && $e['error'] === 'VALIDACAO', "[6] filtro inválido → 422 (tem $s)");
[$s, $e] = $exec(100, $pedido('apagar_tudo')); $ok($s === 400 && empty($e['ok']), "[7] ação fora da allowlist → 400 do núcleo, nada executado (tem $s)");
foreach (array_keys(PV2_ALLOWLIST['analytics']) as $acao) { $ok(PV2_ALLOWLIST['analytics'][$acao]['tipo'] === 'leitura', "[8] analytics.$acao é LEITURA"); }
@array_map('unlink', glob("$dir/nonces/*") ?: []); @rmdir("$dir/nonces"); @rmdir($dir);
if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "analytics-leitura: OK (8 grupos)\n";
