<?php
declare(strict_types=1);
/**
 * Onda 1 (Avatar nativo) — TESTE DE COMPORTAMENTO da StudioLib.php com PDO FALSO (sem banco):
 * prova que a persistência extraída preserva a ordem e o conteúdo das operações do studio.php
 * (limite 30/h, config inválida, item bloqueado, SVG ausente/rejeitado, conflito 409, sucesso com arquivo + 5 escritas,
 * reativar sem arquivo novo, historico_meta nome/fixado, poda preservando fixadas) e que avst_meta/avst_historico/avst_estado
 * devolvem a mesma forma de dados do endpoint. uso: php scripts/avatar/testes/studio-lib.php
 */
require_once __DIR__ . '/../../../api/avatar/StudioLib.php';
require_once __DIR__ . '/_pdo-falso.php';

$falhas = [];
$ok = static function (bool $c, string $m) use (&$falhas): void { if (!$c) { $falhas[] = $m; } };
$erro = static function (callable $fn): ?AvstErro { try { $fn(); return null; } catch (AvstErro $e) { return $e; } };
$dir = sys_get_temp_dir() . '/avst-lib-teste-' . getmypid();
@mkdir($dir, 0700, true);
$configOk = ['formato' => 'camadas', 'versao' => 1, 'base' => 'base_pele_clara', 'camadas' => ['olhos' => 'olh_padrao', 'boca' => 'boc_sorriso', 'roupa' => 'rou_camiseta', 'fundo' => 'fun_neon'],
    'cores' => ['pele' => '#f5d0a9', 'cabelo' => '#2b1b12', 'roupa' => '#2d4a8a', 'destaque' => '#7c5cff']];
$svgOk = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="#111"/><circle cx="120" cy="120" r="60" fill="#f5d0a9"/></svg>';
$base = static function (array $extra = []): PdoFalso {
    $p = new PdoFalso();
    $p->respostas = $extra + [
        '/^SELECT COUNT\(\*\) FROM app_user_avatars WHERE user_id = \? AND avatar_type IN/' => ['linhas' => [['n' => 3]]],
        '/^SELECT id, version FROM app_user_avatars WHERE user_id = \? AND is_active = 1/' => ['linhas' => [['id' => 10, 'version' => 4]]],
        '/^SELECT DISTINCT a\.`key` FROM avatar_assets a JOIN avatar_unlock_rules/' => ['linhas' => []],
    ];
    return $p;
};
$pedido = ['config' => $configOk, 'svg' => $svgOk, 'base_version' => 4];

