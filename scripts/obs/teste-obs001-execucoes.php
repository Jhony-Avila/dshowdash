<?php
declare(strict_types=1);
// teste-obs001-execucoes.php — OBS-001 / MIG-001 (VINHO, 26/11 noite). MySQL LOCAL, banco temporário zz_obs001 (criado e removido aqui).
require_once dirname(__DIR__, 2) . '/api/obs/ObsExecucoes.php';
require_once dirname(__DIR__, 2) . '/api/obs/ObsProdutor.php';
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_obs001_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;");
$sql = file_get_contents(dirname(__DIR__, 2) . '/scripts/obs/migracao-obs001-execucoes.sql'); $root->exec($sql); $root->exec($sql);   // aditiva: 2× sem erro
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC');
$T = fn(string $h) => new DateTimeImmutable("2026-11-27 $h", $U);
$slot = $T('03:37:00');
$ck('iniciar: grava início + posse', $o->iniciar('asaas.sincronizar', 'zenthra', $slot, 1, 600, $T('03:37:05')));
$ck('duplicada (mesmo slot/tentativa) → false: o produtor não roda de novo', !$o->iniciar('asaas.sincronizar', 'zenthra', $slot, 1, 600, $T('03:37:06')));
$ck('job+escopo já em andamento (outro slot) → false: nunca duas posses', !$o->iniciar('asaas.sincronizar', 'zenthra', $T('04:37:00'), 1, 600, $T('03:38:00')));
$ck('outro escopo roda em paralelo', $o->iniciar('asaas.sincronizar', 'rovic', $slot, 1, 600, $T('03:37:05')));
$ck('renovar só antes de vencer (CAS)', $o->renovar('asaas.sincronizar', 'zenthra', $slot, 1, 600, $T('03:40:00')) && !$o->renovar('asaas.sincronizar', 'rovic', $slot, 1, 60, $T('03:50:00')));
$ck('encerrar ok com a posse válida; sem a posse (vencida) → false', $o->encerrar('asaas.sincronizar', 'zenthra', $slot, 1, 'ok', 120, null, $T('03:41:00'))
    && !$o->encerrar('asaas.sincronizar', 'rovic', $slot, 1, 'ok', 5, null, $T('03:50:00')));
$ck('watchdog: a posse vencida vira "interrompida" e libera a posse; nova tentativa roda', $o->vigiar($T('03:50:00')) === 1 && $o->iniciar('asaas.sincronizar', 'rovic', $slot, 2, 600, $T('03:50:01'))
    && $o->encerrar('asaas.sincronizar', 'rovic', $slot, 2, 'falhou', null, 'fonte', $T('03:51:00')));
$r = $o->resumo('asaas.sincronizar', 'zenthra');
$ck('resumo: tentativa ≠ sucesso; duração = fim − início (235 s); volume da última ok', $r['ultima_tentativa'] === '2026-11-27T03:37:05.000Z' && $r['ultimo_sucesso'] === '2026-11-27T03:41:00.000Z'
    && $r['duracao_s_ultima_ok'] === 235.0 && $r['volume_ultima_ok'] === 120 && $r['estado_ultima'] === 'ok', json_encode($r));
$rr = $o->resumo('asaas.sincronizar', 'rovic');
$ck('escopo que só falhou: último sucesso null (nunca inventado), estado da última = falhou/fonte', $rr['ultimo_sucesso'] === null && $rr['estado_ultima'] === 'falhou' && $rr['erro_ultima'] === 'fonte');
$ck('job sem nenhuma linha: tudo null (nunca zero)', $o->resumo('bling.pedidos')['ultima_tentativa'] === null && $o->resumo('bling.pedidos')['volume_ultima_ok'] === null);
$exc = function (callable $fn) { try { $fn(); return false; } catch (InvalidArgumentException) { return true; } };
$ck('validação: id com espaço/maiúscula/nome de pessoa, ok com erro, volume negativo, erro fora da lista, ttl 0 → recusa', $exc(fn() => $o->iniciar('Asaas Sync', '-', $slot, 1, 60, $T('05:00:00')))
    && $exc(fn() => $o->encerrar('asaas.sincronizar', 'zenthra', $slot, 1, 'ok', 1, 'fonte', $T('05:00:00'))) && $exc(fn() => $o->encerrar('a', '-', $slot, 1, 'parcial', -1, null, $T('05:00:00')))
    && $exc(fn() => $o->encerrar('a', '-', $slot, 1, 'falhou', null, 'mensagem livre', $T('05:00:00'))) && $exc(fn() => $o->iniciar('a', '-', $slot, 1, 0, $T('05:00:00'))));
