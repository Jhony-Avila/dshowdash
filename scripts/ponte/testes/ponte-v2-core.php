<?php
declare(strict_types=1);
/**
 * W1 (Programa PARIDADE TOTAL) — testes do NÚCLEO da Ponte v2 (pv2_executar) com PDO falso, servidor falso e ambiente injetado:
 * método, banco, flag geral (inerte antes do HMAC), corpo, segredo, HMAC/IP, pedido inválido, allowlist, flag do módulo, usuário inativo,
 * nível, cada ação da W1 (SQL executada e binds), erros de negócio (404/409/422), idempotência (replay sem reexecutar, divergente,
 * em andamento, retomada), auditoria dupla, erro interno (chave liberada). uso: php scripts/ponte/testes/ponte-v2-core.php
 */
require_once __DIR__ . '/../../../api/ponte/PonteV2Core.php';
require_once __DIR__ . '/_pdo-falso-v2.php';
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/pv2-core-' . getmypid(); @mkdir("$dir/nonces", 0700, true);
$segredo = str_repeat('z', 48); $agora = 1_800_000_000; $n = 0;
$SQL_USER = '/^SELECT id, status, deleted_at FROM app_users WHERE id = \?/';
$SQL_ROLES = '/^SELECT r\.id, r\.role_key, r\.role_name, r\.level FROM app_user_roles ur JOIN app_roles r/';
$SQL_IDEM_INS = '/^INSERT IGNORE INTO app_ponte_ops/';
$SQL_IDEM_SEL = '/^SELECT corpo_hash, status, resposta_json, UNIX_TIMESTAMP\(criado_em\) AS criado FROM app_ponte_ops/';
$SQL_IDEM_RETOMA = '/^UPDATE app_ponte_ops SET criado_em = FROM_UNIXTIME\(\?\) WHERE/';
$pdoBase = static function (array $extra = [], int $nivel = 80) use ($SQL_USER, $SQL_ROLES, $SQL_IDEM_INS): PdoFalsoV2 {
    $p = new PdoFalsoV2();
    $p->respostas = $extra + [
        $SQL_USER => ['linhas' => [['id' => 7, 'status' => 'active', 'deleted_at' => null]]],
        $SQL_ROLES => ['linhas' => $nivel > 0 ? [['id' => 1, 'role_key' => 'x', 'role_name' => 'X', 'level' => $nivel]] : []],
        $SQL_IDEM_INS => ['afetadas' => 1],
    ];
    return $p;
};
$srv = static function (string $corpo, array $sobre = []) use ($segredo, $agora, &$n): array {
    $n++; $ts = (string)($sobre['ts'] ?? $agora); $nonce = sprintf('nonce-%04d-0123456789ab', $n);
    return ['REMOTE_ADDR' => $sobre['ip'] ?? '127.0.0.1', 'REQUEST_METHOD' => $sobre['metodo'] ?? 'POST', 'REQUEST_URI' => '/api/ponte/',
        'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce, 'HTTP_X_APP_SIG' => PonteAuth::assinar($sobre['segredo'] ?? $segredo, $ts, $nonce, 'POST', '/api/ponte/', $corpo)];
};
$amb = ['flagGeral' => true, 'flagsModulo' => ['ponte.alertas.escrita' => true, 'ponte.notificacoes.escrita' => true], 'segredo' => $segredo, 'dirNonces' => "$dir/nonces", 'agora' => $agora, 'resolver' => "$dir/nao-existe.php"];
$pedido = static fn(string $modulo, string $acao, array $payload = [], array $extra = []): string => json_encode(['user_id' => 7, 'modulo' => $modulo, 'acao' => $acao, 'payload' => $payload, 'request_id' => 'req-0123456789abcdef'] + $extra);
$exec = static fn(?PDO $pdo, array $server, string $corpo, array $a = []) => pv2_executar($pdo, $server, $corpo, $a + $amb);
$executou = static fn(PdoFalsoV2 $p, string $re): bool => (bool)array_filter($p->executadas, static fn($e) => preg_match($re, preg_replace('/\s+/', ' ', $e[0])));
$binds = static function (PdoFalsoV2 $p, string $re): ?array { foreach ($p->executadas as $e) { if (preg_match($re, preg_replace('/\s+/', ' ', $e[0]))) { return $e[1]; } } return null; };

// transporte
[$s, $e] = $exec($pdoBase(), $srv('', ['metodo' => 'GET']), ''); $ok($s === 405 && $e['error'] === 'METODO', '[1] GET → 405');
[$s, $e] = $exec(null, $srv('{}'), '{}'); $ok($s === 503 && $e['error'] === 'PONTE_INDISPONIVEL', '[2] sem banco → 503');
[$s, $e] = $exec($pdoBase(), $srv('{}', ['segredo' => str_repeat('w', 48)]), '{}', ['flagGeral' => false]); $ok($s === 404 && $e['error'] === 'NAO_ENCONTRADO', '[3] flag geral OFF → 404 mesmo com HMAC errado (inerte)');
[$s, $e] = $exec($pdoBase(), $srv('{}'), '{}', ['flagGeral' => null, 'resolver' => "$dir/nao-existe.php"]); $ok($s === 404, '[3b] resolver ausente → flag OFF → 404');
$grande = str_repeat('x', PV2_CORPO_MAX + 1); [$s, $e] = $exec($pdoBase(), $srv($grande), $grande); $ok($s === 413 && $e['error'] === 'CORPO_GRANDE', '[4] corpo > 256 KB → 413');
[$s, $e] = $exec($pdoBase(), $srv('{}'), '{}', ['segredo' => '']); $ok($s === 503, '[5] segredo ausente → 503');
[$s, $e] = $exec($pdoBase(), $srv('{}', ['segredo' => str_repeat('w', 48)]), '{}'); $ok($s === 403 && $e['error'] === 'PONTE_RECUSADA', '[6] HMAC errado → 403');
[$s, $e] = $exec($pdoBase(), $srv('{}', ['ip' => '203.0.113.9']), '{}'); $ok($s === 403, '[6b] fora do loopback → 403');
$c = json_encode(['user_id' => 7, 'acao' => 'reconhecer', 'request_id' => 'req-0123456789abcdef']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'PEDIDO_INVALIDO', '[7] sem modulo → 400');
$c = json_encode(['user_id' => 7, 'modulo' => 'alertas', 'acao' => 'reconhecer', 'request_id' => 'curto']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'PEDIDO_INVALIDO', '[7b] request_id curto → 400');
$c = 'nao-json'; [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400, '[7c] JSON inválido → 400');
$c = $pedido('alertas', 'apagar_tudo'); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'ACAO_INVALIDA', '[8] ação fora da allowlist → 400');
$c = $pedido('pipedrive', 'concluir'); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'ACAO_INVALIDA', '[8b] módulo fora da allowlist → 400');
$c = $pedido('alertas', 'reconhecer', ['id' => 1]); [$s, $e] = $exec($pdoBase(), $srv($c), $c, ['flagsModulo' => ['ponte.alertas.escrita' => false]]); $ok($s === 404 && $e['error'] === 'MODULO_DESLIGADO', '[9] flag do módulo OFF → 404');
$p = $pdoBase([$SQL_USER => ['linhas' => [['id' => 7, 'status' => 'disabled', 'deleted_at' => null]]]]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 403 && $e['error'] === 'USUARIO_INVALIDO', '[10] usuário desativado → 403');
$p = $pdoBase([$SQL_USER => ['linhas' => []]]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 403 && $e['error'] === 'USUARIO_INVALIDO', '[10b] usuário inexistente → 403');
$p = $pdoBase([], 50); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 403 && $e['error'] === 'PERMISSAO_NEGADA' && ($e['meta']['nivel_minimo'] ?? 0) === 80, '[11] nível 50 em alertas → 403 (mínimo 80)');
$ok(!$executou($p, '/^UPDATE DT_Alerta/'), '[11] nada executado em DT_Alerta sem permissão');

