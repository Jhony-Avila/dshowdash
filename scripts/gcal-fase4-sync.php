<?php
// scripts/gcal-fase4-sync.php — carga inicial, incremental e recuperacao de 410.
// Transporte falso + banco real: o pipeline inteiro sem depender de credencial.
declare(strict_types=1);
error_reporting(E_ALL); ini_set('display_errors','1');
require '/var/www/dshowdash/config/db_connection.php';
$API='/var/www/dshowdash/api/google-calendar';
foreach (['lib/GcalCrypto.php','lib/GoogleOAuth.php','lib/GcalTransport.php','lib/GcalNormalizer.php',
          'lib/GoogleCalendarClient.php','repositories/GcalRepository.php',
          'services/GcalAuthService.php','services/GcalSyncService.php'] as $x) require $API.'/'.$x;

$f=0; function ok(string $t,bool $c,string $x=''):void{global $f;if(!$c){$f++;echo "  [FALHA] $t $x\n";}else echo "  [ok]    $t $x\n";}
$R = fn(int $s, array $b) => new GcalResposta($s,$b);

$repo = new GcalRepository();
$USER = 999998;
$repo->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id=?")->execute([$USER]);
$repo->pdo()->prepare("DELETE FROM gcal_oauth_states WHERE user_id=?")->execute([$USER]);

// Conta pronta, com tokens (o passo de OAuth em si depende de credencial real).
$acc = $repo->salvarConta($USER, ['google_account_id'=>'sub-sync','email'=>'s@x.com','scopes'=>'calendar.readonly']);
$repo->salvarTokens($acc, ['access_token'=>'AT','refresh_token'=>'RT','expires_in'=>3600]);

$evGoogle = fn(string $id, string $sum, string $dia) => [
  'id'=>$id,'status'=>'confirmed','summary'=>$sum,'etag'=>'"'.$id.'"','sequence'=>0,
  'start'=>['dateTime'=>$dia.'T09:00:00-03:00'],'end'=>['dateTime'=>$dia.'T10:00:00-03:00']];

echo "\n== Carga completa ==\n";
$t = new GcalTransportFake(
  $R(200,['items'=>[['id'=>'primary','summary'=>'Minha Agenda','accessRole'=>'owner','primary'=>true,'timeZone'=>'America/Sao_Paulo']]]),
  $R(200,['items'=>[$evGoogle('e1','A','2026-08-03'), $evGoogle('e2','B','2026-08-04')],'nextSyncToken'=>'SYNC-1'])
);
$auth = new GcalAuthService($repo, $t);
$sync = new GcalSyncService($repo, $auth);
$sync->sincronizarCalendarios($acc);
ok('calendário persistido', count($repo->listarCalendarios($USER)) === 1);
$r1 = $sync->cargaCompleta($acc,'primary');
ok('2 eventos gravados', $r1['created']===2 && $r1['processed']===2, json_encode($r1));
ok('syncToken guardado', $repo->lerSyncToken($acc,'primary')==='SYNC-1');
// A janela da carga tem de ir na query — sem timeMin o Google traria tudo.
$q = $t->chamadas[1]['query'];
ok('carga usa timeMin/timeMax (§77)', isset($q['timeMin']) && isset($q['timeMax']));
ok('NÃO manda syncToken na carga', !isset($q['syncToken']));

echo "\n== Incremental ==\n";
$t2 = new GcalTransportFake($R(200,['items'=>[$evGoogle('e1','A RENOMEADO','2026-08-03')],'nextSyncToken'=>'SYNC-2']));
$s2 = new GcalSyncService($repo, new GcalAuthService($repo,$t2));
$r2 = $s2->incremental($acc,'primary');
ok('só o alterado foi processado', $r2['processed']===1 && $r2['updated']===1, json_encode($r2));
ok('incremental mandou o syncToken', ($t2->ultimaQuery()['syncToken'] ?? null)==='SYNC-1');
ok('token rotacionado', $repo->lerSyncToken($acc,'primary')==='SYNC-2');
$ev = $repo->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00');
ok('título atualizado no banco', ($ev[0]['summary'] ?? '')==='A RENOMEADO');

echo "\n== Incremental sem mudança não reescreve (payload_hash) ==\n";
$t3 = new GcalTransportFake($R(200,['items'=>[$evGoogle('e1','A RENOMEADO','2026-08-03')],'nextSyncToken'=>'SYNC-3']));
$r3 = (new GcalSyncService($repo,new GcalAuthService($repo,$t3)))->incremental($acc,'primary');
ok('mesmo payload conta como inalterado', $r3['inalterados']===1 && $r3['updated']===0, json_encode($r3));

