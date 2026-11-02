<?php
/**
 * Panel-01 API — Gestão de Requisições Enterprise
 * @job_name api-painel-01
 * @version 3.7.0-ERPV2-ENTERPRISE
 * @updated 2026-09-16
 *
 * v3.7.0-ERPV2: ERP dropou Requisicao/Requisicao_Item/Requisicao_Midia (19–20/08/2026). SQL inalterado; as tabelas
 *   legadas viraram tabelas derivadas de compatibilidade sobre fin_requisicao_pagamento_x (api/modules/panels/_erp-compat.php).
 * @updated 2026-01-25
 *
 * v3.6.0-P06: Migrado para ApiResponse (padronização)
 */

require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../../../config/db_connection.php';
require_once __DIR__ . '/../_erp-compat.php'; // tabelas derivadas: schema novo do ERP → shape legado (2026-09-16)

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$validator = InputValidator::fromGet();
$allowedActions = ['default', 'kpis', 'list', 'situacoes', 'centros', 'categorias', 'fornecedores', 'search', 'export', 'resumo-mensal', 'top-fornecedores', 'top-categorias'];
$action = $validator->enum('action', 'default', $allowedActions);
$requisicaoId = $validator->id('id') ?: null;
$CACHE_TTL = RedisConfig::TTL_UI;

$cacheableActions = ['default', 'kpis', 'situacoes', 'centros', 'categorias', 'fornecedores', 'resumo-mensal', 'top-categorias'];

if (in_array($action, $cacheableActions, true) && !$requisicaoId) {
    $cacheKey = "panel:01:{$action}";
    if ($action === 'top-fornecedores') {
        $limitCache = $validator->int('limit', 10, ['min' => 5, 'max' => 20]);
        $cacheKey = "panel:01:top-fornecedores:{$limitCache}";
    }
    if (RedisHelper::serveIfCached($cacheKey)) { exit; }
}

header('X-Cache: MISS');

try {
    $pdo = getConnection('DSHOW_PROD');
} catch (Exception $e) {
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
    exit;
}

try {
    if ($requisicaoId) {
        $result = getRequisicao360($pdo, $requisicaoId);
        if (!$result['ok']) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); }
        else { echo ApiResponse::buildSuccess($result['data'], ['version' => '3.7.0-ERPV2-ENTERPRISE']); }
        RedisHelper::close();
    }
    elseif ($action === 'kpis') { $response = getKPIs($pdo); cacheAndOutput('panel:01:kpis', $response, $CACHE_TTL); }
    elseif ($action === 'list') { $response = getRequisicoesList($pdo, $validator); $envelope = json_decode(ApiResponse::buildSuccess($response['data'], ['pagination' => $response['pagination'], 'version' => '3.7.0-ERPV2-ENTERPRISE']), true); $envelope['pagination'] = $response['pagination']; /* v3.7.0: o front lê result.pagination no topo (services/api.js:114), não meta.pagination */ echo json_encode($envelope, JSON_UNESCAPED_UNICODE); RedisHelper::close(); }
    elseif ($action === 'situacoes') { $response = getSituacoes($pdo); cacheAndOutput('panel:01:situacoes', $response, $CACHE_TTL); }
    elseif ($action === 'centros') { $response = getCentrosCusto($pdo); cacheAndOutput('panel:01:centros', $response, $CACHE_TTL); }
    elseif ($action === 'categorias') { $response = getCategorias($pdo); cacheAndOutput('panel:01:categorias', $response, $CACHE_TTL); }
    elseif ($action === 'fornecedores') { $response = getFornecedores($pdo); cacheAndOutput('panel:01:fornecedores', $response, $CACHE_TTL); }
    elseif ($action === 'search') { $response = searchRequisicoes($pdo, $validator); echo ApiResponse::buildSuccess($response['data'], ['query' => $response['query'] ?? '', 'version' => '3.7.0-ERPV2-ENTERPRISE']); RedisHelper::close(); }
    elseif ($action === 'export') { exportCSV($pdo, $validator); RedisHelper::close(); }
    elseif ($action === 'resumo-mensal') { $response = getResumoMensal($pdo); cacheAndOutput('panel:01:resumo-mensal', $response, $CACHE_TTL); }
    elseif ($action === 'top-fornecedores') { $limit = $validator->int('limit', 10, ['min' => 5, 'max' => 20]); $response = getTopFornecedores($pdo, $limit); cacheAndOutput("panel:01:top-fornecedores:{$limit}", $response, $CACHE_TTL); }
    elseif ($action === 'top-categorias') { $response = getTopCategorias($pdo); cacheAndOutput('panel:01:top-categorias', $response, $CACHE_TTL); }
    else {
        $response = ['kpis' => getKPIs($pdo)['data'], 'requisicoes' => getRequisicoesList($pdo, $validator)['data'], 'filters' => ['situacoes' => getSituacoes($pdo)['data'], 'centros' => getCentrosCusto($pdo)['data']]];
        cacheAndOutput('panel:01:default', $response, $CACHE_TTL);
    }
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function cacheAndOutput($key, $data, $ttl) {
    $output = ApiResponse::buildSuccess($data['data'] ?? $data, ['version' => '3.7.0-ERPV2-ENTERPRISE']);
    RedisHelper::cacheAndReturn($key, $output, $ttl);
}

