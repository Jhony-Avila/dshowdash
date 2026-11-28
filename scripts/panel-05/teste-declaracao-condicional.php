<?php
declare(strict_types=1);
// scripts/panel-05/teste-declaracao-condicional.php — P0 28/11 (panel-05: `Call to undefined function p05v()`), VINHO.
// Função declarada DENTRO de um bloco (if/try/…) só passa a existir quando a execução chega a ela; o PHP só antecipa as de nível superior.
// Este teste lê os TOKENS do arquivo e falha se alguma função condicional for declarada DEPOIS do despachante (`switch ($action)`) — o caso que
// os testes por include/eval do bloco de funções não viam. Uso: php teste-declaracao-condicional.php [arquivo]   (padrão: o api.php do panel-05)
$arq = $argv[1] ?? dirname(__DIR__, 2) . '/api/modules/panels/panel-05/api.php';
$tk = token_get_all((string) file_get_contents($arq));
$prof = 0; $cond = []; $topo = []; $despacho = null; $pilhaFn = [];
for ($i = 0, $n = count($tk); $i < $n; $i++) {
    $t = $tk[$i];
    if ($t === '{' || (is_array($t) && in_array($t[0], [T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES], true))) { $prof++; continue; }
    if ($t === '}') { $prof--; if ($pilhaFn && end($pilhaFn) === $prof) array_pop($pilhaFn); continue; }
    if (!is_array($t)) continue;
    if ($t[0] === T_SWITCH && $despacho === null && $pilhaFn === []) {
        for ($j = $i + 1; $j < $i + 6 && $j < $n; $j++) if (is_array($tk[$j]) && $tk[$j][0] === T_VARIABLE && $tk[$j][1] === '$action') { $despacho = $t[2]; break; }
    }
    if ($t[0] === T_FUNCTION) {
        $j = $i + 1; while ($j < $n && is_array($tk[$j]) && $tk[$j][0] === T_WHITESPACE) $j++;
        if ($j < $n && is_array($tk[$j]) && $tk[$j][0] === T_STRING && $pilhaFn === []) {   // declaração nomeada fora de outra função
            if ($prof === 0) $topo[$tk[$j][1]] = $t[2]; else $cond[$tk[$j][1]] = $t[2];
        }
        // marca o corpo: a próxima '{' abre uma função (closures e métodos também — nada dentro deles conta como declaração do arquivo)
        for ($k = $j; $k < $n; $k++) { if ($tk[$k] === '{') { $pilhaFn[] = $prof; break; } if ($tk[$k] === ';') break; }
    }
}
$ok = 0; $f = 0; $c = function (string $nome, bool $v) use (&$ok, &$f): void { if ($v) $ok++; else { $f++; echo "FALHOU: $nome\n"; } };
$c('despachante (switch ($action)) encontrado', $despacho !== null);
foreach ($cond as $nome => $linha) $c("função condicional $nome() (linha $linha) declarada ANTES do despachante (linha $despacho)", $despacho !== null && $linha < $despacho);
$c('p05v() existe no arquivo', isset($cond['p05v']) || isset($topo['p05v']));
echo basename($arq) . ': ' . count($topo) . ' funções de nível superior, ' . count($cond) . " condicionais · $ok ok, $f falha(s)\n"; exit($f === 0 ? 0 : 1);