echo "\n== 410: recarga sem apagar dado (§49.3) ==\n";
$antes = count($repo->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00'));
$t4 = new GcalTransportFake(
  $R(410,['error'=>['errors'=>[['reason'=>'fullSyncRequired']]]]),          // incremental morre
  $R(200,['items'=>[$evGoogle('e1','A','2026-08-03'),$evGoogle('e2','B','2026-08-04'),
                    $evGoogle('e3','C','2026-08-05')],'nextSyncToken'=>'SYNC-NOVO'])  // recarga
);
$r4 = (new GcalSyncService($repo,new GcalAuthService($repo,$t4)))->incremental($acc,'primary');
ok('410 disparou carga completa', $r4['processed']===3, json_encode($r4));
ok('token novo gravado', $repo->lerSyncToken($acc,'primary')==='SYNC-NOVO');
$depois = count($repo->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00'));
ok('nenhum evento foi perdido no caminho', $depois >= $antes, "($antes -> $depois)");
ok('erro 410 registrado', (int)$repo->pdo()->query("SELECT COUNT(*) FROM gcal_sync_errors WHERE account_id=$acc AND http_status=410")->fetchColumn() >= 1);

echo "\n== Cancelado no incremental não some do banco (§59) ==\n";
$t5 = new GcalTransportFake($R(200,['items'=>[
  ['id'=>'e3','status'=>'cancelled','etag'=>'"c"','sequence'=>1,
   'start'=>['dateTime'=>'2026-08-05T09:00:00-03:00'],'end'=>['dateTime'=>'2026-08-05T10:00:00-03:00']]],
  'nextSyncToken'=>'SYNC-4']));
(new GcalSyncService($repo,new GcalAuthService($repo,$t5)))->incremental($acc,'primary');
$semCanc = count($repo->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00'));
$comCanc = count($repo->eventosDaJanela($USER,'2026-08-01 00:00:00','2026-08-10 00:00:00',null,true));
ok('cancelado sai da grade', $comCanc === $semCanc + 1, "($semCanc / $comCanc)");

echo "\n== Renovação de token dentro do sync ==\n";
$repo->salvarTokens($acc,['access_token'=>'VENCIDO','refresh_token'=>'RT','expires_in'=>1]);
ok('token está vencido', $repo->tokenVencido($acc) === true);
// GoogleOAuth::refresh chamaria a rede; sem credencial ele lança, e o serviço
// tem de marcar a conta em vez de repetir para sempre.
$erro=null;
try { (new GcalAuthService($repo,new GcalTransportFake()))->tokenValido($acc); }
catch (Throwable $e) { $erro=$e->getMessage(); }
ok('refresh sem credencial falha com mensagem clara', $erro!==null && str_contains($erro,'revogado'), (string)$erro);
$stt = $repo->pdo()->query("SELECT connection_status,last_error_code FROM gcal_accounts WHERE id=$acc")->fetch(PDO::FETCH_ASSOC);
ok('conta marcada para reconectar', $stt['connection_status']==='reauth_required', json_encode($stt));

echo "\n== sincronizarConta não aborta por um calendário ruim ==\n";
$repo->salvarTokens($acc,['access_token'=>'AT2','refresh_token'=>'RT','expires_in'=>3600]);
$repo->salvarConta($USER,['google_account_id'=>'sub-sync','email'=>'s@x.com']); // volta a connected
$t6 = new GcalTransportFake(
  $R(200,['items'=>[['id'=>'primary','summary'=>'A','accessRole'=>'owner','primary'=>true],
                    ['id'=>'ruim@x.com','summary'=>'Sem acesso','accessRole'=>'reader']]]),
  $R(200,['items'=>[],'nextSyncToken'=>'S']),                 // primary ok
  $R(403,['error'=>['errors'=>[['reason'=>'forbidden']]]]),   // o outro nega
  $R(403,['error'=>['errors'=>[['reason'=>'forbidden']]]]),
  $R(403,['error'=>['errors'=>[['reason'=>'forbidden']]]]),
  $R(403,['error'=>['errors'=>[['reason'=>'forbidden']]]]),
  $R(403,['error'=>['errors'=>[['reason'=>'forbidden']]]])
);
$tot = (new GcalSyncService($repo,new GcalAuthService($repo,$t6)))->sincronizarConta($acc);
ok('processou os 2 calendários', $tot['calendarios']===2, json_encode($tot));
ok('1 erro isolado, não abortou', $tot['errors']===1, json_encode($tot));

// limpeza
$repo->pdo()->prepare("DELETE FROM gcal_accounts WHERE user_id=?")->execute([$USER]);
echo "\n" . ($f===0 ? "TODOS OS CHECKS PASSARAM\n" : "*** $f FALHA(S) ***\n");
exit($f===0?0:1);
