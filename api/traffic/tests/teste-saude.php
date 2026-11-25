<?php
declare(strict_types=1);
// api/traffic/tests/teste-saude.php — saúde do Trânsito com TomTom FALSA (nenhuma rede, nenhuma chave real). Uso: php api/traffic/tests/teste-saude.php
// Prova o achado da CIMA (23/11): resposta de ERRO da TomTom (cota/chave) não pode virar "up" nem "zero de lentidão / zero ocorrências".
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../models/TrafficModels.php';
require_once __DIR__ . '/../calc/TrafficSaude.php';
require_once __DIR__ . '/../providers/TomTomTrafficProvider.php';
$cfg = require __DIR__ . '/../config.php';
$N = count(require __DIR__ . '/../providers/fixtures/sp-roads.php');
$ok = 0; $falha = 0;
function check(string $n, bool $c, string $d = ''): void { global $ok, $falha; if ($c) $ok++; else { $falha++; echo "FALHOU: $n" . ($d !== '' ? "  ($d)" : '') . "\n"; } }
function erroDe(callable $f): ?string { try { $f(); return null; } catch (RuntimeException $e) { return $e->getMessage(); } }
$FLUXO = ['flowSegmentData' => ['currentSpeed' => 32, 'freeFlowSpeed' => 60, 'currentTravelTime' => 120, 'freeFlowTravelTime' => 60, 'confidence' => 1, 'roadClosure' => false]];
$COTA = ['detailedError' => ['code' => 'OVER_THE_LIMIT', 'message' => 'You have exceeded your daily request quota']];
$QPS = ['error' => 'Developer Over Qps', 'httpStatusCode' => 403];
$CHAVE = ['error' => 'Developer Inactive', 'httpStatusCode' => 403];
$prov = fn(Closure $http) => new TomTomTrafficProvider('chave-INVENTADA-de-teste', $cfg, $http);
$flowOuInc = fn(Closure $flow, Closure $inc) => fn(string $url, int $t): array => str_contains($url, 'flowSegmentData') ? $flow($url) : $inc($url);

// classificação
foreach ([[200, $FLUXO, 'ok'], [0, null, 'sem_resposta'], [429, [], 'cota'], [403, $COTA, 'cota'], [403, $QPS, 'cota'], [403, $CHAVE, 'chave'], [401, [], 'chave'],
          [503, null, 'servidor'], [400, ['error' => 'bad'], 'http_400']] as [$st, $j, $esp]) {
    check("classificar $st → $esp", traffic_http_classificar($st, $j) === $esp, traffic_http_classificar($st, $j));
}

// O BUG: cota excedida (403 com JSON de erro) — antes dava "up" e lista vazia
$p = $prov($flowOuInc(fn() => ['status' => 403, 'json' => $COTA], fn() => ['status' => 403, 'json' => $COTA]));
check('cota excedida: health DOWN (antes: up)', $p->health() === ['status' => 'down', 'detail' => 'cota']);
check('cota excedida: fluxo é FALHA, não lista vazia', erroDe(fn() => $p->getTrafficFlow($cfg['bounds'])) === 'flow_indisponivel:cota');
check('cota excedida: ocorrências são FALHA, não "zero"', erroDe(fn() => $p->getIncidents($cfg['bounds'])) === 'incidents_indisponivel:cota');
check('cota excedida: diagnóstico conta o erro', ($p->diagnostico()['erros']['ocorrencias_cota'] ?? 0) === 1);
$p = $prov($flowOuInc(fn() => ['status' => 403, 'json' => $CHAVE], fn() => ['status' => 403, 'json' => $CHAVE]));
check('chave recusada: health down/chave', $p->health() === ['status' => 'down', 'detail' => 'chave']);
$p = $prov($flowOuInc(fn() => ['status' => 0, 'json' => null], fn() => ['status' => 0, 'json' => null]));
check('sem resposta: health down/sem_resposta', $p->health() === ['status' => 'down', 'detail' => 'sem_resposta']);
$p = $prov($flowOuInc(fn() => ['status' => 200, 'json' => []], fn() => ['status' => 200, 'json' => []]));
check('200 sem flowSegmentData: health down/sem_fluxo', $p->health() === ['status' => 'down', 'detail' => 'sem_fluxo']);
check('200 sem flowSegmentData: fluxo é falha sem_fluxo', erroDe(fn() => $p->getTrafficFlow($cfg['bounds'])) === 'flow_indisponivel:sem_fluxo');
check('200 sem a lista de ocorrências: falha de formato', erroDe(fn() => $p->getIncidents($cfg['bounds'])) === 'incidents_indisponivel:formato');

