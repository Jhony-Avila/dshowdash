<?php
// Panel-16 - Fornecedor 360 Enterprise
// @version 4.6.0-ERPV2-ENTERPRISE
// v4.6.0-ERPV2 (2026-09-16): ERP dropou Fornecedor/Fornecedor_Conta_Bancaria (19–20/08/2026). SQL inalterado; as tabelas legadas
//   viraram tabelas derivadas de compatibilidade sobre ent_fornecedor/ent_*/fin_dado_bancario/fin_chave_pix (_erp-compat.php).
//   Total_Pago/Qtd_Requisicoes são calculados de fin_requisicao_pagamento; Status ATUALIZADO→'Ativo', DESATUALIZADO→'Desatualizado'.

require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../../../config/db_connection.php';
require_once __DIR__ . '/../_erp-compat.php'; // tabelas derivadas: schema novo do ERP → shape legado (2026-09-16)

$validator = InputValidator::fromGet();
$action = $validator->enum('action', 'list', ['list', 'detail', 'kpis']);
$id = $validator->id('id') ?? 0;
$CACHE_TTL = RedisConfig::TTL_UI;

$search = $validator->string('search', '');
$status = $validator->string('status', '');
$uf = $validator->string('uf', '');
$tipo = $validator->enum('tipo', '', ['', 'PJ', 'PF']);
$limit = $validator->int('limit', 50, ['min' => 1, 'max' => 100]);
$offset = $validator->int('offset', 0, ['min' => 0]);

$useListCache = ($action === 'list' && empty($search) && empty($status) && empty($uf) && empty($tipo) && $offset === 0);

$cacheKey = null;
if ($action === 'kpis') $cacheKey = 'panel:16:kpis';
elseif ($useListCache) $cacheKey = "panel:16:list:{$limit}";

if ($cacheKey && RedisHelper::serveIfCached($cacheKey)) { exit; }

try {
    $pdo = getConnection('DSHOW_PROD');
} catch (Exception $e) {
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
    exit;
}

