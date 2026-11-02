<?php
/**
 * Panel-05 API — Cliente 360 Enterprise
 * @version 7.7.0-ERPV2-ENTERPRISE
 * v7.6.0-ERPV2 (2026-09-16): ERP dropou Organizacao/Pessoa/Orcamento/Contas_A_Receber (19–20/08/2026). SQL inalterado; as tabelas
 *   legadas viraram tabelas derivadas de compatibilidade sobre ent_x + orc_orcamento + fin_conta_receber_x (_erp-compat.php).
 *   Id_Organizacao agora = ent_cliente.id (PJ); Ultimo_Contato = data do último orçamento (não existe campo próprio no ERP novo).
 * v7.5.0-P06: Migrado para ApiResponse
 */

require_once __DIR__ . '/../_init.php';
header('Cache-Control: no-store');

require_once __DIR__ . '/../../../../config/db_connection.php';
require_once __DIR__ . '/../_erp-compat.php'; // tabelas derivadas: schema novo do ERP → shape legado (2026-09-16)
require_once __DIR__ . '/../../../core/SessionGate.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_AUTH_REQUIRED, 401);
    exit;
}

$validator = InputValidator::fromGet();
$allowed_actions = ['default', 'kpis', 'list', 'charts', 'top', 'vendedores', 'insights', 'export', 'compare', 'funil', 'metrics', 'search', 'churn', 'ranking', 'heatmap'];
$action = $validator->enum('action', 'default', $allowed_actions);
$clienteId = $validator->id('id') ?: null;
$CACHE_TTL = RedisConfig::TTL_UI;

$cacheableActions = ['default', 'kpis', 'charts', 'vendedores', 'insights', 'funil', 'metrics', 'churn', 'heatmap'];

if (in_array($action, $cacheableActions, true) && !$clienteId) {
    $cacheKey = "panel:05:{$action}";
    if (RedisHelper::serveIfCached($cacheKey)) { exit; }
}

header('X-Cache: MISS');

try {
    $pdo = getConnection('DSHOW_PROD');
} catch (Exception $e) { ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500); exit; }

