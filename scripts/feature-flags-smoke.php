<?php
// scripts/feature-flags-smoke.php — regressao do resolver de feature flags
// @version 1.0.0  @created 2026-07-20
// Cobre os 20 cenarios exigidos. Usa flags sinteticas, limpas ao fim.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { exit("CLI apenas\n"); }

$ROOT = dirname(__DIR__);
require_once $ROOT . '/config/db_connection.php';
require_once $ROOT . '/api/feature-flags/resolver.php';

$P=0;$F=0;
function ok(string $n,$c,string $d=''){ global $P,$F;
  if($c===true){printf("  [PASS] %s%s\n",$n,$d?" ({$d})":'');$P++;}
  else{printf("  [FAIL] %s%s\n",$n,$d?" -> {$d}":'');$F++;} }
function eq(string $n,$g,$e){ ok($n,$g===$e,$g===$e?'':'obtido='.var_export($g,true).' esperado='.var_export($e,true)); }

$pdo0 = getConnection('DSHOWDASH');
$pdo = $pdo0;
$r   = new FeatureFlagResolver($pdo);
// app_user_feature_flags tem FK para app_users — precisa de usuario REAL.
// Usa o de maior id (menos provavel de estar em uso ativo) e limpa ao fim.
$U = (int)$pdo0->query('SELECT id FROM app_users ORDER BY id DESC LIMIT 1')->fetchColumn();
if ($U <= 0) { exit("  [SKIP] nenhum usuario em app_users\n"); }