// alertas.reconhecer
$SQL_ACK = '/^UPDATE DT_Alerta SET status = "acknowledged", acknowledged_at = NOW\(\), acknowledged_by = :by WHERE id = :id AND status = "active"/';
$p = $pdoBase([$SQL_ACK => ['afetadas' => 1]]); $c = $pedido('alertas', 'reconhecer', ['id' => 123]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['ok'] === true && $e['data'] === ['id' => 123, 'acknowledged' => true] && $e['meta']['endpoint'] === 'ponte' && $e['meta']['version'] === '2.0.0', '[12] reconhecer → 200 ' . json_encode($e));
$ok($binds($p, $SQL_ACK) === [':by' => '7', ':id' => 123], '[12] binds do acknowledge = [by=7, id=123]: ' . json_encode($binds($p, $SQL_ACK)));
$ok($executou($p, '/^INSERT INTO app_audit_log/') && $executou($p, '/^INSERT INTO app_audit_trail/'), '[12] auditoria dupla gravada');
$bt = $binds($p, '/^INSERT INTO app_audit_trail/'); $ok(($bt[0] ?? null) === 7 && ($bt[1] ?? '') === 'ponte.alertas.reconhecer' && ($bt[2] ?? '') === 'alerta' && ($bt[3] ?? null) === 123, '[12] app_audit_trail: user, action, entity: ' . json_encode(array_slice($bt ?? [], 0, 4)));
$ok($executou($p, '/^UPDATE app_ponte_ops SET status = \?, resposta_json = \?, concluido_em = NOW\(3\)/'), '[12] idempotência concluída (status 200 gravado)');
$bi = $binds($p, $SQL_IDEM_INS); $ok(($bi[0] ?? null) === 7 && ($bi[1] ?? '') === 'req-0123456789abcdef' && ($bi[2] ?? '') === 'alertas' && ($bi[3] ?? '') === 'reconhecer', '[12] app_ponte_ops reservado');
$p = $pdoBase([$SQL_ACK => ['afetadas' => 0]]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 404 && $e['error'] === 'NOT_FOUND' && ($e['data']['message'] ?? '') === 'Alerta nao encontrado ou nao esta ativo', '[13] reconhecer inexistente/inativo → 404 (mensagem do painel)');
$bc = $binds($p, '/^UPDATE app_ponte_ops SET status = \?/'); $ok(($bc[0] ?? null) === 404, '[13] 404 também fica registrado para replay');
$c = $pedido('alertas', 'reconhecer', ['id' => 'abc']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 422 && $e['error'] === 'VALIDACAO' && isset($e['data']['campos']['id']), '[13b] id inválido → 422');

