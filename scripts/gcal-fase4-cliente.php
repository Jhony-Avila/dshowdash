<?php
// scripts/gcal-fase4-cliente.php — cliente da Google Calendar API + normalizador.
// Usa GcalTransportFake: prova parsing, paginacao, 401/410/429 e RRULE SEM chamar o Google.
declare(strict_types=1);
error_reporting(E_ALL); ini_set('display_errors','1');
$API='/var/www/dshowdash/api/google-calendar';
require $API.'/lib/GcalTransport.php';
require $API.'/lib/GcalNormalizer.php';
require $API.'/lib/GoogleCalendarClient.php';

$f=0; function ok(string $t,bool $c,string $x=''):void{global $f;if(!$c){$f++;echo "  [FALHA] $t $x\n";}else echo "  [ok]    $t $x\n";}
$R = fn(int $s, array $b) => new GcalResposta($s, $b);

echo "\n== Normalizador: dia inteiro x evento com hora (§48) ==\n";
$comHora = GcalNormalizer::evento([
  'id'=>'e1','status'=>'confirmed','summary'=>'Reunião',
  'start'=>['dateTime'=>'2026-08-03T09:00:00-03:00','timeZone'=>'America/Sao_Paulo'],
  'end'=>['dateTime'=>'2026-08-03T10:00:00-03:00','timeZone'=>'America/Sao_Paulo'],
], 'primary');
ok('não é dia inteiro', $comHora['all_day'] === false);
ok('09:00 SP vira 12:00 UTC', $comHora['start_utc'] === '2026-08-03 12:00:00', $comHora['start_utc']);
ok('colunas DATE ficam nulas', $comHora['start_date']===null && $comHora['end_date']===null);

$diaInteiro = GcalNormalizer::evento([
  'id'=>'e2','status'=>'confirmed','summary'=>'Feriado',
  'start'=>['date'=>'2026-09-07'],'end'=>['date'=>'2026-09-08'],
], 'primary');
ok('é dia inteiro', $diaInteiro['all_day'] === true);
ok('guarda a DATA pura', $diaInteiro['start_date']==='2026-09-07' && $diaInteiro['end_date']==='2026-09-08');
ok('NÃO vira 00:00 de um fuso', $diaInteiro['start_utc']===null && $diaInteiro['end_utc']===null);

echo "\n== Normalizador: campos do §58 e participantes ==\n";
$full = GcalNormalizer::evento([
  'id'=>'e3','iCalUID'=>'uid-3@google.com','etag'=>'"123"','sequence'=>4,
  'recurringEventId'=>'serie-1','originalStartTime'=>['dateTime'=>'2026-08-03T09:00:00-03:00'],
  'status'=>'confirmed','summary'=>'Semanal','htmlLink'=>'https://calendar.google.com/x',
  'start'=>['dateTime'=>'2026-08-10T09:00:00-03:00'],'end'=>['dateTime'=>'2026-08-10T10:00:00-03:00'],
  'organizer'=>['email'=>'org@x.com','displayName'=>'Org','self'=>true],
  'attendees'=>[
    ['email'=>'org@x.com','responseStatus'=>'accepted','organizer'=>true,'self'=>true],
    ['email'=>'b@x.com','displayName'=>'B','responseStatus'=>'needsAction','optional'=>true],
    ['email'=>'sala@resource.calendar.google.com','responseStatus'=>'accepted','resource'=>true]],
  'reminders'=>['useDefault'=>false,'overrides'=>[['method'=>'email','minutes'=>60]]],
  'recurrence'=>['RRULE:FREQ=WEEKLY;BYDAY=MO,WE','EXDATE;VALUE=DATE:20260817'],
  'conferenceData'=>['conferenceSolution'=>['name'=>'Google Meet'],
    'entryPoints'=>[['entryPointType'=>'video','uri'=>'https://meet.google.com/abc','pin'=>'999'],
                    ['entryPointType'=>'phone','uri'=>'tel:+551140000000']]],
  'transparency'=>'transparent','visibility'=>'private','eventType'=>'focusTime','colorId'=>'5',
], 'primary');
ok('iCalUID preservado', $full['ical_uid']==='uid-3@google.com');
ok('recurringEventId preservado', $full['recurring_event_id']==='serie-1');
ok('etag e sequence preservados', $full['etag']==='"123"' && $full['sequence']===4);
ok('originalStartTime preservado', $full['original_start_time']!==null);
ok('my_response vem do attendee self', $full['my_response']==='accepted');
ok('3 participantes', count($full['attendees'])===3);
ok('recurso marcado', $full['attendees'][2]['is_resource']===true);
ok('opcional marcado', $full['attendees'][1]['optional']===true);
ok('lembrete override', $full['reminders'][0]['method']==='email' && $full['reminders'][0]['minutes']===60);
ok('RRULE extraído', $full['recurrence']['rrule']==='RRULE:FREQ=WEEKLY;BYDAY=MO,WE');
ok('EXDATE separado do RRULE', str_contains((string)$full['recurrence']['exdate'],'EXDATE'));
ok('Meet + telefone', $full['conference']['uri']==='https://meet.google.com/abc' && !empty($full['conference']['phone']));
ok('transparency/visibility/eventType', $full['transparency']==='transparent' && $full['visibility']==='private' && $full['event_type']==='focusTime');

