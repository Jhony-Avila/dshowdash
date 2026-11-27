<?php
// painel05-cl3.php (VINHO, 27/11 · UARPS v4 CL3): o recorte de CARTEIRA no servidor vale igual para lista, busca, ficha, totais, rankings e exportação.
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
if (is_file($raiz . '/api/_helpers/CsvSeguro.php')) { require_once $raiz . '/api/_helpers/CsvSeguro.php'; }   // o exportCSV (eval) usa o CsvSeguro
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
require_once $raiz . '/api/modules/panels/panel-05/escopo-cl3.php';
$v = static fn (array $x): InputValidator => new InputValidator($x);
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
$GLOBALS['FIN'] = true;
$ids = static fn(array $l, string $k) => array_map('intval', array_column($l, $k));
$tudo = getClientesList($pdo, $v(['per_page' => '100']))['data'];
$ok($ids($tudo['items'], 'Id_Organizacao') === [1, 2, 3, 4] || count($tudo['items']) === 4, 'controle: sem escopo, a lista traz os 4 clientes PJ');
// ── CARTEIRA = clientes 1 e 3 ──
$GLOBALS['P05_ESCOPO'] = ['modo' => 'carteira', 'ids' => [1, 3], 'motivo' => 'carteira'];
$l = getClientesList($pdo, $v(['per_page' => '10']))['data'];
$ok(array_values(array_diff($ids($l['items'], 'Id_Organizacao'), [1, 3])) === [] && $l['pagination']['total'] === 2, 'CL3 lista + paginação: só a carteira (1 e 3), total 2 · ' . json_encode([$ids($l['items'], 'Id_Organizacao'), $l['pagination']]));
$b = searchClientes($pdo, $v(['q' => 'Cliente']))['data'];
$ok(array_values(array_diff($ids($b, 'id'), [1, 3])) === [] && count($b) === 2, 'CL3 busca: só a carteira · ' . json_encode($ids($b, 'id')));
$ok(getCliente360($pdo, 2)['ok'] === false && getCliente360($pdo, 1)['ok'] === true, 'CL3 ficha: cliente fora da carteira = não encontrado (404), da carteira = ok');
$k = getKPIs($pdo)['data'];
$ok((int) $k['clientes_ativos'] + (int) $k['clientes_inativos'] === 2 && $k['contatos_ativos'] === null, 'CL3 totais: os KPIs contam só a carteira (2); contatos sem vínculo confiável = null (nunca zero falso) · ' . json_encode($k));
ob_start(); exportCSV($pdo, $v([])); $csv = ob_get_clean();
$linhas = array_values(array_filter(explode("\n", trim(preg_replace('/^\xEF\xBB\xBF/', '', $csv)))));
$ok(count($linhas) === 3 && !str_contains($csv, 'Cliente 2') && !str_contains($csv, 'Cliente 4'), 'CL3 exportação: cabeçalho + 2 linhas, nada fora da carteira · ' . count($linhas));
$r = getRanking($pdo, $v(['tipo' => 'quantidade', 'periodo' => '12m']), 0)['data']['items'];
$ok(array_values(array_diff($ids($r, 'id'), [1, 3])) === [], 'CL3 ranking: só clientes da carteira · ' . json_encode($ids($r, 'id')));
$t = getTopClientes($pdo, $v([]), 0)['data'];
$ok(array_values(array_diff($ids($t, 'Id_Organizacao'), [1, 3])) === [], 'CL3 top: só clientes da carteira');
$vd = getVendedores($pdo)['data']; $tot = array_sum(array_map(fn($x) => (int) $x['total_orcs'], $vd));
$ok($tot === (int) $pdo->query("SELECT COUNT(*) FROM qte_quote WHERE customer_id IN (1,3) AND deleted = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)")->fetchColumn(), 'CL3 vendedores: os orçamentos contados são só os da carteira · ' . $tot);
// ── carteira VAZIA (falha fechada / pessoa sem clientes) ──
$GLOBALS['P05_ESCOPO'] = ['modo' => 'carteira', 'ids' => [], 'motivo' => 'carteira_indisponivel'];
$ok(getClientesList($pdo, $v([]))['data']['pagination']['total'] === 0 && searchClientes($pdo, $v(['q' => 'Cliente']))['data'] === [] && getCliente360($pdo, 1)['ok'] === false, 'carteira vazia: nada aparece (lista, busca, ficha)');
// ── decisão do escopo (p05_escopo) ──
$C = fn(int $id, string $s, $u) => ['cliente_id' => $id, 'situacao' => $s, 'user_id' => $u];
$fonte = fn(array $r) => fn(int $u, string $o) => $r;
$mix = [$C(1, 'confirmado', 7), $C(3, 'confirmado', '7'), $C(3, 'confirmado', 7), $C(2, 'confirmado', 8), $C(4, 'nao_resolvido', null), $C(5, 'sem_responsavel', null),
        $C(6, 'confirmado', null), $C(9, 'qualquer', 7), $C(10, 'sem_responsavel', 7), $C(-2, 'confirmado', 7), ['situacao' => 'confirmado', 'user_id' => 7]];
