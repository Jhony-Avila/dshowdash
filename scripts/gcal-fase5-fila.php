<?php
// Fase 5 — prova da fila, dos canais push e do webhook, SEM credencial
// @module google-calendar.fase5.prova
// @version 1.0.0
// @created 2026-07-30
//
//     php scripts/gcal-fase5-fila.php
//
// Mesma tatica da Fase 4: transporte falso + costura no token endpoint, banco
// GCAL_DSHOW real, conta de teste apagada ao final aconteca o que acontecer.
//
// O que so da para provar assim: backoff, morte apos 6 tentativas, destrave de
// worker morto, deduplicacao sob rajada de webhook e renovacao de canal. Nada
// disso aparece no caminho feliz — e todos sao caminhos que SO acontecem em
// producao, quando ja e tarde.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$raiz = dirname(__DIR__);
require_once $raiz . '/api/_helpers/ApiResponse.php';
require_once $raiz . '/config/db_connection.php';
require_once $raiz . '/api/google-calendar/lib/Tz.php';
require_once $raiz . '/api/google-calendar/lib/GcalCrypto.php';
require_once $raiz . '/api/google-calendar/lib/GoogleOAuth.php';
require_once $raiz . '/api/google-calendar/lib/GcalTransport.php';
require_once $raiz . '/api/google-calendar/lib/GcalNormalizer.php';
require_once $raiz . '/api/google-calendar/lib/GoogleCalendarClient.php';
require_once $raiz . '/api/google-calendar/lib/GcalGoLive.php';
require_once $raiz . '/api/google-calendar/repositories/GcalRepository.php';
require_once $raiz . '/api/google-calendar/services/GcalAuthService.php';
require_once $raiz . '/api/google-calendar/services/GcalSyncService.php';
require_once $raiz . '/api/google-calendar/services/GcalWatchService.php';
require_once $raiz . '/api/google-calendar/services/GcalQueueService.php';

const USER_TESTE = 999998;

$ok = 0; $falhas = [];
$check = static function (string $n, bool $c, string $o = '') use (&$ok, &$falhas): void {
    if ($c) { $ok++; printf("  ok      %s %s\n", $n, $o); }
    else    { $falhas[] = $n; printf("  FALHA   %s %s\n", $n, $o); }
};
$secao = static fn(string $t) => printf("\n%s\n%s\n", $t, str_repeat('─', mb_strlen($t)));

putenv('GOOGLE_CALENDAR_OAUTH_CLIENT_ID=teste.apps.googleusercontent.com');
putenv('GOOGLE_CALENDAR_OAUTH_CLIENT_SECRET=segredo-de-teste');
putenv('GCAL_WEBHOOK_URL=https://dshowdash.com.br/api/google-calendar/webhook');

$repo = new GcalRepository();

$limpar = static function (GcalRepository $r): void {
    $r->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id = :u")->execute([':u' => USER_TESTE]);
    $r->pdo()->prepare("DELETE FROM gcal_audit_logs WHERE user_id = :u")->execute([':u' => USER_TESTE]);
    $r->pdo()->prepare("DELETE FROM gcal_oauth_states WHERE user_id = :u")->execute([':u' => USER_TESTE]);
};
$limpar($repo);
register_shutdown_function(static function () use ($repo, $limpar) { $limpar($repo); });

echo "\nFASE 5 — FILA, CANAIS PUSH E WEBHOOK\n", str_repeat('═', 74), "\n";

// ── Conta de teste, pelo caminho real ────────────────────────────────
GoogleOAuth::$postDeTeste = static fn(array $c): array => [
    'access_token' => 'ya29.f5', 'refresh_token' => '1//f5',
    'expires_in' => 3599, 'scope' => GoogleOAuth::scopes(), 'token_type' => 'Bearer',
];
$fake = new GcalTransportFake(new GcalResposta(200, [
    'sub' => '5555', 'email' => 'fase5@dshow.com.br', 'name' => 'Fase 5', 'hd' => 'dshow.com.br']));
$auth = new GcalAuthService($repo, $fake);
$state = [];
parse_str((string)parse_url($auth->iniciar(USER_TESTE), PHP_URL_QUERY), $state);
$conta = $auth->concluir('code', (string)$state['state']);
$acc = (int)$conta['account_id'];