echo "\n== Normalizador: eventType — fromGmail aceito, desconhecido vira default (28/10/2026) ==\n";
// Dados reais: a 1ª sincronização após o go-live morreu com 1265 "Data truncated for column 'event_type'" porque o Google
// mandou eventType=fromGmail (voos/hotéis/reservas vindos do Gmail) e o ENUM não o tinha. Lista fechada + fallback seguro.
GcalNormalizer::$tiposDesconhecidos = [];
$base = ['id'=>'g1','status'=>'confirmed','summary'=>'Voo','start'=>['dateTime'=>'2026-10-30T08:00:00-03:00'],'end'=>['dateTime'=>'2026-10-30T09:00:00-03:00']];
ok('TIPOS_EVENTO = lista oficial da API (default, focusTime, outOfOffice, workingLocation, birthday, fromGmail)',
   GcalNormalizer::TIPOS_EVENTO === ['default','focusTime','outOfOffice','workingLocation','birthday','fromGmail']);
ok('fromGmail passa como está', GcalNormalizer::evento($base + ['eventType'=>'fromGmail'], 'primary')['event_type'] === 'fromGmail');
ok('birthday passa como está', GcalNormalizer::evento($base + ['eventType'=>'birthday'], 'primary')['event_type'] === 'birthday');
ok('tipo desconhecido vira default (nunca derruba a gravação)', GcalNormalizer::evento($base + ['eventType'=>'algoNovoDoGoogle'], 'primary')['event_type'] === 'default');
ok('…e é contado para o aviso (uma linha de log por tipo)', (GcalNormalizer::$tiposDesconhecidos['algoNovoDoGoogle'] ?? 0) === 1);
ok('sem eventType = default', GcalNormalizer::evento($base, 'primary')['event_type'] === 'default');
ok('eventType não-string (lixo) = default', GcalNormalizer::evento($base + ['eventType'=>['x']], 'primary')['event_type'] === 'default');

echo "\n== useDefault não vira 'sem lembrete' ==\n";
$ud = GcalNormalizer::evento(['id'=>'e4','status'=>'confirmed','start'=>['date'=>'2026-08-03'],
  'end'=>['date'=>'2026-08-04'],'reminders'=>['useDefault'=>true]], 'primary');
ok('useDefault gera lembrete marcado como padrão',
   count($ud['reminders'])===1 && !empty($ud['reminders'][0]['padrao_do_calendario']));

echo "\n== RRULE em português (§20) ==\n";
$casos = [
  'RRULE:FREQ=DAILY' => 'Todos os dias',
  'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' => 'Toda semana, nos dias úteis',
  'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH' => 'A cada 2 semanas, às terça, quinta',
  'RRULE:FREQ=MONTHLY;COUNT=6' => 'Todo mês, 6 vezes',
  'RRULE:FREQ=YEARLY;UNTIL=20301231' => 'Todo ano, até 31/12/2030',
];
foreach ($casos as $in=>$esperado) ok("\"$esperado\"", GcalNormalizer::rruleEmTexto($in)===$esperado, GcalNormalizer::rruleEmTexto($in));
ok('RRULE desconhecido volta cru', GcalNormalizer::rruleEmTexto('RRULE:FREQ=HOURLY')==='RRULE:FREQ=HOURLY');

