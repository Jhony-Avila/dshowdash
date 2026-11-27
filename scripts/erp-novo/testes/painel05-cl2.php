<?php
// painel05-cl2.php (VINHO, 27/11 · UARPS v4 CL2): SEM a permissão financeira, a receita não decide membros nem ordem (top 5 por tipo, vendedores, mapa por UF).
// conferências do CP-002 (ChatGPT, LOTE7): ranking por quantidade/valor/ticket com líderes DIFERENTES na mesma amostra; ranking pela data de
// GANHO; lista e exportação com o MESMO predicado; desempate pelo id; estatística do detalhe INTEGRAL (não só os 50 exibidos); mapa sem
// divisão por zero. Extrai as funções de api/modules/panels/panel-05/api.php (as mesmas da produção). Só com KOALA_TESTE_DB=<banco esq_*>.
declare(strict_types=1);
$db = getenv('KOALA_TESTE_DB');
if (!$db || !preg_match('/^esq_[a-z0-9_]+$/', $db)) { echo "[PULADO] painel05-sql: KOALA_TESTE_DB não definido\n"; exit(0); }
$raiz = realpath(__DIR__ . '/../../..');
if (!defined('P05_SEM_FIN')) { define('P05_SEM_FIN', 'Sem permissão para dados financeiros.'); }
if (!function_exists('p05_fin')) { function p05_fin(): bool { return ($GLOBALS['FIN'] ?? false) === true; } }
$GLOBALS['FIN'] = true;
require $raiz . '/api/core/helpers/InputValidator.php';
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
if (!class_exists('RedisHelper')) { final class RedisHelper { public static function tryGetCache(string $k) { return null; } public static function setCache(string $k, $v, $t = 0) { return true; } } }
if (!class_exists('ApiResponse')) { final class ApiResponse { public const ERR_VALIDATION_ERROR = 'VALIDATION_ERROR'; public static array $ultimo = []; public static function error(string $c, int $h = 400, ?array $m = null): void { self::$ultimo = [$c, $h, $m]; } } }
$src = file_get_contents($raiz . '/api/modules/panels/panel-05/api.php');
eval(substr($src, strpos($src, 'function getKPIs(')));
$pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=$db", 'root', null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$pdo->exec("SET time_zone = '-03:00'");
$T = ['fin_accounts_receivable_installment', 'fin_accounts_receivable', 'qte_quote', 'shr_address', 'pty_customer', 'pty_person', 'pty_organization', 'pty_party_base', 'sys_user'];
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
$pdo->exec("CREATE TABLE sys_user (id INT PRIMARY KEY, name VARCHAR(60))");
$pdo->exec("CREATE TABLE pty_party_base (id INT PRIMARY KEY, type VARCHAR(2), active TINYINT DEFAULT 1, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_organization (id INT PRIMARY KEY, entity_id INT, company_name VARCHAR(80), trade_name VARCHAR(80), nickname VARCHAR(80), cnpj VARCHAR(14), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_person (id INT PRIMARY KEY, entity_id INT, name VARCHAR(80), cpf VARCHAR(11), deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE pty_customer (id INT PRIMARY KEY, entity_id INT, created_at DATETIME, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE shr_address (id INT PRIMARY KEY, entity_id INT, city VARCHAR(40), state VARCHAR(2), `default` TINYINT DEFAULT 0, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE qte_quote (id INT PRIMARY KEY, customer_id INT, salesperson_id INT, status VARCHAR(20), business_type VARCHAR(20), total_value DECIMAL(14,2), won_at DATETIME NULL, created_at DATETIME, loss_reason VARCHAR(40) NULL, lost_at DATETIME NULL, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE fin_accounts_receivable (id INT PRIMARY KEY, customer_id INT, deleted TINYINT DEFAULT 0)");
$pdo->exec("CREATE TABLE fin_accounts_receivable_installment (id INT PRIMARY KEY, accounts_receivable_id INT, value DECIMAL(14,2), due_date DATE, status VARCHAR(30), deleted TINYINT DEFAULT 0)");
$pdo->exec("INSERT INTO sys_user VALUES (1,'Vendedor 1'),(2,'Vendedor 2')");
// clientes PJ 1..4 (o 4 inativo) + PF 5 (o legado/compat conta só PJ — decisão W-5 pendente)
foreach ([1, 2, 3, 4] as $i) { $pdo->exec("INSERT INTO pty_party_base VALUES ($i,'PJ'," . ($i === 4 ? 0 : 1) . ",0)"); $pdo->exec("INSERT INTO pty_organization VALUES ($i,$i,'Razao $i','Cliente $i','', '0000000000000$i',0)"); $pdo->exec("INSERT INTO pty_customer VALUES ($i,$i,'2026-0$i-10 12:00:00',0)"); $pdo->exec("INSERT INTO shr_address VALUES ($i,$i,'Cidade','" . ($i < 3 ? 'SP' : 'RJ') . "',1,0)"); }
$pdo->exec("INSERT INTO pty_party_base VALUES (5,'PF',1,0)"); $pdo->exec("INSERT INTO pty_person VALUES (5,5,'Pessoa Cinco','00000000005',0)"); $pdo->exec("INSERT INTO pty_customer VALUES (5,5,'2026-05-10 12:00:00',0)");
$h = date('Y-m-d H:i:s', strtotime('-10 days')); $antigo = date('Y-m-d H:i:s', strtotime('-400 days'));
// líderes DIFERENTES: valor = cliente 1 (1 orçamento grande) · quantidade = cliente 2 (3 pequenos) · ticket = cliente 1 também? não: cliente 3 tem 1 de 6000 > média do 1? ajustado abaixo
$q = $pdo->prepare("INSERT INTO qte_quote VALUES (?,?,?,?,?,?,?,?,?,?,0)");
$q->execute([1, 1, 1, 'WON', 'SALE', 10000, $h, $antigo, null, null]);   // criado há 400 dias, GANHO há 10 → entra no ranking 12m só pela data de ganho
$q->execute([2, 1, 1, 'WON', 'SALE', 2000, $h, $h, null, null]);
foreach ([3, 4, 5] as $id) { $q->execute([$id, 2, 2, 'WON', 'RENTAL', 1000, $h, $h, null, null]); }
$q->execute([6, 3, 2, 'WON', 'SALE', 7000, $h, $h, null, null]);
$q->execute([7, 3, 2, 'LOST', 'SALE', 500, null, $h, 'PRICE', $h]);
for ($id = 100; $id < 160; $id++) { $q->execute([$id, 4, 1, 'IN_PROGRESS', 'SALE', 1, null, $h, null, null]); }   // 60 orçamentos: estatística integral > 50 exibidos
$q->execute([160, 4, 1, 'WON', 'SALE', 999, $h, $antigo, null, null]);
$pdo->exec("INSERT INTO fin_accounts_receivable VALUES (1,1,0),(2,3,0)");
$pdo->exec("INSERT INTO fin_accounts_receivable_installment VALUES (1,1,500,'2026-10-01','OVERDUE',0),(2,1,700,'2027-01-01','OPEN',0),(3,2,300,'2026-09-01','PARTIAL',0),(4,2,999,'2026-09-01','RECEIVED',0)");
// fixture que SEPARA receita × quantidade: 4 ganhos pequenos de RENTAL pelo vendedor 1 (RENTAL passa a ter MAIS ganhos e MENOS receita que SALE;
// o vendedor 1 passa a ter mais ganhos e menos receita que o 2 nos últimos 12 meses)
foreach ([200, 201, 202, 203] as $id) { $q->execute([$id, 2, 1, 'WON', 'RENTAL', 1, $h, $h, null, null]); }
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$GLOBALS['FIN'] = true;
$tc = getCharts($pdo)['data']['por_tipo']; $vc = getVendedores($pdo)['data']; $hc = getHeatmap($pdo)['data'];
$ok(array_column($tc, 'tipo')[0] === 'SALE' && $tc[0]['receita'] !== null, 'com a permissão: por_tipo ordenado pela receita (SALE primeiro) · ' . json_encode(array_column($tc, 'tipo')));
$ok($vc[0]['vendedor'] === 'Vendedor 2' && $vc[0]['receita'] !== null, 'com a permissão: vendedores pela receita (Vendedor 2 primeiro) · ' . json_encode(array_column($vc, 'vendedor')));
$GLOBALS['FIN'] = false;
$tn = getCharts($pdo)['data']['por_tipo']; $vn = getVendedores($pdo)['data']; $hn = getHeatmap($pdo)['data'];
$ok(array_column($tn, 'tipo')[0] === 'RENTAL' && array_filter($tn, fn($x) => $x['receita'] !== null) === [], 'CL2 sem permissão: por_tipo pela QUANTIDADE (RENTAL primeiro) e receita null · ' . json_encode(array_column($tn, 'tipo')));
$ok($vn[0]['vendedor'] === 'Vendedor 1' && array_filter($vn, fn($x) => $x['receita'] !== null || $x['ticket_medio'] !== null) === [], 'CL2 sem permissão: vendedores pelos GANHOS (Vendedor 1 primeiro), receita/ticket null · ' . json_encode(array_column($vn, 'vendedor')));
$cl = array_map('intval', array_column($hn, 'clientes')); $s = $cl; rsort($s);
$ok($cl === $s && array_filter($hn, fn($x) => $x['receita'] !== null || $x['intensidade_receita'] !== null) === [], 'CL2 sem permissão: mapa por UF ordenado por CLIENTES, receita e intensidade null · ' . json_encode($cl));
$ok(array_column($tn, 'qtd') == array_column(getCharts($pdo)['data']['por_tipo'], 'qtd'), 'CL2: a mesma resposta sem permissão é estável (desempate determinístico)');
// a resposta sem permissão é IDÊNTICA se só as receitas mudarem (controle independente: multiplica todos os valores por 7)
$pdo->exec("UPDATE qte_quote SET total_value = total_value * 7 + 3");
$ok(getCharts($pdo)['data']['por_tipo'] === $tn && getVendedores($pdo)['data'] === $vn && getHeatmap($pdo)['data'] === $hn, 'CL2: sem permissão, trocar SÓ as receitas não muda nada na resposta (membros, ordem, campos)');
$GLOBALS['FIN'] = true;
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
if ($f) { echo "[ERRO] painel05-cl2:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   painel05-cl2: $n verificações (sem a permissão financeira a receita não escolhe membros nem ordem; trocar só as receitas não muda a resposta)\n";