try {
    switch ($action) {
        case 'detail':
            $result = getFornecedor360($pdo, $id);
            echo ApiResponse::buildSuccess($result['data'] ?? $result, ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            break;
        case 'kpis':
            $response = getKPIs($pdo);
            $output = ApiResponse::buildSuccess($response['data'], ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            RedisHelper::cacheAndReturn('panel:16:kpis', $output, $CACHE_TTL);
            break;
        default:
            $response = getListagem($pdo, $search, $status, $uf, $tipo, $limit, $offset);
            $output = ApiResponse::buildSuccess($response['data'], ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            if ($useListCache) {
                RedisHelper::cacheAndReturn("panel:16:list:{$limit}", $output, $CACHE_TTL);
            } else {
                header('Content-Type: application/json; charset=utf-8');
                echo $output;
            }
    }
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function getKPIs($pdo) {
    $kpis = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN Ativo = -1 THEN 1 ELSE 0 END) as ativos, SUM(CASE WHEN Ativo != -1 OR Ativo IS NULL THEN 1 ELSE 0 END) as inativos, SUM(CASE WHEN Tipo = 'PJ' THEN 1 ELSE 0 END) as pj, SUM(CASE WHEN Tipo = 'PF' THEN 1 ELSE 0 END) as pf, SUM(COALESCE(Total_Pago, 0)) as total_pago, SUM(COALESCE(Qtd_Requisicoes, 0)) as total_requisicoes, AVG(COALESCE(Total_Pago, 0)) as media_por_fornecedor, COUNT(DISTINCT Endereco_Uf) as total_ufs, SUM(CASE WHEN Status = 'Desatualizado' THEN 1 ELSE 0 END) as desatualizados FROM " . ERP_V_FORNECEDOR . " Fornecedor")->fetch(PDO::FETCH_ASSOC);
    $pix = $pdo->query("SELECT COUNT(DISTINCT Id_Fornecedor) as com_pix FROM " . ERP_V_FORNECEDOR_CONTA_BANCARIA . " Fornecedor_Conta_Bancaria WHERE Pix IS NOT NULL AND Pix != ''")->fetch(PDO::FETCH_ASSOC);
    $byStatus = $pdo->query("SELECT COALESCE(Status, 'Nao definido') as status, COUNT(*) as qtd FROM " . ERP_V_FORNECEDOR . " Fornecedor GROUP BY Status ORDER BY qtd DESC")->fetchAll(PDO::FETCH_ASSOC);
    $byUF = $pdo->query("SELECT COALESCE(Endereco_Uf, 'N/D') as uf, COUNT(*) as qtd, SUM(COALESCE(Total_Pago, 0)) as valor FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Endereco_Uf IS NOT NULL AND Endereco_Uf != '' GROUP BY Endereco_Uf ORDER BY qtd DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    $topValor = $pdo->query("SELECT Id_Fornecedor as id, COALESCE(Fantasia, Nome_Empresa) as nome, Endereco_Uf as uf, Total_Pago as valor, Qtd_Requisicoes as requisicoes, Status as status FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Total_Pago > 0 ORDER BY Total_Pago DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    return ['ok' => true, 'data' => ['kpis' => ['total' => (int)$kpis['total'], 'ativos' => (int)$kpis['ativos'], 'inativos' => (int)$kpis['inativos'], 'pj' => (int)$kpis['pj'], 'pf' => (int)$kpis['pf'], 'total_pago' => round((float)$kpis['total_pago'], 2), 'media_por_fornecedor' => round((float)$kpis['media_por_fornecedor'], 2), 'total_requisicoes' => (int)$kpis['total_requisicoes'], 'total_ufs' => (int)$kpis['total_ufs'], 'desatualizados' => (int)$kpis['desatualizados'], 'com_pix' => (int)$pix['com_pix']], 'by_status' => $byStatus, 'by_uf' => $byUF, 'top_valor' => $topValor, 'timestamp' => date('Y-m-d H:i:s')]];
}

function getListagem($pdo, $search, $status, $uf, $tipo, $limit, $offset) {
    $where = ['1=1']; $params = [];
    if ($search) { $where[] = "(Nome_Empresa LIKE :search OR Fantasia LIKE :search2 OR Cnpj LIKE :search3 OR Cpf LIKE :search4)"; $params[':search'] = "%{$search}%"; $params[':search2'] = "%{$search}%"; $params[':search3'] = "%{$search}%"; $params[':search4'] = "%{$search}%"; }
    if ($status) { $where[] = "Status = :status"; $params[':status'] = $status; }
    if ($uf) { $where[] = "Endereco_Uf = :uf"; $params[':uf'] = $uf; }
    if ($tipo) { $where[] = "Tipo = :tipo"; $params[':tipo'] = $tipo; }
    $whereClause = implode(' AND ', $where);
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE {$whereClause}"); $countStmt->execute($params); $total = $countStmt->fetchColumn();
    $sql = "SELECT f.Id_Fornecedor as id, f.Tipo as tipo, f.Cnpj as cnpj, f.Cpf as cpf, COALESCE(f.Fantasia, f.Nome_Empresa, f.Nome) as nome, f.Nome_Empresa as razao_social, f.Status as status, f.Ativo as ativo, f.Email as email, f.Telefone as telefone, CONCAT(f.Endereco_Municipio, '/', f.Endereco_Uf) as local, f.Endereco_Uf as uf, f.Total_Pago as total_pago, f.Qtd_Requisicoes as requisicoes, f.Qtd_Requisicoes as qtd_requisicoes, (SELECT Pix FROM " . ERP_V_FORNECEDOR_CONTA_BANCARIA . " fcb WHERE fcb.Id_Fornecedor = f.Id_Fornecedor AND fcb.Pix IS NOT NULL AND fcb.Pix != '' LIMIT 1) as pix, f.Data_Criacao as criado_em, (SELECT COUNT(*) FROM " . ERP_V_FORNECEDOR_CONTA_BANCARIA . " Fornecedor_Conta_Bancaria WHERE Id_Fornecedor = f.Id_Fornecedor) as qtd_contas FROM " . ERP_V_FORNECEDOR . " f WHERE {$whereClause} ORDER BY f.Total_Pago DESC, f.Nome_Empresa ASC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql); $stmt->bindValue(':limit', $limit, PDO::PARAM_INT); $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $val) { $stmt->bindValue($key, $val); } $stmt->execute();
    $fornecedores = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $row['risco'] = ($row['status'] === 'Desatualizado' && $row['total_pago'] > 1000000) ? 'alto' : (($row['status'] === 'Desatualizado') ? 'medio' : 'baixo'); $fornecedores[] = $row; }
    $ufs = $pdo->query("SELECT DISTINCT Endereco_Uf FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Endereco_Uf IS NOT NULL AND Endereco_Uf != '' ORDER BY Endereco_Uf")->fetchAll(PDO::FETCH_COLUMN);
    return ['ok' => true, 'data' => ['fornecedores' => $fornecedores, 'pagination' => ['total' => (int)$total, 'limit' => $limit, 'offset' => $offset, 'pages' => ceil($total / $limit), 'page' => floor($offset / $limit) + 1], 'filters' => ['ufs' => $ufs, 'status' => ['Ativo', 'Desatualizado'], 'tipos' => ['PJ', 'PF']], 'timestamp' => date('Y-m-d H:i:s')]];
}

function getFornecedor360($pdo, $id) {
    if (!$id) return ['ok' => false, 'error' => 'ID obrigatorio'];
    $stmt = $pdo->prepare("SELECT * FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Id_Fornecedor = ?"); $stmt->execute([$id]); $fornecedor = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$fornecedor) return ['ok' => false, 'error' => 'Fornecedor nao encontrado'];
    $contas = [];
    $stmt = $pdo->prepare("SELECT * FROM " . ERP_V_FORNECEDOR_CONTA_BANCARIA . " Fornecedor_Conta_Bancaria WHERE Id_Fornecedor = ?"); $stmt->execute([$id]);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $contas[] = ['id' => $row['Id_Conta'], 'titular' => $row['Nome_Titular'], 'cpf_cnpj' => $row['Cpf_Cnpj'], 'agencia' => $row['Agencia'], 'conta' => $row['Conta'], 'pix' => $row['Pix']]; }
    $risco = 'baixo'; $alertas = [];
    if ($fornecedor['Status'] === 'Desatualizado') { $risco = 'medio'; $alertas[] = 'Cadastro desatualizado'; }
    if (empty($contas)) { $alertas[] = 'Sem conta bancaria cadastrada'; }
    if ($fornecedor['Total_Pago'] > 1000000 && $fornecedor['Status'] === 'Desatualizado') { $risco = 'alto'; $alertas[] = 'Fornecedor critico com cadastro desatualizado'; }
    return ['ok' => true, 'data' => ['nome' => ($fornecedor['Fantasia'] ?: ($fornecedor['Nome_Empresa'] ?: $fornecedor['Nome'])), 'cnpj' => $fornecedor['Cnpj'], 'identidade' => ['id' => $fornecedor['Id_Fornecedor'], 'tipo' => $fornecedor['Tipo'], 'cnpj' => $fornecedor['Cnpj'], 'cpf' => $fornecedor['Cpf'], 'nome' => $fornecedor['Nome'], 'razao_social' => $fornecedor['Nome_Empresa'], 'fantasia' => $fornecedor['Fantasia'], 'status' => $fornecedor['Status'], 'ativo' => $fornecedor['Ativo']], 'contato' => ['email' => $fornecedor['Email'], 'telefone' => $fornecedor['Telefone'], 'celular' => $fornecedor['Celular']], 'endereco' => ['logradouro' => $fornecedor['Endereco_Logradouro'], 'numero' => $fornecedor['Endereco_Numero'], 'bairro' => $fornecedor['Endereco_Bairro'], 'cidade' => $fornecedor['Endereco_Municipio'], 'uf' => $fornecedor['Endereco_Uf'], 'cep' => $fornecedor['Endereco_Cep']], 'financeiro' => ['total_pago' => (float)$fornecedor['Total_Pago'], 'requisicoes' => (int)$fornecedor['Qtd_Requisicoes']], 'contas_bancarias' => $contas, 'risco' => ['nivel' => $risco, 'alertas' => $alertas], 'governanca' => ['criado_em' => $fornecedor['Data_Criacao'], 'atualizado_em' => $fornecedor['Ultima_Modificacao']], 'timestamp' => date('Y-m-d H:i:s')]];
}