echo "\n== paraGoogle: PATCH só manda o que veio ==\n";
$g = GcalNormalizer::paraGoogle(['summary'=>'Novo']);
ok('PATCH parcial não inclui start/end', !isset($g['start']) && !isset($g['end']) && $g['summary']==='Novo');
$g2 = GcalNormalizer::paraGoogle(['start'=>'2026-08-03','end'=>'2026-08-04','all_day'=>true]);
ok('dia inteiro usa `date`', isset($g2['start']['date']) && !isset($g2['start']['dateTime']));
$g3 = GcalNormalizer::paraGoogle(['start'=>'2026-08-03T09:00:00-03:00','end'=>'2026-08-03T10:00:00-03:00','time_zone'=>'America/Sao_Paulo']);
ok('com hora usa `dateTime`+timeZone', isset($g3['start']['dateTime']) && $g3['start']['timeZone']==='America/Sao_Paulo');

echo "\n== Cliente: paginação ==\n";
$t = new GcalTransportFake(
  $R(200, ['items'=>[['id'=>'a','status'=>'confirmed','start'=>['date'=>'2026-08-01'],'end'=>['date'=>'2026-08-02']]], 'nextPageToken'=>'PG2']),
  $R(200, ['items'=>[['id'=>'b','status'=>'confirmed','start'=>['date'=>'2026-08-02'],'end'=>['date'=>'2026-08-03']]], 'nextSyncToken'=>'SYNC-FINAL'])
);
$c = new GoogleCalendarClient($t, 'TOKEN');
$r1 = $c->listarEventos('primary', ['timeMin'=>'2026-08-01T00:00:00Z']);
ok('juntou as 2 páginas', count($r1['eventos'])===2);
ok('2ª página pediu pageToken', ($t->chamadas[1]['query']['pageToken'] ?? null)==='PG2');
ok('syncToken só da ÚLTIMA página', $r1['syncToken']==='SYNC-FINAL');

echo "\n== Cliente: incremental não manda timeMin junto do syncToken ==\n";
$t2 = new GcalTransportFake($R(200, ['items'=>[], 'nextSyncToken'=>'S2']));
(new GoogleCalendarClient($t2,'T'))->listarEventos('primary', ['syncToken'=>'S1','timeMin'=>'2026-01-01T00:00:00Z']);
$q = $t2->ultimaQuery();
ok('mandou syncToken', ($q['syncToken'] ?? null)==='S1');
ok('NÃO mandou timeMin (o Google recusa os dois juntos)', !isset($q['timeMin']));

echo "\n== Cliente: 410 vira exceção própria (§49.3) ==\n";
$t3 = new GcalTransportFake($R(410, ['error'=>['errors'=>[['reason'=>'fullSyncRequired']],'message'=>'Sync token is no longer valid']]));
$pegou=false;
try { (new GoogleCalendarClient($t3,'T'))->listarEventos('primary',['syncToken'=>'VELHO']); }
catch (GcalSyncTokenInvalido $e) { $pegou=true; }
ok('410 lança GcalSyncTokenInvalido', $pegou);

echo "\n== Cliente: 401 renova UMA vez e repete ==\n";
$t4 = new GcalTransportFake($R(401,['error'=>['message'=>'Invalid Credentials']]), $R(200,['items'=>[]]));
$renovou=0;
$c4 = new GoogleCalendarClient($t4,'VELHO', function() use (&$renovou){ $renovou++; return 'NOVO'; });
$c4->listarEventos('primary');
ok('renovou exatamente 1 vez', $renovou===1, "($renovou)");
ok('repetiu com o token NOVO', ($t4->chamadas[1]['token'] ?? '')==='NOVO');

$t5 = new GcalTransportFake($R(401,['error'=>[]]), $R(401,['error'=>[]]));
$ren2=0; $erro=null;
try { (new GoogleCalendarClient($t5,'V', function() use (&$ren2){ $ren2++; return 'N'; }))->listarEventos('primary'); }
catch (GcalApiException $e) { $erro=$e->getMessage(); }
ok('401 persistente NÃO vira laço', $ren2===1 && $erro!==null, "(renov=$ren2)");

echo "\n== Cliente: freeBusy trata calendário sem permissão ==\n";
$t6 = new GcalTransportFake($R(200,['calendars'=>[
  'a@x.com'=>['busy'=>[['start'=>'2026-08-03T12:00:00Z','end'=>'2026-08-03T13:00:00Z']]],
  'b@x.com'=>['errors'=>[['reason'=>'notFound']],'busy'=>[]]]]));