// tudo certo
$p = $prov($flowOuInc(fn() => ['status' => 200, 'json' => $FLUXO], fn() => ['status' => 200, 'json' => ['incidents' => []]]));
check('normal: health up', $p->health() === ['status' => 'up', 'detail' => 'ok']);
$f = $p->getTrafficFlow($cfg['bounds']);
check("normal: $N vias lidas", count($f) === $N && $p->diagnostico()['flow_ok'] === $N);
check('normal: zero ocorrências DE VERDADE continua []', $p->getIncidents($cfg['bounds']) === []);
$q = TrafficSaude::qualidade(true, true, count($f), $p->diagnostico());
check('normal: qualidade completa', $q['status'] === 'complete' && $q['flowSegments'] === $N && $q['flowExpected'] === $N);
check('normal: saúde up', TrafficSaude::avaliar(['status' => 'up'], $q) === ['status' => 'up', 'motivo' => null]);

// metade das vias com 429
$i = 0;
$p = $prov($flowOuInc(function () use (&$i, $FLUXO) { return (++$i % 2) ? ['status' => 200, 'json' => $FLUXO] : ['status' => 429, 'json' => []]; },
                      fn() => ['status' => 200, 'json' => ['incidents' => []]]));
$f = $p->getTrafficFlow($cfg['bounds']); $q = TrafficSaude::qualidade(true, true, count($f), $p->diagnostico());
$esperadas = (int) ceil($N / 2);
check('metade com 429: retrato PARCIAL com as vias lidas', count($f) === $esperadas && $q['status'] === 'partial' && $q['errors'] === ['cota']);
check('metade com 429: saúde "parcial" com a contagem', TrafficSaude::avaliar(['status' => 'up'], $q) === ['status' => 'parcial', 'motivo' => "fluxo_parcial_{$esperadas}_de_$N"]);

// saúde a partir do último retrato
check('provedor ok mas fluxo vazio → parcial', TrafficSaude::avaliar(['status' => 'up'], TrafficSaude::qualidade(false, true, 0, ['flow_esperado' => $N, 'erros' => ['cota' => $N]]))['motivo'] === 'fluxo_vazio');
check('ocorrências indisponíveis → parcial', TrafficSaude::avaliar(['status' => 'up'], TrafficSaude::qualidade(true, false, $N, ['flow_esperado' => $N, 'erros' => []]))
    === ['status' => 'parcial', 'motivo' => 'ocorrencias_indisponiveis']);
check('sem retrato nenhum → parcial', TrafficSaude::avaliar(['status' => 'up'], null) === ['status' => 'parcial', 'motivo' => 'sem_retrato_recente']);
check('só retrato velho → parcial', TrafficSaude::avaliar(['status' => 'up'], TrafficSaude::qualidade(true, true, $N, ['flow_esperado' => $N]), true)['motivo'] === 'retrato_velho');
check('provedor down manda, mesmo com retrato completo', TrafficSaude::avaliar(['status' => 'down', 'detail' => 'cota'], TrafficSaude::qualidade(true, true, $N, ['flow_esperado' => $N]))
    === ['status' => 'down', 'motivo' => 'cota']);
check('ocorrências indisponíveis → contagens NULAS (nunca zero)', TrafficSaude::anularOcorrencias(['activeIncidents' => 0, 'closures' => 0, 'trafficIndex' => 40])
    === ['activeIncidents' => null, 'closures' => null, 'trafficIndex' => 40, 'endedIncidents' => null, 'accidents' => null, 'roadworks' => null, 'congestion' => null, 'hazard' => null, 'other' => null]);
// a chave nunca aparece em erro/diagnóstico
$p = $prov($flowOuInc(fn() => ['status' => 403, 'json' => $COTA], fn() => ['status' => 403, 'json' => $COTA]));
$txt = (string) erroDe(fn() => $p->getTrafficFlow($cfg['bounds'])) . json_encode($p->diagnostico()) . json_encode($p->health());
check('chave fora de erro e diagnóstico', !str_contains($txt, 'chave-INVENTADA'));

// Orçamento de chamadas (TTL 15 min aprovado em 23/11): renovações/dia × (vias + 1) + health ≤ 1.500.
$c = $cfg['cache'];
check('TTLs de 15 min (payload, fluxo, ocorrências, resumo, health)',
    $c['ttl_dashboard'] === 900 && $c['ttl_flow'] === 900 && $c['ttl_incidents'] === 900 && $c['ttl_summary'] === 900 && $c['ttl_health'] === 900);
check('retrato velho dura ≥ 2 ciclos', $c['ttl_stale'] >= 2 * $c['ttl_dashboard']);
$vias = count(require __DIR__ . '/../providers/fixtures/sp-roads.php');
$dia = intdiv(86400, $c['ttl_dashboard']) * ($vias + 1) + intdiv(86400, $c['ttl_health']);
check("orçamento diário 24 h ≤ 1.500 (calculado: $dia)", $dia <= 1500);

echo "teste-saude: $ok ok, $falha falha(s)\n";
exit($falha === 0 ? 0 : 1);
