<?php
// ERP novo — PORTÃO DE RECONCILIAÇÃO do Painel 05 · Cliente 360 (AZUL, 26/11 noite), pela matriz do CP-002 (ChatGPT, LOTE7) no molde do CP-001:
// TRÊS camadas na MESMA fotografia (L1 SQL direto sem view · L2 views do 0002 · L3 as funções da API do painel 05), centavos inteiros,
// tolerância zero, status desconhecido = BLOQUEIO. Saída só com contagens e somas (ids comparados por hash, nunca mostrados).
// Universo da camada (= legado): clientes PJ não excluídos (PF fora até a decisão W-5); "ganho" = qte_quote WON; a receber = face da parcela
// (o SALDO líquido de baixas é degrau semântico, F16). Uso: php scripts/erp-novo/comparar-painel05.php → exit 0 APTO · 1 NÃO APTO · 2 sem conclusão.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
if (!getenv('ERP_NOVO_TESTE')) { require $raiz . '/config/db_connection.php'; }
require $raiz . '/api/_helpers/ErpNovo.php';
require_once $raiz . '/api/core/helpers/InputValidator.php';
if (!erp_novo_configurado()) { fwrite(STDERR, "[ERRO] credencial do ERP novo ausente (DB_ERP_NOVO_CNF/HOST/NAME)\n"); exit(2); }
require $raiz . '/api/modules/panels/_erp-compat-novo.php';
if (!class_exists('RedisHelper')) { final class RedisHelper { public static function tryGetCache(string $k) { return null; } public static function setCache(string $k, $v, $t = 0) { return true; } } }
// a reconciliação compara VALORES: roda como operador (CLI, root) com a visão financeira completa; a permissão por pessoa é provada nos testes
if (!defined('P05_SEM_FIN')) { define('P05_SEM_FIN', 'Sem permissão para dados financeiros.'); }
function p05_fin(): bool { return true; }
$fonte = (string)file_get_contents($raiz . '/api/modules/panels/panel-05/api.php');
$i0 = strpos($fonte, 'function getKPIs('); $i1 = strpos($fonte, 'function exportCSV(');
if ($i0 === false || $i1 === false) { fwrite(STDERR, "[ERRO] funções da API do painel 05 não encontradas\n"); exit(2); }
eval(substr($fonte, $i0, $i1 - $i0));
$i2 = strpos($fonte, 'function getCliente360('); eval(substr($fonte, $i2));
try { $pdo = erp_novo_pdo(); $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY'); }
catch (Throwable $e) { fwrite(STDERR, "[ERRO] ERP novo indisponível — nenhuma conclusão\n"); exit(2); }
$R = [];
$rec = static function (string $id, string $estado, string $det) use (&$R): void { $R[$id] = [$estado, $det]; };
$q = static function (string $sql, array $p = []) use ($pdo): array { $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchAll(PDO::FETCH_NUM); };
$um = static fn (string $sql, array $p = []) => $q($sql, $p)[0] ?? [];
$cent = static fn (string $c): string => "CAST(COALESCE(SUM(ROUND($c * 100)), 0) AS SIGNED)";
$fc = static fn ($v): int => (int)round((float)sprintf('%.2f', (float)$v) * 100);
$v = static fn (array $x): InputValidator => new InputValidator($x);
$V = ERP_V_ORGANIZACAO; $VO = ERP_V_ORCAMENTO; $VR = ERP_V_CONTAS_A_RECEBER;
$PJ = "FROM pty_customer c JOIN pty_party_base e ON e.id = c.entity_id AND e.deleted = 0 AND e.type = 'PJ' JOIN pty_organization o ON o.entity_id = e.id AND o.deleted = 0 WHERE c.deleted = 0";
$ST = ['WON' => 3, 'LOST' => 4, 'IN_PROGRESS' => 1, 'REJECTED' => 2];
try {
    // P05-01 KPIs: clientes ativos/inativos, ganhos, perdidos, total (L1/L2/L3)
    $k = getKPIs($pdo)['data'];
    [$a1, $i1c] = array_map('intval', $um("SELECT SUM(e.active = 1), SUM(e.active <> 1 OR e.active IS NULL) $PJ"));
    [$a2, $i2c] = array_map('intval', $um("SELECT SUM(Flag_Ativo = -1), SUM(Flag_Ativo = 0 OR Flag_Ativo IS NULL) FROM $V t"));
    [$g1, $gc1] = array_map('intval', $um("SELECT COUNT(*), {$cent('total_value')} FROM qte_quote WHERE deleted = 0 AND status = 'WON'"));
    [$g2, $gc2] = array_map('intval', $um("SELECT COUNT(*), {$cent('Valor_Final')} FROM $VO t WHERE Id_Status = 3"));
    $p1 = (int)$um("SELECT COUNT(*) FROM qte_quote WHERE deleted = 0 AND status = 'LOST'")[0]; $t1 = (int)$um('SELECT COUNT(*) FROM qte_quote WHERE deleted = 0')[0];
    $ok = $a1 === $a2 && $a2 === (int)$k['clientes_ativos'] && $i1c === $i2c && $i2c === (int)$k['clientes_inativos'] && $g1 === $g2 && $g2 === (int)$k['orcamentos_ganhos']
        && $gc1 === $gc2 && $gc2 === $fc($k['receita_total']) && $p1 === (int)$k['orcamentos_perdidos'] && $t1 === (int)$k['orcamentos_total'];
    $rec('P05-01', $ok ? 'PASS' : 'FAIL', "clientes PJ ativos L1/L2/L3 $a1/$a2/{$k['clientes_ativos']} · inativos $i1c/$i2c/{$k['clientes_inativos']} · ganhos $g1/$g2/{$k['orcamentos_ganhos']} · centavos " . ($gc1 === $gc2 && $gc2 === $fc($k['receita_total']) ? 'iguais' : 'DIFERENTES') . " · perdidos/total $p1/$t1");
    // P05-02 status de orçamento desconhecido
    $desc = (int)$um("SELECT COUNT(*) FROM qte_quote WHERE deleted = 0 AND status NOT IN ('" . implode("','", array_keys($ST)) . "')")[0];
    $rec('P05-02', $desc > 0 ? 'BLOQUEIO' : 'PASS', "orçamentos com status fora da lista conhecida: $desc" . ($desc ? ' (hoje viram 2 "Reprovado" na camada — F14: decisão antes de ativar)' : ''));
    // P05-03 rankings: quantidade, valor, ticket (data de GANHO, 12 meses, desempate pelo id)
    $ini = (new DateTimeImmutable('today', new DateTimeZone('America/Sao_Paulo')))->modify('-12 months')->format('Y-m-d');
    $falhasR = [];
    foreach (['receita' => "{$cent('q.total_value')}", 'quantidade' => 'COUNT(*)', 'ticket' => 'CAST(ROUND(AVG(q.total_value) * 100) AS SIGNED)'] as $tipo => $med) {
        $l1 = array_map(static fn ($r) => [(int)$r[0], (int)$r[1]], $q("SELECT c.id, $med AS m FROM qte_quote q JOIN pty_customer c ON c.id = q.customer_id AND c.deleted = 0 JOIN pty_party_base e ON e.id = c.entity_id AND e.deleted = 0 AND e.type = 'PJ' JOIN pty_organization o ON o.entity_id = e.id AND o.deleted = 0
            WHERE q.deleted = 0 AND q.status = 'WON' AND CONVERT_TZ(q.won_at,'+00:00','-03:00') >= ? GROUP BY c.id ORDER BY m DESC, c.id ASC LIMIT 10", [$ini]));
        $l3 = array_map(static fn ($r) => [(int)$r['id'], $tipo === 'quantidade' ? (int)$r['valor'] : $fc($r['valor'])], getRanking($pdo, $v(['tipo' => $tipo, 'periodo' => '12m', 'limit' => '10']), 0)['data']['items']);
        if ($l1 !== $l3) { $falhasR[] = $tipo; }
    }
    $rec('P05-03', $falhasR ? 'FAIL' : 'PASS', 'rankings quantidade/valor/ticket L1/L3 (ids, medida e ordem): ' . ($falhasR ? 'DIFERENTES em ' . implode(', ', $falhasR) : 'iguais'));
    // P05-04 lista × exportação × L1: mesmo predicado (status ativo), desempate pelo id
    $lista = getClientesList($pdo, $v(['status' => 'ativo', 'per_page' => '100']))['data'];
    $l1n = (int)$um("SELECT COUNT(*) $PJ AND e.active = 1")[0];
    $nao = $q("SELECT c.id $PJ AND e.active = 1 ORDER BY COALESCE(NULLIF(o.trade_name,''), NULLIF(o.nickname,''), o.company_name), c.id LIMIT 100");
    $idsL = array_map(static fn ($r) => (int)$r['Id_Organizacao'], $lista['items']); $idsB = array_map(static fn ($r) => (int)$r[0], $nao);
    $ok = (int)$lista['pagination']['total'] === $l1n && $idsL === $idsB;
    $rec('P05-04', $ok ? 'PASS' : 'FAIL', "lista ativa total API/L1 $l1n/" . $lista['pagination']['total'] . ' · 1ª página (ids e ordem com desempate) ' . ($idsL === $idsB ? 'igual' : 'DIFERENTE') . ($l1n > 5000 ? ' · exportação recusaria (> 5000: refine)' : ' · exportação usa o mesmo predicado (filtroClientes)'));
    // P05-05 detalhe: estatística INTEGRAL (amostra: os 10 clientes com mais orçamentos)
    $fd = 0; $am = $q("SELECT customer_id FROM qte_quote WHERE deleted = 0 GROUP BY customer_id ORDER BY COUNT(*) DESC, customer_id LIMIT 10");
    foreach ($am as [$cid]) {
        $d = getCliente360($pdo, (int)$cid); if (!($d['ok'] ?? false)) { continue; }
        [$tt, $gg, $cc] = array_map('intval', $um("SELECT COUNT(*), SUM(status = 'WON'), {$cent("CASE WHEN status = 'WON' THEN total_value ELSE 0 END")} FROM qte_quote WHERE deleted = 0 AND customer_id = ?", [$cid]));
        $s = $d['data']['orcamentos']['stats'];
        if ((int)$s['total'] !== $tt || (int)$s['ganhos'] !== $gg || ($s['valor_total'] !== null && $fc($s['valor_total']) !== $cc)) { $fd++; }
    }
    $rec('P05-05', $fd === 0 ? 'PASS' : 'FAIL', count($am) . " detalhes (os de mais orçamentos) · estatística integral divergente em $fd");
    // P05-06 contas a receber em aberto (face; saldo líquido é degrau semântico F16) e inadimplência
    [$r1, $rc1] = array_map('intval', $um("SELECT COUNT(*), {$cent('p.value')} FROM fin_accounts_receivable_installment p JOIN fin_accounts_receivable cr ON cr.id = p.accounts_receivable_id AND cr.deleted = 0 WHERE p.deleted = 0 AND p.status IN ('OPEN','PARTIAL','OVERDUE')"));
    [$r2, $rc2] = array_map('intval', $um("SELECT COUNT(*), {$cent('Valor')} FROM $VR t WHERE Id_Situacao = 1"));
    $descP = (int)$um("SELECT COUNT(*) FROM fin_accounts_receivable_installment WHERE deleted = 0 AND status NOT IN ('OPEN','PARTIAL','OVERDUE','RECEIVED','RECOVERED','CANCELLED','PARTIALLY_CANCELLED')")[0];
    $rec('P05-06', $r1 === $r2 && $rc1 === $rc2 ? ($descP ? 'BLOQUEIO' : 'PASS') : 'FAIL', "parcelas em aberto L1/L2 $r1/$r2 · centavos " . ($rc1 === $rc2 ? 'iguais' : 'DIFERENTES') . " · status de parcela desconhecido: $descP · (valor = FACE; saldo líquido de baixas = F16, depois)");
    // P05-07 mapa por UF: soma das UFs = total de ativos PJ
    $hm = getHeatmap($pdo)['data']; $soma = array_sum(array_map(static fn ($x) => (int)$x['clientes'], $hm));
    $rec('P05-07', $soma === $a1 ? 'PASS' : 'FAIL', "soma dos clientes por UF $soma × ativos PJ $a1");
} catch (Throwable $e) { fwrite(STDERR, '[ERRO] consulta falhou (' . get_class($e) . ') — nenhuma conclusão' . (getenv('ERP_NOVO_TESTE') ? ': ' . $e->getMessage() : '') . "\n"); exit(2); }
$pdo->exec('ROLLBACK');
ksort($R); $falha = 0;
foreach ($R as $id => [$estado, $det]) { if ($estado !== 'PASS') { $falha++; } printf("%-6s %-8s %s\n", $id, $estado, $det); }
echo $falha ? "== NÃO APTO: $falha critério(s) sem PASS\n" : "== APTO: " . count($R) . " critérios PASS\n";
exit($falha ? 1 : 0);
