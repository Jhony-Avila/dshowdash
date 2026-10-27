<?php
declare(strict_types=1);
/**
 * Onda 1 (Avatar nativo) — testes do NÚCLEO da ponte (PonteCore::avpt_executar) com PDO falso, servidor falso e ambiente injetado:
 * método, banco indisponível, flag OFF (inerte), corpo grande, segredo ausente, HMAC inválido, pedido inválido, ler (forma),
 * salvar (sucesso e FUNCAO_DESLIGADA), reativar, meta, favorito, ação inválida, erro de negócio (429) com extra, e
 * identidade das SQL de favoritos com favoritos.php. uso: php scripts/avatar/testes/ponte-core.php
 */
require_once __DIR__ . '/../../../api/avatar/PonteCore.php';
require_once __DIR__ . '/_pdo-falso.php';
$falhas = []; $ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$dir = sys_get_temp_dir() . '/avst-ponte-core-' . getmypid(); @mkdir("$dir/nonces", 0700, true); @mkdir("$dir/pub", 0700, true);
$segredo = str_repeat('z', 48); $agora = 1_800_000_000; $n = 0;
$configOk = ['formato' => 'camadas', 'versao' => 1, 'base' => 'base_pele_clara', 'camadas' => ['olhos' => 'olh_padrao', 'boca' => 'boc_sorriso', 'roupa' => 'rou_camiseta', 'fundo' => 'fun_neon'],
    'cores' => ['pele' => '#f5d0a9', 'cabelo' => '#2b1b12', 'roupa' => '#2d4a8a', 'destaque' => '#7c5cff']];
$svgOk = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="#111"/></svg>';
$pdoBase = static function (array $extra = []): PdoFalso {
    $p = new PdoFalso();
    $p->respostas = $extra + [
        '/^SELECT COUNT\(\*\) FROM app_user_avatars WHERE user_id = \? AND avatar_type IN/' => ['linhas' => [['n' => 1]]],
        '/^SELECT id, version FROM app_user_avatars WHERE user_id = \? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1 FOR UPDATE/' => ['linhas' => [['id' => 10, 'version' => 4]]],
        '/^SELECT id, avatar_type, avatar_config, avatar_image_url, version, updated_at FROM app_user_avatars WHERE user_id = \? AND is_active = 1/' => ['linhas' => [['id' => 10, 'avatar_type' => 'generated', 'avatar_config' => json_encode($GLOBALS['configOk']), 'avatar_image_url' => '/assets/avatars/studio/u7-v4.svg', 'version' => 4, 'updated_at' => 'x']]],
        '/^SELECT avatar_url FROM app_users WHERE id = \?/' => ['linhas' => [['avatar_url' => '/assets/avatars/studio/u7-v4.svg']]],
        '/^SELECT a\.`key` FROM avatar_user_favorites f JOIN avatar_assets a/' => ['linhas' => [['key' => 'fun_neon'], ['key' => 'rou_camiseta']]],
        '/^SELECT id FROM avatar_assets WHERE `key` = \?/' => ['linhas' => [['id' => 55]]],
        '/^DELETE FROM avatar_user_favorites WHERE user_id = \? AND asset_id = \?/' => ['afetadas' => 0],
    ];
    return $p;
};
$srv = static function (string $corpo, array $sobre = []) use ($segredo, $agora, &$n): array {
    $n++; $ts = (string) ($sobre['ts'] ?? $agora); $nonce = sprintf('nonce-%04d-0123456789ab', $n);
    return ['REMOTE_ADDR' => $sobre['ip'] ?? '127.0.0.1', 'REQUEST_METHOD' => $sobre['metodo'] ?? 'POST', 'REQUEST_URI' => '/api/avatar/ponte.php',
        'HTTP_X_APP_TS' => $ts, 'HTTP_X_APP_NONCE' => $nonce, 'HTTP_X_APP_SIG' => PonteAuth::assinar($sobre['segredo'] ?? $segredo, $ts, $nonce, 'POST', '/api/avatar/ponte.php', $corpo)];
};
$amb = ['flag' => true, 'segredo' => $segredo, 'dirNonces' => "$dir/nonces", 'agora' => $agora, 'dirFisico' => "$dir/pub", 'resolver' => "$dir/nao-existe.php"];
$pedido = static fn(string $acao, array $payload = [], array $extra = []): string => json_encode(['user_id' => 7, 'acao' => $acao, 'payload' => $payload, 'request_id' => 'req-1'] + $extra);
$exec = static fn(?PDO $pdo, array $server, string $corpo, array $a = []) => avpt_executar($pdo, $server, $corpo, $a + $amb);

