<?php
declare(strict_types=1);
// scripts/pipedrive/teste-ddi036-037.php — DDI-036/037 (GPT DATA, 28/11, VINHO): coleções filhas substituídas numa transação só e SÓ quando a
// coleção recebida é válida e completa. MySQL de TESTE: banco descartável zz_… (estrutura da 8121, dados fictícios) + servidor FALSO do Pipedrive local.
// Uso: php teste-ddi036-037.php <zz_banco> [--raiz <árvore>]
$db = $argv[1] ?? ''; if (preg_match('/^zz_[a-z0-9_]{1,40}\z/', $db) !== 1) { fwrite(STDERR, "banco zz_… obrigatório\n"); exit(2); }
$raiz = (($i = array_search('--raiz', $argv, true)) !== false) ? $argv[$i + 1] : dirname(__DIR__, 2);
require_once "$raiz/api/pipedrive/repositories/SyncRepository.php";
require_once "$raiz/api/pipedrive/lib/PipedriveClient.php";
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (['pipe_persons', 'pipe_person_emails', 'pipe_person_phones', 'pipe_products', 'pipe_product_prices', 'pipe_deal_products'] as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); $pdo->exec("CREATE TABLE $t LIKE ATRWEB_VAL_PIPE_8121.$t"); }
$pdo->exec("CREATE TRIGGER zz_falha_email BEFORE INSERT ON pipe_person_emails FOR EACH ROW BEGIN IF NEW.value = 'falha@exemplo.invalid' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'; END IF; END");
$pdo->exec("CREATE TRIGGER zz_falha_item BEFORE INSERT ON pipe_deal_products FOR EACH ROW BEGIN IF NEW.comments = 'FALHA' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'; END IF; END");
$r = new PipeSyncRepository($pdo);
$ok = 0; $falhas = 0; $c = function (string $n, bool $v) use (&$ok, &$falhas): void { if ($v) $ok++; else { $falhas++; echo "FALHOU: $n\n"; } };
$v = fn (int $m) => sprintf('2026-11-28 11:%02d:00', $m);
$em = fn () => (string) $pdo->query("SELECT IFNULL(GROUP_CONCAT(value ORDER BY value), '') FROM pipe_person_emails WHERE person_pd_id = 1")->fetchColumn();
$p = fn (int $m, $emails = '__sem__', int $dono = 990201) => array_merge(['id' => 1, 'name' => 'P1', 'owner_id' => $dono, 'update_time' => $v($m), 'add_time' => $v(0)], $emails === '__sem__' ? [] : ['emails' => $emails]);
// DDI-037 · 4 estados da coleção
$r->upsertPerson($p(1, [['value' => 'a@exemplo.invalid'], ['value' => 'b@exemplo.invalid']]));
$c('PREENCHIDA substitui', $em() === 'a@exemplo.invalid,b@exemplo.invalid');
$r->upsertPerson($p(2));
$c('AUSENTE (sem a chave) preserva', $em() === 'a@exemplo.invalid,b@exemplo.invalid');
$pai = fn () => $pdo->query('SELECT CONCAT(IFNULL(primary_email, "-"), "|", IFNULL(email_norm, "-")) FROM pipe_persons WHERE pipedrive_id = 1')->fetchColumn();
$c('AUSENTE preserva também os campos DERIVADOS do pai (primary_email/email_norm) — QI VERDE/AZUL 12:04', $pai() === 'a@exemplo.invalid|a@exemplo.invalid');
$r->upsertPerson($p(3, 'nao-e-lista'));
$c('INVÁLIDA (não é lista) preserva', $em() === 'a@exemplo.invalid,b@exemplo.invalid' && $pai() === 'a@exemplo.invalid|a@exemplo.invalid');
$r->upsertPerson($p(4, ['x' => ['value' => 'c@exemplo.invalid']]));
$c('INVÁLIDA (objeto, não lista) preserva', $em() === 'a@exemplo.invalid,b@exemplo.invalid');
$r->upsertPerson($p(5, []));
$c('VAZIA comprovada ([]) substitui por vazio (filhos e derivados)', $em() === '' && $pai() === '-|-');
// DDI-036 · falha no meio = ROLLBACK de pai + filhos
$r->upsertPerson($p(6, [['value' => 'a@exemplo.invalid']], 990201));
try { $r->upsertPerson($p(7, [['value' => 'b@exemplo.invalid'], ['value' => 'falha@exemplo.invalid']], 990202)); $c('falha simulada lança', false); } catch (Throwable $e) { $c('falha simulada lança', true); }
$c('falha no meio: coleção anterior INTACTA', $em() === 'a@exemplo.invalid');
$c('falha no meio: registro pai também volta (sem responsável novo)', (int) $pdo->query('SELECT owner_id FROM pipe_persons WHERE pipedrive_id = 1')->fetchColumn() === 990201);
$pdo->beginTransaction(); $r->upsertPerson($p(8, [['value' => 'd@exemplo.invalid']])); $pdo->rollBack();
$c('dentro de transação do chamador (savepoint): o rollback do chamador desfaz tudo', $em() === 'a@exemplo.invalid');
// produtos do negócio
$it = fn (int $id, string $com = '') => ['id' => $id, 'product_id' => 50 + $id, 'item_price' => 10, 'quantity' => 1, 'comments' => $com];
$n = fn () => (int) $pdo->query('SELECT COUNT(*) FROM pipe_deal_products WHERE deal_pd_id = 7')->fetchColumn();
$r->upsertDealProducts(7, [$it(1), $it(2), $it(3)]);
$c('itens: completa substitui', $n() === 3);
$r->upsertDealProducts(7, null);
$c('itens: null (ausente/inválida/incompleta) preserva', $n() === 3);
try { $r->upsertDealProducts(7, [$it(4), $it(5, 'FALHA')]); } catch (Throwable $e) { }
$c('itens: falha no meio = os 3 anteriores intactos', $n() === 3);
$r->upsertDealProducts(7, []);
$c('itens: vazia comprovada zera', $n() === 0);
// produto: preços/custos
$r->upsertProduct(['id' => 5, 'name' => 'Prod', 'update_time' => $v(1), 'prices' => [['price' => 10, 'currency' => 'BRL', 'cost' => 4]]]);
$r->upsertProduct(['id' => 5, 'name' => 'Prod', 'update_time' => $v(2)]);
$c('produto: preços ausentes preservam preço e custo', $pdo->query('SELECT CONCAT(price, "/", cost) FROM pipe_product_prices WHERE product_pd_id = 5')->fetchColumn() === '10.00/4.00');
// DDI-037 · cliente: paginação (servidor falso local)
$porta = 18000 + random_int(0, 999); $srv = proc_open([PHP_BINARY, '-S', "127.0.0.1:$porta", __DIR__ . '/teste-ddi036-037-roteador.php'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pp);
usleep(400000);
$cli = new PipedriveClient('token-ficticio', "http://127.0.0.1:$porta", 5);
$pag = function (string $rota, array $o = []) use ($cli) { $itens = []; $res = $cli->paginate($rota, $o + ['version' => 'v2'], function (array $l) use (&$itens) { foreach ($l as $x) $itens[] = $x; }); return [$res, $itens]; };
[$x, $i] = $pag('sem-data'); $c('cliente: resposta SEM "data" = inválida (ok=false, RESPOSTA_INVALIDA), nunca coleção vazia', $x['ok'] === false && $x['error'] === 'RESPOSTA_INVALIDA' && $i === []);
[$x, $i] = $pag('data-texto'); $c('cliente: "data" que não é lista = inválida', $x['ok'] === false && $x['error'] === 'RESPOSTA_INVALIDA');
[$x, $i] = $pag('vazia'); $c('cliente: "data": null = vazia COMPROVADA (ok, completo, 0 itens)', $x['ok'] === true && $x['completo'] === true && $i === []);
[$x, $i] = $pag('duas-paginas'); $c('cliente: 2 páginas = completa com os 3 itens', $x['ok'] === true && $x['completo'] === true && count($i) === 3);
[$x, $i] = $pag('sem-fim', ['maxPages' => 2]); $c('cliente: parada por teto = NÃO completa', $x['ok'] === true && $x['completo'] === false);
[$x, $i] = $pag('nao-existe'); $c('cliente: 404 = ok=false com status 404 (ausência)', $x['ok'] === false && (int) $x['status'] === 404);
proc_terminate($srv);
echo "teste-ddi036-037: $ok ok, $falhas falha(s)\n"; exit($falhas === 0 ? 0 : 1);