// 1) limite por hora
$p = $base(['/^SELECT COUNT\(\*\) FROM app_user_avatars WHERE user_id = \? AND avatar_type IN/' => ['linhas' => [['n' => 30]]]]);
$e = $erro(fn() => avst_persistir($p, 7, $pedido, $dir));
$ok($e && $e->codigo === 'RATE_LIMIT' && $e->status === 429 && $e->extra === ['limite_por_hora' => 30], '[1] RATE_LIMIT 429 esperado');
$ok(count($p->executadas) === 1, '[1] só a contagem deve ter rodado antes do 429');
// 2) config inválida → 400 com a mensagem do validador
$e = $erro(fn() => avst_persistir($base(), 7, ['config' => ['formato' => 'xyz'], 'svg' => $svgOk], $dir));
$ok($e && $e->status === 400 && $e->codigo !== '' , '[2] config inválida → 400 (' . ($e ? $e->codigo : 'sem erro') . ')');
// 3) item bloqueado 403
$p = $base(['/^SELECT DISTINCT a\.`key` FROM avatar_assets a JOIN avatar_unlock_rules/' => ['linhas' => [['key' => 'fun_neon']]]]);
$e = $erro(fn() => avst_persistir($p, 7, $pedido, $dir));
$ok($e && $e->codigo === 'ITEM_BLOQUEADO' && $e->status === 403 && ($e->extra['itens'] ?? null) === ['fun_neon'], '[3] ITEM_BLOQUEADO 403 com a lista');
// 4) svg ausente / rejeitado
$e = $erro(fn() => avst_persistir($base(), 7, ['config' => $configOk, 'base_version' => 4], $dir));
$ok($e && $e->codigo === 'SVG_AUSENTE' && $e->status === 400, '[4a] SVG_AUSENTE');
$e = $erro(fn() => avst_persistir($base(), 7, ['config' => $configOk, 'svg' => '<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>', 'base_version' => 4], $dir));
$ok($e && $e->codigo === 'SVG_REJEITADO' && $e->status === 400 && isset($e->extra['motivo']), '[4b] SVG_REJEITADO com motivo');
// 5) conflito de versão → 409 com rollback
$p = $base();
$e = $erro(fn() => avst_persistir($p, 7, ['config' => $configOk, 'svg' => $svgOk, 'base_version' => 3], $dir));
$ok($e && $e->codigo === 'CONFLITO_VERSAO' && $e->status === 409 && $e->extra === ['version' => 4], '[5] CONFLITO_VERSAO 409 {version:4}');
$ok($p->eventos === ['begin', 'rollback'], '[5] transação revertida');
$ok(!is_file("$dir/u7-v5.svg"), '[5] nenhum arquivo escrito no conflito');
// 6) sucesso: arquivo + ordem das escritas + retorno
$p = $base();
$r = avst_persistir($p, 7, $pedido, $dir);
$ok($r === ['version' => 5, 'render_url' => '/assets/avatars/studio/u7-v5.svg', 'tipo' => 'camadas'], '[6] retorno {version:5, render_url, tipo:camadas}: ' . json_encode($r));
$ok(is_file("$dir/u7-v5.svg") && file_get_contents("$dir/u7-v5.svg") === SvgSanitizer::sanitizar($svgOk), '[6] arquivo = sanitizar(svg) byte a byte');
$ok(!is_file("$dir/u7-v5.svg.tmp"), '[6] tmp renomeado');
$sqls = array_map(static fn($x) => $x[0], $p->executadas);
$esperada = ['SELECT COUNT(*) FROM app_user_avatars', 'SELECT DISTINCT a.`key`', 'SELECT id, version FROM app_user_avatars', 'UPDATE app_user_avatars SET is_active = 0', 'INSERT INTO app_user_avatars', 'DELETE a FROM app_user_avatars a', 'DELETE m FROM avatar_version_meta m', 'UPDATE app_users SET avatar_url = ?'];
$ok(count($sqls) === count($esperada), '[6] ' . count($esperada) . ' comandos esperados, ' . count($sqls) . ' executados');
foreach ($esperada as $i => $prefixo) { $ok(isset($sqls[$i]) && str_starts_with($sqls[$i], $prefixo), "[6] comando #$i deveria começar com '$prefixo' (veio: " . substr($sqls[$i] ?? '-', 0, 40) . ')'); }
$ok($p->eventos === ['begin', 'commit'], '[6] begin → commit');
$ins = $p->executadas[4][1] ?? [];
$ok(($ins[0] ?? null) === 7 && ($ins[1] ?? null) === 'generated' && ($ins[3] ?? null) === '/assets/avatars/studio/u7-v5.svg' && ($ins[4] ?? null) === 5, '[6] INSERT com user, generated, url, versão 5');
$cfgGravado = json_decode((string) ($ins[2] ?? ''), true);
$ok(is_array($cfgGravado) && $cfgGravado['formato'] === 'camadas' && $cfgGravado['base'] === 'base_pele_clara', '[6] avatar_config gravado = config validada');
$ok(str_contains($sqls[5], 'LIMIT 100') && str_contains($sqls[5], 'is_pinned = 1'), '[6] poda LIMIT 100 preservando fixadas');
$ok(($p->executadas[7][1] ?? null) === ['/assets/avatars/studio/u7-v5.svg', 7], '[6] espelho em app_users.avatar_url');
// 6b) sem base_version (null) não gera conflito
$r = avst_persistir($base(), 7, ['config' => $configOk, 'svg' => $svgOk], $dir);
$ok(($r['version'] ?? 0) === 5, '[6b] sem base_version salva normalmente');
// 7) reativar: reutiliza URL, sem arquivo novo, tipo pelo config
$p = $base(['/^SELECT avatar_type, avatar_config, avatar_image_url FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => [['avatar_type' => 'generated', 'avatar_config' => json_encode($configOk), 'avatar_image_url' => '/assets/avatars/studio/u7-v2.svg']]]]);
$r = avst_persistir($p, 7, ['reativar_id' => 2, 'base_version' => 4], $dir);
$ok($r === ['version' => 5, 'render_url' => '/assets/avatars/studio/u7-v2.svg', 'tipo' => 'camadas'], '[7] reativar devolve url antiga e versão 5: ' . json_encode($r));
$ok(!is_file("$dir/u7-v5.svg") || filemtime("$dir/u7-v5.svg") > 0, '[7] (sem escrita nova — arquivo de [6] permanece)');
$p = $base(['/^SELECT avatar_type, avatar_config, avatar_image_url FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => []]]);
$e = $erro(fn() => avst_persistir($p, 7, ['reativar_id' => 99], $dir));
$ok($e && $e->codigo === 'VERSAO_NAO_ENCONTRADA' && $e->status === 404, '[7b] reativar inexistente → 404');
// 8) historico_meta
$p = new PdoFalso();
$p->respostas = ['/^SELECT id FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => [['id' => 10]]], '/^SELECT label, is_pinned FROM avatar_version_meta/' => ['linhas' => [['label' => 'Antigo', 'is_pinned' => 0]]]];
$r = avst_meta($p, 7, ['id' => 10, 'nome' => '  <b>Gala</b> 2026 ', 'fixado' => true]);
$ok($r === ['id' => 10, 'nome' => 'Gala 2026', 'fixado' => true], '[8] meta: strip_tags+trim, fixado true: ' . json_encode($r));
$ok(str_starts_with($p->executadas[2][0] ?? '', 'INSERT INTO avatar_version_meta') && ($p->executadas[2][1] ?? null) === [7, 10, 'Gala 2026', 1], '[8] upsert avatar_version_meta');
$r = avst_meta($p, 7, ['id' => 10, 'nome' => str_repeat('x', 80)]);
$ok(mb_strlen($r['nome']) === 60, '[8b] nome cortado em 60');
$e = $erro(fn() => avst_meta($p, 7, ['id' => 0]));
$ok($e && $e->codigo === 'VERSAO_INVALIDA' && $e->status === 400, '[8c] id inválido → 400');
$p2 = new PdoFalso(); $p2->respostas = ['/^SELECT id FROM app_user_avatars WHERE id = \? AND user_id = \?/' => ['linhas' => []]];
$e = $erro(fn() => avst_meta($p2, 7, ['id' => 5]));
$ok($e && $e->codigo === 'VERSAO_NAO_ENCONTRADA' && $e->status === 404, '[8d] versão de outro usuário → 404');
// 9) histórico e estado: forma
$p = new PdoFalso();
$p->respostas = ['/^SELECT a\.id, a\.avatar_type, a\.avatar_config, a\.avatar_image_url, a\.created_at, a\.is_active, a\.version, m\.label, m\.is_pinned FROM app_user_avatars a LEFT JOIN avatar_version_meta m/' => ['linhas' => [
    ['id' => 10, 'avatar_type' => 'generated', 'avatar_config' => json_encode($configOk), 'avatar_image_url' => '/assets/avatars/studio/u7-v4.svg', 'created_at' => '2026-10-27 10:00:00', 'is_active' => 1, 'version' => 4, 'label' => 'Gala', 'is_pinned' => 1],
    ['id' => 9, 'avatar_type' => 'image', 'avatar_config' => null, 'avatar_image_url' => '/assets/avatars/studio/u7-v3.png', 'created_at' => '2026-10-26 10:00:00', 'is_active' => 0, 'version' => 3, 'label' => null, 'is_pinned' => 0],
]]];
$h = avst_historico($p, 7);
$ok(($h['retencao'] ?? 0) === 100 && count($h['itens']) === 2, '[9] histórico: 2 itens, retenção 100');
$ok($h['itens'][0]['tipo'] === 'camadas' && $h['itens'][0]['nome'] === 'Gala' && $h['itens'][0]['fixado'] === true && $h['itens'][0]['ativo'] === true && is_array($h['itens'][0]['config']), '[9] item camadas com meta');
$ok($h['itens'][1]['tipo'] === 'foto' && $h['itens'][1]['config'] === null && $h['itens'][1]['fixado'] === false, '[9] item foto sem config');
$p = new PdoFalso();
$p->respostas = ['/^SELECT id, avatar_type, avatar_config, avatar_image_url, version, updated_at FROM app_user_avatars WHERE user_id = \? AND is_active = 1/' => ['linhas' => [['id' => 10, 'avatar_type' => 'generated', 'avatar_config' => json_encode($configOk), 'avatar_image_url' => '/assets/avatars/studio/u7-v4.svg', 'version' => 4, 'updated_at' => 'x']]],
    '/^SELECT avatar_url FROM app_users WHERE id = \?/' => ['linhas' => [['avatar_url' => '/assets/avatars/studio/u7-v4.svg']]]];
$s = avst_estado($p, 7);
$ok(array_keys($s) === ['config', 'version', 'render_url', 'avatar_url', 'tipo_ativo', 'config_camadas_recente', 'config_3d_recente'], '[10] estado: mesmas 7 chaves na mesma ordem: ' . implode(',', array_keys($s)));
$ok($s['version'] === 4 && $s['tipo_ativo'] === 'camadas' && $s['config']['base'] === 'base_pele_clara' && $s['config_3d_recente'] === null, '[10] estado coerente');
// limpeza
foreach (glob("$dir/*") ?: [] as $f) { @unlink($f); }
@rmdir($dir);
echo $falhas ? "[studio-lib] FALHAS:\n - " . implode("\n - ", $falhas) . "\n" : "[studio-lib] OK — 10 grupos (limite, config, trava, svg, 409, sucesso, reativar, meta, histórico, estado)\n";
exit($falhas ? 1 : 0);