[$s, $e] = $exec($pdoBase(), $srv('', ['metodo' => 'GET']), ''); $ok($s === 405 && $e['error'] === 'METODO', '[1] GET → 405');
[$s, $e] = $exec(null, $srv('{}'), '{}'); $ok($s === 503 && $e['error'] === 'PONTE_INDISPONIVEL', '[2] sem banco → 503');
[$s, $e] = $exec($pdoBase(), $srv('{}'), '{}', ['flag' => false]); $ok($s === 404 && $e['error'] === 'NAO_ENCONTRADO', '[3] flag OFF → 404 (inerte)');
[$s, $e] = $exec($pdoBase(), $srv('{}'), '{}', ['flag' => null, 'resolver' => "$dir/nao-existe.php"]); $ok($s === 404, '[3b] resolver ausente → flag OFF → 404');
$grande = str_repeat('x', AVPT_CORPO_MAX + 1); [$s, $e] = $exec($pdoBase(), $srv($grande), $grande); $ok($s === 413 && $e['error'] === 'CORPO_GRANDE', '[4] corpo > 1 MB → 413');
[$s, $e] = $exec($pdoBase(), $srv('{}'), '{}', ['segredo' => '']); $ok($s === 503, '[5] segredo ausente → 503');
[$s, $e] = $exec($pdoBase(), $srv('{}', ['segredo' => str_repeat('w', 48)]), '{}'); $ok($s === 403 && $e['error'] === 'PONTE_RECUSADA', '[6] HMAC errado → 403');
[$s, $e] = $exec($pdoBase(), $srv('{}', ['ip' => '203.0.113.9']), '{}'); $ok($s === 403, '[6b] fora do loopback → 403');
$c = '{"acao":"ler"}'; [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'PEDIDO_INVALIDO', '[7] sem user_id/request_id → 400');
$c = 'nao-json'; [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400, '[7b] JSON inválido → 400');
// ler
$c = $pedido('ler', [], ['flags' => ['as6.vestuario_separado', 'x y']]); [$s, $e] = $exec($pdoBase(), $srv($c), $c);
$ok($s === 200 && $e['ok'] === true && $e['meta']['endpoint'] === 'avatar/ponte', '[8] ler → 200 envelope');
$d = $e['data'] ?? [];
$ok(array_keys($d) === ['estado', 'historico', 'favoritos', 'vida', 'flags', 'limites'], '[8] chaves de ler: ' . implode(',', array_keys($d)));
$ok(($d['estado']['version'] ?? 0) === 4 && ($d['estado']['tipo_ativo'] ?? '') === 'camadas', '[8] estado via StudioLib');
$ok(($d['favoritos']['itens'] ?? null) === ['fun_neon', 'rou_camiseta'] && $d['favoritos']['fonte'] === 'servidor', '[8] favoritos');
$ok(array_keys($d['vida']) === ['conquistas', 'eventos', 'desbloqueados'] && is_array($d['vida']['conquistas']), '[8] vida');
$ok($d['flags'] === [], '[8] flags vazias sem resolver (padrões do motor)');
$ok($d['limites'] === ['por_hora' => 30, 'retencao' => 100, 'nome_max' => 60, 'svg_bytes_max' => 300000], '[8] limites: ' . json_encode($d['limites']));
// salvar
$p = $pdoBase(); $c = $pedido('salvar', ['config' => $configOk, 'svg' => $svgOk, 'base_version' => 4]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data'] === ['version' => 5, 'render_url' => '/assets/avatars/studio/u7-v5.svg', 'tipo' => 'camadas'], '[9] salvar → 200 {version:5,…}: ' . json_encode($e));
$ok(is_file("$dir/pub/u7-v5.svg") && file_get_contents("$dir/pub/u7-v5.svg") === SvgSanitizer::sanitizar($svgOk), '[9] arquivo publicado no diretório injetado = sanitizar(svg)');
$ok(count(array_filter($p->executadas, static fn($x) => str_starts_with($x[0], 'INSERT INTO app_user_avatars'))) === 1, '[9] 1 INSERT em app_user_avatars');
$c = $pedido('salvar', ['foto' => 'data:image/png;base64,AAAA', 'base_version' => 4]); [$s, $e] = $exec($pdoBase(), $srv($c), $c);
$ok($s === 403 && $e['error'] === 'FUNCAO_DESLIGADA', '[10] salvar foto pela ponte → 403 FUNCAO_DESLIGADA');
$c = $pedido('salvar', ['config3d' => ['formato' => '3d'], 'base_version' => 4]); [$s, $e] = $exec($pdoBase(), $srv($c), $c);
$ok($s === 403 && $e['error'] === 'FUNCAO_DESLIGADA', '[10b] salvar 3d pela ponte → 403');
$c = $pedido('salvar', ['config' => $configOk, 'svg' => $svgOk, 'base_version' => 3]); [$s, $e] = $exec($pdoBase(), $srv($c), $c);
$ok($s === 409 && $e['error'] === 'CONFLITO_VERSAO' && $e['data'] === ['version' => 4], '[11] conflito → 409 com version');
$p = $pdoBase(['/^SELECT COUNT\(\*\) FROM app_user_avatars WHERE user_id = \? AND avatar_type IN/' => ['linhas' => [['n' => 30]]]]);
$c = $pedido('salvar', ['config' => $configOk, 'svg' => $svgOk]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 429 && $e['error'] === 'RATE_LIMIT' && $e['data'] === ['limite_por_hora' => 30], '[12] limite → 429 com extra');
// reativar
$p = $pdoBase(['/^SELECT avatar_type, avatar_config, avatar_image_url FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => [['avatar_type' => 'generated', 'avatar_config' => json_encode($configOk), 'avatar_image_url' => '/assets/avatars/studio/u7-v2.svg']]]]);
$c = $pedido('reativar', ['id' => 2, 'base_version' => 4]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data']['render_url'] === '/assets/avatars/studio/u7-v2.svg' && $e['data']['version'] === 5, '[13] reativar → 200');
// meta
$p = $pdoBase(['/^SELECT id FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => [['id' => 10]]], '/^SELECT label, is_pinned FROM avatar_version_meta/' => ['linhas' => []]]);
$c = $pedido('meta', ['id' => 10, 'nome' => 'Gala', 'fixado' => true]); [$s, $e] = $exec($p, $srv($c), $c);
$ok($s === 200 && $e['data'] === ['id' => 10, 'nome' => 'Gala', 'fixado' => true], '[14] meta → 200: ' . json_encode($e['data'] ?? null));
// favorito
$c = $pedido('favorito', ['item' => 'fun_neon']); [$s, $e] = $exec($pdoBase(), $srv($c), $c);
$ok($s === 200 && $e['data'] === ['favorito' => true, 'sincronizado' => true], '[15] favorito liga → true');
$p = $pdoBase(['/^DELETE FROM avatar_user_favorites WHERE user_id = \? AND asset_id = \?/' => ['afetadas' => 1]]);
[$s, $e] = $exec($p, $srv($c), $c); $ok($s === 200 && $e['data'] === ['favorito' => false, 'sincronizado' => true], '[15b] favorito desliga → false');
$c = $pedido('favorito', ['item' => 'Inválido!']); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 422 && $e['error'] === 'ITEM_INVALIDO', '[15c] item inválido → 422');
$c = $pedido('explodir'); [$s, $e] = $exec($pdoBase(), $srv($c), $c); $ok($s === 400 && $e['error'] === 'ACAO_INVALIDA', '[16] ação desconhecida → 400');
// nonce reutilizado → 403
$server = $srv($c); [$s] = $exec($pdoBase(), $server, $c); [$s2, $e2] = $exec($pdoBase(), $server, $c);
$ok($s === 400 && $s2 === 403 && $e2['error'] === 'PONTE_RECUSADA', '[17] repetição do mesmo pedido assinado → 403');
// SQL de favoritos idênticas às de favoritos.php (duplicação controlada — DP-AN.10)
$fav = file_get_contents(__DIR__ . '/../../../api/avatar/favoritos.php'); $core = file_get_contents(__DIR__ . '/../../../api/avatar/PonteCore.php');
$sqls = array_map(static fn($m) => $m[2], iterator_to_array((function () use ($fav) { if (preg_match_all('/prepare\(([\'"])([\s\S]*?)\1\)/', $fav, $mm, PREG_SET_ORDER)) { foreach ($mm as $m) { yield $m; } } })()));
$ok(count($sqls) === 4, '[18] favoritos.php deveria ter 4 SQL (tem ' . count($sqls) . ')');
foreach ($sqls as $q) { $ok(str_contains($core, $q), '[18] SQL de favoritos.php ausente/alterada no PonteCore: ' . substr(trim($q), 0, 50)); }
$ok(str_contains($fav, "preg_match('/^[a-z0-9_]{1,80}$/', \$item)") && str_contains($core, "preg_match('/^[a-z0-9_]{1,80}$/', \$item)"), '[18] validação do item igual');
// limpeza
foreach (glob("$dir/*/*") ?: [] as $f) { @unlink($f); } foreach (glob("$dir/*") ?: [] as $f) { @rmdir($f); } @rmdir($dir);
echo $falhas ? "[ponte-core] FALHAS:\n - " . implode("\n - ", $falhas) . "\n" : "[ponte-core] OK — 18 grupos\n";
exit($falhas ? 1 : 0);
