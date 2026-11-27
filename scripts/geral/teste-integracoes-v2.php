<?php
declare(strict_types=1);
// teste-integracoes-v2.php — INT-001 (VINHO, 26/11 noite): GET /api/geral/v2/integracoes.php?v=2 (Central de Integrações), ADITIVO ao v1.
// MySQL LOCAL com banco temporário zz_int2 (criado e removido aqui); dados sintéticos; nenhum segredo.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/geral/GeralV2Integracoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zz_int2'")->fetchColumn()) { echo "zz_int2 já existe — abortado\n"; exit(2); }
$TMP = sys_get_temp_dir() . '/int2-' . bin2hex(random_bytes(4)); mkdir($TMP, 0700);
register_shutdown_function(function () use ($root, $TMP) { $root->exec('DROP DATABASE IF EXISTS zz_int2'); array_map('unlink', glob("$TMP/*") ?: []); @rmdir($TMP); });
$root->exec("CREATE DATABASE zz_int2; USE zz_int2;
 CREATE TABLE asaas_contas (conta VARCHAR(32) PRIMARY KEY, nome VARCHAR(120), estado VARCHAR(20), erro_codigo VARCHAR(40), ultima_tentativa DATETIME, ultima_sync_ok DATETIME);
 INSERT INTO asaas_contas VALUES ('zenthra','ZENTHRA LTDA','ok',NULL,'2026-11-26 21:37:00','2026-11-26 21:37:00'),('rovic','ROVIC ME','ok',NULL,'2026-11-26 22:01:00','2026-11-26 15:37:00');
 CREATE TABLE fin_pcf_snapshot (id INT AUTO_INCREMENT PRIMARY KEY, gerado_em DATETIME, estado VARCHAR(10), motivos VARCHAR(200));
 INSERT INTO fin_pcf_snapshot (gerado_em, estado, motivos) VALUES ('2026-11-27 00:40:00','ok',''),('2026-11-27 00:55:00','erro','timeout');
 CREATE TABLE pipe_accounts (status VARCHAR(20), is_active TINYINT); INSERT INTO pipe_accounts VALUES ('connected',1);
 CREATE TABLE pipe_sync_runs (id INT AUTO_INCREMENT PRIMARY KEY, entity VARCHAR(20), status VARCHAR(20), errors INT, started_at DATETIME, finished_at DATETIME);
 INSERT INTO pipe_sync_runs (entity,status,errors,started_at,finished_at) VALUES ('deals','completed',0,'2026-11-26 21:45:00','2026-11-26 21:46:00'),('activities','completed',0,'2026-11-26 21:45:00','2026-11-26 21:46:00'),('deals','failed',3,'2026-11-26 22:00:00','2026-11-26 22:00:30');
 CREATE TABLE gcal_accounts (id INT, user_id INT, is_active TINYINT, connection_status VARCHAR(20)); INSERT INTO gcal_accounts VALUES (1,75,1,'connected');
 CREATE TABLE gcal_calendars (account_id INT, calendar_id VARCHAR(40), deleted TINYINT); INSERT INTO gcal_calendars VALUES (1,'a',0),(1,'b',0),(1,'c',0);
 CREATE TABLE gcal_sync_state (account_id INT, calendar_id VARCHAR(40), status VARCHAR(20), last_sync_at DATETIME);
 INSERT INTO gcal_sync_state VALUES (1,'a','ok','2026-11-27 00:58:00'),(1,'b','ok','2026-11-27 00:50:00'),(1,'c','error','2026-11-26 10:00:00');");
$pdo = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_int2;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$AGORA = new DateTimeImmutable('2026-11-26 22:10:00', new DateTimeZone('America/Sao_Paulo'));   // 01:10 UTC
$seg = new RdSegredos($TMP);
$I = new GeralV2Integracoes(new GeralV2($pdo, $pdo, null, 75, $AGORA), $pdo, $AGORA, '', 'zz_int2', $seg);
$v2 = $I->listaV2(); $by = array_column($v2['integracoes'], null, 'id');
$ck('versao 2 + catálogo de 10 (7 do pacote + Google Analytics, Ads e Outlook), na ordem', $v2['versao'] === 2 && array_keys($by) === ['pipedrive', 'bling', 'google', 'asaas', 'precifica', 'rdstation', 'meta', 'google_analytics', 'google_ads', 'outlook'], json_encode(array_keys($by)));
$chaves = ['id', 'nome', 'recurso', 'estado', 'ultima_tentativa', 'ultimo_sucesso', 'cobertas', 'esperadas', 'erro', 'proximo_passo', 'acao'];
$todas = true; foreach ($v2['integracoes'] as $x) $todas = $todas && array_slice(array_keys($x), 0, 11) === $chaves && is_string($x['recurso']);
$estados = ['ok', 'atrasado', 'parcial', 'com_problema', 'aguardando', 'sem_acesso', 'nao_integrado', 'desconhecido'];
$ck('todas as linhas: as mesmas chaves, recurso preenchido e estado do vocabulário v2', $todas && array_diff(array_column($v2['integracoes'], 'estado'), $estados) === []);
$p = $by['pipedrive'];
$ck('Pipedrive: ultima_tentativa (22:00, a rodada que FALHOU) ≠ ultimo_sucesso (21:46)', $p['ultima_tentativa'] === '2026-11-26T22:00:00-03:00' && $p['ultimo_sucesso'] === '2026-11-26T21:46:00-03:00', json_encode($p, JSON_UNESCAPED_UNICODE));
$g = $by['google'];
$ck('Google: cobertura 2 de 3 calendários; parcial (o v1 diria com_problema)', $g['cobertas'] === 2 && $g['esperadas'] === 3 && $g['estado'] === 'parcial', json_encode($g, JSON_UNESCAPED_UNICODE));
$a = $by['asaas']; $ac = array_column($a['contas'] ?? [], null, 'conta');
$ck('Asaas: 1 de 2 empresas em dia → parcial; tentativa = a mais recente (22:01); contas com rótulo curto e estado próprio', $a['estado'] === 'parcial' && $a['cobertas'] === 1 && $a['esperadas'] === 2
    && $a['ultima_tentativa'] === '2026-11-26T22:01:00-03:00' && $ac['zenthra']['rotulo'] === 'Zenthra' && $ac['zenthra']['estado'] === 'ok' && $ac['rovic']['estado'] === 'atrasado', json_encode($a, JSON_UNESCAPED_UNICODE));
$pr = $by['precifica'];
$ck('Precifica: tentativa = a leitura que falhou (21:55) e último sucesso = a boa (21:40); cobertura null (sem prova)', $pr['ultima_tentativa'] === '2026-11-26T21:55:00-03:00' && $pr['ultimo_sucesso'] === '2026-11-26T21:40:00-03:00'
    && $pr['cobertas'] === null && $pr['estado'] === 'com_problema', json_encode($pr, JSON_UNESCAPED_UNICODE));
$ck('Bling sem conexão: sem horário inventado (null) e nunca "ok"', $by['bling']['ultima_tentativa'] === null && $by['bling']['estado'] !== 'ok');
$ck('GA, Ads e Outlook: desconhecido, tudo null, com o motivo — nunca "ok" sem prova', array_unique(array_map(fn($k) => $by[$k]['estado'], ['google_analytics', 'google_ads', 'outlook'])) === ['desconhecido']
    && $by['outlook']['ultimo_sucesso'] === null && $by['outlook']['cobertas'] === null && str_contains((string) $by['outlook']['erro'], 'desconhecido'));
$ck('Meta: nao_integrado; RD sem credenciais: aguardando, sem tentativa', $by['meta']['estado'] === 'nao_integrado' && $by['rdstation']['estado'] === 'aguardando' && $by['rdstation']['ultima_tentativa'] === null);
$v1 = $I->lista();
$ck('v1 INTOCADO (a Geral): sem versao, 7 linhas, sem os campos novos', !isset($v1['versao']) && count($v1['integracoes']) === 7 && !array_key_exists('ultima_tentativa', $v1['integracoes'][0]) && !array_key_exists('recurso', $v1['integracoes'][0]));
$j = json_encode($v2);
preg_match('/ZENTHRA LTDA|ROVIC ME|aact_|access_token|refresh_token|client_secret|"password"|"senha"/i', $j, $mm); $ck("nenhum segredo nem razão social na resposta (só rótulo curto)", $mm === [], json_encode($mm));
echo "teste-integracoes-v2: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
