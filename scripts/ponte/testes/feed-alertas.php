<?php
declare(strict_types=1);
/**
 * 25/11/2026 noite (ESQUERDA) — Ponte v2, LEITURA `feed_alertas.listar`: pelo NÚCLEO prova flag OFF = 404 e nível 49 = 403; pelo núcleo puro
 * da lib (fontes falsas, sem banco) prova a junção: ordem por gravidade/antiguidade, fonte indisponível sem alertas e SEM derrubar a outra,
 * Asaas sem as travas = `sem_permissao` e a leitura do Asaas NEM é chamada.
 */
require_once __DIR__ . '/../../../api/ponte/PonteV2Core.php';
require_once __DIR__ . '/_pdo-falso-v2.php';
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/pv2-feed-' . getmypid(); @mkdir("$dir/nonces", 0700, true);
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
    $n++; $ts = (string)$agora; $nonce = sprintf('nonce-feed-%04d-0123456789', $n);
    return ['REMOTE_ADDR' => '127.0.0.1', 'REQUEST_METHOD' => 'POST', 'REQUEST_URI' => '/api/ponte/', 'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce,
        'HTTP_X_APP_SIG' => PonteAuth::assinar($segredo, $ts, $nonce, 'POST', '/api/ponte/', $corpo)];
};
$corpo = static fn (): string => json_encode(['user_id' => 7, 'modulo' => 'feed_alertas', 'acao' => 'listar', 'payload' => [], 'request_id' => 'req-feed-' . bin2hex(random_bytes(6))]);
$amb = static fn (bool $flag): array => ['flagGeral' => true, 'flagsModulo' => ['ponte.feed_alertas.leitura' => $flag], 'segredo' => $segredo, 'dirNonces' => "$dir/nonces", 'agora' => $agora, 'resolver' => "$dir/nao-existe.php"];
$c = $corpo(); [$s] = pv2_executar($pdo(100), $srv($c), $c, $amb(false)); $ok($s === 404, "[1] flag OFF → 404 (tem $s)");
$c = $corpo(); [$s, $e] = pv2_executar($pdo(49), $srv($c), $c, $amb(true)); $ok($s === 403 && ($e['error'] ?? '') === 'PERMISSAO_NEGADA', "[2] nível 49 → 403 (tem $s)");
$ok((PV2_ALLOWLIST['feed_alertas']['listar']['tipo'] ?? '') === 'leitura' && (PV2_ALLOWLIST['feed_alertas']['listar']['nivel'] ?? 0) === 50, '[3] feed_alertas.listar é LEITURA nível 50');

$al = static fn (string $id, string $sev, ?string $desde) => ['id' => $id, 'type' => 't', 'severity' => $sev, 'status' => 'active', 'title' => $id, 'first_seen_at' => $desde];
$pipe = static fn () => ['alertas' => [$al('pipedrive:sem_proxima_atividade:9', 'warning', null), $al('pipedrive:parado_ha_dias:3', 'critical', '2026-09-01T00:00:00Z'), $al('pipedrive:parado_ha_dias:4', 'warning', '2026-10-01T00:00:00Z')]];
$asa = static fn () => ['alertas' => [$al('asaas:vencidas_acima:loja', 'critical', null), $al('asaas:sem_leitura:b', 'info', null)]];
$r = feed_alertas_montar($pipe, $asa, static fn () => true, $agora);
$ok(array_column($r['alertas'], 'id') === ['pipedrive:parado_ha_dias:3', 'asaas:vencidas_acima:loja', 'pipedrive:parado_ha_dias:4', 'pipedrive:sem_proxima_atividade:9', 'asaas:sem_leitura:b']
    && $r['fontes'] === ['pipedrive' => 'ok', 'asaas' => 'ok'] && $r['total'] === 5, '[4] junção ordenada (gravidade → mais antigo → id), fontes ok');
$r = feed_alertas_montar(static fn () => null, $asa, static fn () => true, $agora);
$ok($r['fontes']['pipedrive'] === 'indisponivel' && $r['fontes']['asaas'] === 'ok' && $r['total'] === 2, '[5] Pipedrive indisponível (null) → sem os alertas dele, Asaas segue');
$chamou = false;
$r = feed_alertas_montar($pipe, static function () use (&$chamou) { $chamou = true; return ['alertas' => []]; }, static fn () => false, $agora);
$ok($r['fontes']['asaas'] === 'sem_permissao' && !$chamou && $r['total'] === 3, '[6] sem as travas do Asaas → sem_permissao e a leitura do Asaas não é chamada');
$r = feed_alertas_montar(static fn () => throw new RuntimeException('x'), static fn () => throw new RuntimeException('y'), static fn () => true, $agora);
$ok($r['fontes'] === ['pipedrive' => 'indisponivel', 'asaas' => 'indisponivel'] && $r['alertas'] === [], '[7] as duas fontes falham → indisponivel, nunca lista "sem alertas" com fonte ok');
@array_map('unlink', glob("$dir/nonces/*") ?: []); @rmdir("$dir/nonces"); @rmdir($dir);
if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "feed-alertas: OK (7 grupos)\n";
