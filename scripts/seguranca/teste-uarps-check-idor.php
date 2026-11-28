<?php
declare(strict_types=1);
// teste-uarps-check-idor.php (AZUL/ESQUERDA, 28/11) — check-trigger/check-region/check-multiple: consultar OUTRA pessoa (user_id ≠ o da sessão)
// exige enforceUarpsAdmin (gate:admin:permissions + nível 80). A própria pessoa segue livre. Estático (sem banco). Uso: php <este> [RAIZ]
$raiz = rtrim($argv[1] ?? dirname(__DIR__, 2), '/'); $src = (string) @file_get_contents("$raiz/api/permissions/uarps.php"); $f = 0; $n = 0;
$ok = function (bool $c, string $m) use (&$f, &$n) { $n++; if (!$c) { $f++; echo "  FALHA: $m\n"; } };
foreach (['check-trigger', 'check-region', 'check-multiple'] as $acao) {
    $i = strpos($src, "case '$acao':"); $j = $i === false ? false : strpos($src, 'break;', $i);
    $bloco = ($i !== false && $j !== false) ? substr($src, $i, $j - $i) : '';
    $ok($bloco !== '', "$acao existe");
    $p1 = strpos($bloco, "\$targetUserId = \$validator->id('user_id', 0) ?: \$userId;"); $p2 = strpos($bloco, 'if ($targetUserId !== $userId) { enforceUarpsAdmin($userId); }');
    $p3 = strpos($bloco, 'ApiResponse::success(');
    $ok($p1 !== false && $p2 !== false && $p3 !== false && $p1 < $p2 && $p2 < $p3, "$acao: outra pessoa → enforceUarpsAdmin ANTES da resposta");
}
$ok(str_contains($src, "case 'my-permissions':"), 'my-permissions (a própria) continua');
echo ($f === 0 ? '[OK]  ' : '[ERRO]') . " teste-uarps-check-idor: " . ($f === 0 ? "$n verificações" : "$f de $n") . " (check-* de outra pessoa exige a alçada do editor)\n"; exit($f ? 1 : 0);
