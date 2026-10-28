<?php
// scripts/gcal-smoke-all.php — suite deterministica do modulo Google Calendar.
// @version 1.0.0  @created 2026-07-29
//
// Exercita GcalMock direto, sem HTTP/sessao/nginx: prova os ramos que o
// "caminho feliz" da UI nao exercita (permissao negada, privacidade de
// freeBusyReader, escopo de serie recorrente, resposta invalida, fuso).
// Rodar: php scripts/gcal-smoke-all.php   (exit 0 = tudo PASS)
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

$_SESSION = [];
putenv('GCAL_PROVIDER=mock');
$_ENV['GCAL_PROVIDER'] = 'mock';

$base = '/var/www/dshowdash/api/google-calendar';
require_once $base . '/lib/Tz.php';
require_once $base . '/lib/GcalProvider.php';
require_once $base . '/lib/GcalCrypto.php';
require_once $base . '/lib/GcalProviderBase.php';
require_once $base . '/lib/GcalMock.php';

$falhas = 0;
function ok(string $t, bool $c, string $extra = ''): void {
    global $falhas;
    if (!$c) { $falhas++; echo "  FALHOU  $t $extra\n"; }
    else { echo "  ok      $t $extra\n"; }
}

$m  = new GcalMock();
$tz = 'America/Sao_Paulo';
$hoje = (new DateTimeImmutable('now', new DateTimeZone($tz)))->format('Y-m-d');

echo "\n== 1. Tz: a trap do CONVERT_TZ resolvida em PHP ==\n";
$utc = Tz::paraUtc('2026-07-30 09:00:00', 'America/Sao_Paulo');
ok('09:00 SP -> 12:00 UTC', $utc->format('H:i') === '12:00', '(' . $utc->format('H:i') . ')');
ok('ida e volta preserva', Tz::paraLocal($utc, 'America/Sao_Paulo')->format('H:i') === '09:00');
$dif = Tz::difMinutos($utc, 'Asia/Shanghai', 'America/Sao_Paulo');
ok('SP x Shenzhen = 11h', $dif === 660, "($dif min)");
ok('fuso inválido cai no padrão', Tz::normalizar('Marte/Olympus') === 'America/Sao_Paulo');
ok('dia inteiro reconhecido', Tz::ehDiaInteiro('2026-07-30', '2026-07-31'));
ok('com hora NÃO é dia inteiro', !Tz::ehDiaInteiro('2026-07-30T09:00:00-03:00', '2026-07-30T10:00:00-03:00'));

echo "\n== 2. Semente ==\n";
$cals = $m->calendarios();
ok('7 calendários', count($cals) === 7, '(' . count($cals) . ')');
ok('tem freeBusyReader', in_array('freeBusyReader', array_column($cals, 'access_role'), true));
$ev = $m->eventos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
ok('hoje tem eventos', count($ev) > 5, '(' . count($ev) . ')');

echo "\n== 3. Privacidade §75.1 (freeBusyReader esconde conteúdo) ==\n";
$priv = array_values(array_filter($ev, fn($e) => $e['calendar_id'] === 'diretoria@dshow.com.br'));
ok('bloco da diretoria existe', count($priv) === 1);
if ($priv) {
    ok('título redigido', $priv[0]['summary'] === 'Ocupado');
    ok('participantes ocultos', $priv[0]['attendees'] === []);
    ok('marcado como redacted', !empty($priv[0]['redacted']));
}

echo "\n== 4. Conflitos computados (§23) ==\n";
$cf = $m->conflitos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
ok('detecta conflito hoje', count($cf) >= 1, '(' . count($cf) . ')');
$tipos = array_unique(array_column($cf, 'tipo'));
ok('há sobreposição', in_array('sobreposicao', $tipos, true), '[' . implode(',', $tipos) . ']');
$almocoConflita = false;
foreach ($cf as $c) {
    foreach ($c['eventos'] as $e) { if ($e['summary'] === 'Almoço') $almocoConflita = true; }
}
ok('transparent NÃO gera conflito (almoço)', !$almocoConflita);
$marcado = array_filter($ev, fn($e) => !empty($e['has_conflict']));
ok('evento traz has_conflict', count($marcado) >= 2, '(' . count($marcado) . ')');

