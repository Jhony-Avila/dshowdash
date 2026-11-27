<?php
// ERP novo — TODAS as consultas do painel 05 (Cliente 360) pela camada NOVA contra um MySQL de TESTE sintético (AZUL, 26/11 noite), com as
// conferências do CP-002 (ChatGPT, LOTE7): ranking por quantidade/valor/ticket com líderes DIFERENTES na mesma amostra; ranking pela data de
// GANHO; lista e exportação com o MESMO predicado; desempate pelo id; estatística do detalhe INTEGRAL (não só os 50 exibidos); mapa sem
// divisão por zero. Extrai as funções de api/modules/panels/panel-05/api.php (as mesmas da produção). Só com KOALA_TESTE_DB=<banco esq_*>.
declare(strict_types=1);
$db = getenv('KOALA_TESTE_DB');
if (!$db || !preg_match('/^esq_[a-z0-9_]+$/', $db)) { echo "[PULADO] painel05-sql: KOALA_TESTE_DB não definido\n"; exit(0); }
$raiz = realpath(__DIR__ . '/../../..');
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
$f = []; $n = 0;
$ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$v = static fn (array $x): InputValidator => new InputValidator($x);
$run = static function (string $nome, callable $fn) use (&$f, &$n) { $n++; try { $r = $fn(); if (!is_array($r) || ($r['ok'] ?? true) === false) { $f[] = "$nome: ok=false"; } return $r; } catch (Throwable $e) { $f[] = "$nome: " . get_class($e) . ' ' . substr($e->getMessage(), 0, 150); return null; } };
foreach (['kpis' => fn () => getKPIs($pdo), 'charts' => fn () => getCharts($pdo), 'top' => fn () => getTopClientes($pdo, $v([]), 60), 'vendedores' => fn () => getVendedores($pdo),
          'insights' => fn () => getInsights($pdo), 'funil' => fn () => getFunil($pdo), 'metrics' => fn () => getMetricsAvancadas($pdo), 'churn' => fn () => getChurnRisk($pdo),
          'heatmap' => fn () => getHeatmap($pdo), 'search' => fn () => searchClientes($pdo, $v(['q' => 'Cliente'])), 'compare' => fn () => getComparativo($pdo, $v([])),
          'list' => fn () => getClientesList($pdo, $v([])), 'detalhe' => fn () => getCliente360($pdo, 4)] as $nome => $fn) { $run("painel05 $nome", $fn); }
// CP-002: ranking — líderes por medida
$lider = static function (string $tipo) use ($pdo, $v, &$f) { try { $r = getRanking($pdo, $v(['tipo' => $tipo, 'periodo' => '12m']), 60)['data']['items']; return [(int)($r[0]['id'] ?? 0), $r]; } catch (Throwable $e) { $f[] = "painel05 ranking $tipo: " . substr($e->getMessage(), 0, 160); return [0, []]; } };
[$lv, $rv] = $lider('receita'); [$lq] = $lider('quantidade'); [$lt] = $lider('ticket');
$ok($lv === 1, "ranking por VALOR: líder = cliente 1 (12.000) · veio $lv");
$ok($lq === 2, "ranking por QUANTIDADE: líder = cliente 2 (3 ganhos) · veio $lq");
$ok($lt === 3 || $lt === 1, "ranking por TICKET: líder pelo AVG (cliente 3 = 7.000 · cliente 1 = 6.000) · veio $lt");
$ok($lt === 3, 'ranking por TICKET ≠ ranking por VALOR (o antigo usava SUM nos três)');
$ok(in_array(1, array_map(static fn ($r) => (int)$r['id'], $rv), true), 'ranking 12m pela data de GANHO inclui orçamento criado há 400 dias e ganho há 10');
// CP-002: detalhe com estatística integral
$d = getCliente360($pdo, 4)['data']['orcamentos'];
$ok(count($d['items']) === 50 && (int)$d['stats']['total'] === 61 && (int)$d['stats']['ganhos'] === 1, 'detalhe: 50 exibidos, estatística INTEGRAL (61 orçamentos, 1 ganho) · veio ' . json_encode($d['stats']));
// CP-002: lista e exportação com o mesmo predicado (filtro por UF) e desempate pelo id
$lista = getClientesList($pdo, $v(['uf' => 'SP', 'per_page' => '100']))['data'];
$ok((int)$lista['pagination']['total'] === count($lista['items']), 'lista filtrada: total = itens');
ob_start(); exportCSV($pdo, $v(['uf' => 'SP'])); $csv = ob_get_clean();
$linhas = array_values(array_filter(explode("\n", trim(preg_replace('/^\xEF\xBB\xBF/', '', $csv)))));
$ok(count($linhas) - 1 === count($lista['items']), 'exportação = mesma seleção da lista (mesmos filtros) · CSV ' . (count($linhas) - 1) . ' × lista ' . count($lista['items']));
$ok(!str_contains($csv, '0000000000000'), 'exportação sem documento (decisão conservadora do CP-002 até definir os campos)');
// mapa: sem divisão por zero (tudo zero)
$pdo->exec("UPDATE qte_quote SET total_value = 0");
$run('painel05 heatmap com receita zero (sem divisão por zero)', fn () => getHeatmap($pdo));
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
if ($f) { echo "[ERRO] painel05-sql:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   painel05-sql: $n verificações (as 15 ações pela camada nova + CP-002: rankings com líderes diferentes, data de ganho, detalhe integral, lista = exportação, sem divisão por zero)\n";
