<?php
// scripts/gcal-fase4-repositorio.php — persistencia em GCAL_DSHOW (Fase 4).
// Roda contra o banco REAL, com user_id de teste, e limpa o que cria.
declare(strict_types=1);
error_reporting(E_ALL); ini_set('display_errors','1');
require '/var/www/dshowdash/config/db_connection.php';
$API = '/var/www/dshowdash/api/google-calendar';
require $API . '/lib/GcalCrypto.php';
require $API . '/repositories/GcalRepository.php';

$f = 0;
function ok(string $t, bool $c, string $x=''): void { global $f; if(!$c){$f++;echo "  [FALHA] $t $x\n";} else echo "  [ok]    $t $x\n"; }

$r = new GcalRepository();
$USER = 999999;   // usuário de teste; limpo no fim

// limpeza defensiva de execuções anteriores
$r->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id = ?")->execute([$USER]);
$r->pdo()->prepare("DELETE FROM gcal_oauth_states WHERE user_id = ?")->execute([$USER]);

echo "\n== Contas e tokens ==\n";
$acc = $r->salvarConta($USER, ['google_account_id'=>'sub-teste-1','email'=>'t@x.com',
  'display_name'=>'Teste','account_type'=>'workspace','scopes'=>'calendar.readonly']);
ok('conta criada', $acc > 0, "(id $acc)");
$contas = $r->listarContas($USER);
ok('primeira conta vira padrão', (int)$contas[0]['is_default'] === 1);
$acc2 = $r->salvarConta($USER, ['google_account_id'=>'sub-teste-2','email'=>'t2@x.com']);
$contas = $r->listarContas($USER);
ok('segunda conta NÃO vira padrão', count($contas) === 2 && (int)$contas[1]['is_default'] === 0);
ok('salvar de novo é idempotente', $r->salvarConta($USER, ['google_account_id'=>'sub-teste-1','email'=>'t@x.com']) === $acc);

$r->salvarTokens($acc, ['access_token'=>'ACCESS-1','refresh_token'=>'REFRESH-1','expires_in'=>3600]);
$t = $r->lerTokens($acc);
ok('tokens ida e volta', $t['access']==='ACCESS-1' && $t['refresh']==='REFRESH-1');
$raw = $r->pdo()->query("SELECT access_token_enc FROM gcal_oauth_tokens WHERE account_id=$acc")->fetchColumn();
ok('token está CIFRADO no banco', !str_contains((string)$raw,'ACCESS-1') && str_starts_with((string)$raw,'v1.'));

// A armadilha do Google: refresh ausente NÃO pode apagar o guardado.
$r->salvarTokens($acc, ['access_token'=>'ACCESS-2','expires_in'=>3600]);
$t = $r->lerTokens($acc);
ok('refresh preservado quando não vem', $t['access']==='ACCESS-2' && $t['refresh']==='REFRESH-1');
ok('token novo não está vencido', $r->tokenVencido($acc) === false);
$r->salvarTokens($acc, ['access_token'=>'A3','expires_in'=>1]);
ok('token de 1s conta como vencido (folga 60s)', $r->tokenVencido($acc) === true);

$r->marcarErroConta($acc2, 'invalid_grant', 'acesso revogado');
$c2 = $r->pdo()->query("SELECT connection_status FROM gcal_accounts WHERE id=$acc2")->fetchColumn();
ok('invalid_grant vira reauth_required', $c2 === 'reauth_required', "($c2)");

echo "\n== Estado OAuth (state + PKCE) ==\n";
$r->criarState($USER, 'STATE-abc', 'VERIFIER-xyz', '#/rota');
$v = $r->pdo()->query("SELECT code_verifier_enc FROM gcal_oauth_states WHERE state='STATE-abc'")->fetchColumn();
ok('verifier cifrado', !str_contains((string)$v,'VERIFIER-xyz'));
$s1 = $r->consumirState('STATE-abc');
ok('consome e devolve o verifier', $s1 && $s1['verifier']==='VERIFIER-xyz' && $s1['user_id']===$USER);
$s2 = $r->consumirState('STATE-abc');
ok('SEGUNDO consumo é recusado (anti-replay)', $s2 === null);
ok('state inexistente devolve null', $r->consumirState('NAO-EXISTE') === null);

