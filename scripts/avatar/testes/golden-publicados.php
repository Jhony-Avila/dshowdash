<?php
declare(strict_types=1);
/**
 * Onda 1 (Avatar nativo) — PROVA COM CONFIGS REAIS (DP-AN.7): para cada versão em camadas de app_user_avatars,
 * re-renderiza avatar_config com o ARTEFATO exportado do motor (render-cli.mjs, contexto sem globais), passa pelo
 * SvgSanitizer REAL e compara os bytes com o arquivo publicado. Imprime SÓ CONTAGENS (nenhum id, nome, config ou URL).
 * Flags remotas do usuário entram via FeatureFlagResolver quando existir. Nada é gravado. Precisa do banco → executar SÓ
 * no servidor, pelo Jhony:  php scripts/avatar/testes/golden-publicados.php [--limite N] [--motor public/assets/avatars/motor/motor-<v>.js]
 */
$raiz = dirname(__DIR__, 3);
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/avatar/SvgSanitizer.php';
$args = $argv; array_shift($args);
$limite = 0; $motor = '';
for ($i = 0; $i < count($args); $i++) {
    if ($args[$i] === '--limite') { $limite = (int) ($args[++$i] ?? 0); }
    elseif ($args[$i] === '--motor') { $motor = (string) ($args[++$i] ?? ''); }
}
if ($motor === '') {
    $meta = @json_decode((string) @file_get_contents($raiz . '/public/assets/avatars/motor/motor.json'), true);
    $motor = is_array($meta) ? $raiz . '/public/assets/avatars/motor/' . ($meta['arquivo'] ?? '') : '';
}
if (!is_file($motor)) { fwrite(STDERR, "motor exportado não encontrado (rode scripts/avatar/exportar-motor.mjs)\n"); exit(2); }
$cli = $raiz . '/scripts/avatar/motor/render-cli.mjs';
$resolver = $raiz . '/api/feature-flags/resolver.php';
$flagsRemotas = [];
if (is_file($motor) && is_file(dirname($motor) . '/motor.json')) {
    $m = json_decode((string) file_get_contents(dirname($motor) . '/motor.json'), true);
    $flagsRemotas = is_array($m['flags_remotas'] ?? null) ? $m['flags_remotas'] : [];
}
$pdo = getConnection('DSHOWDASH');
$sql = "SELECT user_id, avatar_config, avatar_image_url FROM app_user_avatars
        WHERE avatar_type = 'generated' AND avatar_config LIKE '%\"formato\":\"camadas\"%' AND avatar_image_url LIKE '%.svg'
        ORDER BY id DESC" . ($limite > 0 ? " LIMIT " . $limite : '');
$st = $pdo->query($sql);
$res = ['linhas' => 0, 'arquivo_ausente' => 0, 'config_invalida' => 0, 'identicos' => 0, 'divergentes' => 0, 'erro_render' => 0];
$ff = null;
if (is_file($resolver)) { require_once $resolver; $ff = new FeatureFlagResolver($pdo); }
$cacheFlags = [];
foreach ($st as $l) {
    $res['linhas']++;
    $arq = $raiz . '/public' . (string) $l['avatar_image_url'];
    if (!is_file($arq)) { $res['arquivo_ausente']++; continue; }
    $uid = (int) $l['user_id'];
    if (!isset($cacheFlags[$uid])) {
        $cacheFlags[$uid] = [];
        if ($ff) { foreach ($flagsRemotas as $k) { try { $cacheFlags[$uid][$k] = ($ff->resolve($k, $uid)['enabled'] ?? false) === true; } catch (Throwable $e) { $cacheFlags[$uid][$k] = false; } } }
    }
    $pedido = json_encode(['config' => json_decode((string) $l['avatar_config'], true), 'flags' => $cacheFlags[$uid]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $desc = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $proc = proc_open(['node', $cli, $motor], $desc, $pipes, $raiz);
    if (!is_resource($proc)) { $res['erro_render']++; continue; }
    fwrite($pipes[0], $pedido); fclose($pipes[0]);
    $svg = stream_get_contents($pipes[1]); fclose($pipes[1]); fclose($pipes[2]);
    $code = proc_close($proc);
    if ($code === 3) { $res['config_invalida']++; continue; }
    if ($code !== 0 || $svg === '') { $res['erro_render']++; continue; }
    try { $esperado = SvgSanitizer::sanitizar($svg); } catch (Throwable $e) { $res['erro_render']++; continue; }
    if (hash('sha256', $esperado) === hash_file('sha256', $arq)) { $res['identicos']++; } else { $res['divergentes']++; }
}
echo json_encode($res, JSON_PRETTY_PRINT) . "\n";
echo ($res['divergentes'] === 0 && $res['erro_render'] === 0 && $res['identicos'] > 0) ? "[golden-publicados] OK — todos os publicados em camadas reproduzidos byte a byte\n" : "[golden-publicados] ATENÇÃO — ver contagens acima\n";
exit(($res['divergentes'] === 0 && $res['erro_render'] === 0) ? 0 : 1);