$sj = array_column($o->comoSyncJobs(), null, 'job_name');
$ck('MIG-001 · formato legado sync_jobs: job@escopo, last_execution/last_success, success_rate, avg_execution_time, total; next_execution/cron null (catálogo)',
    $sj['asaas.sincronizar@zenthra']['last_success'] === '2026-11-27T03:41:00.000Z' && $sj['asaas.sincronizar@zenthra']['success_rate'] === 100.0 && $sj['asaas.sincronizar@zenthra']['avg_execution_time'] === 235.0
    && $sj['asaas.sincronizar@rovic']['success_rate'] === 0.0 && $sj['asaas.sincronizar@rovic']['error_count'] === 2 && $sj['asaas.sincronizar@rovic']['total_executions'] === 2
    && $sj['asaas.sincronizar@rovic']['avg_execution_time'] === null && $sj['asaas.sincronizar@zenthra']['next_execution'] === null && $sj['asaas.sincronizar@zenthra']['is_running'] === false, json_encode($sj));
$h = $o->historico('asaas.sincronizar', 'rovic');
$ck('MIG-001 · formato legado sync_jobs_history: error/interrompida, volume desconhecido = rows_affected null', $h[0]['status'] === 'error' && $h[0]['error_code'] === 'fonte' && $h[0]['rows_affected'] === null
    && $h[1]['error_code'] === 'interrompida' && count($h) === 2, json_encode($h));
$ck('banco: CHECK recusa "ok" com erro e fim faltando, mesmo contornando o código', (function () use ($pdo) {
    foreach (["('x','-','2026-11-27 00:00:00',1,NOW(3),NOW(3),'ok',NULL,'fonte',NOW(3))", "('y','-','2026-11-27 00:00:00',1,NOW(3),NULL,'falhou',NULL,NULL,NOW(3))"] as $v)
        { try { $pdo->exec("INSERT INTO obs_execucao VALUES $v"); return false; } catch (PDOException) {} }
    return true; })());
// ── degrau 2: o produtor (Asaas) grava no registro SEM depender dele
$ck('slot do cron :37 (UTC): 03:50 → 03:37; 03:10 → 02:37', ObsProdutor::slotHorario($T('03:50:00'), 37)->format('H:i') === '03:37' && ObsProdutor::slotHorario($T('03:10:00'), 37)->format('H:i') === '02:37');
$P = new ObsProdutor(fn() => $pdo, 'asaas.sincronizar');
$s2 = $T('05:37:00'); $a1 = $P->comecar('gav', $s2, $T('05:37:02')); $P->terminar($a1, 'ok', 33, 'fonte', $T('05:38:00'));
$a2 = $P->comecar('gav', $s2, $T('05:40:00')); $P->terminar($a2, 'falhou', null, 'fonte', $T('05:40:30'));
$rg = $o->resumo('asaas.sincronizar', 'gav');
$ck('produtor: 1ª rodada tentativa 1 (ok, volume 33, erro ignorado no ok); rodar de novo no mesmo slot = tentativa 2', $a1[2] === 1 && $a2[2] === 2 && $rg['volume_ultima_ok'] === 33 && $rg['estado_ultima'] === 'falhou', json_encode($rg));
$semTabela = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=mysql;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$Q = new ObsProdutor(fn() => $semTabela, 'asaas.sincronizar'); $aq = $Q->comecar('gav', $s2, $T('06:00:00')); $Q->terminar($aq, 'ok', 1, null, $T('06:01:00'));
$R0 = new ObsProdutor(fn() => throw new PDOException('banco fora'), 'asaas.sincronizar'); $ar = $R0->comecar('gav', $s2, $T('06:00:00')); $R0->terminar($ar, 'ok', 1, null, $T('06:01:00'));
$ck('FAIL-SOFT: tabela ausente ou banco fora → alça null, nenhuma exceção (a sincronização roda igual)', $aq === null && $ar === null);
$run = (string) file_get_contents(dirname(__DIR__, 2) . '/scripts/asaas/asaas-sincronizar.php');
$ck('runner do Asaas: comecar antes e terminar depois de CADA conta; o resultado e o código de saída não dependem do registro', preg_match('/comecar\(\$r.*\n.*sincronizar\(\$r, \$agora\).*\n(.*\n){0,2}.*terminar\(/', $run) === 1 && str_contains($run, 'exit($falhou ? 1 : 0);'));
$rd = (string) file_get_contents(dirname(__DIR__, 2) . '/scripts/rdstation/rd-sincronizar.php');
$ck('runner do RD: registra rd.sincronizar (slot :41), parcial quando falta total (cobertura), fecha o registro também na exceção; config ausente não derruba',
    strpos($rd, "->comecar(") < strpos($rd, '->rodar(') && str_contains($rd, "'rd.sincronizar'") && str_contains($rd, "'cobertura'") && substr_count($rd, '->terminar(') === 2 && str_contains($rd, "throw new RuntimeException('sem_config')")
    && substr_count($run, '->terminar(') === 2);