echo "\n== Calendários ==\n";
$r->salvarCalendario($acc, ['calendar_id'=>'primary','summary'=>'Minha Agenda',
  'access_role'=>'owner','is_primary'=>true,'kind'=>'personal','color_hex'=>'#60a5fa']);
$r->salvarCalendario($acc, ['calendar_id'=>'time@x.com','summary'=>'Equipe','access_role'=>'writer','kind'=>'team']);
$cals = $r->listarCalendarios($USER);
ok('2 calendários', count($cals) === 2, '('.count($cals).')');
ok('primário vem primeiro', $cals[0]['calendar_id']==='primary');
$r->salvarCalendario($acc, ['calendar_id'=>'primary','summary'=>'Renomeada','access_role'=>'owner','is_primary'=>true]);
$cals = $r->listarCalendarios($USER);
ok('upsert atualiza, não duplica', count($cals)===2 && $cals[0]['summary']==='Renomeada');
$n = $r->marcarCalendariosAusentes($acc, ['primary']);
ok('calendário ausente é marcado (não apagado)', $n === 1 && count($r->listarCalendarios($USER)) === 1);

echo "\n== Eventos ==\n";
$ev = ['calendar_id'=>'primary','event_id'=>'evt-1','ical_uid'=>'uid-1','status'=>'confirmed',
  'summary'=>'Reunião','start_utc'=>'2026-08-03 12:00:00','end_utc'=>'2026-08-03 13:00:00',
  'etag'=>'"e1"','sequence'=>0,'attendees'=>[
     ['email'=>'a@x.com','display_name'=>'A','response'=>'accepted','is_organizer'=>true],
     ['email'=>'b@x.com','display_name'=>'B','response'=>'needsAction']],
  'reminders'=>[['method'=>'popup','minutes'=>10]],
  'recurrence'=>['rrule'=>'RRULE:FREQ=WEEKLY','human'=>'Toda semana'],
  'conference'=>['platform'=>'meet','uri'=>'https://meet.google.com/abc','pin'=>'1234']];
ok('evento inserido', $r->salvarEvento($acc,$ev) === 'inserido');
ok('mesmo payload = inalterado (payload_hash)', $r->salvarEvento($acc,$ev) === 'inalterado');
$ev['summary'] = 'Reunião renomeada';
ok('payload diferente = atualizado', $r->salvarEvento($acc,$ev) === 'atualizado');

$pk = (int)$r->pdo()->query("SELECT id FROM gcal_events WHERE event_id='evt-1'")->fetchColumn();
$att = $r->participantesDe([$pk]);
ok('participantes gravados', count($att[$pk] ?? []) === 2);
$pin = $r->pdo()->query("SELECT pin_enc FROM gcal_event_conferences WHERE event_pk=$pk")->fetchColumn();
ok('PIN da conferência cifrado', $pin && !str_contains((string)$pin,'1234'));
$rec = $r->pdo()->query("SELECT rrule FROM gcal_event_recurrence WHERE event_pk=$pk")->fetchColumn();
ok('recorrência gravada', $rec === 'RRULE:FREQ=WEEKLY');

// Dia inteiro NÃO usa colunas UTC.
$r->salvarEvento($acc, ['calendar_id'=>'primary','event_id'=>'evt-dia','status'=>'confirmed',
  'summary'=>'Feriado','all_day'=>true,'start_date'=>'2026-08-05','end_date'=>'2026-08-06']);
$d = $r->pdo()->query("SELECT all_day,start_utc,start_date FROM gcal_events WHERE event_id='evt-dia'")->fetch(PDO::FETCH_ASSOC);
ok('dia inteiro usa DATE e deixa UTC nulo', (int)$d['all_day']===1 && $d['start_utc']===null && $d['start_date']==='2026-08-05');

$j = $r->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00');
ok('janela traz os dois', count($j) === 2, '('.count($j).')');
$j2 = $r->eventosDaJanela($USER,'2026-09-01 00:00:00','2026-09-10 00:00:00');
ok('janela fora do período traz zero', count($j2) === 0);