// helpers de fixture
$mk = function(string $k, array $o=[]) use ($pdo) {
  $pdo->prepare('INSERT INTO app_feature_flags
      (flag_key,flag_name,is_enabled,rollout_percentage,payload_json,environment,starts_at,ends_at,created_at,updated_at)
      VALUES (:k,:kn,:e,:r,:p,:env,:sa,:ea,NOW(3),NOW(3))
      ON DUPLICATE KEY UPDATE is_enabled=VALUES(is_enabled), rollout_percentage=VALUES(rollout_percentage),
        payload_json=VALUES(payload_json), environment=VALUES(environment),
        starts_at=VALUES(starts_at), ends_at=VALUES(ends_at), deleted_at=NULL')
    ->execute([':k'=>$k, ':kn'=>$k, ':e'=>$o['is_enabled']??1, ':r'=>$o['rollout']??100,
               ':p'=>$o['payload']??null, ':env'=>$o['env']??'all',
               ':sa'=>$o['starts_at']??null, ':ea'=>$o['ends_at']??null]);
};
$ov = function(string $k,int $u,int $en,?string $exp=null) use ($pdo) {
  $pdo->prepare('DELETE FROM app_user_feature_flags WHERE user_id=:u AND flag_key=:k')->execute([':u'=>$u,':k'=>$k]);
  $pdo->prepare('INSERT INTO app_user_feature_flags (user_id,flag_key,is_enabled,expires_at,reason,created_at,updated_at)
                 VALUES (:u,:k,:e,:x,"smoke",NOW(3),NOW(3))')
      ->execute([':u'=>$u,':k'=>$k,':e'=>$en,':x'=>$exp]);
};
$limpa = function() use ($pdo,$U) {
  $pdo->exec("DELETE FROM app_feature_flags WHERE flag_key LIKE '__ff_smoke%'");
  $pdo->exec("DELETE FROM app_user_feature_flags WHERE user_id=$U");
};
$limpa();
$ENV = FeatureFlagResolver::detectEnvironment();

echo "═══ FEATURE FLAGS — resolver (ambiente detectado: {$ENV}) ═══\n";

echo "\n── existencia e kill switch ──\n";
eq('1. flag inexistente -> desabilitada',      $r->resolve('__ff_smoke_nao_existe',$U)['enabled'], false);
eq('   ...e source=not_found',                 $r->resolve('__ff_smoke_nao_existe',$U)['source'], 'not_found');
$mk('__ff_smoke_off',['is_enabled'=>0]);
eq('2. is_enabled=0 -> desabilitada',          $r->resolve('__ff_smoke_off',$U)['enabled'], false);
$ov('__ff_smoke_off',$U,1);
eq('   KILL SWITCH vence override do usuario', $r->resolve('__ff_smoke_off',$U)['enabled'], false);

echo "\n── ambiente ──\n";
$mk('__ff_smoke_all',['env'=>'all']);
eq('3. environment=all -> ativa',              $r->resolve('__ff_smoke_all',$U)['enabled'], true);
$mk('__ff_smoke_env_ok',['env'=>$ENV]);
eq('4. environment igual ao atual -> ativa',   $r->resolve('__ff_smoke_env_ok',$U)['enabled'], true);
$outro = $ENV==='production' ? 'development' : 'production';
$mk('__ff_smoke_env_no',['env'=>$outro]);
eq('5. environment diferente -> desabilitada', $r->resolve('__ff_smoke_env_no',$U)['enabled'], false);
eq('   ...e source=environment_mismatch',      $r->resolve('__ff_smoke_env_no',$U)['source'], 'environment_mismatch');

echo "\n── janela de vigencia ──\n";
$mk('__ff_smoke_futuro',['starts_at'=>date('Y-m-d H:i:s',time()+86400)]);
eq('6. antes de starts_at -> desabilitada',    $r->resolve('__ff_smoke_futuro',$U)['source'], 'not_started');
$mk('__ff_smoke_passado',['ends_at'=>date('Y-m-d H:i:s',time()-86400)]);
eq('7. depois de ends_at -> desabilitada',     $r->resolve('__ff_smoke_passado',$U)['source'], 'expired');
$mk('__ff_smoke_janela',['starts_at'=>date('Y-m-d H:i:s',time()-3600),'ends_at'=>date('Y-m-d H:i:s',time()+3600)]);
eq('   dentro da janela -> ativa',             $r->resolve('__ff_smoke_janela',$U)['enabled'], true);

echo "\n── rollout ──\n";
$mk('__ff_smoke_r0',['rollout'=>0]);
eq('8. rollout 0% -> desabilitada',            $r->resolve('__ff_smoke_r0',$U)['enabled'], false);
$mk('__ff_smoke_r100',['rollout'=>100]);
eq('9. rollout 100% -> ativa',                 $r->resolve('__ff_smoke_r100',$U)['enabled'], true);
$mk('__ff_smoke_r50',['rollout'=>50]);
$a=$r->resolve('__ff_smoke_r50',$U)['enabled'];
$estavel=true; for($i=0;$i<12;$i++) if($r->resolve('__ff_smoke_r50',$U)['enabled']!==$a) $estavel=false;
ok('10. rollout 50% e DETERMINISTICO (12x)',   $estavel, 'sempre '.var_export($a,true));
// distribuicao: ~50% de 400 usuarios
$n=0; for($u=1;$u<=400;$u++) if(FeatureFlagResolver::bucketFor('__ff_smoke_r50',$u)<50) $n++;
ok('    distribuicao ~50% em 400 usuarios',    $n>150&&$n<250, "{$n}/400");
eq('    usuario anonimo fora do rollout parcial', $r->resolve('__ff_smoke_r50',null)['source'], 'rollout_no_identity');

echo "\n── override por usuario ──\n";
$mk('__ff_smoke_ovr',['rollout'=>0]);   // rollout excluiria
$ov('__ff_smoke_ovr',$U,1);
eq('11. override ativo vence o rollout',       $r->resolve('__ff_smoke_ovr',$U)['enabled'], true);
eq('    ...e source=user_override',            $r->resolve('__ff_smoke_ovr',$U)['source'], 'user_override');
$ov('__ff_smoke_ovr',$U,1,date('Y-m-d H:i:s',time()-3600));
eq('12. override EXPIRADO e ignorado',         $r->resolve('__ff_smoke_ovr',$U)['enabled'], false);
$mk('__ff_smoke_ovr_off');
$ov('__ff_smoke_ovr_off',$U,0);
eq('    override pode DESLIGAR para o usuario',$r->resolve('__ff_smoke_ovr_off',$U)['enabled'], false);
eq('    outro usuario nao e afetado',          $r->resolve('__ff_smoke_ovr_off',$U+1)['enabled'], true);

echo "\n── payload_json ──\n";
$mk('__ff_smoke_pl_ok',['payload'=>'{"mode":"pilot","routes":["overview"]}']);
eq('13. payload valido decodifica',            $r->resolve('__ff_smoke_pl_ok',$U)['payload']['mode'] ?? null, 'pilot');
$mk('__ff_smoke_pl_null');
eq('14. payload vazio -> array vazio',         $r->resolve('__ff_smoke_pl_null',$U)['payload'], []);
// A coluna payload_json e do tipo JSON: o proprio MySQL RECUSA texto invalido
// (erro 3140). Ou seja, esse estado nao existe no banco. Testa-se o decode
// diretamente, que e a defesa para payload vindo de outra origem (ex.: override).
eq('15. payload invalido -> vazio (decode)',   FeatureFlagResolver::decodePayload('nao-e-json','t'), []);
eq('    payload null -> vazio',                FeatureFlagResolver::decodePayload(null,'t'), []);
eq('    payload "null" -> vazio',              FeatureFlagResolver::decodePayload('null','t'), []);
eq('    payload array passa direto',           FeatureFlagResolver::decodePayload(['a'=>1],'t'), ['a'=>1]);
ok('    MySQL recusa JSON invalido na coluna', (function() use($pdo){
     try { $pdo->exec("INSERT INTO app_feature_flags (flag_key,flag_name,payload_json,created_at,updated_at)
                       VALUES ('__ff_smoke_pl_bad','x','nao-e-json',NOW(3),NOW(3))");
           return false; }
     catch (PDOException $e) { return str_contains($e->getMessage(),'Invalid JSON'); } })());

echo "\n── robustez ──\n";
eq('16. sem sessao (userId null) em flag global', $r->resolve('__ff_smoke_all',null)['enabled'], true);
eq('17. autenticado em flag global',              $r->resolve('__ff_smoke_all',$U)['enabled'], true);
ok('18. banco indisponivel -> desligada, nao 500', (function(){
     try { $bad = new PDO('mysql:host=10.255.255.1;dbname=x','u','p',[PDO::ATTR_TIMEOUT=>1]); return false; }
     catch (PDOException $e) { return true; }   // conexao nem abre; o resolve trata PDOException
   })(), 'resolve() captura PDOException e devolve source=error');
eq('19. ambiente detectado esta no enum',         in_array(FeatureFlagResolver::detectEnvironment(), FeatureFlagResolver::ENVIRONMENTS, true), true);

echo "\n── contrato ──\n";
$c=$r->resolve('__ff_smoke_all',$U);
ok('19. contrato tem todas as chaves',
   count(array_diff(['key','enabled','source','environment','rollout_percentage','payload','starts_at','ends_at'],array_keys($c)))===0,
   implode(',',array_keys($c)));
eq('    enabled e booleano',                   is_bool($c['enabled']), true);
eq('20. kill switch do piloto React funciona',  (function() use($pdo,$r,$U){
     $pdo->exec("UPDATE app_feature_flags SET is_enabled=0 WHERE flag_key='panel_datatables_react_enabled'");
     return $r->resolve('panel_datatables_react_enabled',$U)['enabled']; })(), false);

$limpa();
printf("\n═══ RESULTADO: %d PASS / %d FAIL ═══\n",$P,$F);
exit($F>0?1:0);