// alertas.resolver
$SQL_RES_SEL = '/^SELECT alert_type, target_type, target_id, status FROM DT_Alerta WHERE id = :id/';
$SQL_RES_UPD = '/^UPDATE DT_Alerta SET status = "resolved", resolved_at = NOW\(\) WHERE id = :id/';
$p = $pdoBase([$SQL_RES_SEL => ['linhas' => [['alert_type' => 'db_offline', 'target_type' => 'connection', 'target_id' => 3, 'status' => 'active']]], $SQL_RES_UPD => ['afetadas' => 1]]);
$c = $pedido('alertas', 'resolver', ['id' => 9]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data']['resolved'] === true && $e['data']['id'] === 9 && str_starts_with($e['data']['message'], 'Alerta resolvido manualmente'), '[14] resolver → 200 ' . json_encode($e['data'] ?? null));
$ok($binds($p, $SQL_RES_UPD) === [':id' => 9], '[14] UPDATE resolved com id');
$p = $pdoBase([$SQL_RES_SEL => ['linhas' => [['alert_type' => 'x', 'target_type' => 'y', 'target_id' => 1, 'status' => 'resolved']]]]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 409 && $e['error'] === 'VALIDATION_ERROR' && !$executou($p, $SQL_RES_UPD), '[14b] já resolvido → 409 sem UPDATE');
$p = $pdoBase([$SQL_RES_SEL => ['linhas' => []]]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 404 && $e['error'] === 'NOT_FOUND', '[14c] resolver inexistente → 404');

// alertas.silenciar / dessilenciar
$SQL_SIL_INS = '/^INSERT INTO DT_Silencio_Alerta/';
$c = $pedido('alertas', 'silenciar', ['reason' => 'manutenção']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 422 && isset($e['data']['campos']['janela']), '[15] silenciar sem janela → 422');
$c = $pedido('alertas', 'silenciar', ['starts_at' => '2026-10-29 10:00:00', 'ends_at' => '2026-10-29 09:00:00']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 422 && isset($e['data']['campos']['ends_at']), '[15b] fim antes do início → 422');
$c = $pedido('alertas', 'silenciar', ['alert_type' => 'DROP TABLE']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 422 && isset($e['data']['campos']['alert_type']), '[15c] alert_type inválido → 422');
$p = $pdoBase([$SQL_SIL_INS => ['afetadas' => 1]]); $c = $pedido('alertas', 'silenciar', ['daily_from' => '22:00', 'daily_to' => '06:00', 'connection_id' => 3, 'alert_type' => 'db_slow', 'reason' => str_repeat('r', 300)]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data'] === ['id' => 77, 'silenced' => true], '[15d] silenciar diário → 200 id 77: ' . json_encode($e));
$bs = $binds($p, $SQL_SIL_INS); $ok(($bs[':df'] ?? '') === '22:00:00' && ($bs[':dt'] ?? '') === '06:00:00' && array_key_exists(':sa', $bs) && $bs[':sa'] === null && ($bs[':cid'] ?? 0) === 3 && ($bs[':t'] ?? '') === 'db_slow' && strlen($bs[':r'] ?? '') === 255 && ($bs[':by'] ?? '') === '7', '[15d] binds normalizados (H:i→H:i:s, reason 255, by=7): ' . json_encode($bs));
$p = $pdoBase([$SQL_SIL_INS => ['afetadas' => 1]]); $c = $pedido('alertas', 'silenciar', ['starts_at' => '2026-10-29T10:00:00-03:00', 'ends_at' => '2026-10-29T12:00:00-03:00']); [$s, $e] = $exec($p, $srv($c), $c);
$bs = $binds($p, $SQL_SIL_INS); $ok($s === 200 && ($bs[':sa'] ?? '') === '2026-10-29 10:00:00' && ($bs[':ea'] ?? '') === '2026-10-29 12:00:00', '[15e] intervalo ISO → Y-m-d H:i:s em Brasília: ' . json_encode($bs));
$SQL_SIL_DEL = '/^UPDATE DT_Silencio_Alerta SET is_active = 0 WHERE id = :id/';
$p = $pdoBase([$SQL_SIL_DEL => ['afetadas' => 1]]); $c = $pedido('alertas', 'dessilenciar', ['id' => 77]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['id' => 77, 'silenced' => false], '[16] dessilenciar → 200');
$p = $pdoBase([$SQL_SIL_DEL => ['afetadas' => 0]]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 404 && $e['error'] === 'NOT_FOUND', '[16b] dessilenciar inexistente → 404');

// notificacoes (nível 0, posse por user_id na SQL)
$SQL_N_LIDA = '/^UPDATE app_notifications SET is_read = 1, read_at = NOW\(3\) WHERE id = \? AND user_id = \?$/';
$SQL_N_TODAS = '/^UPDATE app_notifications SET is_read = 1, read_at = NOW\(3\) WHERE user_id = \? AND is_read = 0$/';
$SQL_N_DEL = '/^DELETE FROM app_notifications WHERE id = \? AND user_id = \?$/';
$p = $pdoBase([$SQL_N_LIDA => ['afetadas' => 1]], 0); $c = $pedido('notificacoes', 'marcar_lida', ['id' => 5]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data'] === ['marked' => true] && $binds($p, $SQL_N_LIDA) === [5, 7], '[17] marcar_lida (usuário sem papel, nível 0) → 200, binds [id, user]: ' . json_encode($binds($p, $SQL_N_LIDA)));
$p = $pdoBase([$SQL_N_LIDA => ['afetadas' => 0]], 0); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['marked' => false], '[17b] aviso de outro usuário → marked=false (posse na SQL, como o painel)');
$p = $pdoBase([$SQL_N_TODAS => ['afetadas' => 4]], 0); $c = $pedido('notificacoes', 'marcar_todas'); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['marked' => 4] && $binds($p, $SQL_N_TODAS) === [7], '[17c] marcar_todas → 200 marked 4');
$p = $pdoBase([$SQL_N_DEL => ['afetadas' => 1]], 0); $c = $pedido('notificacoes', 'excluir', ['id' => 5]); [$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['deleted' => true] && $binds($p, $SQL_N_DEL) === [5, 7], '[17d] excluir → 200');

// idempotência
$c = $pedido('alertas', 'reconhecer', ['id' => 123]);
$hash = hash('sha256', "alertas\nreconhecer\n" . json_encode(['id' => 123], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
$guardado = pv2_envelope(true, ['id' => 123, 'acknowledged' => true], null);
$p = $pdoBase([$SQL_IDEM_INS => ['afetadas' => 0], $SQL_IDEM_SEL => ['linhas' => [['corpo_hash' => $hash, 'status' => 200, 'resposta_json' => json_encode($guardado), 'criado' => $agora - 10]]], $SQL_ACK => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['id' => 123, 'acknowledged' => true] && ($e['meta']['replay'] ?? false) === true && !$executou($p, $SQL_ACK), '[18] replay devolve a resposta guardada SEM reexecutar: ' . json_encode($e));
$p = $pdoBase([$SQL_IDEM_INS => ['afetadas' => 0], $SQL_IDEM_SEL => ['linhas' => [['corpo_hash' => str_repeat('0', 64), 'status' => 200, 'resposta_json' => '{}', 'criado' => $agora]]]]);
[$s, $e] = $exec($p, $srv($c), $c); $ok($s === 409 && $e['error'] === 'IDEMPOTENCIA_DIVERGENTE', '[18b] mesma chave, corpo diferente → 409');
$p = $pdoBase([$SQL_IDEM_INS => ['afetadas' => 0], $SQL_IDEM_SEL => ['linhas' => [['corpo_hash' => $hash, 'status' => 0, 'resposta_json' => null, 'criado' => $agora - 5]]], $SQL_IDEM_RETOMA => ['afetadas' => 0]]);
[$s, $e] = $exec($p, $srv($c), $c); $ok($s === 409 && $e['error'] === 'EM_ANDAMENTO', '[18c] em andamento (5 s) → 409');
$p = $pdoBase([$SQL_IDEM_INS => ['afetadas' => 0], $SQL_IDEM_SEL => ['linhas' => [['corpo_hash' => $hash, 'status' => 0, 'resposta_json' => null, 'criado' => $agora - 600]]], $SQL_IDEM_RETOMA => ['afetadas' => 1], $SQL_ACK => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $executou($p, $SQL_ACK), '[18d] em andamento há 600 s → retomado e executado');
$rb = $binds($p, $SQL_IDEM_RETOMA); $ok(($rb[3] ?? 0) === $agora - PV2_EM_ANDAMENTO_S, '[18d] janela de retomada = 60 s');

// erro interno libera a chave; nonce repetido é recusado
$p = $pdoBase([$SQL_ACK => ['afetadas' => 1]]); $p->lancar = [$SQL_ACK => 'MySQL server has gone away']; [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 500 && $e['error'] === 'ERRO_INTERNO' && $executou($p, '/^DELETE FROM app_ponte_ops WHERE user_id = \? AND request_id = \?/'), '[19] PDOException no handler → 500 e chave liberada para retry');
$sv = $srv($c); $p = $pdoBase([$SQL_ACK => ['afetadas' => 1]]); [$s1] = $exec($p, $sv, $c); [$s2, $e2] = $exec($pdoBase([$SQL_ACK => ['afetadas' => 1]]), $sv, $c);
$ok($s1 === 200 && $s2 === 403 && $e2['error'] === 'PONTE_RECUSADA', '[20] mesmo nonce duas vezes → 2ª recusada (replay de rede)');

// allowlist: só os 7 handlers da W1 e todos existem
$total = 0; foreach (PV2_ALLOWLIST as $m => $as) { foreach ($as as $a => $d) { $total++; $ok(function_exists($d['handler']), "[21] handler $m.$a existe"); $ok(in_array($d['tipo'], ['leitura', 'escrita'], true) && is_int($d['nivel']), "[21] $m.$a declara tipo e nível"); } }
$ok($total === 7, "[21] allowlist da W1 tem 7 ações (tem $total)");

exec('rm -rf ' . escapeshellarg($dir));
if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "ponte-v2-core: OK (" . (21) . " grupos de casos)\n";
