<?php
declare(strict_types=1);
// teste-texto-perfil.php (AZUL/ESQUERDA, 27/11 · P0 XSS-UARPS) — sem banco, sem rede.
// Uso: php scripts/seguranca/teste-texto-perfil.php [RAIZ]   (RAIZ = árvore a conferir; padrão = a deste arquivo)
$raiz = rtrim($argv[1] ?? dirname(__DIR__, 2), '/'); $f = 0; $n = 0;
$ok = function (bool $c, string $m) use (&$f, &$n) { $n++; if (!$c) { $f++; echo "  FALHA: $m\n"; } };
$h = "$raiz/api/_helpers/TextoPerfil.php";
$ok(is_file($h), 'helper TextoPerfil.php existe');
if (is_file($h)) {
    require_once $h;
    foreach (['Teste" data-x="1" x="', 'a<b', 'a>b', '<img src=x>', 'x`y', "linha\nnova", "tab\tx", "nul\x00", "\xe9 latin1"] as $p)
        $ok(TextoPerfil::inseguro($p), 'recusa ' . bin2hex($p));
    foreach (['José da Silva', "D'Ávila", 'Ana-Maria (Vendas)', 'Gerente & Sócio', '', 'Nº 10, 50%'] as $p)
        $ok(!TextoPerfil::inseguro($p), 'aceita ' . $p);
}
$src = (string) @file_get_contents("$raiz/api/user/profile.php");
$ok(str_contains($src, "require_once __DIR__ . '/../_helpers/TextoPerfil.php'"), 'profile.php carrega o helper');
$pi = strpos($src, 'TextoPerfil::inseguro'); $ps = strpos($src, 'strip_tags(');
$ok($pi !== false && $ps !== false && $pi < $ps, 'profile.php recusa ANTES de limpar (inseguro antes de strip_tags)');
$ok((bool) preg_match("/\\\$recusados !== \[\]\) \{\s*ApiResponse::error\('VALIDATION_FAILED', 400/", $src), 'profile.php responde 400 VALIDATION_FAILED com os campos recusados');
$ok(strpos($src, "\$recusados !== []") < strpos($src, '$repo->update('), 'a recusa vem antes de qualquer gravação');
echo ($f === 0 ? '[OK]  ' : '[ERRO]') . " teste-texto-perfil: " . ($f === 0 ? "$n verificações" : "$f de $n") . " (campos do perfil recusam \" < > ` e controles antes de gravar; apóstrofo e acentos aceitos)\n";
exit($f === 0 ? 0 : 1);
