<?php
// painel05-ex1.php (VINHO, 27/11 · UARPS v4 EX1): exportar exige o direito PRÓPRIO; valores só com o financeiro; a decisão vale a cada arquivo (revogação com a tela aberta).
// Mesma base fictícia do painel05-cl3 (copiada). Só com KOALA_TESTE_DB=<banco esq_*>.
declare(strict_types=1);
$db = getenv('KOALA_TESTE_DB');
if (!$db || !preg_match('/^esq_[a-z0-9_]+$/', $db)) { echo "[PULADO] painel05-ex1: KOALA_TESTE_DB não definido\n"; exit(0); }
$raiz = realpath(__DIR__ . '/../../..');
if (!defined('P05_SEM_FIN')) { define('P05_SEM_FIN', 'Sem permissão para dados financeiros.'); }
if (!function_exists('p05_fin')) { function p05_fin(): bool { return ($GLOBALS['FIN'] ?? false) === true; } }
$GLOBALS['FIN'] = true;
require $raiz . '/api/core/helpers/InputValidator.php';
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
if (!class_exists('RedisHelper')) { final class RedisHelper { public static function tryGetCache(string $k) { return null; } public static function setCache(string $k, $v, $t = 0) { return true; } } }
if (!class_exists('ApiResponse')) { final class ApiResponse { public const ERR_VALIDATION_ERROR = 'VALIDATION_ERROR'; public const ERR_NOT_AUTHORIZED = 'NOT_AUTHORIZED'; public static array $ultimo = []; public static function error(string $c, int $h = 400, ?array $m = null): void { self::$ultimo = [$c, $h, $m]; } } }
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
require_once $raiz . '/api/modules/panels/panel-05/escopo-cl3.php';
$v = static fn (array $x): InputValidator => new InputValidator($x);
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$GLOBALS['FIN'] = true;
$ids = static fn(array $l, string $k) => array_map('intval', array_column($l, $k));
$csvDe = static function () use ($pdo, $v): array { ApiResponse::$ultimo = []; ob_start(); exportCSV($pdo, $v([])); $c = ob_get_clean();
    $l = array_values(array_filter(explode("\n", trim(preg_replace('/^\xEF\xBB\xBF/', '', $c))))); return ['bytes' => strlen($c), 'linhas' => count($l), 'cab' => $l[0] ?? '', 'erro' => ApiResponse::$ultimo, 'csv' => $c]; };
// ── as 4 combinações exportar × financeiro (com a decisão do despachante) ──
foreach ([[false, false], [false, true], [true, false], [true, true]] as [$ex, $fin]) {
    $GLOBALS['FIN'] = $fin; $GLOBALS['P05_EXPORTAR'] = p05_pode_exportar(990075, fn() => true, fn($u, $t) => $ex && $t === P05_CAP_EXPORTAR);
    $r = $csvDe(); $nome = 'exportar=' . ($ex ? 'sim' : 'nao') . ' financeiro=' . ($fin ? 'sim' : 'nao');
    if (!$ex) $ok($r['bytes'] === 0 && ($r['erro'][1] ?? 0) === 403 && ($r['erro'][2]['motivo'] ?? '') === 'sem_permissao_exportar', "$nome: NENHUM arquivo (403), inclusive com o financeiro · " . json_encode([$r['bytes'], $r['erro']]));
    elseif (!$fin) $ok($r['linhas'] === 5 && !str_contains($r['cab'], 'Receita') && $r['erro'] === [], "$nome: só o cadastro (sem a coluna de valores) · " . $r['cab']);
    else $ok($r['linhas'] === 5 && str_contains($r['cab'], 'Receita_Gerada'), "$nome: cadastro + valores · " . $r['cab']);
}
// ── exportar sem consultar: negado = zero consultas (a conexão nem é usada) ──
$GLOBALS['P05_EXPORTAR'] = false; $GLOBALS['FIN'] = true;
$pdoQuebrado = new class extends PDO { public int $n = 0; public function __construct() {} public function prepare(string $q, array $o = []): PDOStatement|false { $this->n++; throw new RuntimeException('não devia consultar'); } };
ApiResponse::$ultimo = []; ob_start(); try { exportCSV($pdoQuebrado, $v([])); } catch (RuntimeException $e) {} ob_end_clean();
$ok($pdoQuebrado->n === 0 && (ApiResponse::$ultimo[1] ?? 0) === 403, 'negado: recusa ANTES de consultar o banco (0 consultas)');
// ── revogação com a tela aberta: dois arquivos seguidos, o direito retirado entre eles ──
$direito = true; $cap = function ($u, $t) use (&$direito) { return $direito && $t === P05_CAP_EXPORTAR; };
$GLOBALS['P05_EXPORTAR'] = p05_pode_exportar(990075, fn() => true, $cap); $a = $csvDe();
$direito = false;
$GLOBALS['P05_EXPORTAR'] = p05_pode_exportar(990075, fn() => true, $cap); $b = $csvDe();
$ok($a['linhas'] === 5 && $b['bytes'] === 0 && ($b['erro'][1] ?? 0) === 403, 'revogação com a tela aberta: o arquivo antes sai (5 linhas), o PRÓXIMO já é recusado (0 bytes, 403) · ' . json_encode([$a['bytes'], $b['bytes']]));
// ── recorte CL3 + exportação: só a carteira, e só com o direito ──
$GLOBALS['P05_ESCOPO'] = ['modo' => 'carteira', 'ids' => [1, 3], 'motivo' => 'carteira']; $GLOBALS['P05_EXPORTAR'] = true;
$c = $csvDe(); $ok($c['linhas'] === 3 && !str_contains($c['csv'], 'Cliente 2'), 'com o direito, o arquivo respeita a carteira (2 linhas + cabeçalho)');
unset($GLOBALS['P05_ESCOPO']);
// ── decisão p05_pode_exportar ──
$ok(p05_pode_exportar(990075, fn() => false, fn() => false) === true, 'flag desligada = como hoje (abrir o painel basta)');
$ok(p05_pode_exportar(null, fn() => true, fn() => true) === false, 'sem identidade = nega');
$ok(p05_pode_exportar(990075, fn() => true, fn($u, $t) => $t === P05_CAP_BASE) === false, 'outra capacidade (base inteira) NÃO dá exportar');
$ok(p05_pode_exportar(990075, fn() => true, function () { return 1; }) === false, 'resposta não booleana da capacidade = nega');
unset($GLOBALS['P05_EXPORTAR']);
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
if ($f) { echo "[ERRO] painel05-ex1:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   painel05-ex1: $n verificações (4 combinações exportar × financeiro; negado sem consultar; revogação com a tela aberta; carteira; decisão)\n";