function getKPIs($pdo) {
    $stmt = $pdo->query("SELECT COUNT(*) as total, COALESCE(SUM(Total), 0) as valor_total FROM " . ERP_V_REQUISICAO . " Requisicao"); $totais = $stmt->fetch();
    $stmt = $pdo->query("SELECT Id_Situacao, Situacao, COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Situacao IS NOT NULL GROUP BY Id_Situacao, Situacao ORDER BY Id_Situacao");
    $situacaoMap = []; foreach ($stmt->fetchAll() as $s) { $situacaoMap[$s['Id_Situacao']] = ['nome' => $s['Situacao'], 'qtd' => (int)$s['qtd'], 'valor' => (float)$s['valor']]; }
    $stmt = $pdo->query("SELECT COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE MONTH(Data_Requisicao) = MONTH(CURDATE()) AND YEAR(Data_Requisicao) = YEAR(CURDATE())"); $esteMes = $stmt->fetch();
    $stmt = $pdo->query("SELECT COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE MONTH(Data_Requisicao) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(Data_Requisicao) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))"); $mesAnterior = $stmt->fetch();
    $variacaoQtd = $mesAnterior['qtd'] > 0 ? round((($esteMes['qtd'] - $mesAnterior['qtd']) / $mesAnterior['qtd']) * 100, 1) : 0;
    $variacaoValor = $mesAnterior['valor'] > 0 ? round((($esteMes['valor'] - $mesAnterior['valor']) / $mesAnterior['valor']) * 100, 1) : 0;
    $stmt = $pdo->query("SELECT COUNT(*) as qtd, COALESCE(SUM(Valor_Reembolso), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Reembolso = 1"); $reembolsos = $stmt->fetch();
    return ['ok' => true, 'data' => ['total' => (int)$totais['total'], 'valorTotal' => (float)$totais['valor_total'], 'porSituacao' => $situacaoMap, 'pendenteLancamento' => $situacaoMap[1304] ?? ['qtd' => 0, 'valor' => 0], 'pendentePagamento' => $situacaoMap[1305] ?? ['qtd' => 0, 'valor' => 0], 'pago' => $situacaoMap[1306] ?? ['qtd' => 0, 'valor' => 0], 'cancelado' => $situacaoMap[1308] ?? ['qtd' => 0, 'valor' => 0], 'esteMes' => ['qtd' => (int)$esteMes['qtd'], 'valor' => (float)$esteMes['valor'], 'variacaoQtd' => $variacaoQtd, 'variacaoValor' => $variacaoValor], 'reembolsos' => ['qtd' => (int)$reembolsos['qtd'], 'valor' => (float)$reembolsos['valor']], 'timestamp' => date('Y-m-d H:i:s')]];
}