// Cancelado sai da grade por padrão, mas continua no banco (§59).
$ev['status'] = 'cancelled';
$r->salvarEvento($acc, $ev);
ok('cancelado sai da janela', count($r->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00')) === 1);
ok('cancelado continua no banco', count($r->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00',null,true)) === 2);

echo "\n== Sincronização ==\n";
$r->salvarSyncState($acc,'primary',['sync_token'=>'TOKEN-1','status'=>'ok','processed'=>10,'duration_ms'=>250]);
ok('sync token ida e volta', $r->lerSyncToken($acc,'primary') === 'TOKEN-1');
$rawT = $r->pdo()->query("SELECT sync_token_enc FROM gcal_sync_state WHERE account_id=$acc AND calendar_id='primary'")->fetchColumn();
ok('sync token CIFRADO', !str_contains((string)$rawT,'TOKEN-1'));
$r->salvarSyncState($acc,'primary',['status'=>'ok','processed'=>3]);
ok('salvar sem token preserva o anterior', $r->lerSyncToken($acc,'primary') === 'TOKEN-1');
$r->exigirCargaCompleta($acc,'primary');
$stt = $r->pdo()->query("SELECT status FROM gcal_sync_state WHERE account_id=$acc AND calendar_id='primary'")->fetch(PDO::FETCH_ASSOC);
ok('410 marca full_resync e zera o token', $stt['status']==='full_resync_required' && $r->lerSyncToken($acc,'primary')===null);

$cid = GcalRepository::correlationId();
$run = $r->abrirRun($acc,'primary','full',$cid);
$r->fecharRun($run,['duration_ms'=>900,'processed'=>20,'created'=>15,'updated'=>5]);
$runRow = $r->pdo()->query("SELECT * FROM gcal_sync_runs WHERE id=$run")->fetch(PDO::FETCH_ASSOC);
ok('run registrado e fechado', (int)$runRow['processed']===20 && $runRow['finished_at']!==null);
$r->registrarErro($acc,['run_id'=>$run,'calendar_id'=>'primary','http_status'=>410,'error_code'=>'fullSyncRequired','message'=>'token expirado','correlation_id'=>$cid]);
ok('erro registrado com correlation id', (int)$r->pdo()->query("SELECT COUNT(*) FROM gcal_sync_errors WHERE correlation_id='$cid'")->fetchColumn() === 1);

echo "\n== Auditoria (§76) ==\n";
$r->auditar($USER,'update',['account_id'=>$acc,'calendar_id'=>'primary','event_id'=>'evt-1',
  'before'=>['summary'=>'A','access_token'=>'DEVE-SUMIR'],'after'=>['summary'=>'B'],'correlation_id'=>$cid]);
$aud = $r->pdo()->query("SELECT before_json FROM gcal_audit_logs WHERE correlation_id='$cid'")->fetchColumn();
ok('auditoria gravada', $aud !== false);
ok('scrub tira o token do before_json', !str_contains((string)$aud,'DEVE-SUMIR'), (string)$aud);

echo "\n== Transação faz rollback ==\n";
$antes = (int)$r->pdo()->query("SELECT COUNT(*) FROM gcal_events")->fetchColumn();
try {
  $r->transacao(function(GcalRepository $rr) use ($acc) {
    $rr->salvarEvento($acc,['calendar_id'=>'primary','event_id'=>'evt-rollback','status'=>'confirmed',
      'summary'=>'X','start_utc'=>'2026-08-04 12:00:00','end_utc'=>'2026-08-04 13:00:00']);
    throw new RuntimeException('falha proposital');
  });
} catch (Throwable $e) {}
ok('rollback desfaz a escrita', (int)$r->pdo()->query("SELECT COUNT(*) FROM gcal_events")->fetchColumn() === $antes);

echo "\n== Desconectar ==\n";
$r->desconectar($acc);
ok('tokens apagados', $r->lerTokens($acc) === null);
ok('conta marcada revoked', $r->pdo()->query("SELECT connection_status FROM gcal_accounts WHERE id=$acc")->fetchColumn() === 'revoked');

// limpeza
$r->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id = ?")->execute([$USER]);
$r->pdo()->prepare("DELETE FROM gcal_oauth_states WHERE user_id = ?")->execute([$USER]);
$sobrou = (int)$r->pdo()->query("SELECT COUNT(*) FROM gcal_events")->fetchColumn();
ok('CASCADE limpou os eventos junto', $sobrou === 0, "($sobrou)");

echo "\n" . ($f===0 ? "TODOS OS CHECKS PASSARAM\n" : "*** $f FALHA(S) ***\n");
exit($f===0?0:1);