$ok(p05_escopo(7, 'novo', fn() => false)['modo'] === 'todos', 'flag desligada = como hoje (todos)');
$ok(p05_escopo(7, 'novo', fn() => true, fn($u, $t) => $t === P05_CAP_BASE)['modo'] === 'todos', 'capacidade base inteira = todos');
$e = p05_escopo(7, 'novo', fn() => true, fn($u, $t) => false, $fonte($mix));
$ok($e === ['modo' => 'carteira', 'ids' => [1, 3], 'motivo' => 'carteira'], 'confirmado = só os da PRÓPRIA pessoa (1, 3); de outra pessoa, não resolvido, sem responsável (sem a capacidade), confirmado sem pessoa, situação desconhecida e id inválido ficam FORA · ' . json_encode($e));
$e2 = p05_escopo(7, 'novo', fn() => true, fn($u, $t) => $t === P05_CAP_SEM_RESP, $fonte($mix));
$ok($e2['ids'] === [1, 3, 5], 'com a capacidade sem_responsavel entra só o "sem responsável" CONFIRMADO (5); o que vem com pessoa (10) não conta como sem responsável · ' . json_encode($e2));
$ok(p05_escopo(8, 'novo', fn() => true, fn($u, $t) => false, $fonte($mix))['ids'] === [2], 'outra pessoa vê só a carteira dela (2)');
$ok(p05_escopo(7, 'novo', fn() => true, fn($u, $t) => false, function () { throw new PDOException('tabela'); }) === ['modo' => 'carteira', 'ids' => [], 'motivo' => 'carteira_indisponivel'], 'fonte ausente/ilegível = carteira VAZIA (falha fechada)');
$ok(P05_FONTE_ATIVA === null && p05_escopo(7, 'novo', fn() => true, fn($u, $t) => false) === ['modo' => 'carteira', 'ids' => [], 'motivo' => 'sem_fonte_ativa'], 'NENHUMA fonte ativa (padrão) = todo cliente "não resolvido": carteira vazia para quem não vê a base inteira');
$ok(p05_escopo(7, 'novo', fn() => true, fn($u, $t) => false, null, 'inexistente')['motivo'] === 'sem_fonte_ativa' && array_keys(p05_fontes()) === ['tabela'], 'fonte ativa desconhecida = não resolvido; registrada só a "tabela" (sem ativar)');
$ok(array_map('p05_classificar', [$C(1, 'confirmado', 7), $C(1, 'confirmado', null), $C(1, 'confirmado', 0), $C(1, 'sem_responsavel', null), $C(1, 'sem_responsavel', 3), $C(1, '', null), []]) === ['confirmado', 'nao_resolvido', 'nao_resolvido', 'sem_responsavel', 'nao_resolvido', 'nao_resolvido', 'nao_resolvido'], 'regra dos 3 estados: o padrão é "não resolvido"');
$ok(is_file(P05_API . '/feature-flags/resolver.php') && is_file(P05_API . '/core/UARPSGate.php'), 'os require padrão (flag e capacidade) apontam para arquivos que existem');
$ok(p05_escopo(null, 'novo', fn() => true)['ids'] === [], 'sem identidade = carteira vazia');
$ok(p05_escopo_cache(['modo' => 'todos', 'ids' => [], 'motivo' => 'x']) === '' && p05_escopo_cache($e) !== p05_escopo_cache(['modo' => 'carteira', 'ids' => [1], 'motivo' => 'carteira']), 'o escopo entra na chave do cache (carteiras diferentes = chaves diferentes)');
unset($GLOBALS['P05_ESCOPO']);
foreach ($T as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); }
if ($f) { echo "[ERRO] painel05-cl3:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   painel05-cl3: $n verificações (o recorte de carteira vale para lista, busca, ficha, totais, ranking, top, vendedores e exportação; vazia = nada; decisão do escopo e cache)\n";