function getRequisicoesList($pdo, InputValidator $v) {
    $pagination = $v->pagination(20, 100);
    $page = $pagination['page']; $limit = $pagination['limit']; $offset = $pagination['offset'];
    $where = ['1=1']; $binds = [];
    $situacao = $v->id('situacao'); if ($situacao) { $where[] = 'r.Id_Situacao = :situacao'; $binds[':situacao'] = $situacao; }
    $centro = $v->id('centro'); if ($centro) { $where[] = 'r.Id_Centro_Custo = :centro'; $binds[':centro'] = $centro; }
    $categoria = $v->id('categoria'); if ($categoria) { $where[] = 'r.Categoria = :categoria'; $binds[':categoria'] = $categoria; }
    $fornecedor = $v->id('fornecedor'); if ($fornecedor) { $where[] = 'r.Id_Fornecedor = :fornecedor'; $binds[':fornecedor'] = $fornecedor; }
    $dataInicio = $v->date('dataInicio'); $dataFim = $v->date('dataFim');
    if ($dataInicio) { $where[] = 'r.Data_Requisicao >= :dataInicio'; $binds[':dataInicio'] = $dataInicio; }
    if ($dataFim) { $where[] = 'r.Data_Requisicao <= :dataFim'; $binds[':dataFim'] = $dataFim; }
    $q = $v->rawString('q', '', ['maxLength' => 100]);
    if (strlen($q) >= 2) { $where[] = '(r.Descricao_Requisicao LIKE :q OR r.Fornecedor LIKE :q2 OR r.Cliente LIKE :q3)'; $search = '%' . $q . '%'; $binds[':q'] = $search; $binds[':q2'] = $search; $binds[':q3'] = $search; }
    if ($v->has('reembolso')) { $where[] = 'r.Reembolso = :reembolso'; $binds[':reembolso'] = $v->bool('reembolso') ? 1 : 0; }
    $whereClause = implode(' AND ', $where);
    $sorting = $v->sorting(['Id_Requisicao', 'Data_Requisicao', 'Total', 'Situacao', 'Centro_De_Custo', 'Fornecedor'], 'Data_Requisicao', 'DESC');
    $sortField = $sorting['field']; $sortOrder = $sorting['order'];
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM " . ERP_V_REQUISICAO . " r WHERE {$whereClause}"); foreach ($binds as $k => $val) $countStmt->bindValue($k, $val); $countStmt->execute(); $total = (int)$countStmt->fetchColumn();
    $sql = "SELECT r.Id_Requisicao as id, r.Descricao_Requisicao as descricao, r.Qtd as qtd, r.Total as total, r.Id_Situacao as id_situacao, r.Situacao as situacao, r.Id_Centro_Custo as id_centro_custo, r.Centro_De_Custo as centro_custo, r.Id_Fornecedor as id_fornecedor, r.Fornecedor as fornecedor, r.Cliente as cliente, r.Categoria as id_categoria, r.Descricao_Categoria as categoria, r.Reembolso as reembolso, r.Valor_Reembolso as valor_reembolso, r.Beneficiario_Reembolso as beneficiario, r.Criador as criador, r.Data_Requisicao as data_requisicao, r.Data_Criacao as data_criacao, r.Data_Prev_Pgto as data_prev_pgto, r.Observacao as observacao FROM " . ERP_V_REQUISICAO . " r WHERE {$whereClause} ORDER BY {$sortField} {$sortOrder} LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql); foreach ($binds as $k => $val) $stmt->bindValue($k, $val); $stmt->bindValue(':limit', $limit, PDO::PARAM_INT); $stmt->bindValue(':offset', $offset, PDO::PARAM_INT); $stmt->execute();
    $requisicoes = $stmt->fetchAll(); foreach ($requisicoes as &$r) { $r['total'] = (float)$r['total']; $r['qtd'] = (float)$r['qtd']; $r['reembolso'] = (bool)$r['reembolso']; $r['valor_reembolso'] = (float)$r['valor_reembolso']; $r['descricao_curta'] = mb_strlen($r['descricao']) > 60 ? mb_substr($r['descricao'], 0, 60) . '...' : $r['descricao']; }
    return ['ok' => true, 'data' => $requisicoes, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => ceil($total / $limit)]];
}

function getRequisicao360($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Requisicao = :id"); $stmt->execute([':id' => $id]); $requisicao = $stmt->fetch();
    if (!$requisicao) return ['ok' => false, 'error' => 'NOT_FOUND'];
    $stmt = $pdo->prepare("SELECT Id as id, Descricao_Livre as descricao, Quantidade as qtd, Valor_Unitario as valor_unitario, Subtotal as subtotal, Tipo_Un as unidade, Fornecedor as fornecedor, Criador as criador, Data_Criacao as data_criacao FROM " . ERP_V_REQUISICAO_ITEM . " Requisicao_Item WHERE Id_Requisicao = :id ORDER BY Id"); $stmt->execute([':id' => $id]); $itens = $stmt->fetchAll();
    $stmt = $pdo->prepare("SELECT Id as id, Tipo as tipo, Url as url, Nome_arquivo as nome, Tamanho_arquivo as tamanho, Descricao as descricao, Data_criacao as data_criacao FROM " . ERP_V_REQUISICAO_MIDIA . " Requisicao_Midia WHERE Id_Requisicao = :id ORDER BY Data_criacao DESC"); $stmt->execute([':id' => $id]); $midias = $stmt->fetchAll();
    return ['ok' => true, 'data' => ['requisicao' => $requisicao, 'itens' => $itens, 'midias' => $midias, 'totalItens' => count($itens), 'totalMidias' => count($midias)]];
}