// MIG-001 · piloto do 1º consumidor (get_jobs_status.php) sobre o registro
$sj2 = $o->comoSyncJobs(); $js = ObsExecucoes::jobsStatusLegado($sj2, '1', '', '', 100);
$ck('piloto get_jobs_status: mesmas chaves do legado (jobs[], statistics, filters, total; a fonte vai no meta), ordem last_execution DESC, inexistentes = null',
    array_keys($js) === ['jobs', 'statistics', 'filters', 'total'] && array_keys($js['jobs'][0]) === ['id', 'job_name', 'job_type', 'description', 'is_active', 'is_running', 'error_count', 'last_execution', 'last_success', 'success_rate', 'avg_execution_time', 'total_executions', 'created_at', 'updated_at']
    && $js['jobs'][0]['last_execution'] >= end($js['jobs'])['last_execution'] && $js['jobs'][0]['id'] === null && $js['statistics']['total_jobs'] === count($sj2), json_encode($js['statistics']));
$ck('piloto: search filtra pelo job_name; job_type (o registro não tem) e is_active=0 → nenhum; limit corta', count(ObsExecucoes::jobsStatusLegado($sj2, '', '', 'rovic', 100)['jobs']) === 1
    && ObsExecucoes::jobsStatusLegado($sj2, '1', 'cron', '', 100)['jobs'] === [] && ObsExecucoes::jobsStatusLegado($sj2, '0', '', '', 100)['jobs'] === [] && count(ObsExecucoes::jobsStatusLegado($sj2, '', '', '', 1)['jobs']) === 1);
$gs = (string) file_get_contents(dirname(__DIR__, 2) . '/api/monitoring/get_jobs_status.php');
$ck('piloto: a troca de fonte só com a flag GLOBAL obs_monitoramento; flag ilegível = legado; cache separado; registro fora = 503 (nunca zero)', str_contains($gs, 'ObsConsumidor::ligado()') && str_contains($gs, "'obs:' . \$CACHE_KEY") && str_contains($gs, "503, ['fonte' => 'registro_execucoes'"));
// MIG-001 · 2º consumidor (executions_hourly.php)
$ph = $o->porHora24h($T('12:00:00'));
$tot = (int) $pdo->query("SELECT COUNT(*) FROM obs_execucao WHERE iniciado_em >= '2026-11-26 12:00:00'")->fetchColumn();
$oks = (int) $pdo->query("SELECT COUNT(*) FROM obs_execucao WHERE estado = 'ok' AND iniciado_em >= '2026-11-26 12:00:00'")->fetchColumn();
$ck('por hora (fuso de Brasília): soma = execuções da janela, success = ok, hora 00 = as 03:37 UTC, formato legado', array_sum(array_column($ph, 'total')) === $tot && array_sum(array_column($ph, 'success')) === $oks
    && $ph[0]['hour'] === 0 && array_keys($ph[0]) === ['hour', 'total', 'success', 'errors', 'avg_time'], json_encode($ph));
$ck('por hora: janela de 24 h (amanhã à tarde, nada) e sem terminada = avg_time null', $o->porHora24h($T('12:00:00')->modify('+2 days')) === [] && in_array(null, array_column($ph, 'avg_time'), true) === (count(array_filter($ph, fn($x) => $x['avg_time'] === null)) > 0));
$ck('flag do registro: só enabled === true liga; ausente/erro = legado', ObsExecucoes::fonteRegistroLigada(fn() => ['enabled' => true]) && !ObsExecucoes::fonteRegistroLigada(fn() => ['enabled' => 1])
    && !ObsExecucoes::fonteRegistroLigada(fn() => []) && !ObsExecucoes::fonteRegistroLigada(fn() => throw new RuntimeException('x')));