try {
    if ($clienteId) { $result = getCliente360($pdo, $clienteId); if (!$result['ok']) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); } else { echo ApiResponse::buildSuccess($result['data'], ['version' => '7.7.0-ERPV2-ENTERPRISE']); } RedisHelper::close(); exit; }
    switch ($action) {
        case 'kpis': $response = getKPIs($pdo); break;
        case 'list': $response = getClientesList($pdo, $validator); echo ApiResponse::buildSuccess($response['data'], ['version' => '7.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); exit;
        case 'charts': $response = getCharts($pdo); break;
        case 'top': $response = getTopClientes($pdo, $validator, $CACHE_TTL); echo ApiResponse::buildSuccess($response['data'], ['version' => '7.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); exit;
        case 'vendedores': $response = getVendedores($pdo); break;
        case 'insights': $response = getInsights($pdo); break;
        case 'export': exportCSV($pdo, $validator); exit;
        case 'compare': $response = getComparativo($pdo, $validator); echo ApiResponse::buildSuccess($response['data'], ['version' => '7.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); exit;
        case 'funil': $response = getFunil($pdo); break;
        case 'metrics': $response = getMetricsAvancadas($pdo); break;
        case 'search': $response = searchClientes($pdo, $validator); echo ApiResponse::buildSuccess($response['data'], ['query' => $response['query'] ?? '', 'version' => '7.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); exit;
        case 'churn': $response = getChurnRisk($pdo); break;
        case 'ranking': $response = getRanking($pdo, $validator, $CACHE_TTL); echo ApiResponse::buildSuccess($response['data'], ['version' => '7.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); exit;
        case 'heatmap': $response = getHeatmap($pdo); break;
        default: $response = ['ok' => true, 'data' => ['kpis' => getKPIs($pdo)['data'], 'clientes' => getClientesList($pdo, $validator)['data'], 'insights' => getInsights($pdo)['data']]];
    }
    if (in_array($action, $cacheableActions, true)) {
        $output = ApiResponse::buildSuccess($response['data'] ?? $response, ['version' => '7.7.0-ERPV2-ENTERPRISE']);
        RedisHelper::cacheAndReturn("panel:05:{$action}", $output, $CACHE_TTL);
    } else {
        echo ApiResponse::buildSuccess($response['data'] ?? $response, ['version' => '7.7.0-ERPV2-ENTERPRISE']);
        RedisHelper::close();
    }
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function getKPIs($pdo) {
    $d = $pdo->query("SELECT (SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Flag_Ativo = -1) as clientes_ativos, (SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Flag_Ativo = 0 OR Flag_Ativo IS NULL) as clientes_inativos, (SELECT COUNT(*) FROM " . ERP_V_PESSOA . " Pessoa WHERE Ativo = -1) as contatos_ativos, (SELECT COALESCE(SUM(Valor_Final), 0) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6)) as receita_total, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6)) as orcamentos_ganhos, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status = 4) as orcamentos_perdidos, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento) as orcamentos_total, (SELECT COUNT(DISTINCT Municipio_Endereco) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Municipio_Endereco IS NOT NULL) as cidades, (SELECT COUNT(DISTINCT Uf_Endereco) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Uf_Endereco IS NOT NULL) as estados, (SELECT COALESCE(SUM(Valor), 0) FROM " . ERP_V_CONTAS_A_RECEBER . " Contas_A_Receber WHERE Id_Situacao = 1) as a_receber_aberto, (SELECT COUNT(*) FROM " . ERP_V_CONTAS_A_RECEBER . " Contas_A_Receber WHERE Vencimento < CURDATE() AND Id_Situacao = 1) as titulos_vencidos")->fetch();
    $d['taxa_conversao'] = $d['orcamentos_total'] > 0 ? round(($d['orcamentos_ganhos'] / $d['orcamentos_total']) * 100, 1) : 0;
    $d['ticket_medio'] = $d['orcamentos_ganhos'] > 0 ? round($d['receita_total'] / $d['orcamentos_ganhos'], 2) : 0;
    return ['ok' => true, 'data' => $d];
}

function getCharts($pdo) {
    return ['ok' => true, 'data' => [
        'receita_mensal' => $pdo->query("SELECT DATE_FORMAT(Data_Criacao, '%Y-%m') as mes, DATE_FORMAT(Data_Criacao, '%b/%y') as mes_label, COUNT(*) as qtd, COALESCE(SUM(Valor_Final), 0) as receita FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6) AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY DATE_FORMAT(Data_Criacao, '%Y-%m') ORDER BY mes")->fetchAll(),
        'por_tipo' => $pdo->query("SELECT COALESCE(Tipo_Negocio, 'Outros') as tipo, COUNT(*) as qtd, COALESCE(SUM(Valor_Final), 0) as receita FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6) GROUP BY Tipo_Negocio ORDER BY receita DESC LIMIT 5")->fetchAll(),
        'por_uf' => $pdo->query("SELECT COALESCE(o.Uf_Endereco, 'N/D') as uf, COUNT(DISTINCT o.Id_Organizacao) as clientes FROM " . ERP_V_ORGANIZACAO . " o WHERE o.Flag_Ativo = -1 GROUP BY o.Uf_Endereco ORDER BY clientes DESC LIMIT 10")->fetchAll(),
        'novos_clientes' => $pdo->query("SELECT DATE_FORMAT(Data_Criacao, '%Y-%m') as mes, DATE_FORMAT(Data_Criacao, '%b/%y') as mes_label, COUNT(*) as qtd FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY DATE_FORMAT(Data_Criacao, '%Y-%m') ORDER BY mes")->fetchAll()
    ]];
}

function getTopClientes($pdo, InputValidator $v, $ttl) {
    $lim = $v->int('limit', 10, ['min' => 5, 'max' => 20]);
    $ck = "panel:05:top:{$lim}";
    $cached = RedisHelper::tryGetCache($ck);
    if ($cached !== null) { header('X-Cache: HIT'); return json_decode($cached, true); }
    $stmt = $pdo->prepare("SELECT o.Id_Organizacao, o.Nome_Empresa, o.Razao_Social, o.Municipio_Endereco, o.Uf_Endereco, o.Qtd_Orcs_Ganhos, o.Qtd_Orcs_Perdidos, COALESCE(SUM(orc.Valor_Final), 0) as total_receita FROM " . ERP_V_ORGANIZACAO . " o LEFT JOIN " . ERP_V_ORCAMENTO . " orc ON orc.Id_Organizacao = o.Id_Organizacao AND orc.Id_Status IN (3, 5, 6) WHERE o.Flag_Ativo = -1 GROUP BY o.Id_Organizacao ORDER BY total_receita DESC LIMIT :lim");
    $stmt->bindValue(':lim', $lim, PDO::PARAM_INT); $stmt->execute();
    $result = ['ok' => true, 'data' => $stmt->fetchAll()];
    RedisHelper::setCache($ck, json_encode($result), $ttl);
    return $result;
}

function getVendedores($pdo) {
    $v = $pdo->query("SELECT o.Nome_Vendedor as vendedor, COUNT(*) as total_orcs, SUM(CASE WHEN o.Id_Status IN (3, 5, 6) THEN 1 ELSE 0 END) as ganhos, SUM(CASE WHEN o.Id_Status = 4 THEN 1 ELSE 0 END) as perdidos, COALESCE(SUM(CASE WHEN o.Id_Status IN (3, 5, 6) THEN o.Valor_Final ELSE 0 END), 0) as receita, COUNT(DISTINCT o.Id_Organizacao) as clientes FROM " . ERP_V_ORCAMENTO . " o WHERE o.Nome_Vendedor IS NOT NULL AND o.Nome_Vendedor != '' AND o.Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY o.Nome_Vendedor ORDER BY receita DESC LIMIT 15")->fetchAll();
    foreach ($v as &$x) { $x['taxa_conversao'] = $x['total_orcs'] > 0 ? round(($x['ganhos'] / $x['total_orcs']) * 100, 1) : 0; $x['ticket_medio'] = $x['ganhos'] > 0 ? round($x['receita'] / $x['ganhos'], 2) : 0; }
    return ['ok' => true, 'data' => $v];
}

function getInsights($pdo) {
    $ins = [];
    $inad = $pdo->query("SELECT COUNT(DISTINCT o.Id_Organizacao) as q, COALESCE(SUM(car.Valor), 0) as v FROM " . ERP_V_ORGANIZACAO . " o INNER JOIN " . ERP_V_CONTAS_A_RECEBER . " car ON car.Id_Organizacao = o.Id_Organizacao WHERE car.Vencimento < CURDATE() AND car.Id_Situacao = 1")->fetch();
    if ($inad['q'] > 0) $ins[] = ['tipo' => 'alert', 'nivel' => 'danger', 'icone' => 'alert-triangle', 'titulo' => 'Inadimplencia', 'valor' => $inad['q'], 'descricao' => 'clientes com titulos vencidos', 'detalhe' => 'R$ ' . number_format($inad['v'], 2, ',', '.')];
    $sc = $pdo->query("SELECT COUNT(*) as q FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Flag_Ativo = -1 AND (Ultimo_Contato IS NULL OR Ultimo_Contato < DATE_SUB(CURDATE(), INTERVAL 90 DAY))")->fetch()['q'];
    if ($sc > 0) $ins[] = ['tipo' => 'warning', 'nivel' => 'warning', 'icone' => 'clock', 'titulo' => 'Sem Contato', 'valor' => $sc, 'descricao' => 'clientes sem contato ha 90+ dias', 'detalhe' => 'Risco de churn'];
    $nv = $pdo->query("SELECT COUNT(*) as q FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Data_Criacao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')")->fetch()['q'];
    if ($nv > 0) $ins[] = ['tipo' => 'success', 'nivel' => 'success', 'icone' => 'user-plus', 'titulo' => 'Novos Clientes', 'valor' => $nv, 'descricao' => 'cadastrados este mes', 'detalhe' => 'Crescimento da base'];
    $pp = $pdo->query("SELECT COUNT(*) as q, COALESCE(SUM(Valor_Final), 0) as v FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status NOT IN (3, 4, 5, 6) AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")->fetch();
    if ($pp['q'] > 0) $ins[] = ['tipo' => 'info', 'nivel' => 'info', 'icone' => 'trending-up', 'titulo' => 'Pipeline', 'valor' => $pp['q'], 'descricao' => 'orcamentos em andamento', 'detalhe' => 'R$ ' . number_format($pp['v'], 2, ',', '.')];
    return ['ok' => true, 'data' => $ins];
}

function getFunil($pdo) {
    $d = $pdo->query("SELECT (SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as leads, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as orcamentos, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status NOT IN (3, 4, 5, 6) AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as negociacao, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6) AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as ganhos, (SELECT COUNT(*) FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status = 4 AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)) as perdidos")->fetch();
    $pm = $pdo->query("SELECT DATE_FORMAT(Data_Criacao, '%Y-%m') as mes, DATE_FORMAT(Data_Criacao, '%b/%y') as mes_label, COUNT(*) as total, SUM(CASE WHEN Id_Status IN (3, 5, 6) THEN 1 ELSE 0 END) as ganhos, SUM(CASE WHEN Id_Status = 4 THEN 1 ELSE 0 END) as perdidos FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(Data_Criacao, '%Y-%m') ORDER BY mes")->fetchAll();
    // 2026-09-16: top 5 motivos de perda (12 meses) — o frontend (ui/funil.ts) renderiza motivosPerda
    $mp = $pdo->query("SELECT COALESCE(Motivo_Perda, 'NAO_INFORMADO') as motivo, COUNT(*) as qtd FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status = 4 AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY COALESCE(Motivo_Perda, 'NAO_INFORMADO') ORDER BY qtd DESC LIMIT 5")->fetchAll();
    $totMp = array_sum(array_map(fn($m) => (int)$m['qtd'], $mp));
    foreach ($mp as &$m) { $m['qtd'] = (int)$m['qtd']; $m['percentual'] = $totMp > 0 ? round($m['qtd'] / $totMp * 100, 1) : 0; $m['motivo'] = ucfirst(strtolower(str_replace('_', ' ', (string)$m['motivo']))); } unset($m);
    return ['ok' => true, 'data' => ['etapas' => [['nome' => 'Leads', 'valor' => (int)$d['leads'], 'cor' => '#3b82f6'], ['nome' => 'Orcamentos', 'valor' => (int)$d['orcamentos'], 'cor' => '#8b5cf6'], ['nome' => 'Em Negociacao', 'valor' => (int)$d['negociacao'], 'cor' => '#f59e0b'], ['nome' => 'Ganhos', 'valor' => (int)$d['ganhos'], 'cor' => '#22c55e'], ['nome' => 'Perdidos', 'valor' => (int)$d['perdidos'], 'cor' => '#ef4444']], 'por_mes' => $pm, 'motivos_perda' => $mp]];
}

function getMetricsAvancadas($pdo) {
    $tm = $pdo->query("SELECT AVG(DATEDIFF(Data_Ganho, Data_Criacao)) as v FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6) AND Data_Ganho IS NOT NULL AND Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)")->fetch()['v'];
    $ltv = $pdo->query("SELECT AVG(t) as v FROM (SELECT SUM(orc.Valor_Final) as t FROM " . ERP_V_ORGANIZACAO . " o INNER JOIN " . ERP_V_ORCAMENTO . " orc ON orc.Id_Organizacao = o.Id_Organizacao AND orc.Id_Status IN (3, 5, 6) WHERE o.Flag_Ativo = -1 GROUP BY o.Id_Organizacao HAVING t > 0) as x")->fetch()['v'];
    $ret = $pdo->query("SELECT COUNT(DISTINCT CASE WHEN q > 1 THEN Id_Organizacao END) as r, COUNT(DISTINCT Id_Organizacao) as t FROM (SELECT Id_Organizacao, COUNT(*) as q FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Status IN (3, 5, 6) GROUP BY Id_Organizacao) as x")->fetch();
    return ['ok' => true, 'data' => ['tempo_medio_conversao' => round($tm ?? 0), 'ltv_medio' => round($ltv ?? 0, 2), 'taxa_retencao' => $ret['t'] > 0 ? round(($ret['r'] / $ret['t']) * 100, 1) : 0, 'clientes_retidos' => (int)$ret['r'], 'clientes_total' => (int)$ret['t']]];
}

function getChurnRisk($pdo) {
    $stmt = $pdo->query("SELECT o.Id_Organizacao as id, o.Nome_Empresa as nome, o.Municipio_Endereco as cidade, o.Uf_Endereco as uf, o.Ultimo_Contato, o.Receita_Gerada as receita, DATEDIFF(CURDATE(), o.Ultimo_Contato) as dias_sem_contato, (SELECT COUNT(*) FROM " . ERP_V_CONTAS_A_RECEBER . " car WHERE car.Id_Organizacao = o.Id_Organizacao AND car.Vencimento < CURDATE() AND car.Id_Situacao = 1) as titulos_vencidos FROM " . ERP_V_ORGANIZACAO . " o WHERE o.Flag_Ativo = -1 AND (o.Ultimo_Contato IS NULL OR o.Ultimo_Contato < DATE_SUB(CURDATE(), INTERVAL 60 DAY)) ORDER BY dias_sem_contato DESC LIMIT 15");
    $resultado = [];
    foreach ($stmt->fetchAll() as $c) {
        $risco = 0; $fatores = []; $dias = (int)$c['dias_sem_contato'];
        if ($dias > 180) { $risco += 40; $fatores[] = "Sem contato ha {$dias} dias"; } elseif ($dias > 90) { $risco += 25; $fatores[] = "Sem contato ha {$dias} dias"; }
        $tv = (int)$c['titulos_vencidos']; if ($tv > 0) { $risco += min(35, $tv * 10); $fatores[] = "{$tv} titulo(s) vencido(s)"; }
        if ($risco >= 20) $resultado[] = ['id' => $c['id'], 'nome' => $c['nome'], 'cidade' => $c['cidade'], 'uf' => $c['uf'], 'receita' => (float)$c['receita'], 'risco_score' => min(100, $risco), 'nivel' => $risco >= 60 ? 'critico' : ($risco >= 40 ? 'alto' : 'medio'), 'fatores' => $fatores];
    }
    return ['ok' => true, 'data' => ['clientes' => $resultado, 'stats' => ['total' => count($resultado)]]];
}

function getHeatmap($pdo) {
    $data = $pdo->query("SELECT COALESCE(o.Uf_Endereco, 'N/D') as uf, COUNT(DISTINCT o.Id_Organizacao) as clientes, COALESCE(SUM(orc.Valor_Final), 0) as receita FROM " . ERP_V_ORGANIZACAO . " o LEFT JOIN " . ERP_V_ORCAMENTO . " orc ON orc.Id_Organizacao = o.Id_Organizacao AND orc.Id_Status IN (3, 5, 6) WHERE o.Flag_Ativo = -1 GROUP BY o.Uf_Endereco ORDER BY receita DESC")->fetchAll();
    $maxR = max(array_column($data, 'receita') ?: [1]);
    foreach ($data as &$d) { $d['intensidade_receita'] = round(($d['receita'] / $maxR) * 100); }
    return ['ok' => true, 'data' => $data];
}

function getRanking($pdo, InputValidator $v, $ttl) {
    $tipo = $v->enum('tipo', 'receita', ['receita', 'quantidade', 'ticket']);
    $periodo = $v->enum('periodo', '12m', ['1m', '3m', '6m', '12m']);
    $limit = $v->int('limit', 10, ['min' => 5, 'max' => 20]);
    $ck = "panel:05:ranking:{$tipo}:{$periodo}:{$limit}";
    $cached = RedisHelper::tryGetCache($ck);
    if ($cached !== null) { header('X-Cache: HIT'); return json_decode($cached, true); }
    $pf = match($periodo) { '1m' => 'AND orc.Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)', '3m' => 'AND orc.Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)', '6m' => 'AND orc.Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)', default => 'AND orc.Data_Criacao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)' };
    $sql = "SELECT o.Id_Organizacao as id, o.Nome_Empresa as nome, o.Uf_Endereco as uf, COALESCE(SUM(orc.Valor_Final), 0) as valor FROM " . ERP_V_ORGANIZACAO . " o INNER JOIN " . ERP_V_ORCAMENTO . " orc ON orc.Id_Organizacao = o.Id_Organizacao WHERE orc.Id_Status IN (3, 5, 6) {$pf} GROUP BY o.Id_Organizacao ORDER BY valor DESC LIMIT :lim";
    $stmt = $pdo->prepare($sql); $stmt->bindValue(':lim', $limit, PDO::PARAM_INT); $stmt->execute();
    $results = $stmt->fetchAll(); foreach ($results as $i => &$r) $r['posicao'] = $i + 1;
    $result = ['ok' => true, 'data' => ['items' => $results, 'tipo' => $tipo, 'periodo' => $periodo]];
    RedisHelper::setCache($ck, json_encode($result), $ttl);
    return $result;
}

function searchClientes($pdo, InputValidator $v) {
    $q = $v->rawString('q', '', ['maxLength' => 100]);
    $limit = $v->int('limit', 8, ['min' => 3, 'max' => 10]);
    if (strlen($q) < 2) return ['ok' => true, 'data' => [], 'query' => $q];
    $search = '%' . $q . '%';
    $stmt = $pdo->prepare("SELECT o.Id_Organizacao as id, o.Nome_Empresa as nome, o.Municipio_Endereco as cidade, o.Uf_Endereco as uf, COALESCE(o.Receita_Gerada, 0) as receita FROM " . ERP_V_ORGANIZACAO . " o WHERE o.Nome_Empresa LIKE :s1 OR o.Razao_Social LIKE :s2 ORDER BY o.Receita_Gerada DESC LIMIT :lim");
    $stmt->bindValue(':s1', $search); $stmt->bindValue(':s2', $search); $stmt->bindValue(':lim', $limit, PDO::PARAM_INT); $stmt->execute();
    return ['ok' => true, 'data' => $stmt->fetchAll(), 'query' => $q];
}

function getComparativo($pdo, InputValidator $v) {
    $p = $v->enum('periodo', 'mes', ['mes', 'ano']);
    if ($p === 'mes') {
        $a = "Data_Criacao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
        $an = "Data_Criacao >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND Data_Criacao < DATE_FORMAT(CURDATE(), '%Y-%m-01')";
    } else {
        $a = "Data_Criacao >= DATE_FORMAT(CURDATE(), '%Y-01-01')";
        $an = "Data_Criacao >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-01-01') AND Data_Criacao < DATE_FORMAT(CURDATE(), '%Y-01-01')";
    }
    $ca = $pdo->query("SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE {$a}")->fetchColumn();
    $cp = $pdo->query("SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE {$an}")->fetchColumn();
    $calc = fn($x, $y) => $y == 0 ? ($x > 0 ? 100 : 0) : round((($x - $y) / $y) * 100, 1);
    return ['ok' => true, 'data' => ['periodo' => $p, 'metricas' => [['nome' => 'Novos Clientes', 'label' => 'Novos Clientes', 'atual' => (int)$ca, 'anterior' => (int)$cp, 'variacao' => $calc($ca, $cp)]]]];
}

function getClientesList($pdo, InputValidator $v) {
    $pg = $v->int('page', 1, ['min' => 1]);
    $pp = $v->int('per_page', 25, ['min' => 10, 'max' => 100]);
    $of = ($pg - 1) * $pp;
    $w = ['1=1']; $b = [];
    $status = $v->enum('status', 'all', ['all', 'ativo', 'inativo']);
    if ($status !== 'all') $w[] = $status === 'ativo' ? 'o.Flag_Ativo = -1' : '(o.Flag_Ativo = 0 OR o.Flag_Ativo IS NULL)';
    $uf = $v->string('uf', '', ['pattern' => '/^[A-Z]{2}$/']);
    if ($uf) { $w[] = 'o.Uf_Endereco = :uf'; $b[':uf'] = $uf; }
    $search = $v->rawString('search', '', ['maxLength' => 100]);
    if ($search) { $s = '%' . $search . '%'; $w[] = '(o.Nome_Empresa LIKE :s1 OR o.Razao_Social LIKE :s2)'; $b[':s1'] = $s; $b[':s2'] = $s; }
    // 2026-09-16 (backlog painel 05): seletor de período do frontend filtra pela data de cadastro do cliente
    $di = $v->date('dataInicio'); $df = $v->date('dataFim');
    if ($di) { $w[] = 'o.Data_Criacao >= :di'; $b[':di'] = $di; }
    if ($df) { $w[] = 'o.Data_Criacao < DATE_ADD(:df, INTERVAL 1 DAY)'; $b[':df'] = $df; }
    $wc = implode(' AND ', $w);
    $tc = $pdo->prepare("SELECT COUNT(*) FROM " . ERP_V_ORGANIZACAO . " o WHERE {$wc}"); $tc->execute($b); $total = $tc->fetchColumn();
    $stmt = $pdo->prepare("SELECT o.Id_Organizacao, o.Nome_Empresa, o.Razao_Social, o.Flag_Ativo, o.Municipio_Endereco, o.Uf_Endereco, o.Receita_Gerada, o.Qtd_Orcs_Ganhos FROM " . ERP_V_ORGANIZACAO . " o WHERE {$wc} ORDER BY o.Nome_Empresa LIMIT :lm OFFSET :of");
    foreach ($b as $k => $val) $stmt->bindValue($k, $val); $stmt->bindValue(':lm', $pp, PDO::PARAM_INT); $stmt->bindValue(':of', $of, PDO::PARAM_INT); $stmt->execute();
    $cl = $stmt->fetchAll(); foreach ($cl as &$c) { $c['status'] = $c['Flag_Ativo'] == -1 ? 'ativo' : 'inativo'; }
    return ['ok' => true, 'data' => ['items' => $cl, 'pagination' => ['page' => $pg, 'per_page' => $pp, 'total' => (int)$total, 'total_pages' => ceil($total / $pp)]]];
}

function exportCSV($pdo, InputValidator $v) {
    $stmt = $pdo->query("SELECT Nome_Empresa, Razao_Social, Cnpj, CASE WHEN Flag_Ativo = -1 THEN 'Ativo' ELSE 'Inativo' END as Status, Municipio_Endereco as Cidade, Uf_Endereco as UF, Receita_Gerada FROM " . ERP_V_ORGANIZACAO . " Organizacao ORDER BY Nome_Empresa LIMIT 5000");
    header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="clientes_' . date('Y-m-d_His') . '.csv"');
    $out = fopen('php://output', 'w'); fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); $d = $stmt->fetchAll();
    if (count($d) > 0) { fputcsv($out, array_keys($d[0]), ';'); foreach ($d as $r) fputcsv($out, $r, ';'); } fclose($out);
}

function getCliente360($pdo, $id) {
    $c = $pdo->prepare("SELECT * FROM " . ERP_V_ORGANIZACAO . " Organizacao WHERE Id_Organizacao = :id"); $c->execute([':id' => $id]); $cliente = $c->fetch();
    if (!$cliente) return ['ok' => false, 'error' => 'CLIENTE_NOT_FOUND'];
    $or = $pdo->prepare("SELECT Id_Orc, Nome_Vendedor, Tipo_Negocio, Valor_Final, Id_Status, Data_Criacao FROM " . ERP_V_ORCAMENTO . " Orcamento WHERE Id_Organizacao = :id ORDER BY Data_Criacao DESC LIMIT 50"); $or->execute([':id' => $id]);
    $orcamentos = $or->fetchAll(); $os = ['total' => count($orcamentos), 'ganhos' => 0, 'valor_total' => 0];
    foreach ($orcamentos as $o) { if (in_array($o['Id_Status'], [3, 5, 6])) { $os['ganhos']++; $os['valor_total'] += (float)$o['Valor_Final']; } }
    return ['ok' => true, 'data' => ['cliente' => $cliente, 'orcamentos' => ['items' => $orcamentos, 'stats' => $os]]];
}