function getSituacoes($pdo) { $stmt = $pdo->query("SELECT DISTINCT Id_Situacao as id, Situacao as nome, COUNT(*) as qtd FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Situacao IS NOT NULL AND Situacao IS NOT NULL GROUP BY Id_Situacao, Situacao ORDER BY Id_Situacao"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function getCentrosCusto($pdo) { $stmt = $pdo->query("SELECT DISTINCT Id_Centro_Custo as id, Centro_De_Custo as nome, COUNT(*) as qtd FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Centro_Custo IS NOT NULL AND Centro_De_Custo IS NOT NULL GROUP BY Id_Centro_Custo, Centro_De_Custo ORDER BY Centro_De_Custo"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function getCategorias($pdo) { $stmt = $pdo->query("SELECT DISTINCT Categoria as id, Descricao_Categoria as nome, COUNT(*) as qtd FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Categoria IS NOT NULL AND Descricao_Categoria IS NOT NULL GROUP BY Categoria, Descricao_Categoria ORDER BY Descricao_Categoria LIMIT 50"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function getFornecedores($pdo) { $stmt = $pdo->query("SELECT DISTINCT Id_Fornecedor as id, Fornecedor as nome, COUNT(*) as qtd FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Fornecedor IS NOT NULL AND Fornecedor IS NOT NULL GROUP BY Id_Fornecedor, Fornecedor ORDER BY qtd DESC LIMIT 100"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function searchRequisicoes($pdo, InputValidator $v) { $q = $v->rawString('q', '', ['maxLength' => 100]); $limit = $v->int('limit', 10, ['min' => 5, 'max' => 15]); if (strlen($q) < 2) return ['ok' => true, 'data' => [], 'query' => $q]; $search = '%' . $q . '%'; $stmt = $pdo->prepare("SELECT r.Id_Requisicao as id, LEFT(r.Descricao_Requisicao, 80) as descricao, r.Total as total, r.Situacao as situacao, r.Fornecedor as fornecedor, r.Data_Requisicao as data FROM " . ERP_V_REQUISICAO . " r WHERE r.Descricao_Requisicao LIKE :q1 OR r.Fornecedor LIKE :q2 OR r.Cliente LIKE :q3 OR CAST(r.Id_Requisicao AS CHAR) = :q4 ORDER BY r.Data_Requisicao DESC LIMIT :lim"); $stmt->bindValue(':q1', $search); $stmt->bindValue(':q2', $search); $stmt->bindValue(':q3', $search); $stmt->bindValue(':q4', $q); $stmt->bindValue(':lim', $limit, PDO::PARAM_INT); $stmt->execute(); return ['ok' => true, 'data' => $stmt->fetchAll(), 'query' => $q]; }
function getResumoMensal($pdo) { $stmt = $pdo->query("SELECT DATE_FORMAT(Data_Requisicao, '%Y-%m') as mes, DATE_FORMAT(Data_Requisicao, '%b/%Y') as label, COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Data_Requisicao >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY DATE_FORMAT(Data_Requisicao, '%Y-%m') ORDER BY mes"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function getTopFornecedores($pdo, $limit) { $stmt = $pdo->prepare("SELECT Id_Fornecedor as id, Fornecedor as nome, COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Id_Fornecedor IS NOT NULL AND Fornecedor IS NOT NULL GROUP BY Id_Fornecedor, Fornecedor ORDER BY valor DESC LIMIT :lim"); $stmt->bindValue(':lim', $limit, PDO::PARAM_INT); $stmt->execute(); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function getTopCategorias($pdo) { $stmt = $pdo->query("SELECT Categoria as id, Descricao_Categoria as nome, COUNT(*) as qtd, COALESCE(SUM(Total), 0) as valor FROM " . ERP_V_REQUISICAO . " Requisicao WHERE Categoria IS NOT NULL AND Descricao_Categoria IS NOT NULL GROUP BY Categoria, Descricao_Categoria ORDER BY valor DESC LIMIT 10"); return ['ok' => true, 'data' => $stmt->fetchAll()]; }
function exportCSV($pdo, InputValidator $v) {
    $exportValidator = $v->withOverrides(['limit' => 5000, 'page' => 1]);
    $result = getRequisicoesList($pdo, $exportValidator);
    $requisicoes = $result['data']; $filename = 'requisicoes_' . date('Y-m-d_His') . '.csv'; header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="' . $filename . '"'); $output = fopen('php://output', 'w'); fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); fputcsv($output, ['ID', 'Descricao', 'Qtd', 'Total', 'Situacao', 'Centro Custo', 'Fornecedor', 'Cliente', 'Categoria', 'Reembolso', 'Criador', 'Data Requisicao', 'Prev. Pagamento'], ';'); foreach ($requisicoes as $r) { fputcsv($output, [$r['id'], $r['descricao'], $r['qtd'], number_format($r['total'], 2, ',', '.'), $r['situacao'], $r['centro_custo'], $r['fornecedor'], $r['cliente'], $r['categoria'], $r['reembolso'] ? 'Sim' : 'Nao', $r['criador'], $r['data_requisicao'], $r['data_prev_pgto']], ';'); } fclose($output); }
