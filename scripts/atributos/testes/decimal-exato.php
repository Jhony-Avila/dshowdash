<?php
// Produtos & Atributos — DecimalExato::mulDiv (conversão de unidade sem float; o servidor não tem bcmath/gmp). a × f1 ÷ f2, meio-para-cima.
declare(strict_types=1);
require_once __DIR__ . '/../../../api/atributos/DecimalExato.php';

$casos = [
    // [a, f1, f2, escala, esperado, descrição]
    ['1500', '0.001', '0.01', 6, '150', 'mm → cm'],
    ['150', '0.01', '0.001', 6, '1500', 'cm → mm'],
    ['80', '0.01', '1', 6, '0.8', 'cm → m'],
    ['0.8', '1', '0.01', 6, '80', 'm → cm'],
    ['1', '0.0254', '0.01', 6, '2.54', 'pol → cm'],
    ['1', '1', '3', 6, '0.333333', 'dízima truncada na escala'],
    ['2', '1', '3', 6, '0.666667', 'meio-para-cima'],
    ['-1500', '0.001', '0.01', 6, '-150', 'negativo'],
    ['0', '0.001', '0.01', 6, '0', 'zero'],
    ['123456789012345.123456', '1', '1', 6, '123456789012345.123456', 'grande, sem perda (float erraria)'],
    ['0.1', '3', '1', 6, '0.3', '0,1 × 3 = 0,3 exato (float dá 0.30000000000000004)'],
    ['12', '1', '1000', 2, '0.01', 'escala 2, meio-para-cima (0,012 → 0,01)'],
    ['15', '1', '1000', 2, '0.02', 'escala 2, 0,015 → 0,02'],
    ['3600', '1', '3600', 6, '1', 's → h'],
];
$n = 0; $falhas = 0;
foreach ($casos as [$a, $f1, $f2, $esc, $esp, $desc]) {
    $n++;
    $obt = DecimalExato::mulDiv($a, $f1, $f2, $esc);
    if ($obt !== $esp) { $falhas++; echo "[ERRO] $desc: mulDiv($a, $f1, $f2, $esc) = $obt · esperado $esp\n"; }
}
$n++;
try { DecimalExato::mulDiv('1', '1', '0'); $falhas++; echo "[ERRO] divisão por zero deveria falhar\n"; } catch (Throwable) {}
echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " decimal-exato: $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