echo "\n== 5. Free/busy e sugestões (§22) ==\n";
$fb = $m->freeBusy(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz,
                    'pessoas' => ['jhony@dshow.com.br', 'marina.costa@dshow.com.br'],
                    'duracao_min' => 60]);
ok('matriz preenchida', count($fb['matriz']) === 48, '(' . count($fb['matriz']) . ' slots de 30min)');
$estados = [];
foreach ($fb['matriz'] as $l) { foreach ($l['estados'] as $s) { $estados[$s] = true; } }
ok('tem free e busy', isset($estados['free']) && isset($estados['busy']), '[' . implode(',', array_keys($estados)) . ']');
ok('marca off_hours', isset($estados['off_hours']));
ok('sugere horários', count($fb['sugestoes']) >= 1, '(' . count($fb['sugestoes']) . ')');
foreach ($fb['sugestoes'] as $s) {
    $dur = (new DateTimeImmutable($s['fim']))->getTimestamp() - (new DateTimeImmutable($s['inicio']))->getTimestamp();
    ok('sugestão dura 60min', $dur === 3600, '(' . ($dur / 60) . ')');
    break;
}

echo "\n== 6. Convites (§44) ==\n";
$conv = $m->convites(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
ok('há convites de terceiros', count($conv) >= 2, '(' . count($conv) . ')');
$aguardando = array_values(array_filter($conv, fn($c) => $c['categoria'] === 'aguardando'));
ok('há pendente', count($aguardando) >= 1);

echo "\n== 7. Escrita persiste + regra de permissão ==\n";
$novo = $m->criarEvento([
    'calendar_id' => 'primary', 'summary' => 'Teste sandbox',
    'start' => $hoje . 'T19:00:00-03:00', 'end' => $hoje . 'T19:30:00-03:00',
]);
ok('criou', !empty($novo['id']));
$ev2 = $m->eventos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
ok('aparece na listagem', count($ev2) === count($ev) + 1, '(' . count($ev) . ' -> ' . count($ev2) . ')');

$err = null;
try { $m->criarEvento(['calendar_id' => 'feriados@group.v.calendar.google.com', 'summary' => 'x',
                       'start' => $hoje . 'T20:00:00-03:00', 'end' => $hoje . 'T20:30:00-03:00']); }
catch (Throwable $e) { $err = $e->getMessage(); }
ok('recusa escrita em calendário reader', $err !== null, '(' . (string)$err . ')');

$m->atualizarEvento('primary', $novo['id'], ['summary' => 'Renomeado']);
$lido = $m->evento('primary', $novo['id']);
ok('edição persiste', $lido['summary'] === 'Renomeado');
ok('sequence subiu', (int)$lido['sequence'] === 1, '(' . $lido['sequence'] . ')');

$m->excluirEvento('primary', $novo['id'], false);
ok('exclusão persiste', $m->evento('primary', $novo['id']) === null);

echo "\n== 8. Resposta a convite (§44.2) ==\n";
if ($aguardando) {
    $alvo = $aguardando[0];
    $r = $m->responderConvite($alvo['calendar_id'], $alvo['id'], 'accepted', 'Confirmado');
    ok('my_response mudou', $r['my_response'] === 'accepted');
    $self = array_values(array_filter($r['attendees'], fn($a) => !empty($a['self'])));
    ok('attendee self acompanhou', $self && $self[0]['response'] === 'accepted');
    $errR = null;
    try { $m->responderConvite($alvo['calendar_id'], $alvo['id'], 'talvez', null); }
    catch (Throwable $e) { $errR = $e->getMessage(); }
    ok('recusa resposta inválida', $errR !== null);
}

echo "\n== 9. Série recorrente: escopo this vs all (§19) ==\n";
$semana = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+7 days')->format('Y-m-d'), 'tz' => $tz]);
$daily = array_values(array_filter($semana, fn($e) => $e['recurring_event_id'] === 'ser_daily'));
ok('série tem várias instâncias', count($daily) >= 4, '(' . count($daily) . ')');
if (count($daily) >= 2) {
    $m->atualizarEvento($daily[0]['calendar_id'], $daily[0]['id'], ['summary' => 'Daily NOVO'], 'all');
    $semana2 = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+7 days')->format('Y-m-d'), 'tz' => $tz]);
    $renomeados = array_filter($semana2, fn($e) => $e['summary'] === 'Daily NOVO');
    ok('escopo=all renomeou a série', count($renomeados) >= 4, '(' . count($renomeados) . ')');
}

echo "\n== 10. Overview / KPIs (§15) ==\n";
GcalMock::reset();
$ov = $m->overview(['tz' => $tz]);
$h = $ov['hoje'];
ok('compromissos > 0', $h['compromissos'] > 0, '(' . $h['compromissos'] . ')');
ok('ocupado_min > 0', $h['ocupado_min'] > 0, '(' . $h['ocupado_min'] . ' min)');
ok('livre_min coerente', $h['livre_min'] === max(0, 540 - $h['ocupado_min']));
ok('conflitos >= 1', $h['conflitos'] >= 1, '(' . $h['conflitos'] . ')');
ok('série de 28 dias', count($ov['carga']['serie_28d']) === 28);
ok('carga tem horas', $ov['carga']['horas_total'] > 0, '(' . $ov['carga']['horas_total'] . 'h)');

echo "\n== 11. Alertas (§62) ==\n";
$al = $m->alertas(['tz' => $tz]);
$cats = array_unique(array_column($al, 'categoria'));
ok('3 categorias presentes', count(array_intersect(['agenda','organizacao','tecnico'], $cats)) === 3,
   '[' . implode(',', $cats) . ']');
$tec = array_values(array_filter($al, fn($a) => $a['categoria'] === 'tecnico'));
ok('alerta de conta desconectada', count($tec) >= 1, '(' . count($tec) . ')');

echo "\n== 12. Sync e mascaramento de segredo (§78) ==\n";
$sy = $m->sincronizacao();
ok('7 calendários no sync', count($sy) === 7, '(' . count($sy) . ')');
ok('sync_token mascarado', $sy[0]['sync_token'] === '********');
$contas = $m->contas();
$temToken = false;
foreach ($contas as $c) {
    foreach (['access_token','refresh_token','token'] as $k) { if (!empty($c[$k]) && $c[$k] !== '********') $temToken = true; }
}
ok('nenhuma conta vaza token', !$temToken);

echo "\n== 13. Janela: evento fora do range não vaza ==\n";
$amanha = (new DateTimeImmutable($hoje))->modify('+1 day')->format('Y-m-d');
$soAmanha = $m->eventos(['de' => $amanha, 'ate' => $amanha, 'tz' => $tz]);
$vazou = false;
foreach ($soAmanha as $e) {
    $d = substr((string)$e['start'], 0, 10);
    if ($d !== $amanha && empty($e['all_day'])) $vazou = true;
}
ok('nenhum evento fora da janela', !$vazou);

echo "\n== 14. Dia inteiro NÃO vira 24h (§48) ==\n";
$mes = $m->eventos(['de' => $hoje, 'ate' => (new DateTimeImmutable($hoje))->modify('+30 days')->format('Y-m-d'), 'tz' => $tz]);
$allday = array_values(array_filter($mes, fn($e) => !empty($e['all_day'])));
ok('há eventos de dia inteiro', count($allday) >= 1, '(' . count($allday) . ')');
$formatoOk = true;
foreach ($allday as $e) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$e['start'])) $formatoOk = false;
}
ok('dia inteiro usa data pura', $formatoOk);