$fake->enfileirar(new GcalResposta(200, ['items' => [
    ['id' => 'ag@dshow.com.br', 'summary' => 'Agenda', 'primary' => true,
     'accessRole' => 'owner', 'timeZone' => 'America/Sao_Paulo'],
]]));
$sync  = new GcalSyncService($repo, $auth);
$sync->sincronizarCalendarios($acc);
$watch = new GcalWatchService($repo, $auth);
$fila  = new GcalQueueService($repo, $auth, $sync, $watch);

// ═══════════════════════════════════════════════════════════════════
$secao('1. Enfileirar e deduplicar');

$j1 = $repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental');
$j2 = $repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental');
$check('dois pedidos iguais viram UM job', $j1 === $j2, "#$j1");

// Rajada de webhook: uma edição em lote produz dezenas de POSTs em segundos.
for ($i = 0; $i < 30; $i++) { $repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental', [], 10, 1); }
$n = (int)$repo->pdo()->query(
    "SELECT COUNT(*) FROM gcal_sync_jobs WHERE account_id = $acc AND status = 'pending'")->fetchColumn();
$check('rajada de 30 webhooks ainda é 1 job', $n === 1, "$n na fila");

$p = (int)$repo->pdo()->query(
    "SELECT priority FROM gcal_sync_jobs WHERE id = $j1")->fetchColumn();
$check('pedido mais urgente antecipa o job existente', $p === 1, "prioridade $p");

$j3 = $repo->enfileirar($acc, null, 'watch_renew');
$check('kind diferente é job diferente', $j3 !== $j1);
$j4 = $repo->enfileirar($acc, 'outro@dshow.com.br', 'incremental');
$check('calendário diferente é job diferente', $j4 !== $j1);

// ═══════════════════════════════════════════════════════════════════
$secao('2. Reserva atômica');

$repo->pdo()->exec("UPDATE gcal_sync_jobs SET run_after = UTC_TIMESTAMP() WHERE account_id = $acc");
$a = $repo->reservarJob();
$b = $repo->reservarJob();
$check('reservou um job', $a !== null);
$check('segunda reserva pega OUTRO job', $b !== null && (int)$b['id'] !== (int)$a['id'],
    'ids ' . ($a['id'] ?? '?') . ' e ' . ($b['id'] ?? '?'));
$check('job reservado vira running',
    $repo->pdo()->query("SELECT status FROM gcal_sync_jobs WHERE id = {$a['id']}")->fetchColumn() === 'running');
$check('tentativa foi contada', (int)$a['attempts'] === 1);

// Job com run_after no futuro não pode ser reservado — é o que faz o backoff
// funcionar em vez de virar laço apertado.
$repo->pdo()->exec("UPDATE gcal_sync_jobs SET status='pending',
                    run_after = UTC_TIMESTAMP() + INTERVAL 10 MINUTE WHERE account_id = $acc");
$check('job agendado para o futuro não é reservado', $repo->reservarJob() === null);

// ═══════════════════════════════════════════════════════════════════
$secao('3. Backoff e morte');

$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$jid = $repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental');

$esperas = [];
for ($t = 1; $t <= 5; $t++) {
    $d = $repo->falharJob($jid, $t, 'erro simulado');
    $esperas[] = $d;
}
$check('backoff é exponencial', $esperas === ['reagendado em 1 min', 'reagendado em 2 min',
    'reagendado em 4 min', 'reagendado em 8 min', 'reagendado em 16 min'],
    implode(' · ', $esperas));

$check('morre na 6ª tentativa', $repo->falharJob($jid, 6, 'erro simulado') === 'dead');
$check('status final é dead',
    $repo->pdo()->query("SELECT status FROM gcal_sync_jobs WHERE id = $jid")->fetchColumn() === 'dead');

$jid2 = $repo->enfileirar($acc, 'x@dshow.com.br', 'incremental');
$check('erro PERMANENTE mata na 1ª', $repo->falharJob($jid2, 1, 'notFound', true) === 'dead',
    '(escopo revogado não melhora com retry)');

// ═══════════════════════════════════════════════════════════════════
$secao('4. Worker morto devolve o job à fila');

$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$jid3 = $repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental');
$repo->pdo()->exec("UPDATE gcal_sync_jobs SET status='running',
                    started_at = UTC_TIMESTAMP() - INTERVAL 45 MINUTE WHERE id = $jid3");
$check('nada a destravar antes do prazo', $repo->destravarJobs(60) === 0);
$check('destrava o preso há 45 min', $repo->destravarJobs(30) === 1);
$check('voltou a pending',
    $repo->pdo()->query("SELECT status FROM gcal_sync_jobs WHERE id = $jid3")->fetchColumn() === 'pending');

// ═══════════════════════════════════════════════════════════════════
$secao('5. Execução real de um job (incremental)');

$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$hoje = new DateTimeImmutable('today 10:00', new DateTimeZone('America/Sao_Paulo'));
$fake->enfileirar(new GcalResposta(200, [
    'nextSyncToken' => 'TOKEN-F5',
    'items' => [[
        'id' => 'evt-f5', 'status' => 'confirmed', 'summary' => 'Da fila',
        'iCalUID' => 'evt-f5@google.com', 'etag' => '"e"', 'sequence' => 0,
        'start' => ['dateTime' => $hoje->format('c')],
        'end'   => ['dateTime' => $hoje->modify('+30 minutes')->format('c')],
        'organizer' => ['email' => 'fase5@dshow.com.br', 'self' => true],
        'created' => '2026-07-01T10:00:00Z', 'updated' => '2026-07-20T10:00:00Z',
    ]],
]));
$repo->enfileirar($acc, 'ag@dshow.com.br', 'full');
$r = $fila->drenar(5);
$check('1 job processado com sucesso', $r['processados'] === 1 && $r['ok'] === 1, json_encode($r['detalhe']));
$check('evento entrou no banco',
    (int)$repo->pdo()->query("SELECT COUNT(*) FROM gcal_events WHERE account_id = $acc")->fetchColumn() === 1);
$check('job marcado done',
    (int)$repo->pdo()->query("SELECT COUNT(*) FROM gcal_sync_jobs
                               WHERE account_id = $acc AND status='done'")->fetchColumn() === 1);

// ═══════════════════════════════════════════════════════════════════
$secao('6. Falha de API não derruba o worker');

$repo->enfileirar($acc, 'ag@dshow.com.br', 'incremental');
$repo->pdo()->exec("UPDATE gcal_sync_jobs SET run_after = UTC_TIMESTAMP()
                     WHERE account_id = $acc AND status='pending'");
// 404 = permanente: o calendário não existe mais.
$fake->enfileirar(new GcalResposta(404, ['error' => ['errors' => [['reason' => 'notFound']]]]));
$r = $fila->drenar(5);
$check('worker sobrevive à falha', $r['processados'] === 1);
$check('job permanente vai direto para dead', $r['mortos'] === 1, json_encode($r['detalhe'][0] ?? []));
$check('erro foi registrado em gcal_sync_errors',
    (int)$repo->pdo()->query("SELECT COUNT(*) FROM gcal_sync_errors WHERE account_id = $acc")->fetchColumn() > 0);

// ═══════════════════════════════════════════════════════════════════
$secao('7. Canais push');

$expMs = (time() + 6 * 86400) * 1000;
$fake->enfileirar(new GcalResposta(200, ['resourceId' => 'res-abc', 'expiration' => (string)$expMs]));
$c1 = $watch->abrir($acc, 'ag@dshow.com.br');
$check('canal aberto', $c1['channel_id'] !== '');
$check('expiração convertida de MILISSEGUNDOS',
    abs(strtotime($c1['expiration'] . ' UTC') - (time() + 6 * 86400)) < 60,
    $c1['expiration'] . ' (sem dividir por 1000 cairia no ano 56.000)');

$guardado = $repo->canalAtivo($c1['channel_id']);
$check('canal recuperável pelo id', $guardado !== null);
$check('token do canal recuperável', ($guardado['token'] ?? '') !== '');
$bruto = $repo->pdo()->query(
    "SELECT token_enc FROM gcal_watch_channels WHERE channel_id = '{$c1['channel_id']}'")->fetchColumn();
$check('token do canal CIFRADO em disco',
    is_string($bruto) && !str_contains($bruto, (string)$guardado['token']));

// Renovar: abre o novo ANTES de parar o antigo, senão há janela sem cobertura.
$fake->enfileirar(new GcalResposta(200, ['resourceId' => 'res-def', 'expiration' => (string)$expMs]));
$fake->enfileirar(new GcalResposta(200, []));   // channels.stop
$c2 = $watch->abrir($acc, 'ag@dshow.com.br');
$check('renovação gera canal novo', $c2['channel_id'] !== $c1['channel_id']);
$check('canal antigo foi parado', $repo->canalAtivo($c1['channel_id']) === null);
$ativos = $repo->canaisAtivosDe($acc, 'ag@dshow.com.br');
$check('sobra exatamente 1 canal ativo', count($ativos) === 1,
    count($ativos) . ' (UNIQUE com NULL não garante isso no MySQL — é o código que garante)');

$repo->pdo()->exec("UPDATE gcal_watch_channels SET expiration = UTC_TIMESTAMP() + INTERVAL 2 HOUR
                     WHERE channel_id = '{$c2['channel_id']}'");
$check('canal a vencer é detectado', count($repo->canaisAVencer(24)) === 1);
$check('fora da janela não é detectado', count($repo->canaisAVencer(1)) === 0);

$fake->enfileirar(new GcalResposta(200, ['resourceId' => 'res-ghi', 'expiration' => (string)$expMs]));
$fake->enfileirar(new GcalResposta(200, []));
$rr = $watch->renovarVencendo(24);
$check('renovarVencendo renovou 1', $rr['renovados'] === 1 && $rr['falhas'] === 0, json_encode($rr));

// ═══════════════════════════════════════════════════════════════════
$secao('8. Webhook — validação da tripla');

/** Simula o POST do Google direto no controller, medindo o que ele decide. */
$webhook = static function (array $cab) use ($repo): array {
    $canal = $repo->canalAtivo((string)($cab['id'] ?? ''));
    if ($canal === null) return ['status' => 200, 'acao' => 'ignorado'];
    if (!hash_equals((string)$canal['token'], (string)($cab['token'] ?? ''))
        || !hash_equals((string)$canal['resource_id'], (string)($cab['resource'] ?? ''))) {
        return ['status' => 403, 'acao' => 'recusado'];
    }
    if (($cab['estado'] ?? '') === 'sync') return ['status' => 200, 'acao' => 'ping'];
    $repo->enfileirar((int)$canal['account_id'], (string)$canal['calendar_id'],
                      'incremental', ['origem' => 'webhook'], 10, 1);
    return ['status' => 200, 'acao' => 'enfileirado'];
};

$vivo = $repo->canaisAtivosDe($acc, 'ag@dshow.com.br')[0];
$tokenVivo = $repo->canalAtivo((string)$vivo['channel_id'])['token'];
$base = ['id' => $vivo['channel_id'], 'token' => $tokenVivo, 'resource' => $vivo['resource_id']];

$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");

$r1 = $webhook($base + ['estado' => 'exists']);
$check('notificação legítima enfileira', $r1 === ['status' => 200, 'acao' => 'enfileirado']);

$r2 = $webhook($base + ['estado' => 'sync']);
$check('ping "sync" da abertura NÃO gasta chamada', $r2['acao'] === 'ping');

$r3 = $webhook(['id' => $vivo['channel_id'], 'token' => 'errado',
                'resource' => $vivo['resource_id'], 'estado' => 'exists']);
$check('token errado é recusado com 403', $r3['status'] === 403);

$r4 = $webhook($base_res = ['id' => $vivo['channel_id'], 'token' => $tokenVivo,
                            'resource' => 'outro', 'estado' => 'exists']);
$check('resourceId errado é recusado', $r4['status'] === 403);

$r5 = $webhook(['id' => 'canal-que-nao-existe', 'token' => 'x', 'resource' => 'y']);
$check('canal desconhecido responde 200, não 404', $r5['status'] === 200,
    '(404 faz o Google derrubar outros canais do mesmo host)');

for ($i = 0; $i < 20; $i++) { $webhook($base + ['estado' => 'exists']); }
$n = (int)$repo->pdo()->query(
    "SELECT COUNT(*) FROM gcal_sync_jobs WHERE account_id = $acc AND status='pending'")->fetchColumn();
$check('21 notificações continuam sendo 1 job', $n === 1, "$n na fila");

// ═══════════════════════════════════════════════════════════════════
$secao('9. Agendamento pelo cron');

$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$repo->pdo()->exec("UPDATE gcal_sync_state SET next_sync_at = UTC_TIMESTAMP() - INTERVAL 1 MINUTE
                     WHERE account_id = $acc");
$ag = $fila->agendarDevidos();
$check('cron enfileirou o calendário devido', $ag['incremental'] >= 1, json_encode($ag));

$repo->pdo()->exec("UPDATE gcal_sync_state SET status = 'full_resync_required'
                     WHERE account_id = $acc");
$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$fila->agendarDevidos();
// Filtrar PELO CALENDÁRIO: `agendarDevidos()` também enfileira `watch_renew`
// (job de conta, calendar_id NULL), e um `LIMIT 1` solto pegava esse.
$kind = $repo->pdo()->query(
    "SELECT kind FROM gcal_sync_jobs
      WHERE account_id = $acc AND status='pending' AND calendar_id = 'ag@dshow.com.br'
      LIMIT 1")->fetchColumn();
$check('quem pediu recarga recebe FULL, não incremental', $kind === 'full',
    "veio '$kind' (incremental reentraria no mesmo 410 para sempre)");

$repo->pdo()->exec("UPDATE gcal_sync_state SET status='ok',
                    next_sync_at = UTC_TIMESTAMP() + INTERVAL 15 MINUTE WHERE account_id = $acc");
$repo->pdo()->exec("DELETE FROM gcal_sync_jobs WHERE account_id = $acc");
$ag2 = $fila->agendarDevidos();
$check('calendário em dia não é reagendado', $ag2['incremental'] === 0);

// ═══════════════════════════════════════════════════════════════════
$secao('10. Reconciliação não apaga o que não olhou');

$repo->pdo()->exec("UPDATE gcal_sync_state
                       SET window_from = DATE(UTC_TIMESTAMP()) - INTERVAL 1 DAY,
                           window_to   = DATE(UTC_TIMESTAMP()) + INTERVAL 1 DAY,
                           last_sync_at = UTC_TIMESTAMP(), status='ok'
                     WHERE account_id = $acc");
// Evento DENTRO da janela e não tocado pela última varredura: sumiu da origem.
$repo->pdo()->exec("UPDATE gcal_events SET synced_at = UTC_TIMESTAMP() - INTERVAL 1 HOUR
                     WHERE account_id = $acc");
// Evento FORA da janela: a carga nem olhou para ele, então não pode ser tocado.
$repo->pdo()->prepare(
    "INSERT INTO gcal_events (account_id, calendar_id, event_id, status, summary, all_day,
                              start_utc, end_utc, synced_at)
     VALUES (:a,'ag@dshow.com.br','evt-fora','confirmed','Fora da janela',0,
             UTC_TIMESTAMP() + INTERVAL 200 DAY, UTC_TIMESTAMP() + INTERVAL 200 DAY + INTERVAL 1 HOUR,
             UTC_TIMESTAMP() - INTERVAL 1 HOUR)")->execute([':a' => $acc]);

$repo->enfileirar($acc, 'ag@dshow.com.br', 'reconcile');
$repo->pdo()->exec("UPDATE gcal_sync_jobs SET run_after = UTC_TIMESTAMP()
                     WHERE account_id = $acc AND kind='reconcile'");
$fila->drenar(3);

$dentro = (int)$repo->pdo()->query(
    "SELECT deleted FROM gcal_events WHERE account_id=$acc AND event_id='evt-f5'")->fetchColumn();
$fora = (int)$repo->pdo()->query(
    "SELECT deleted FROM gcal_events WHERE account_id=$acc AND event_id='evt-fora'")->fetchColumn();
$check('evento sumido DENTRO da janela vira deleted', $dentro === 1);
$check('evento FORA da janela NÃO é tocado', $fora === 0,
    '(apagar fora da janela é o jeito silencioso de esvaziar uma agenda)');

// ═══════════════════════════════════════════════════════════════════
$secao('11. Limpeza da fila e CASCADE');

$repo->pdo()->exec("UPDATE gcal_sync_jobs SET status='done',
                    finished_at = UTC_TIMESTAMP() - INTERVAL 10 DAY WHERE account_id = $acc");
$check('jobs concluídos antigos são removidos', $repo->limparJobsAntigos(7) > 0);

$repo->pdo()->prepare("DELETE FROM gcal_accounts WHERE id = :a")->execute([':a' => $acc]);
foreach (['gcal_sync_jobs', 'gcal_watch_channels', 'gcal_sync_state'] as $t) {
    $n = (int)$repo->pdo()->query("SELECT COUNT(*) FROM $t WHERE account_id = $acc")->fetchColumn();
    $check("  $t zerado ao excluir a conta", $n === 0, $n > 0 ? "sobraram $n" : '');
}

// ═══════════════════════════════════════════════════════════════════
echo "\n", str_repeat('═', 74), "\n";
if ($falhas) {
    printf("%d ok · %d FALHA(S):\n", $ok, count($falhas));
    foreach ($falhas as $f) { echo "  • $f\n"; }
    echo "\n";
    exit(1);
}
printf("TODOS OS %d CHECKS PASSARAM\n", $ok);
echo "Fila, canais push e webhook provados sem credencial do Google.\n\n";
exit(0);
