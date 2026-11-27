<?php
// teste-disco-saude.php — RT-001 (VERMELHO, 26/11): fronteiras dos limiares únicos de disco do Dash e a regra do 503 do /api/health.
// Rodar: php scripts/status/teste-disco-saude.php   (sem banco, sem rede)
declare(strict_types=1);
require __DIR__ . '/../../api/core/DiscoSaude.php';
$ok = 0; $falha = 0;
$c = function (string $nome, $obtido, $esperado) use (&$ok, &$falha) { if ($obtido === $esperado) { $ok++; } else { $falha++; echo "FALHA $nome: " . var_export($obtido, true) . ' (esperado ' . var_export($esperado, true) . ")\n"; } };
$t = 10000.0;
foreach ([[0, 'online'], [8499, 'online'], [8500, 'warning'], [9199, 'warning'], [9200, 'critical'], [9500, 'critical'], [10000, 'critical']] as [$usado, $nivel])
    $c("usado $usado/10000", DiscoSaude::medir($t, $t - $usado)[1], $nivel);
$c('84,999% não arredonda para aviso', DiscoSaude::medir(100000.0, 15001.0)[1], 'online');
$c('91,999% ainda é aviso', DiscoSaude::medir(100000.0, 8001.0)[1], 'warning');
foreach ([[false, 1.0], [1.0, false], [0.0, 0.0], [10.0, -1.0], [10.0, 11.0]] as $i => [$tot, $liv]) $c("amostra inválida $i", DiscoSaude::medir($tot, $liv), [null, 'unknown']);
$h = file_get_contents(__DIR__ . '/../../api/health.php');
// HL-001-R1 (27/11, ratificado pelo arquiteto; ajuste do AZUL neste teste): o BLOQUEIO (503 UNHEALTHY) passa de 95% para 92%, decidido
// pelo valor NÃO arredondado; 85–92% = aviso sem piorar o agregado. As regras ficam em api/core/HealthAgregado.php.
require __DIR__ . '/../../api/core/HealthAgregado.php';
$c('o 503 UNHEALTHY vem a partir de 92% (bloqueio), não mais 95%', [HealthAgregado::LIMIARES['disco'], HealthAgregado::nivelUso('disco', 100000.0, 8000.0)['agregado'], HealthAgregado::nivelUso('disco', 100000.0, 8001.0)['agregado'], substr_count($h, "HealthAgregado::nivelUso('disco'") === 1 && substr_count($h, "\$piorar(\$d['agregado'])") === 1], [[85, 92], 'UNHEALTHY', 'HEALTHY', true]);
$c('medição indisponível = null, nunca 100', [HealthAgregado::nivelUso('disco', false, 1.0)['uso'], substr_count($h, "'used_percent' => \$d['uso'] === null ? null")], [null, 1]);
$c('medição indisponível = 503 com motivo disco_desconhecido', [HealthAgregado::nivelUso('disco', false, 1.0)['agregado'], HealthAgregado::nivelUso('disco', false, 1.0)['motivo']], ['UNHEALTHY', 'disco_desconhecido']);
$mapa = ['online' => 'OK', 'warning' => 'WARNING', 'critical' => 'CRITICAL', 'unknown' => 'UNKNOWN']; $igual = true;
foreach ([[0, 0], [100000, 15001], [100000, 15000], [100000, 8001], [100000, 8000], [10, 11], [0, 0]] as [$tt, $ll]) { if ($mapa[DiscoSaude::medir((float) $tt, (float) $ll)[1]] !== HealthAgregado::nivelUso('disco', (float) $tt, (float) $ll)['rotulo']) { $igual = false; } }
$c('o health usa os limiares únicos (DiscoSaude e HealthAgregado concordam nas fronteiras)', $igual, true);
echo "teste-disco-saude: $ok/" . ($ok + $falha) . " ok\n"; exit($falha ? 1 : 0);