echo "\n== 15. Relatórios (§64) ==\n";
require_once $base . '/lib/GcalReports.php';
$tipos = $m->tiposRelatorio();
ok('catálogo tem 11 relatórios', count($tipos) === 11, '(' . count($tipos) . ')');
$de = (new DateTimeImmutable($hoje))->modify('-27 days')->format('Y-m-d');
$falhouAlgum = [];
foreach ($tipos as $t) {
    $rel = $m->relatorio($t['id'], ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
    $temColunas = !empty($rel['colunas']);
    $temTotais  = isset($rel['totais']);
    $temSerie   = array_key_exists('serie', $rel);
    if (!$temColunas || !$temTotais || !$temSerie) { $falhouAlgum[] = $t['id']; }
}
ok('todos devolvem colunas+totais+serie', empty($falhouAlgum), '[' . implode(',', $falhouAlgum) . ']');

$ev = $m->relatorio('eventos', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('eventos tem linhas', count($ev['linhas']) > 20, '(' . count($ev['linhas']) . ')');
ok('total de duração soma', ($ev['totais']['duracao'] ?? 0) > 0, '(' . ($ev['totais']['duracao'] ?? 0) . ' min)');

$pa = $m->relatorio('participantes', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('participantes ordenado por reuniões', count($pa['linhas']) > 2
   && $pa['linhas'][0]['reunioes'] >= $pa['linhas'][1]['reunioes'], '(' . count($pa['linhas']) . ' pessoas)');
$souEu = array_filter($pa['linhas'], fn($l) => $l['email'] === 'jhony@dshow.com.br');
ok('não conta você mesmo', count($souEu) === 0);

$ho = $m->relatorio('horarios', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
$soma = array_sum(array_column($ho['linhas'], 'participacao'));
ok('percentuais somam ~100', abs($soma - 100) < 1.5, '(' . round($soma, 1) . '%)');

$du = $m->relatorio('duracao', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('6 faixas de duração', count($du['linhas']) === 6, '(' . count($du['linhas']) . ')');

$cl = $m->relatorio('clientes', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('clientes agrupa por vínculo', count($cl['linhas']) > 0, '(' . count($cl['linhas']) . ')');

$re = $m->relatorio('recursos', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('recursos lista as salas', count($re['linhas']) === 2, '(' . count($re['linhas']) . ')');

// Média ignora zeros: senão "duração média" cai com dia sem reunião.
$cd = $m->relatorio('carga-dia', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
$medias = array_values(array_filter(array_column($cd['linhas'], 'media'), fn($v) => $v > 0));
$mediaEsperada = $medias ? round(array_sum($medias) / count($medias), 1) : 0;
ok('média ignora linhas zeradas', abs(($cd['totais']['media'] ?? 0) - $mediaEsperada) < 0.2,
   '(' . ($cd['totais']['media'] ?? 0) . ' vs ' . $mediaEsperada . ')');

echo "\n== 16. Visualizações D3 (§40, §65) ==\n";
$fx = $m->relatorio('fluxo', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('fluxo tem links', count($fx['links']) >= 4, '(' . count($fx['links']) . ')');
ok('fluxo se declara suficiente', $fx['suficiente'] === true, '(' . $fx['total'] . ' reuniões)');
$destinos = array_unique(array_column($fx['links'], 'para'));
ok('fluxo tem 3 estágios', count($destinos) >= 3, '[' . implode(',', array_slice($destinos, 0, 6)) . ']');

$rd = $m->relatorio('rede', ['de' => $de, 'ate' => $hoje, 'tz' => $tz]);
ok('rede tem nós', count($rd['nos']) >= 3, '(' . count($rd['nos']) . ')');
ok('rede tem arestas', count($rd['arestas']) >= 2, '(' . count($rd['arestas']) . ')');
ok('rede se declara suficiente', $rd['suficiente'] === true);
ok('rede informa omitidos', array_key_exists('omitidos', $rd), '(' . $rd['omitidos'] . ')');
$semSelf = array_filter($rd['nos'], fn($n) => $n['id'] === 'jhony@dshow.com.br');
ok('rede não inclui você', count($semSelf) === 0);

// Janela curta => dado insuficiente, e a viz TEM de dizer isso em vez de desenhar lixo.
$fxCurto = $m->relatorio('fluxo', ['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
ok('fluxo admite dado insuficiente em janela curta',
   is_bool($fxCurto['suficiente']) && ($fxCurto['suficiente'] === false || $fxCurto['total'] >= 8),
   '(' . $fxCurto['total'] . ' reuniões, suficiente=' . var_export($fxCurto['suficiente'], true) . ')');

echo "\n== 17. Vínculos internos com dado REAL (§32, §57) ==\n";
require_once '/var/www/dshowdash/config/db_connection.php';
require_once $base . '/lib/GcalLinks.php';

$t0 = microtime(true);
$busca = GcalLinks::buscar('painel');
$ms = (int)round((microtime(true) - $t0) * 1000);
ok('busca unificada responde', count($busca['itens']) > 0, '(' . count($busca['itens']) . " itens em {$ms}ms)");
ok('abaixo de 800ms', $ms < 800, "({$ms}ms)");
ok('nenhuma fonte degradada', empty($busca['degradado']), '[' . implode(',', $busca['degradado']) . ']');
ok('declara as fontes', count($busca['fontes']) >= 1, '[' . implode(',', $busca['fontes']) . ']');
ok('termo curto recusado', GcalLinks::buscar('a')['aviso'] !== null);

$campos = ['entity_type','entity_id','label','sublabel','fonte','extra'];
$faltando = [];
foreach ($busca['itens'] as $i) { foreach ($campos as $c) { if (!array_key_exists($c, $i)) $faltando[] = $c; } }
ok('contrato do item completo', empty($faltando), '[' . implode(',', array_unique($faltando)) . ']');

foreach (['pipedrive_deal','pessoa','organizacao','proposta'] as $tp) {
    $rr = GcalLinks::buscar($tp === 'proposta' ? 'a' : 'sil', $tp);
    $so = array_unique(array_column($rr['itens'], 'entity_type'));
    ok("filtro por $tp", empty($rr['itens']) || (count($so) === 1 && $so[0] === $tp), '(' . count($rr['itens']) . ')');
}

$deal = null;
foreach ($busca['itens'] as $i) { if ($i['entity_type'] === 'pipedrive_deal') { $deal = $i; break; } }
if ($deal) {
    $f = GcalLinks::ficha('pipedrive_deal', $deal['entity_id']);
    ok('ficha do negócio (§32.2)', $f !== null && count($f['campos']) >= 3, $f ? '(' . count($f['campos']) . ' campos)' : '');
    ok('ficha aponta rota interna', $f !== null && str_starts_with($f['rota'], '#/'), $f['rota'] ?? '');
    ok('ficha traz atividades', $f !== null && is_array($f['atividades']), '(' . count($f['atividades'] ?? []) . ')');
}
ok('entidade inexistente = null', GcalLinks::ficha('pipedrive_deal', '999999999') === null);
ok('tipo inválido = null', GcalLinks::ficha('nao_existe', '1') === null);

// A regra mais importante deste modulo: ele LE o CRM, nao escreve nele.
$src = file_get_contents($base . '/lib/GcalLinks.php');
ok('GcalLinks não tem SQL de escrita',
   preg_match_all('/\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|TRUNCATE)\s/i', $src) === 0);

echo "\n== 18. Vincular / desvincular no evento ==\n";
$hojeEv = $m->eventos(['de' => $hoje, 'ate' => $hoje, 'tz' => $tz]);
$alvo = null;
foreach ($hojeEv as $e) { if ($e['calendar_id'] === 'primary') { $alvo = $e; break; } }
if ($alvo && $deal) {
    $antes = count($alvo['links'] ?? []);
    $r1 = $m->vincular('primary', $alvo['id'], [
        'entity_type' => 'pipedrive_deal', 'entity_id' => $deal['entity_id'],
        'label' => $deal['label'], 'relation' => 'reuniao', 'extra' => $deal['extra'],
    ]);
    ok('vínculo adicionado', count($r1['links']) === $antes + 1, '(' . $antes . ' -> ' . count($r1['links']) . ')');

    // Idempotencia: vincular de novo ATUALIZA, nao duplica.
    $r2 = $m->vincular('primary', $alvo['id'], [
        'entity_type' => 'pipedrive_deal', 'entity_id' => $deal['entity_id'],
        'label' => 'rotulo novo', 'relation' => 'reuniao', 'extra' => [],
    ]);
    ok('vincular 2x não duplica', count($r2['links']) === $antes + 1, '(' . count($r2['links']) . ')');
    $achou = array_values(array_filter($r2['links'], fn($l) => $l['entity_id'] === $deal['entity_id']));
    ok('vínculo foi atualizado', $achou && $achou[0]['label'] === 'rotulo novo');

    $r3 = $m->desvincular('primary', $alvo['id'], 'pipedrive_deal', $deal['entity_id']);
    ok('vínculo removido', count($r3['links']) === $antes, '(' . count($r3['links']) . ')');

    $errV = null;
    try { $m->vincular('primary', 'evt_inexistente', ['entity_type'=>'x','entity_id'=>'1']); }
    catch (Throwable $e) { $errV = $e->getMessage(); }
    ok('evento inexistente recusa vínculo', $errV !== null);
}

echo "\n" . ($falhas === 0 ? "TODOS OS CHECKS PASSARAM\n" : "*** $falhas CHECK(S) FALHARAM ***\n");
exit($falhas === 0 ? 0 : 1);