$fb = (new GoogleCalendarClient($t6,'T'))->freeBusy('2026-08-03T00:00:00Z','2026-08-04T00:00:00Z',['a@x.com','b@x.com'],'America/Sao_Paulo');
ok('ocupado de quem deu permissão', count($fb['a@x.com']['ocupado'])===1);
ok('sem permissão vem com o MOTIVO, não como "livre"', $fb['b@x.com']['erro']==='notFound');

echo "\n== Cliente: responder convite altera só o próprio attendee ==\n";
$evBase = ['id'=>'e9','status'=>'confirmed','start'=>['dateTime'=>'2026-08-03T09:00:00-03:00'],
  'end'=>['dateTime'=>'2026-08-03T10:00:00-03:00'],
  'attendees'=>[['email'=>'eu@x.com','responseStatus'=>'needsAction'],
                ['email'=>'outro@x.com','responseStatus'=>'accepted']]];
$t7 = new GcalTransportFake($R(200,$evBase), $R(200,$evBase));
(new GoogleCalendarClient($t7,'T'))->responderConvite('primary','e9','eu@x.com','declined','não posso');
$enviado = $t7->chamadas[1]['corpo']['attendees'];
ok('meu status mudou', $enviado[0]['responseStatus']==='declined');
ok('o do outro NÃO mudou', $enviado[1]['responseStatus']==='accepted');
ok('comentário anexado', ($enviado[0]['comment'] ?? '')==='não posso');

$t8 = new GcalTransportFake($R(200,$evBase));
$err8=null;
try { (new GoogleCalendarClient($t8,'T'))->responderConvite('primary','e9','estranho@x.com','accepted'); }
catch (GcalApiException $e) { $err8=$e->motivo; }
ok('quem não é participante é recusado', $err8==='notAttendee');

echo "\n== Cliente: perfil distingue Workspace de conta pessoal ==\n";
$t9 = new GcalTransportFake($R(200,['sub'=>'123','email'=>'a@dshow.com.br','name'=>'A','hd'=>'dshow.com.br']));
$p9 = (new GoogleCalendarClient($t9,'T'))->perfil();
ok('hd presente = workspace', $p9['account_type']==='workspace' && $p9['organization']==='dshow.com.br');
$t10 = new GcalTransportFake($R(200,['sub'=>'456','email'=>'b@gmail.com','name'=>'B']));
ok('sem hd = pessoal', (new GoogleCalendarClient($t10,'T'))->perfil()['account_type']==='personal');
// Go-live 28/10/2026: token SEM escopo de identidade → userinfo responde 401 invalid_request. O erro tem de
// sair com motivo e HTTP (o controller os loga), nunca como 200 vazio.
$t11 = new GcalTransportFake($R(401,['error'=>'invalid_request','error_description'=>'Invalid Credentials']));
$err11 = null; try { (new GoogleCalendarClient($t11,'T'))->perfil(); } catch (GcalApiException $e) { $err11 = $e; }
ok('perfil 401 lança GcalApiException', $err11 instanceof GcalApiException);
ok('…com a mensagem do callback', $err11 && $err11->getMessage()==='Não foi possível ler o perfil da conta Google');
ok('…com motivo invalid_request e HTTP 401', $err11 && $err11->motivo==='invalid_request' && $err11->status===401);

echo "\n== Cliente: tipo de calendário deduzido do id ==\n";
foreach ([['primary'=>true,'id'=>'x','esp'=>'personal'],
          ['id'=>'sala@resource.calendar.google.com','esp'=>'resource'],
          ['id'=>'pt_br#holiday@group.v.calendar.google.com','esp'=>'holiday'],
          ['id'=>'abc@group.calendar.google.com','esp'=>'team']] as $caso) {
  $esp = $caso['esp']; unset($caso['esp']);
  $n = GcalNormalizer::calendario($caso + ['summary'=>'X','accessRole'=>'reader']);
  ok("kind = $esp", $n['kind']===$esp, $n['kind']);
}

echo "\n" . ($f===0 ? "TODOS OS CHECKS PASSARAM\n" : "*** $f FALHA(S) ***\n");
exit($f===0?0:1);
