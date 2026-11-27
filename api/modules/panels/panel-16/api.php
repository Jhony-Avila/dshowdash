<?php
// Panel-16 - Fornecedor 360 Enterprise
// @version 4.6.0-ERPV2-ENTERPRISE
// v4.6.0-ERPV2 (2026-09-16): ERP dropou Fornecedor/Fornecedor_Conta_Bancaria (19–20/08/2026). SQL inalterado; as tabelas legadas
//   viraram tabelas derivadas de compatibilidade sobre ent_fornecedor/ent_*/fin_dado_bancario/fin_chave_pix (_erp-compat.php).
//   26/11 (CP-003): Total_Pago suspenso (null); Qtd_Requisicoes sem canceladas; status cadastral Atualizado/Desatualizado/Desconhecido (camada nova).

require_once __DIR__ . '/../_init.php';
require_once __DIR__ . '/../../../../config/db_connection.php';
require_once __DIR__ . '/../_erp-ponto.php'; // 26/11: origem por painel — legado (_erp-compat.php) ou ERP NOVO (ds_prod), flag erp_novo.painel16 DESLIGADA
// 26/11 CP-003 (ChatGPT, LOTE7, incorporado): SEM dados bancários e PIX (nem consulta, nem contagem, nem alerta) até o vínculo por bank_account_id;
// total pago e ranking financeiro suspensos (null) até a fonte de baixas; status cadastral Atualizado/Desatualizado/Desconhecido.

// PAINEIS-SESSAO (17/11/2026): contenção — exigir sessão (mesmo mecanismo do painel-12/panel-05).
// Antes, o painel respondia SEM login (dados do ERP: fornecedores com CNPJ/CPF, contato, PIX e contas bancárias). Reverter: release anterior.
require_once __DIR__ . '/../../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../core/SessionGate.php';
SessionGate::start();
AuthHelpers::requireAuth();
// ERP NOVO (26/11, mesma regra dos painéis 01/05): origem DEPOIS do login e ANTES do cache e da consulta; permissão por pessoa na origem nova (403).
$ERP_ORIGEM = erp_ponto_origem('painel16');
if ($ERP_ORIGEM === 'novo' && !erp_novo_autorizado(AuthHelpers::getCurrentUserId())) { ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403); exit; }
$CACHE_PREFIX = $ERP_ORIGEM === 'novo' ? 'panel:16n:' : 'panel:16:cp003:';   // o formato mudou (sem banco/PIX): nunca servir o cache antigo

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
if ($action === 'kpis') $cacheKey = "{$CACHE_PREFIX}kpis";
elseif ($useListCache) $cacheKey = "{$CACHE_PREFIX}list:{$limit}";

if ($cacheKey && RedisHelper::serveIfCached($cacheKey)) { exit; }

try {
    $pdo = erp_ponto_pdo('painel16');
} catch (Throwable $e) {
    if ($ERP_ORIGEM === 'novo') { ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'erp', 'estado' => 'indisponivel']); exit; }
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
    exit;
}

try {
    switch ($action) {
        case 'detail':
            $result = getFornecedor360($pdo, $id);
            if (!$result['ok']) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); exit; }
            echo ApiResponse::buildSuccess($result['data'] ?? $result, ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            break;
        case 'kpis':
            $response = getKPIs($pdo);
            $output = ApiResponse::buildSuccess($response['data'], ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            RedisHelper::cacheAndReturn("{$CACHE_PREFIX}kpis", $output, $CACHE_TTL);
            break;
        default:
            $response = getListagem($pdo, $search, $status, $uf, $tipo, $limit, $offset);
            $output = ApiResponse::buildSuccess($response['data'], ['version' => '4.6.0-ERPV2-ENTERPRISE']);
            if ($useListCache) {
                RedisHelper::cacheAndReturn("{$CACHE_PREFIX}list:{$limit}", $output, $CACHE_TTL);
            } else {
                header('Content-Type: application/json; charset=utf-8');
                echo $output;
            }
    }
} catch (Throwable $e) {
    RedisHelper::close();
    if ($ERP_ORIGEM === 'novo') { error_log('[painel16] erp novo: ' . get_class($e)); ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'erp', 'estado' => 'indisponivel']); }
    else { ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500); }
}

function getKPIs($pdo) {
    $kpis = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN Ativo = -1 THEN 1 ELSE 0 END) as ativos, SUM(CASE WHEN Ativo != -1 OR Ativo IS NULL THEN 1 ELSE 0 END) as inativos, SUM(CASE WHEN Tipo = 'PJ' THEN 1 ELSE 0 END) as pj, SUM(CASE WHEN Tipo = 'PF' THEN 1 ELSE 0 END) as pf, SUM(COALESCE(Qtd_Requisicoes, 0)) as total_requisicoes, COUNT(DISTINCT Endereco_Uf) as total_ufs, SUM(CASE WHEN Status = 'Desatualizado' THEN 1 ELSE 0 END) as desatualizados FROM " . ERP_V_FORNECEDOR . " Fornecedor")->fetch(PDO::FETCH_ASSOC);
    $byStatus = $pdo->query("SELECT COALESCE(Status, 'Nao definido') as status, COUNT(*) as qtd FROM " . ERP_V_FORNECEDOR . " Fornecedor GROUP BY Status ORDER BY qtd DESC")->fetchAll(PDO::FETCH_ASSOC);
    $byUF = $pdo->query("SELECT COALESCE(Endereco_Uf, 'N/D') as uf, COUNT(*) as qtd FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Endereco_Uf IS NOT NULL AND Endereco_Uf != '' GROUP BY Endereco_Uf ORDER BY qtd DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    return ['ok' => true, 'data' => ['kpis' => ['total' => (int)$kpis['total'], 'ativos' => (int)$kpis['ativos'], 'inativos' => (int)$kpis['inativos'], 'pj' => (int)$kpis['pj'], 'pf' => (int)$kpis['pf'], 'total_pago' => null, 'media_por_fornecedor' => null, 'total_requisicoes' => (int)$kpis['total_requisicoes'], 'total_ufs' => (int)$kpis['total_ufs'], 'desatualizados' => (int)$kpis['desatualizados']], 'by_status' => $byStatus, 'by_uf' => $byUF, 'top_valor' => null, 'timestamp' => date('Y-m-d H:i:s')]];
}

