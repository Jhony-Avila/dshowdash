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

// allowlist: os 7 handlers da W1 + 2 de metas (DC-2) e todos existem
$total = 0; foreach (PV2_ALLOWLIST as $m => $as) { foreach ($as as $a => $d) { $total++; $ok(function_exists($d['handler']), "[21] handler $m.$a existe"); $ok(in_array($d['tipo'], ['leitura', 'escrita'], true) && is_int($d['nivel']), "[21] $m.$a declara tipo e nível"); } }
$ok($total === 29, "[21] allowlist tem 29 ações: 7 da W1 + 2 metas + 4 agenda + 16 de leitura do analytics (tem $total)");

// metas (DASH-APP-V1 · DC-2): flag própria, nível 80, validação, criar, atualizar com versão, conflito, remover, 404
$ambM = ['flagsModulo' => ['ponte.metas.escrita' => true]];
$SQL_META_SEL = '/^SELECT id, valor_cents, versao FROM app_metas_comerciais WHERE ano = \? AND mes = \? AND escopo = \? AND owner_pd_id = \? FOR UPDATE/';
$SQL_META_INS = '/^INSERT INTO app_metas_comerciais \(ano, mes, escopo, owner_pd_id, valor_cents, versao, criado_por, atualizado_por, created_at, updated_at\)/';
$SQL_META_UPD = '/^UPDATE app_metas_comerciais SET valor_cents = \?, versao = \?, atualizado_por = \?, updated_at = NOW\(3\) WHERE id = \?/';
$SQL_META_HIST = '/^INSERT INTO app_metas_comerciais_hist/';
$SQL_META_BYID = '/^SELECT id, ano, mes, escopo, owner_pd_id, valor_cents, versao FROM app_metas_comerciais WHERE id = \? FOR UPDATE/';
$SQL_META_DEL = '/^DELETE FROM app_metas_comerciais WHERE id = \?/';
$cm = $pedido('metas', 'definir', ['ano' => 2026, 'mes' => 10, 'escopo' => 'global', 'valor_cents' => 350000000, 'request_id' => 'req-0123456789abcdef']);
[$s, $e] = $exec($pdoBase(), $srv($cm), $cm); $ok($s === 404 && $e['error'] === 'MODULO_DESLIGADO', '[22] metas sem a flag ponte.metas.escrita → 404');
$p = $pdoBase([], 50); [$s, $e] = $exec($p, $srv($cm), $cm, $ambM); $ok($s === 403 && $e['error'] === 'PERMISSAO_NEGADA' && ($e['meta']['nivel_minimo'] ?? 0) === 80, '[22] nível 50 em metas → 403 (mínimo 80)');
$p = $pdoBase([$SQL_META_SEL => ['linhas' => []], $SQL_META_INS => ['afetadas' => 1], $SQL_META_HIST => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($cm), $cm, $ambM);
$ok($s === 200 && ($e['data']['id'] ?? 0) === 77 && $e['data']['versao'] === 1 && $e['data']['owner_pd_id'] === 0 && $e['data']['valor_anterior_cents'] === null, '[22a] definir global nova → INSERT, versao 1, owner_pd_id 0: ' . json_encode($e));
$bi = $binds($p, $SQL_META_INS); $ok($bi === [2026, 10, 'global', 0, 350000000, 7, 7], '[22a] binds do INSERT (ano, mes, escopo, owner 0, valor, criado_por, atualizado_por): ' . json_encode($bi));
$bh = $binds($p, $SQL_META_HIST); $ok($bh === [77, 1, null, 350000000, 7, 'app', 'req-0123456789abcdef'], '[22a] hist: meta 77, v1, antes NULL, depois valor, por 7, origem app, request_id: ' . json_encode($bh));
$ok(in_array('begin', $p->eventos, true) && in_array('commit', $p->eventos, true), '[22a] transação aberta e confirmada');
$cm2 = $pedido('metas', 'definir', ['ano' => 2026, 'mes' => 10, 'escopo' => 'vendedor', 'owner_pd_id' => 9409546, 'valor_cents' => 120000000, 'versao_esperada' => 3], ['request_id' => 'req-abcdef0123456789']);
$p = $pdoBase([$SQL_META_SEL => ['linhas' => [['id' => 15, 'valor_cents' => 100000000, 'versao' => 3]]], $SQL_META_UPD => ['afetadas' => 1], $SQL_META_HIST => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($cm2), $cm2, $ambM);
$ok($s === 200 && $e['data']['id'] === 15 && $e['data']['versao'] === 4 && $e['data']['valor_anterior_cents'] === 100000000 && !$executou($p, $SQL_META_INS), '[22b] definir vendedor existente com versao_esperada certa → UPDATE v4: ' . json_encode($e));
$bu = $binds($p, $SQL_META_UPD); $ok($bu === [120000000, 4, 7, 15], '[22b] binds do UPDATE: ' . json_encode($bu));
$p = $pdoBase([$SQL_META_SEL => ['linhas' => [['id' => 15, 'valor_cents' => 100000000, 'versao' => 5]]]]);
[$s, $e] = $exec($p, $srv($cm2), $cm2, $ambM);
$ok($s === 409 && $e['error'] === 'CONFLITO' && ($e['data']['versao_atual'] ?? 0) === 5 && ($e['data']['valor_atual_cents'] ?? 0) === 100000000 && !$executou($p, $SQL_META_UPD) && in_array('rollback', $p->eventos, true), '[22c] versao_esperada 3 ≠ atual 5 → 409 CONFLITO com versão/valor atuais, nada gravado: ' . json_encode($e));
$cm3 = $pedido('metas', 'definir', ['ano' => 2019, 'mes' => 13, 'escopo' => 'vendedor', 'valor_cents' => -1]);
$p = $pdoBase(); [$s, $e] = $exec($p, $srv($cm3), $cm3, $ambM);
$ok($s === 422 && $e['error'] === 'VALIDACAO' && array_keys($e['data']['campos'] ?? []) === ['ano', 'mes', 'owner_pd_id'] && !$executou($p, $SQL_META_SEL), '[22d] payload inválido → 422 com os campos, nada consultado: ' . json_encode($e));
$cm4 = $pedido('metas', 'definir', ['ano' => 2026, 'mes' => 10, 'escopo' => 'global', 'valor_cents' => 1000000000000]);
$p = $pdoBase(); [$s, $e] = $exec($p, $srv($cm4), $cm4, $ambM); $ok($s === 422 && isset($e['data']['campos']['valor_cents']), '[22e] valor acima do teto → 422');
$cr = $pedido('metas', 'remover', ['id' => 15, 'versao_esperada' => 4]);
$p = $pdoBase([$SQL_META_BYID => ['linhas' => [['id' => 15, 'ano' => 2026, 'mes' => 10, 'escopo' => 'vendedor', 'owner_pd_id' => 9409546, 'valor_cents' => 120000000, 'versao' => 4]]], $SQL_META_HIST => ['afetadas' => 1], $SQL_META_DEL => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($cr), $cr, $ambM);
$ok($s === 200 && $e['data']['removed'] === true && $e['data']['valor_anterior_cents'] === 120000000 && $executou($p, $SQL_META_DEL), '[22f] remover existente → hist (valor_novo NULL) + DELETE: ' . json_encode($e));
$bh = $binds($p, $SQL_META_HIST); $ok($bh === [15, 5, 120000000, 7, 'app', null], '[22f] hist da remoção: meta 15, v5, antes 120000000, por 7, app, sem request_id: ' . json_encode($bh));
$p = $pdoBase([$SQL_META_BYID => ['linhas' => []]]); [$s, $e] = $exec($p, $srv($cr), $cr, $ambM);
$ok($s === 404 && $e['error'] === 'NAO_ENCONTRADO' && !$executou($p, $SQL_META_DEL), '[22g] remover inexistente → 404, nada apagado');

// agenda (Paridade W4): flag própria, estágio read → 409, validação, posse/papel (403/404 do provedor), criar/responder/atualizar/excluir com provedor FALSO, Google fora → 503
$GLOBALS['PV2_AGENDA_SEM_MODULO'] = true;
final class ProvedorAgendaFalso
{
    public array $chamadas = [];
    public ?Throwable $lancar = null;
    public function __construct(public int $userId) {}
    private function reg(string $m, array $args): array { $this->chamadas[] = [$m, $args]; if ($this->lancar) { throw $this->lancar; } return ['event_id' => 'ev-1', 'summary' => $args[0]['summary'] ?? 'x', 'user' => $this->userId]; }
    public function responderConvite(string $c, string $e, string $r, ?string $k): array { return $this->reg('responder', [$c, $e, $r, $k]); }
    public function criarEvento(array $p): array { return $this->reg('criar', [$p]); }
    public function atualizarEvento(string $c, string $e, array $p, string $esc = 'this'): array { return $this->reg('atualizar', [$c, $e, $p, $esc]); }
    public function excluirEvento(string $c, string $e, bool $n, string $esc = 'this'): void { $this->reg('excluir', [$c, $e, $n, $esc]); }
}
$prov = new ProvedorAgendaFalso(7);
$GLOBALS['PV2_AGENDA_PROVIDER'] = static fn(int $u) => $prov;
$ambA = ['flagsModulo' => ['ponte.agenda.escrita' => true]];
$ca = $pedido('agenda', 'responder', ['calendar_id' => 'cal@x', 'event_id' => 'ev-1', 'resposta' => 'accepted']);
[$s, $e] = $exec($pdoBase(), $srv($ca), $ca); $ok($s === 404 && $e['error'] === 'MODULO_DESLIGADO', '[23] agenda sem a flag ponte.agenda.escrita → 404');
putenv('GCAL_OAUTH_STAGE=read');
[$s, $e] = $exec($pdoBase(), $srv($ca), $ca, $ambA); $ok($s === 409 && $e['error'] === 'CONFLITO' && ($e['data']['stage'] ?? '') === 'read' && $prov->chamadas === [], '[23a] estágio read → 409 CONFLITO com explicação, Google não é chamado: ' . json_encode($e));
putenv('GCAL_OAUTH_STAGE=write');
[$s, $e] = $exec($pdoBase(), $srv($ca), $ca, $ambA); $ok($s === 200 && $prov->chamadas === [['responder', ['cal@x', 'ev-1', 'accepted', null]]] && ($e['data']['event_id'] ?? '') === 'ev-1', '[23b] responder → GcalDb::responderConvite com o user_id do app: ' . json_encode($e));
$cb = $pedido('agenda', 'responder', ['calendar_id' => 'cal@x', 'event_id' => 'ev-1', 'resposta' => 'maybe']);
[$s, $e] = $exec($pdoBase(), $srv($cb), $cb, $ambA); $ok($s === 422 && isset($e['data']['campos']['resposta']), '[23c] resposta inválida → 422');
$prov->chamadas = [];
$cc = $pedido('agenda', 'criar', ['calendar_id' => 'cal@x', 'summary' => 'Reunião', 'start' => '2026-11-03T10:00:00-03:00', 'end' => '2026-11-03T11:00:00-03:00', 'attendees' => [['email' => 'a@b.com']], 'notificar' => true]);
[$s, $e] = $exec($pdoBase(), $srv($cc), $cc, $ambA); $ok($s === 200 && ($prov->chamadas[0][0] ?? '') === 'criar' && ($prov->chamadas[0][1][0]['summary'] ?? '') === 'Reunião' && ($prov->chamadas[0][1][0]['notificar'] ?? false) === true, '[23d] criar → GcalDb::criarEvento com o corpo do painel: ' . json_encode($e));
$cd = $pedido('agenda', 'criar', ['calendar_id' => 'cal@x', 'summary' => '', 'start' => '2026-11-03T11:00:00-03:00', 'end' => '2026-11-03T10:00:00-03:00']);
[$s, $e] = $exec($pdoBase(), $srv($cd), $cd, $ambA); $ok($s === 422 && isset($e['data']['campos']['summary']) && isset($e['data']['campos']['end']), '[23e] validação do painel (título vazio, fim antes do início) → 422: ' . json_encode($e));
$prov->chamadas = []; $prov->lancar = new RuntimeException('Sem permissão de escrita neste calendário.');
$ce = $pedido('agenda', 'atualizar', ['calendar_id' => 'cal@x', 'event_id' => 'ev-1', 'summary' => 'Novo título']);
[$s, $e] = $exec($pdoBase(), $srv($ce), $ce, $ambA); $ok($s === 403 && $e['error'] === 'PERMISSAO_NEGADA', '[23f] calendário sem papel de escrita → 403');
$prov->lancar = new RuntimeException('Calendário não encontrado nesta conta.');
[$s, $e] = $exec($pdoBase(), $srv($ce), $ce, $ambA); $ok($s === 404 && $e['error'] === 'NOT_FOUND', '[23g] calendário de outra conta → 404');
$prov->lancar = null; $prov->chamadas = [];
$cf = $pedido('agenda', 'excluir', ['calendar_id' => 'cal@x', 'event_id' => 'ev-1', 'notificar' => true]);
[$s, $e] = $exec($pdoBase(), $srv($cf), $cf, $ambA); $ok($s === 200 && $prov->chamadas === [['excluir', ['cal@x', 'ev-1', true, 'this']]] && ($e['data']['deleted'] ?? false) === true, '[23h] excluir → GcalDb::excluirEvento(notificar) e deleted:true');
$prov->lancar = new Exception('curl: timeout');
[$s, $e] = $exec($pdoBase(), $srv($cf), $cf, $ambA); $ok($s === 503 && $e['error'] === 'ORIGEM_INDISPONIVEL', '[23i] Google fora → 503 ORIGEM_INDISPONIVEL');
unset($GLOBALS['PV2_AGENDA_PROVIDER'], $GLOBALS['PV2_AGENDA_SEM_MODULO']); putenv('GCAL_OAUTH_STAGE');

exec('rm -rf ' . escapeshellarg($dir));
if ($falhas) { echo "FALHAS (" . count($falhas) . "):\n - " . implode("\n - ", $falhas) . "\n"; exit(1); }
echo "ponte-v2-core: OK (" . (23) . " grupos de casos)\n";
