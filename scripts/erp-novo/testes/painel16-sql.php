<?php
// ERP novo — painel 16 (Fornecedor 360) pela camada NOVA contra um MySQL de TESTE sintético (AZUL, 26/11 noite), com o aceite do CP-003
// (ChatGPT, LOTE7): NENHUM dado bancário ou PIX na resposta (nem campo, nem contagem, nem alerta); total pago e média = null (suspensos);
// requisições sem canceladas; fornecedor de entidade excluída fora; dois subtipos vigentes NÃO escolhem "o primeiro" (fornecedor aparece 1 vez,
// sem documento); status Atualizado/Desatualizado/Desconhecido; lista com total = itens e ordem estável (nome, id); detalhe inexistente = não ok.
declare(strict_types=1);
$db = getenv('KOALA_TESTE_DB');
if (!$db || !preg_match('/^esq_[a-z0-9_]+$/', $db)) { echo "[PULADO] painel16-sql: KOALA_TESTE_DB não definido\n"; exit(0); }
$raiz = realpath(__DIR__ . '/../../..');
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
$src = file_get_contents($raiz . '/api/modules/panels/panel-16/api.php');
eval(substr($src, strpos($src, 'function getKPIs(')));
$pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db", 'root', null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec("SET time_zone = '-03:00'");
$T = ['fin_payment_request', 'pty_supplier_telephone', 'pty_supplier_email', 'shr_contact', 'shr_address', 'pty_supplier', 'pty_person', 'pty_organization', 'pty_party_base', 'fin_bank_account_bank_data', 'fin_bank_account_pix_key'];
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
$pdo->exec("CREATE TABLE pty_party_base (id INT PRIMARY KEY, type VARCHAR(2), active TINYINT DEFAULT 1, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_organization (id INT PRIMARY KEY, entity_id INT, company_name VARCHAR(80), trade_name VARCHAR(80), cnpj VARCHAR(14), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_person (id INT PRIMARY KEY, entity_id INT, name VARCHAR(80), cpf VARCHAR(11), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_supplier (id INT PRIMARY KEY, entity_id INT, status VARCHAR(20), supplier_type VARCHAR(20), created_at DATETIME, updated_at DATETIME, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE shr_contact (id INT PRIMARY KEY, `key` VARCHAR(80), `default` TINYINT DEFAULT 0, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_supplier_email (supplier_id INT, contact_id INT)");
$pdo->exec("CREATE TABLE pty_supplier_telephone (supplier_id INT, contact_id INT)");
$pdo->exec("CREATE TABLE shr_address (id INT PRIMARY KEY, entity_id INT, street VARCHAR(60), number VARCHAR(10), neighborhood VARCHAR(40), city VARCHAR(40), state VARCHAR(2), zip_code VARCHAR(9), `default` TINYINT DEFAULT 0, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE fin_payment_request (id INT PRIMARY KEY, supplier_id INT, total DECIMAL(10,2), status VARCHAR(30), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE fin_bank_account_bank_data (id INT PRIMARY KEY, supplier_id INT, beneficiary VARCHAR(60), branch VARCHAR(10), bank VARCHAR(20), account_number VARCHAR(20), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE fin_bank_account_pix_key (id INT PRIMARY KEY, supplier_id INT, pix_key VARCHAR(60), active TINYINT DEFAULT 1, deleted TINYINT DEFAULT 0)");
// 1 PJ atualizado · 2 PF desatualizado · 3 PJ com DOIS subtipos vigentes · 4 entidade EXCLUÍDA · 5 status desconhecido · 6 fornecedor excluído
$pdo->exec("INSERT INTO pty_party_base VALUES (1,'PJ',1,0),(2,'PF',1,0),(3,'PJ',1,0),(4,'PJ',1,1),(5,'PJ',0,0),(6,'PJ',1,0)");
$pdo->exec("INSERT INTO pty_organization VALUES (1,1,'Forn Um Ltda','Forn Um','11111111000111',0),(3,3,'Forn Tres A','Tres','33333333000133',0),(30,3,'Forn Tres B','Tres B','33333333000134',0),(4,4,'Forn Quatro','Quatro','44444444000144',0),(5,5,'Forn Cinco','Cinco','55555555000155',0),(6,6,'Forn Seis','Seis','66666666000166',0)");
$pdo->exec("INSERT INTO pty_person VALUES (2,2,'Pessoa Dois','00000000002',0)");
$pdo->exec("INSERT INTO pty_supplier VALUES (1,1,'UP_TO_DATE','SERVICE',NOW(),NOW(),0),(2,2,'OUTDATED','SERVICE',NOW(),NOW(),0),(3,3,'UP_TO_DATE','SERVICE',NOW(),NOW(),0),(4,4,'UP_TO_DATE','SERVICE',NOW(),NOW(),0),(5,5,'PENDING_REVIEW','SERVICE',NOW(),NOW(),0),(6,6,'UP_TO_DATE','SERVICE',NOW(),NOW(),1)");
$pdo->exec("INSERT INTO shr_address VALUES (1,1,'R','1','B','Cidade','SP','00000-000',1,0),(2,2,'R','2','B','Cidade','RJ','00000-000',1,0)");
$pdo->exec("INSERT INTO fin_payment_request VALUES (1,1,100,'PAID',0),(2,1,100,'PARTIALLY_PAID',0),(3,1,100,'CANCELLED',0),(4,1,100,'ACCOUNTS_CANCELLED',0),(5,1,100,'PENDING',1),(6,2,50,'PENDING',0)");
$pdo->exec("INSERT INTO fin_bank_account_bank_data VALUES (1,1,'Titular Ficticio','0001','Banco X','12345-6',0)");
$pdo->exec("INSERT INTO fin_bank_account_pix_key VALUES (1,1,'pix-ficticio@teste.local',1,0),(2,2,'pix-dois@teste.local',1,0)");
$f = []; $n = 0;
$ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$semBanco = static function ($x): bool { $j = json_encode($x, JSON_UNESCAPED_UNICODE); return !preg_match('/pix|agencia|conta_bancaria|"contas"|titular|com_pix|sem_conta|Titular Ficticio|12345-6/i', $j); };
$k = getKPIs($pdo)['data'];
$ok($k['kpis']['total'] === 4, 'KPIs: 4 fornecedores (sem o de entidade excluída e sem o fornecedor excluído) · veio ' . $k['kpis']['total']);
$ok($k['kpis']['total_pago'] === null && $k['kpis']['media_por_fornecedor'] === null, 'KPIs: total pago e média = null (suspensos até a fonte de baixas)');
$ok($k['kpis']['total_requisicoes'] === 3, 'KPIs: requisições sem canceladas e sem excluídas (2 do 1 + 1 do 2) · veio ' . $k['kpis']['total_requisicoes']);
$ok($semBanco($k), 'KPIs: nenhum dado/contagem bancária ou PIX');
$l = getListagem($pdo, '', '', '', '', 50, 0)['data'];
$ids = array_map(static fn ($r) => (int)$r['id'], $l['fornecedores']);
$ok((int)$l['pagination']['total'] === count($ids) && count($ids) === 4 && count(array_unique($ids)) === 4, 'lista: total = itens = 4, sem duplicar o fornecedor de 2 subtipos');
$tres = array_values(array_filter($l['fornecedores'], static fn ($r) => (int)$r['id'] === 3))[0] ?? null;
$ok($tres !== null && $tres['cnpj'] === null, 'dois subtipos vigentes: o fornecedor aparece 1 vez SEM escolher o documento de um deles');
$cinco = array_values(array_filter($l['fornecedores'], static fn ($r) => (int)$r['id'] === 5))[0] ?? null;
$ok(($cinco['status'] ?? null) === 'Desconhecido', 'status fora da lista = Desconhecido (não "Desatualizado")');
$um = array_values(array_filter($l['fornecedores'], static fn ($r) => (int)$r['id'] === 1))[0] ?? null;
$ok(($um['status'] ?? null) === 'Atualizado' && is_array($um) && array_key_exists('total_pago', $um) && $um['total_pago'] === null, 'Atualizado e total_pago null na linha');
$ok($semBanco($l), 'lista: nenhum PIX/conta');
$ok(in_array('Desconhecido', $l['filters']['status'], true), 'filtro de status inclui Desconhecido');
$p1 = getListagem($pdo, '', '', '', '', 2, 0)['data']['fornecedores']; $p2 = getListagem($pdo, '', '', '', '', 2, 2)['data']['fornecedores'];
$pag = array_merge(array_map(static fn ($r) => (int)$r['id'], $p1), array_map(static fn ($r) => (int)$r['id'], $p2));
$ok($pag === $ids, 'paginação 2+2 = a lista inteira, mesma ordem (nome, id)');
$ok(count(getListagem($pdo, '', 'Atualizado', '', '', 50, 0)['data']['fornecedores']) === 2, 'filtro Atualizado = 2');
$d = getFornecedor360($pdo, 1);
$ok(($d['ok'] ?? false) && $semBanco($d), 'detalhe do 1: ok e sem banco/PIX/titular (whitelist)');
$ok(!in_array('Sem conta bancaria cadastrada', $d['data']['alertas'] ?? [], true), 'detalhe: sem alerta derivado de conta bancária');
$ok((getFornecedor360($pdo, 4)['ok'] ?? true) === false && (getFornecedor360($pdo, 999)['ok'] ?? true) === false, 'detalhe de entidade excluída / inexistente = não ok (404 no controlador)');
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
if ($f) { echo "[ERRO] painel16-sql:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   painel16-sql: $n verificações (CP-003: sem banco/PIX, pago suspenso, requisições sem canceladas, entidade excluída fora, subtipo duplo sem escolha, status desconhecido, paginação estável, 404)\n";