// revisão do VERDE (27/11): a decisão da flag fica 60 s no cache; erro não vai para o cache
$cache = []; $chamadas = 0; $res = function () use (&$chamadas) { $chamadas++; return ['enabled' => false, 'source' => 'disabled']; };
$ler = function ($k) use (&$cache) { return $cache[$k] ?? null; }; $gravar = function ($k, $v, $t) use (&$cache) { $cache[$k] = $v; return true; };
$a = ObsExecucoes::fonteRegistroLigada($res, $ler, $gravar); $b = ObsExecucoes::fonteRegistroLigada($res, $ler, $gravar);
$ck('flag: a 2ª requisição usa o cache (1 resolução só, sem abrir o MySQL)', $a === false && $b === false && $chamadas === 1 && $cache[ObsExecucoes::CHAVE_FLAG] === '0');
$cache2 = []; $ler2 = function ($k) use (&$cache2) { return $cache2[$k] ?? null; }; $grv2 = function ($k, $v, $t) use (&$cache2) { $cache2[$k] = $v; return true; };
$ck('flag: erro ao resolver = legado e NÃO vai para o cache', ObsExecucoes::fonteRegistroLigada(fn() => throw new RuntimeException('x'), $ler2, $grv2) === false && $cache2 === []);
$ck('tipos: o registro devolve números inteiros (o legado, texto do PDO emulado); a tela usa Number()/formatters', is_int($sj2[0]['total_executions']));
$eh = (string) file_get_contents(dirname(__DIR__, 2) . '/api/monitoring/executions_hourly.php');
$ck('executions_hourly: troca só pela flag, cache separado, registro fora = 503', str_contains($eh, 'ObsConsumidor::ligado()') && str_contains($eh, "'obs:' . \$CACHE_KEY") && str_contains($eh, "503, ['fonte' => 'registro_execucoes'"));
// revisão do AZUL (27/11): I1 e C1
$o->iniciar('bling.pedidos', '-', $T('07:00:00'), 1, 600, $T('07:00:00'));   // o processo cai sem encerrar
$ck('I1 · posse vencida NÃO bloqueia: iniciar 2 h depois (sem vigiar) interrompe a antiga e roda', $o->iniciar('bling.pedidos', '-', $T('09:00:00'), 1, 600, $T('09:00:00'))
    && $o->historico('bling.pedidos')[1]['error_code'] === 'interrompida' && $o->historico('bling.pedidos')[0]['status'] === 'running');
$ck('I1 · posse ainda VÁLIDA continua bloqueando (outra execução em andamento)', !$o->iniciar('bling.pedidos', '-', $T('09:05:00'), 1, 600, $T('09:05:00')));
$root->exec("USE $ZZ"); $root->exec(file_get_contents(dirname(__DIR__, 2) . '/scripts/obs/migracao-obs001-execucoes-volta.sql'));
$guardadas = (int) $root->query("SELECT COUNT(*) FROM {$ZZ}.obs_execucao__volta_obs001")->fetchColumn();
$ck('C1 · a volta NÃO apaga: renomeia (histórico guardado) e libera os nomes', $guardadas > 0 && (int) $root->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '{$ZZ}' AND table_name = 'obs_execucao'")->fetchColumn() === 0);
$root->exec($sql); $denovo = true; try { $root->exec(file_get_contents(dirname(__DIR__, 2) . '/scripts/obs/migracao-obs001-execucoes-volta.sql')); $denovo = false; } catch (PDOException) {}
$ck('C1 · repetir a volta com a cópia anterior presente → falha e NADA muda (a cópia antiga continua)', $denovo && (int) $root->query("SELECT COUNT(*) FROM {$ZZ}.obs_execucao__volta_obs001")->fetchColumn() === $guardadas);
$fonte = (string) file_get_contents(dirname(__DIR__, 2) . '/api/obs/ObsExecucoes.php');
$ddl = preg_replace(["/--[^\n]*/", "/COMMENT\s+'[^']*'/"], '', $sql);
$cols = $pdo->query("SELECT GROUP_CONCAT(column_name, ':', data_type) FROM information_schema.columns WHERE table_schema = '{$ZZ}' AND table_name = 'obs_execucao'")->fetchColumn();
$ck('sem coluna de texto livre (payload/mensagem/url/text) no registro', !preg_match('/payload|mensagem|url|message|nota/i', $ddl) && !preg_match('/:(text|mediumtext|longtext|json|blob)/i', (string) $cols), (string) $cols);
echo "teste-obs001-execucoes: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
