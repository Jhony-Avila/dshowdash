<?php
declare(strict_types=1);
// teste-previa-repositorio.php — C1: fontes → lote → linhas → decisão → seleção, no MySQL LOCAL (bancos temporários zz_c1_*; criados e removidos aqui).
require_once __DIR__ . '/../../api/cadastro/PreviaRepositorio.php';
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . "$n" . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (['zz_c1_pipe', 'ds_prod', 'consultar_io'] as $db) if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '$db'")->fetchColumn()) { echo "banco $db já existe aqui — teste abortado (nada tocado)\n"; exit(2); }
register_shutdown_function(fn() => $root->exec('DROP DATABASE IF EXISTS zz_c1_pipe; DROP DATABASE IF EXISTS ds_prod; DROP DATABASE IF EXISTS consultar_io'));
$K = ['4022' => str_repeat('a', 40), '4025' => str_repeat('b', 40), '4036' => str_repeat('c', 40), 'p' => str_repeat('d', 40)];
$root->exec("CREATE DATABASE zz_c1_pipe; USE zz_c1_pipe;
 CREATE TABLE pipe_custom_fields (pipedrive_id BIGINT, entity VARCHAR(20), field_key VARCHAR(40), name VARCHAR(100));
 INSERT INTO pipe_custom_fields VALUES (4022,'organization','{$K['4022']}','CNPJ/CPF'),(4025,'organization','{$K['4025']}','Razão Social'),(4036,'organization','{$K['4036']}','Nome Fantasia'),(4038,'organization','{$K['p']}','Id_Precifica');
 CREATE TABLE pipe_organizations (pipedrive_id BIGINT, name VARCHAR(100), custom_fields JSON, is_deleted TINYINT DEFAULT 0, is_active TINYINT DEFAULT 1, last_synced_at DATETIME DEFAULT NOW());
 INSERT INTO pipe_organizations (pipedrive_id, name, custom_fields) VALUES
  (1,'Loja Um','{\"{$K['4022']}\":\"11.222.333/0001-81\",\"{$K['4025']}\":null,\"{$K['4036']}\":{\"value\":null}}'),
  (2,'Loja Dois','{\"{$K['4022']}\":null,\"{$K['p']}\":\"501\"}');
 CREATE TABLE pipe_deals (org_id BIGINT, status VARCHAR(10), won_time DATETIME, is_deleted TINYINT DEFAULT 0);
 INSERT INTO pipe_deals VALUES (1,'won','2026-11-20 10:00',0),(2,'won','2026-11-21 10:00',0);
 CREATE DATABASE ds_prod; CREATE TABLE ds_prod.pty_customer (id INT, entity_id INT); CREATE TABLE ds_prod.pty_organization (entity_id INT, cnpj VARCHAR(20), company_name VARCHAR(100), trade_name VARCHAR(100), deleted TINYINT DEFAULT 0);
 INSERT INTO ds_prod.pty_customer VALUES (500,1),(501,2); INSERT INTO ds_prod.pty_organization VALUES (1,'11222333000181','Loja Um Comércio Ltda','Loja Um',0),(2,'11444777000161','Dois SA','Dois',0);
 CREATE DATABASE consultar_io CHARACTER SET latin1; CREATE TABLE consultar_io.cnpj_detalhes (cnpj VARCHAR(14), razao_social VARCHAR(100), nome_fantasia VARCHAR(100), json_completo TEXT, data_consulta_api DATETIME) CHARACTER SET latin1;
 INSERT INTO consultar_io.cnpj_detalhes VALUES ('11222333000181','LOJA UM COMÉRCIO LTDA','','{\"cnpj\":\"11222333000181\",\"nome_fantasia\":\"LOJA UM\"}','2024-05-01'),('11444777000161','DOIS SA','DOIS',NULL,NULL);");
$root->exec(file_get_contents(__DIR__ . '/migracao-consultar-io-revisao.sql'));
$pipe = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_c1_pipe;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$rds = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=ds_prod;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$repo = new PreviaRepositorio($pipe, $rds);
$hash = fn() => [$pipe->query('SELECT MD5(GROUP_CONCAT(pipedrive_id, custom_fields ORDER BY pipedrive_id)) FROM pipe_organizations')->fetchColumn(),
                 $rds->query('SELECT MD5(GROUP_CONCAT(cnpj, company_name, trade_name ORDER BY entity_id)) FROM ds_prod.pty_organization')->fetchColumn(),
                 $rds->query('SELECT MD5(GROUP_CONCAT(cnpj, razao_social ORDER BY cnpj)) FROM consultar_io.cnpj_detalhes')->fetchColumn()];
$antes = $hash();
$fo = $repo->fontes();
$ck('fontes: 3 ok; tipos do JSON lidos (nulo, objeto {value:null}); Id_Precifica; legado latin1 com acento íntegro',
    $fo['fontes']['pipedrive']['estado'] === 'ok' && $fo['fontes']['precifica']['estado'] === 'ok' && $fo['fontes']['legado']['estado'] === 'ok'
    && $fo['orgs'][0]['campos']['4025']['tipo'] === 'NULL' && $fo['orgs'][0]['campos']['4036']['tipo'] === 'OBJECT' && $fo['orgs'][1]['idprec'] === '501'
    && $fo['leg']['11222333000181']['razao'] === 'LOJA UM COMÉRCIO LTDA', json_encode($fo['fontes']));
$res = PreviaCadastral::montar($fo['orgs'], $fo['prec'], $fo['precCliente'], $fo['leg'], $fo['fontes'], ['ganhos', 'sem_cnpj_id_precifica'], '2026-11-26T17:10:00-03:00', $repo->decididas());
$repo->salvar($res, ['ganhos', 'sem_cnpj_id_precifica'], 75);
$lt = $repo->lote(null); $ls = $repo->linhas($lt['id'], ['filtro' => null, 'campo' => null, 'fila' => null, 'busca' => null, 'pagina' => 1, 'por_pagina' => 100]);
$by = []; foreach ($ls['itens'] as $x) $by[$x['org_id'] . '|' . $x['campo']] = $x;
$ck('lote salvo e relido; 3 linhas: razão (sugestão, Precifica × legado com mesma grafia em caixa), fantasia (legado_json confirmado), CNPJ da ficha sem documento',
    $lt['id'] === $res['lote']['id'] && $ls['total'] === 3 && $by['1|4025']['classificacao'] === 'sugestao' && $by['1|4036']['proposto']['origem'] === 'precifica'
    && $by['2|4022']['classificacao'] === 'sugestao' && $by['2|4022']['proposto']['valor'] === '11444777000161', json_encode(array_map(fn($x) => [$x['classificacao'], $x['proposto']], $by), JSON_UNESCAPED_UNICODE));
$ck('filtros: com_sugestao / fila / busca', $repo->linhas($lt['id'], ['filtro' => 'com_sugestao', 'campo' => null, 'fila' => 'sem_cnpj_id_precifica', 'busca' => 'dois', 'pagina' => 1, 'por_pagina' => 100])['total'] === 1);
$x = $by['1|4025']; $sempre = fn() => 'ok';
$d1 = $repo->decidir($lt['id'], $x['id'], $x['evidencia_versao'], 'aprovar', 'Texto que o Jhony não viu', 'precifica', 75, $sempre);
$d2 = $repo->decidir($lt['id'], $x['id'], $x['evidencia_versao'], 'aprovar', $x['proposto']['valor'], 'precifica', 75, $sempre);
$ck('decisão: grafia não vista → 400; a grafia vista → 200', $d1['http'] === 400 && $d2['http'] === 200);
$sel = $repo->selecao($lt['id']);
$ck('seleção: "Aplicar 1 campo em 1 estabelecimento" com o destino', $sel['campos'] === 1 && $sel['estabelecimentos'] === 1 && $sel['itens'][0]['org_id'] === 1);
$d3 = $repo->decidir($lt['id'], $by['1|4036']['id'], $by['1|4036']['evidencia_versao'], 'aprovar', 'Loja Um', 'precifica', 75, fn() => 'mudou');
$ck('evidência mudou no retrato atual → 409 evidencia_mudou (seleção expira)', $d3['http'] === 409 && $d3['code'] === 'evidencia_mudou');
// RC-008 · F11/F12 no servidor, 503 transitório e revalidação DIRECIONADA real (sem a prévia inteira)
$cnt = fn() => (int) $rds->query('SELECT COUNT(*) FROM consultar_io.revisao_decisao')->fetchColumn();
$rds->exec("SET SESSION TRANSACTION READ WRITE");
$xb = $by['1|4036']; $xb['classificacao'] = 'identidade_duvidosa';
$rds->prepare("UPDATE consultar_io.revisao_linha SET linha_json = ? WHERE lote_id = ? AND linha_id = ?")->execute([json_encode($xb, JSON_UNESCAPED_UNICODE), $lt['id'], $xb['id']]);
$n0 = $cnt(); $d4 = $repo->decidir($lt['id'], $xb['id'], $xb['evidencia_versao'], 'aprovar', $xb['grafias'][0]['valor'], $xb['grafias'][0]['origem'], 75, $sempre);
$ck('F11/F12 · POST direto de identidade bloqueada com grafia válida → 409 aprovacao_bloqueada, sem gravar decisão', $d4['http'] === 409 && $d4['code'] === 'aprovacao_bloqueada' && $cnt() === $n0);
$n1 = $cnt(); $d5 = $repo->decidir($lt['id'], $x['id'], $x['evidencia_versao'], 'aprovar', $x['proposto']['valor'], 'precifica', 75, fn() => 'indisponivel');
$st = $rds->prepare("SELECT COALESCE(SUM(expirada), -1) FROM consultar_io.revisao_decisao WHERE linha_id = ?"); $st->execute([$x['id']]); $exp = (int) $st->fetchColumn();
$ck('fonte transitória fora → 503, a decisão JÁ TOMADA não expira e nada é gravado', $d5['http'] === 503 && $cnt() === $n1 && $exp === 0 && $repo->selecao($lt['id'])['campos'] === 1);
$ck('revalidação direcionada (MySQL local): linha intacta = ok (fila ganhos e fila sem_cnpj)', $repo->revalidar($x) === 'ok' && $repo->revalidar($by['2|4022']) === 'ok');
$pipe->exec('SET SESSION TRANSACTION READ WRITE'); $pipe->exec("UPDATE pipe_organizations SET custom_fields = JSON_SET(custom_fields, '$.\"{$K['4025']}\"', 'Outra Razão') WHERE pipedrive_id = 1");
$ck('revalidação direcionada: destino preenchido desde a prévia = mudou', $repo->revalidar($x) === 'mudou');
$pipe->exec('SET SESSION TRANSACTION READ WRITE'); $pipe->exec("UPDATE pipe_organizations SET custom_fields = JSON_SET(custom_fields, '$.\"{$K['4025']}\"', CAST('null' AS JSON)) WHERE pipedrive_id = 1");
$ck('revalidação direcionada: RDS inacessível = indisponivel (não "mudou")', (new PreviaRepositorio($pipe, new class('mysql:unix_socket=/run/mysqld/mysqld.sock', 'root', '') extends PDO { public function prepare(string $q, array $o = []): PDOStatement|false { throw new PDOException('timeout simulado'); } }))->revalidar($x) === 'indisponivel');
$pipe->exec("SET SESSION TRANSACTION READ WRITE"); $pipe->exec("INSERT INTO pipe_organizations (pipedrive_id, name, custom_fields) VALUES (3, 'Nova', '{\"{$K['4022']}\":\"11444777000161\",\"{$K['4025']}\":null}')");
$pipe->exec("INSERT INTO pipe_deals VALUES (3,'won','2026-11-26 09:00',0)");
$ck('F14 · ranking mudou (CNPJ novo, ganho mais recente, entrou na frente) e a evidência da linha está intacta → continua ok (sem corte na revalidação)', $repo->revalidar($x) === 'ok');
$pipe->exec("SET SESSION TRANSACTION READ WRITE"); $pipe->exec("DELETE FROM pipe_organizations WHERE pipedrive_id = 3"); $pipe->exec("DELETE FROM pipe_deals WHERE org_id = 3");
$res2 = PreviaCadastral::montar($fo['orgs'], $fo['prec'], $fo['precCliente'], $fo['leg'], $fo['fontes'], ['ganhos', 'sem_cnpj_id_precifica'], '2026-11-26T17:20:00-03:00', $repo->decididas());
$ck('lote seguinte: o caso decidido com a mesma evidência sai antes do corte', count($res2['linhas']) === 2);
$ck('nenhuma escrita nas fontes (Pipedrive local, Precifica e legado cnpj_detalhes intactos)', $hash() === $antes);
$fo1 = (new PreviaRepositorio($pipe, $rds, 1))->fontes();
$ck('leitura PAGINADA (páginas de 1 linha) = a mesma leitura de uma vez', $fo1['prec'] === $fo['prec'] && $fo1['leg'] === $fo['leg'] && $fo1['precCliente'] === $fo['precCliente']);
$tmp = tempnam(sys_get_temp_dir(), 'cnf'); file_put_contents($tmp, "[mysql]\nuser=errado\n[client]\nuser=dshow-dash\npassword=\"S3nh@ X\"\nhost=rds.exemplo\nport=3307\n");
$c = CadastroConexoes::lerCnf($tmp); file_put_contents($tmp, "[client]\nuser=u\npassword=p\n");
$semHost = null; try { CadastroConexoes::rds($tmp); } catch (RuntimeException $e) { $semHost = $e->getMessage(); }
unlink($tmp);
$ck('credencial do CRED-C1: [client] lido (aspas removidas, outra seção ignorada); sem host → erro claro, sem conectar', $c['user'] === 'dshow-dash' && $c['password'] === 'S3nh@ X'
    && $c['host'] === 'rds.exemplo' && $c['port'] === '3307' && $semHost === 'credencial_rds_sem_host');
$tmp = tempnam(sys_get_temp_dir(), 'cnf'); file_put_contents($tmp, "[client]\nuser=dshow-dash\npassword=p1\n\n[client]\nhost=10.0.0.9\nport=3306\nprotocol=TCP\nssl-mode=DISABLED\n");
$c2 = CadastroConexoes::lerCnf($tmp); file_put_contents($tmp, "[client]\nuser=u\npassword=p\nhost=h\nssl-mode=VERIFY_CA\n");
$semCa = null; try { CadastroConexoes::rds($tmp); } catch (RuntimeException $e) { $semCa = $e->getMessage(); } unlink($tmp);
$ck('CRED-C1 real: os DOIS blocos [client] são somados (user/password do app + host/porta/ssl-mode); VERIFY_CA sem CA → recusa antes de conectar',
    $c2['user'] === 'dshow-dash' && $c2['password'] === 'p1' && $c2['host'] === '10.0.0.9' && $c2['ssl-mode'] === 'DISABLED' && $semCa === 'credencial_rds_sem_ca');
echo "teste-previa-repositorio: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
