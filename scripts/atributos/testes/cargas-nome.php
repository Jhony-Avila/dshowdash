<?php
// Produtos & Atributos — teste puro da leitura do nome (carga C6/C6c): medidas, pitch, Hz e ambiente. Sem banco.
// Rodar: php scripts/atributos/testes/cargas-nome.php
declare(strict_types=1);
require_once __DIR__ . '/../../../tools/equipamentos/cargas.php';

$n = 0; $falhas = 0;
$igual = function (string $nome, $obtido, $esperado) use (&$n, &$falhas): void {
    $n++; if ($obtido !== $esperado) { $falhas++; echo "[ERRO] $nome: obtido " . json_encode($obtido) . ' · esperado ' . json_encode($esperado) . "\n"; }
};
$l = fn(string $s) => Cargas::lerNome($s);

$igual('T-1: Semi-Outdoor vira semi-outdoor (não outdoor)', $l('Totem Aluminio P.3.076 Semi-Outdoor 640mm x 1920mm 3840Hz')['ambiente'] ?? null, 'semi-outdoor');
$igual('T-1: "semi outdoor" com espaço', $l('Totem P4 semi outdoor 640mm x 1920mm')['ambiente'] ?? null, 'semi-outdoor');
$igual('Outdoor continua outdoor', $l('Totem P4 outdoor 640mm X 1920mm')['ambiente'] ?? null, 'outdoor');
$igual('Indoor continua indoor', $l('Totem Aluminio Com Vidro P.2.5 Indoor 640mm x 1920mm 3840Hz')['ambiente'] ?? null, 'indoor');
$igual('T-2: "38040Hz" não vira 8040 (sem sugestão pelo nome)', $l('Totem Aluminio Com Vidro P.1.25 COB Indoor 640mm x 1920mm 38040Hz')['hz'] ?? null, null);
$igual('3840Hz', $l('Totem P.2.5 Indoor 640mm x 1920mm 3840Hz')['hz'] ?? null, '3840');
$igual('1920 Hz com espaço', $l('Módulo P4 1920 Hz')['hz'] ?? null, '1920');
$igual('medidas largura × altura', [$l('Totem 640mm x 1920mm')['largura'] ?? null, $l('Totem 640mm x 1920mm')['altura'] ?? null], ['640', '1920']);
$igual('pitch P.3.076', $l('Totem Aluminio P.3.076 Semi-Outdoor')['pitch'] ?? null, '3.076');
$igual('pitch P2,5 com vírgula', $l('Módulo P2,5 Indoor')['pitch'] ?? null, '2.5');
$igual('T-6: Dupla Face → 2 faces', Cargas::lerNomeC8('Totem Dupla Face P.2.5 Indoor 640mm x 1920mm 3840Hz')['faces'] ?? null, '2');
$igual('T-6: sem dupla face → nada', Cargas::lerNomeC8('Totem P.2.5 Indoor 640mm x 1920mm')['faces'] ?? null, null);
$igual('T-7: 1 metro diâmetro → 100 cm', Cargas::lerNomeC8('Esfera Led P.2.5 indoor - 1 metro diâmetro 3840 Hz')['diametro_cm'] ?? null, '100');
$igual('T-7: 1.5 metro diâmetro → 150 cm', Cargas::lerNomeC8('Esfera Led P.2.5 indoor - 1.5 metro diâmetro 3840 Hz')['diametro_cm'] ?? null, '150');
$igual('T-7: 0,75 metros de diâmetro → 75 cm', Cargas::lerNomeC8('Esfera 0,75 metros de diametro')['diametro_cm'] ?? null, '75');
$igual('correção do 283 registrada (3840)', Cargas::C6_CORRECOES[283]['taxa_de_atualizacao_refresh_rate_93'][0] ?? null, '3840');

echo ($falhas === 0 ? '[OK]  ' : '[FALHA]') . " cargas-nome (C6c/C8: nome → sugestão): $n casos, $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
