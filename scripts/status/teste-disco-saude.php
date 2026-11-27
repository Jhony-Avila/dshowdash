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
$c('o 503 UNHEALTHY continua só a partir de 95%', substr_count($h, "elseif (\$diskUsedPercent >= 95) \$health['status'] = 'UNHEALTHY';"), 1);
$c('medição indisponível = null, nunca 100', substr_count($h, "\$diskPct === null ? null :"), 1);
$c('medição indisponível = 503 com motivo disco_desconhecido', substr_count($h, "'motivo'] = 'disco_desconhecido'"), 1);
$c('o health usa os limiares únicos', substr_count($h, 'DiscoSaude::medir('), 1);
echo "teste-disco-saude: $ok/" . ($ok + $falha) . " ok\n"; exit($falha ? 1 : 0);
