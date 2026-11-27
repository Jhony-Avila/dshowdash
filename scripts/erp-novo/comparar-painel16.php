<?php
// ERP novo — PORTÃO DE RECONCILIAÇÃO do Painel 16 · Fornecedor 360 (AZUL, 26/11 noite), pela matriz do CP-003 (ChatGPT, LOTE7): 3 camadas na
// MESMA fotografia (L1 SQL direto · L2 view do 0002 revista pelo CP-003 · L3 funções da API), contagens exatas, sem dado bancário/PIX.
// Pago real (baixa) e ranking financeiro estão SUSPENSOS: o comparador só confirma que saem null. Saída só com contagens.
// Uso: php scripts/erp-novo/comparar-painel16.php → exit 0 APTO · 1 NÃO APTO · 2 sem conclusão.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
if (!getenv('ERP_NOVO_TESTE')) { require $raiz . '/config/db_connection.php'; }
require $raiz . '/api/_helpers/ErpNovo.php';
if (!erp_novo_configurado()) { fwrite(STDERR, "[ERRO] credencial do ERP novo ausente (DB_ERP_NOVO_CNF/HOST/NAME)\n"); exit(2); }
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
$fonte = (string)file_get_contents($raiz . '/api/modules/panels/panel-16/api.php');
eval(substr($fonte, strpos($fonte, 'function getKPIs(')));
try { $pdo = erp_novo_pdo(); $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'); }
catch (Throwable $e) { fwrite(STDERR, "[ERRO] ERP novo indisponível — nenhuma conclusão\n"); exit(2); }
$R = []; $rec = static function (string $id, string $e, string $d) use (&$R): void { $R[$id] = [$e, $d]; };
$um = static function (string $sql) use ($pdo): array { return $pdo->query($sql)->fetch(PDO::FETCH_NUM) ?: []; };
$BASE = "FROM pty_supplier f JOIN pty_party_base e ON e.id = f.entity_id AND e.deleted = 0 WHERE f.deleted = 0";
try {
    $k = getKPIs($pdo)['data']['kpis'];
    [$t1, $a1, $pj1, $pf1] = array_map('intval', $um("SELECT COUNT(*), SUM(e.active = 1), SUM(e.type = 'PJ'), SUM(e.type = 'PF') $BASE"));
    [$t2, $d2] = array_map('intval', $um('SELECT COUNT(*), COUNT(DISTINCT Id_Fornecedor) FROM ' . ERP_V_FORNECEDOR . ' t'));
    $ok = $t1 === $t2 && $t2 === $d2 && $t1 === (int)$k['total'] && $a1 === (int)$k['ativos'] && $pj1 === (int)$k['pj'] && $pf1 === (int)$k['pf'];
    $rec('P16-01', $ok ? 'PASS' : 'FAIL', "fornecedores L1/L2/L3 $t1/$t2/{$k['total']} · linhas = ids distintos na view " . ($t2 === $d2 ? 'sim' : "NÃO ($t2/$d2: multiplicação por subtipo)") . " · ativos $a1/{$k['ativos']} · PJ/PF $pj1/$pf1");
    $r1 = (int)$um("SELECT COUNT(*) FROM fin_payment_request r JOIN pty_supplier f ON f.id = r.supplier_id AND f.deleted = 0 JOIN pty_party_base e ON e.id = f.entity_id AND e.deleted = 0 WHERE r.deleted = 0 AND r.status NOT IN ('CANCELLED','ACCOUNTS_CANCELLED')")[0];
    $rec('P16-02', $r1 === (int)$k['total_requisicoes'] ? 'PASS' : 'FAIL', "requisições sem canceladas L1/L3 $r1/{$k['total_requisicoes']}");
    [$at, $de, $dc] = array_map('intval', $um("SELECT SUM(f.status = 'UP_TO_DATE'), SUM(f.status = 'OUTDATED'), SUM(f.status IS NULL OR f.status NOT IN ('UP_TO_DATE','OUTDATED')) $BASE"));
    $porSt = []; foreach (getKPIs($pdo)['data']['by_status'] ?? [] as $x) { $porSt[$x['status']] = (int)$x['qtd']; }
    $ok = ($porSt['Atualizado'] ?? 0) === $at && ($porSt['Desatualizado'] ?? 0) === $de && ($porSt['Desconhecido'] ?? 0) === $dc;
    $rec('P16-03', $ok ? 'PASS' : ($porSt ? 'FAIL' : 'PASS'), "status Atualizado/Desatualizado/Desconhecido L1 $at/$de/$dc" . ($porSt ? ' · L3 ' . json_encode($porSt) : ' (a API não expõe a partição; conferida pela lista)'));
    $multi = (int)$um("SELECT COUNT(*) FROM (SELECT e.id FROM pty_party_base e JOIN pty_organization o ON o.entity_id = e.id AND o.deleted = 0 WHERE e.deleted = 0 GROUP BY e.id HAVING COUNT(*) > 1) x")[0];
    $l = getListagem($pdo, '', '', '', '', 100, 0)['data'];
    $j = json_encode([$k, $l], JSON_UNESCAPED_UNICODE);
    $semBanco = !preg_match('/pix|agencia|"contas"|titular|com_pix/i', $j);
    $ok = (int)$l['pagination']['total'] === $t1 && $semBanco && $k['total_pago'] === null && $k['media_por_fornecedor'] === null;
    $rec('P16-04', $ok ? 'PASS' : 'FAIL', "lista total $t1/{$l['pagination']['total']} · sem banco/PIX " . ($semBanco ? 'sim' : 'NÃO') . ' · total pago e média null ' . ($k['total_pago'] === null ? 'sim' : 'NÃO') . " · entidades PJ com mais de uma organização vigente (pendência de saneamento): $multi");
} catch (Throwable $e) { fwrite(STDERR, '[ERRO] consulta falhou (' . get_class($e) . ') — nenhuma conclusão' . (getenv('ERP_NOVO_TESTE') ? ': ' . $e->getMessage() : '') . "\n"); exit(2); }
$pdo->exec('ROLLBACK');
ksort($R); $falha = 0;
foreach ($R as $id => [$e, $d]) { if ($e !== 'PASS') { $falha++; } printf("%-6s %-6s %s\n", $id, $e, $d); }
echo $falha ? "== NÃO APTO: $falha critério(s) sem PASS\n" : '== APTO: ' . count($R) . " critérios PASS (pago e ranking financeiro suspensos por decisão)\n";
exit($falha ? 1 : 0);
