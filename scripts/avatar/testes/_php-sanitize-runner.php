<?php
declare(strict_types=1);
/**
 * Golden V3.2 §4 — runner ISOLADO do sanitizador PHP REAL.
 *
 * Extrai a função `avst_validar_config($bruto): array` DIRETO de
 * api/avatar/studio.php (byte a byte, por brace-matching — inclui a
 * correção V3.2) e a executa fora do fluxo HTTP/DB. É EXATAMENTE a função
 * que o handler POST chama (studio.php: `$config = avst_validar_config(...)`)
 * antes de persistir a linha. Ou seja: a saída aqui == o que o banco grava.
 *
 * uso: php _php-sanitize-runner.php <studio.php> <config_raw.json>
 *   -> stdout: JSON do config SANITIZADO (o "persisted")
 */
if ($argc < 3) { fwrite(STDERR, "uso: runner <studio.php> <raw.json>\n"); exit(2); }
$src = file_get_contents($argv[1]);
if ($src === false) { fwrite(STDERR, "nao leu studio.php\n"); exit(2); }

$needle = 'function avst_validar_config($bruto): array';
$i = strpos($src, $needle);
if ($i === false) { fwrite(STDERR, "assinatura nao encontrada\n"); exit(2); }
// acha o primeiro '{' apos a assinatura e faz brace-matching
$open = strpos($src, '{', $i);
$depth = 0; $end = -1;
for ($p = $open, $n = strlen($src); $p < $n; $p++) {
    $c = $src[$p];
    if ($c === '{') { $depth++; }
    elseif ($c === '}') { $depth--; if ($depth === 0) { $end = $p; break; } }
}
if ($end < 0) { fwrite(STDERR, "brace-match falhou\n"); exit(2); }
$fnSrc = substr($src, $i, $end - $i + 1);

// define a funcao real em isolamento e executa
eval($fnSrc);

$rawJson = file_get_contents($argv[2]);
$bruto = json_decode($rawJson, true);
try {
    $out = avst_validar_config($bruto);
} catch (Throwable $e) {
    fwrite(STDERR, 'sanitize lancou: ' . $e->getMessage() . "\n");
    exit(3);
}
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
