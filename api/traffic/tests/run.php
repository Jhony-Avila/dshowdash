<?php
/**
 * Testes unitários do módulo de trânsito (sem framework). Uso: php api/traffic/tests/run.php
 * Cobre: normalização, classificação de nível, índice ponderado, km de lentidão (dedup),
 * penalidade de ocorrências (teto), tendência, comparação. @version 1.0.0
 */
require_once __DIR__ . '/../models/TrafficModels.php';
require_once __DIR__ . '/../calc/TrafficIndex.php';

$pass = 0; $fail = 0;
function ok($cond, $msg) { global $pass, $fail; if ($cond) { $pass++; } else { $fail++; echo "  ✗ FAIL: $msg\n"; } }
function near($a, $b, $eps = 0.5) { return $a !== null && abs($a - $b) <= $eps; }

$cfg = require __DIR__ . '/../config.php';

// ── congestionLevel ──
ok(TrafficModels::congestionLevel(90, 90, false) === 'normal', 'ratio 1.0 → normal');
ok(TrafficModels::congestionLevel(50, 100, false) === 'slow',  'ratio 0.5 → slow');
ok(TrafficModels::congestionLevel(10, 100, false) === 'critical', 'ratio 0.1 → critical');
ok(TrafficModels::congestionLevel(50, 100, true)  === 'critical', 'closure → critical');
ok(TrafficModels::congestionLevel(null, 100, false) === 'normal', 'sem current → normal');

// ── flowSegment normaliza ──
$seg = TrafficModels::flowSegment(['id'=>'x','currentSpeedKmh'=>30,'freeFlowSpeedKmh'=>60,'lengthMeters'=>1000]);
ok($seg['congestionLevel'] === 'slow', 'segmento 30/60 → slow');
ok($seg['currentSpeedKmh'] === 30.0 && $seg['freeFlowSpeedKmh'] === 60.0, 'velocidades preservadas');
ok($seg['roadClosure'] === false, 'closure default false');

// ── incident normaliza + saneia tipo/severidade ──
$inc = TrafficModels::incident(['id'=>'i','type'=>'INVALIDO','severity'=>'zzz','title'=>'t']);
ok($inc['type'] === 'other', 'tipo inválido → other');
ok($inc['severity'] === 'low', 'severidade inválida → low');

// ── computeSummary: 2 segmentos, sem incidentes ──
$flow = [
  TrafficModels::flowSegment(['id'=>'a','roadName'=>'A','currentSpeedKmh'=>30,'freeFlowSpeedKmh'=>60,'lengthMeters'=>1000]), // cong 0.5 → score 50
  TrafficModels::flowSegment(['id'=>'b','roadName'=>'B','currentSpeedKmh'=>90,'freeFlowSpeedKmh'=>90,'lengthMeters'=>1000]), // cong 0 → score 0
];
$sum = TrafficIndex::computeSummary($flow, [], $cfg, null);
// média ponderada por len (iguais) = (50+0)/2 = 25
ok($sum['trafficIndex'] === 25, 'índice base ponderado = 25 (obtido: ' . $sum['trafficIndex'] . ')');
ok($sum['level'] === 'normal', 'índice 25 → normal');
// avg current = (30+90)/2 = 60; avg free = (60+90)/2 = 75
ok(near($sum['averageCurrentSpeedKmh'], 60), 'velocidade média atual ~60');
ok(near($sum['averageFreeFlowSpeedKmh'], 75), 'velocidade livre média ~75');
// congestionado: seg a (30 < 60*0.65=39) sim; seg b não → 1km
ok(near($sum['estimatedCongestionKm'], 1.0, 0.05), 'km de lentidão = 1.0 (obtido: ' . $sum['estimatedCongestionKm'] . ')');

// ── dedup: mesmo id não conta 2x ──
$dup = [
  TrafficModels::flowSegment(['id'=>'d','currentSpeedKmh'=>10,'freeFlowSpeedKmh'=>60,'lengthMeters'=>2000]),
  TrafficModels::flowSegment(['id'=>'d','currentSpeedKmh'=>10,'freeFlowSpeedKmh'=>60,'lengthMeters'=>2000]),
];
$sd = TrafficIndex::computeSummary($dup, [], $cfg, null);
ok(near($sd['estimatedCongestionKm'], 2.0, 0.05), 'dedup por id → 2km e não 4km (obtido: ' . $sd['estimatedCongestionKm'] . ')');

// ── penalidade de ocorrências com teto ──
$incs = [];
for ($i = 0; $i < 30; $i++) $incs[] = TrafficModels::incident(['id'=>"c$i",'type'=>'closure','title'=>'x']);
$sp = TrafficIndex::computeSummary($flow, $incs, $cfg, null);
// base 25 + penalidade (30*1.5=45, teto 15) = 40
ok($sp['trafficIndex'] === 40, 'penalidade respeita teto (25+15=40, obtido: ' . $sp['trafficIndex'] . ')');
ok($sp['closures'] === 30, 'contagem de interdições = 30');

// ── classificação de faixas ──
ok(TrafficIndex::levelFor(0.0, $cfg) === 'normal', '0 → normal');
ok(TrafficIndex::levelFor(50.0, $cfg) === 'moderate', '50 → moderate');
ok(TrafficIndex::levelFor(80.0, $cfg) === 'intense', '80 → intense');
ok(TrafficIndex::levelFor(null, $cfg) === 'unavailable', 'null → unavailable');

// ── tendência ──
$tUp = TrafficIndex::computeSummary($flow, [], $cfg, 10.0);  // 25 vs prev 10 → worsening
ok($tUp['trend'] === 'worsening', 'tendência piorando');
$tDn = TrafficIndex::computeSummary($flow, [], $cfg, 90.0);  // 25 vs prev 90 → improving
ok($tDn['trend'] === 'improving', 'tendência melhorando');
$tSt = TrafficIndex::computeSummary($flow, [], $cfg, 26.0);  // 25 vs 26 → stable
ok($tSt['trend'] === 'stable', 'tendência estável');

// ── flow vazio → índice indisponível ──
$empty = TrafficIndex::computeSummary([], [], $cfg, null);
ok($empty['trafficIndex'] === null && $empty['level'] === 'unavailable', 'sem fluxo → indisponível');

echo "\n" . ($fail === 0 ? "✓ TODOS OS TESTES PASSARAM" : "✗ HOUVE FALHAS") . " — $pass passaram, $fail falharam\n";
exit($fail === 0 ? 0 : 1);