function getListagem($pdo, $search, $status, $uf, $tipo, $limit, $offset) {
    $where = ['1=1']; $params = [];
    if ($search) { $where[] = "(Nome_Empresa LIKE :search OR Fantasia LIKE :search2 OR Cnpj LIKE :search3 OR Cpf LIKE :search4)"; $params[':search'] = "%{$search}%"; $params[':search2'] = "%{$search}%"; $params[':search3'] = "%{$search}%"; $params[':search4'] = "%{$search}%"; }
    if ($status) { $where[] = "Status = :status"; $params[':status'] = $status; }
    if ($uf) { $where[] = "Endereco_Uf = :uf"; $params[':uf'] = $uf; }
    if ($tipo) { $where[] = "Tipo = :tipo"; $params[':tipo'] = $tipo; }
    $whereClause = implode(' AND ', $where);
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE {$whereClause}"); $countStmt->execute($params); $total = $countStmt->fetchColumn();
    $sql = "SELECT f.Id_Fornecedor as id, f.Tipo as tipo, f.Cnpj as cnpj, f.Cpf as cpf, COALESCE(f.Fantasia, f.Nome_Empresa, f.Nome) as nome, f.Nome_Empresa as razao_social, f.Status as status, f.Ativo as ativo, f.Email as email, f.Telefone as telefone, CONCAT(f.Endereco_Municipio, '/', f.Endereco_Uf) as local, f.Endereco_Uf as uf, NULL as total_pago, f.Qtd_Requisicoes as requisicoes, f.Qtd_Requisicoes as qtd_requisicoes, f.Data_Criacao as criado_em FROM " . ERP_V_FORNECEDOR . " f WHERE {$whereClause} ORDER BY nome ASC, f.Id_Fornecedor ASC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql); $stmt->bindValue(':limit', $limit, PDO::PARAM_INT); $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $val) { $stmt->bindValue($key, $val); } $stmt->execute();
    $fornecedores = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $row['risco'] = $row['status'] === 'Desatualizado' ? 'medio' : null; $fornecedores[] = $row; }
    $ufs = $pdo->query("SELECT DISTINCT Endereco_Uf FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Endereco_Uf IS NOT NULL AND Endereco_Uf != '' ORDER BY Endereco_Uf")->fetchAll(PDO::FETCH_COLUMN);
    return ['ok' => true, 'data' => ['fornecedores' => $fornecedores, 'pagination' => ['total' => (int)$total, 'limit' => $limit, 'offset' => $offset, 'pages' => ceil($total / $limit), 'page' => floor($offset / $limit) + 1], 'filters' => ['ufs' => $ufs, 'status' => ['Atualizado', 'Desatualizado', 'Desconhecido'], 'tipos' => ['PJ', 'PF']], 'timestamp' => date('Y-m-d H:i:s')]];
}

function getFornecedor360($pdo, $id) {
    if (!$id) return ['ok' => false, 'error' => 'ID obrigatorio'];
    $stmt = $pdo->prepare("SELECT * FROM " . ERP_V_FORNECEDOR . " Fornecedor WHERE Id_Fornecedor = ?"); $stmt->execute([$id]); $fornecedor = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$fornecedor) return ['ok' => false, 'error' => 'Fornecedor nao encontrado'];
    $risco = null; $alertas = [];
    if ($fornecedor['Status'] === 'Desatualizado') { $risco = 'medio'; $alertas[] = 'Cadastro desatualizado'; }
    return ['ok' => true, 'data' => ['nome' => ($fornecedor['Fantasia'] ?: ($fornecedor['Nome_Empresa'] ?: $fornecedor['Nome'])), 'cnpj' => $fornecedor['Cnpj'], 'identidade' => ['id' => $fornecedor['Id_Fornecedor'], 'tipo' => $fornecedor['Tipo'], 'cnpj' => $fornecedor['Cnpj'], 'cpf' => $fornecedor['Cpf'], 'nome' => $fornecedor['Nome'], 'razao_social' => $fornecedor['Nome_Empresa'], 'fantasia' => $fornecedor['Fantasia'], 'status' => $fornecedor['Status'], 'ativo' => $fornecedor['Ativo']], 'contato' => ['email' => $fornecedor['Email'], 'telefone' => $fornecedor['Telefone'], 'celular' => $fornecedor['Celular']], 'endereco' => ['logradouro' => $fornecedor['Endereco_Logradouro'], 'numero' => $fornecedor['Endereco_Numero'], 'bairro' => $fornecedor['Endereco_Bairro'], 'cidade' => $fornecedor['Endereco_Municipio'], 'uf' => $fornecedor['Endereco_Uf'], 'cep' => $fornecedor['Endereco_Cep']], 'financeiro' => ['total_pago' => null, 'requisicoes' => (int)$fornecedor['Qtd_Requisicoes']], 'risco' => ['nivel' => $risco, 'alertas' => $alertas], 'governanca' => ['criado_em' => $fornecedor['Data_Criacao'], 'atualizado_em' => $fornecedor['Ultima_Modificacao']], 'timestamp' => date('Y-m-d H:i:s')]];
}
