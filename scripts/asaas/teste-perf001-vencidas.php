<?php
declare(strict_types=1);
// teste-perf001-vencidas.php — PERF-001 (VINHO, 26/11 noite): a lista paginada no banco é IDÊNTICA à lista em memória (todas as ordens, direções,
// páginas e filtros) e custa menos. MySQL LOCAL, banco temporário zz_perf001 (criado e removido aqui); dados sintéticos.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/asaas/AsaasDados.php"; require_once "$RAIZ/api/asaas/AsaasCobrancas.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'zz_perf001'")->fetchColumn()) { echo "zz_perf001 já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec('DROP DATABASE IF EXISTS zz_perf001'));
$root->exec('CREATE DATABASE zz_perf001');
$pdo = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=zz_perf001;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (AsaasEsquema::ddl('') as $sql) $pdo->exec($sql);
$fuso = new DateTimeZone('America/Sao_Paulo'); $agora = new DateTimeImmutable('2026-11-26 23:40:00', $fuso);
$contas = ['zenthra', 'rovic', 'gav', 'nunca'];
foreach (['zenthra', 'rovic', 'gav'] as $c) $pdo->prepare("INSERT INTO asaas_contas (conta, nome, estado, geracao_ativa, ultima_sync_ok, atualizado_em) VALUES (?,?,'ok',1,'2026-11-26 23:37:00',NOW())")->execute([$c, strtoupper($c)]);
$N = (int) (getenv('PERF001_N') ?: 3000);
mt_srand(2611);
$ins = $pdo->prepare("INSERT INTO asaas_cobrancas (conta, geracao, payment_id, status, billing_type, valor, juros_multa, vencimento, cliente_id, deletada, presente, execucao, atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,NOW())");
$pdo->beginTransaction();
for ($i = 0; $i < $N; $i++) {
    $c = ['zenthra', 'rovic', 'gav'][$i % 3];
    $venc = mt_rand(0, 20) === 0 ? null : (new DateTimeImmutable('2026-11-26'))->modify('-' . mt_rand(-5, 400) . ' days')->format('Y-m-d');   // nulos e futuras
    $valor = number_format(mt_rand(1, 40) * 25, 2, '.', '');   // muitos empates de valor
    $id = (mt_rand(0, 1) ? 'pay_' : 'PAY_') . str_pad((string) mt_rand(0, 99999), 5, '0', STR_PAD_LEFT) . $i;   // maiúsculas e minúsculas (ordem de bytes)
    $ins->execute([$c, mt_rand(0, 15) === 0 ? 0 : 1, $id, mt_rand(0, 6) === 0 ? 'DUNNING_REQUESTED' : (mt_rand(0, 9) === 0 ? 'PENDING' : 'OVERDUE'), 'BOLETO', $valor,
                   mt_rand(0, 3) === 0 ? null : '1.50', $venc, 'cus_' . ($i % 97), mt_rand(0, 30) === 0 ? 1 : 0, mt_rand(0, 30) === 0 ? 0 : 1]);
}
$pdo->commit();
$R = new AsaasResumo($pdo, '', $fuso);
$velha = fn(?string $fil, string $o, string $d, int $p, int $pp) => (new AsaasCobrancas($R->vencidasDetalhadas($contas, $agora), $agora, $fil))->lista($o, $d, $p, $pp);
$nova = fn(?string $fil, string $o, string $d, int $p, int $pp) => (new AsaasCobrancas($R->vencidasPagina($contas, $agora, $fil, $o, $d, $p, $pp), $agora, $fil))->listaPaginada($p, $pp);
$dif = [];
foreach ([null, 'rovic', 'nunca'] as $fil) foreach (['dias', 'valor', 'vencimento'] as $o) foreach (['asc', 'desc'] as $d) foreach ([[1, 50], [2, 50], [7, 37], [999, 50], [1, 200]] as [$p, $pp]) {
    $a = $velha($fil, $o, $d, $p, $pp); $b = $nova($fil, $o, $d, $p, $pp);
    if ($a !== $b) $dif[] = json_encode([$fil, $o, $d, $p, $pp, $a['total'], $b['total'], array_column($a['itens'], 'id') === array_column($b['itens'], 'id')]);
}
$ck("IDÊNTICA à lista em memória: 3 filtros × 3 ordens × 2 direções × 5 páginas = 90 comparações ($N cobranças, empates, nulos, vencimentos futuros, maiúsculas)", $dif === [], implode(' | ', array_slice($dif, 0, 3)));
$t0 = hrtime(true); $m0 = memory_get_usage(); for ($k = 0; $k < 5; $k++) $velha(null, 'dias', 'desc', 1, 50); $tv = (hrtime(true) - $t0) / 5e6;
$t0 = hrtime(true); for ($k = 0; $k < 5; $k++) $nova(null, 'dias', 'desc', 1, 50); $tn = (hrtime(true) - $t0) / 5e6;
$linhasV = count($R->vencidasDetalhadas($contas, $agora)['itens']); $linhasN = count($R->vencidasPagina($contas, $agora, null, 'dias', 'desc', 1, 50)['itens']);
printf("medida LOCAL (MySQL do agentes, sintético, %d cobranças, média de 5): em memória %.1f ms (%d linhas lidas) × no banco %.1f ms (%d linhas lidas)\n", $N, $tv, $linhasV, $tn, $linhasN);
$ck('a página no banco lê só a página (50 linhas), não todas', $linhasN === 50 && $linhasV > 50);
echo "teste-perf001-vencidas: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
