<?php
// _erp-compat-novo.php — camada de compatibilidade sobre o ERP NOVO (`ds_prod`, RDS do Walter; tabelas e enums em INGLÊS, DATETIME em UTC)
// → o MESMO shape legado (Requisicao, Organizacao, Orcamento, Contas_A_Receber, Fornecedor…) dos painéis 01/05/16 (31/10/2026, Noite 2).
// Só é carregada por `_erp-ponto.php` com a flag `erp_novo.<painel>` ligada. De-para: docs do app handoff/erp-rds-migracao/PLANO-MIGRACAO-DASH.md §3/§4.
// Mapeamentos: requisição PENDING→1304 · CONVERTED/PARTIALLY_PAID→1305 · PAID→1306 · ACCOUNTS_CANCELLED/CANCELLED→1308; orçamento WON→3 · LOST→4 ·
// IN_PROGRESS→1 · REJECTED→2; parcela OPEN/PARTIAL/OVERDUE→1 · RECEIVED/RECOVERED→2 · demais→3; fornecedor UP_TO_DATE→'Ativo'.
// Datas: todo DATETIME do ERP novo é UTC → convertido para Brasília AQUI (CONVERT_TZ por deslocamento numérico; não depende das tabelas de fuso),
// porque os painéis comparam com CURDATE()/NOW() da sessão (-03:00). Colunas DATE (vencimento, previsão de pagamento) são civis — sem conversão.
// `default` e `key` são palavras reservadas → entre crases.
// 26/11 (rebase, PM-007 F21): `s3_key` NÃO sai como Url — o S3 do Walter é privado e a chave não é URL pública; o anexo aparece só com nome/tipo/tamanho
//   até existir um caminho de download autorizado (pergunta W-6). Status desconhecido → 1308/2/3 é o legado (degrau semântico F13/F14, depois).
if (!defined('ERP_V_REQUISICAO')) {
    $tz = static fn (string $c): string => "CONVERT_TZ($c,'+00:00','-03:00')";
    $fornecedorNome = "(SELECT COALESCE(NULLIF(fo.trade_name,''), NULLIF(fo.company_name,''), fp.name) FROM pty_supplier f JOIN pty_party_base fe ON fe.id=f.entity_id LEFT JOIN pty_organization fo ON fo.entity_id=fe.id AND fo.deleted=0 LEFT JOIN pty_person fp ON fp.entity_id=fe.id AND fp.deleted=0 WHERE f.id=r.supplier_id LIMIT 1)";
    define('ERP_V_REQUISICAO', "(SELECT r.id AS Id_Requisicao, r.description AS Descricao_Requisicao, (SELECT COALESCE(SUM(i.quantity),0) FROM fin_payment_request_item i WHERE i.payment_request_id=r.id AND i.deleted=0) AS Qtd, r.total AS Total, "
        . "CASE r.status WHEN 'PENDING' THEN 1304 WHEN 'CONVERTED' THEN 1305 WHEN 'PARTIALLY_PAID' THEN 1305 WHEN 'PAID' THEN 1306 ELSE 1308 END AS Id_Situacao, "
        . "CASE r.status WHEN 'PENDING' THEN 'Pendente Lançamento' WHEN 'CONVERTED' THEN 'Pendente Pagamento' WHEN 'PARTIALLY_PAID' THEN 'Pendente Pagamento' WHEN 'PAID' THEN 'Pago' ELSE 'Cancelado' END AS Situacao, "
        . "(SELECT MIN(rcc.cost_center_id) FROM fin_payment_request_cost_center rcc WHERE rcc.payment_request_id=r.id) AS Id_Centro_Custo, "
        . "(SELECT cc.description FROM fin_payment_request_cost_center rcc JOIN fin_cost_center cc ON cc.id=rcc.cost_center_id WHERE rcc.payment_request_id=r.id ORDER BY rcc.cost_center_id LIMIT 1) AS Centro_De_Custo, "
        . "r.supplier_id AS Id_Fornecedor, $fornecedorNome AS Fornecedor, "
        . "(SELECT COALESCE(NULLIF(co.trade_name,''), NULLIF(co.nickname,''), NULLIF(co.company_name,''), cp.name) FROM pty_customer c JOIN pty_party_base ce ON ce.id=c.entity_id LEFT JOIN pty_organization co ON co.entity_id=ce.id AND co.deleted=0 LEFT JOIN pty_person cp ON cp.entity_id=ce.id AND cp.deleted=0 "
        . "WHERE c.id=COALESCE((SELECT ro.customer_id FROM fin_payment_request_proposal ro WHERE ro.payment_request_id=r.id LIMIT 1),(SELECT rr.customer_id FROM fin_payment_request_refund rr WHERE rr.payment_request_id=r.id LIMIT 1)) LIMIT 1) AS Cliente, "
        . "CRC32((SELECT i.category FROM fin_payment_request_item i WHERE i.payment_request_id=r.id AND i.deleted=0 AND i.category IS NOT NULL AND i.category<>'' ORDER BY i.id LIMIT 1)) AS Categoria, "
        . "(SELECT i.category FROM fin_payment_request_item i WHERE i.payment_request_id=r.id AND i.deleted=0 AND i.category IS NOT NULL AND i.category<>'' ORDER BY i.id LIMIT 1) AS Descricao_Categoria, "
        . "(r.type='REFUND') AS Reembolso, CASE WHEN r.type='REFUND' THEN r.total ELSE 0 END AS Valor_Reembolso, CASE WHEN r.type='REFUND' THEN $fornecedorNome END AS Beneficiario_Reembolso, "
        . "(SELECT u.name FROM sys_user u WHERE u.id=r.created_by) AS Criador, DATE(" . $tz('r.created_at') . ") AS Data_Requisicao, " . $tz('r.created_at') . " AS Data_Criacao, r.expected_payment_date AS Data_Prev_Pgto, "
        . "CONCAT_WS(' · ', r.type, r.payment_method, r.payment_type) AS Observacao FROM fin_payment_request r WHERE r.deleted=0)");
    define('ERP_V_REQUISICAO_ITEM', "(SELECT i.id AS Id, i.payment_request_id AS Id_Requisicao, COALESCE(NULLIF(i.description,''), i.category) AS Descricao_Livre, i.quantity AS Quantidade, i.unit_price AS Valor_Unitario, i.subtotal AS Subtotal, NULL AS Tipo_Un, NULL AS Fornecedor, "
        . "(SELECT u.name FROM sys_user u WHERE u.id=i.created_by) AS Criador, " . $tz('i.created_at') . " AS Data_Criacao FROM fin_payment_request_item i WHERE i.deleted=0)");
    define('ERP_V_REQUISICAO_MIDIA', "(SELECT a.id AS Id, a.payment_request_id AS Id_Requisicao, a.file_type AS Tipo, NULL AS Url, a.file_name AS Nome_arquivo, a.size_in_bytes AS Tamanho_arquivo, NULL AS Descricao, " . $tz('a.created_at') . " AS Data_criacao FROM fin_payment_request_attachment a WHERE a.deleted=0)");
    define('ERP_V_ORGANIZACAO', "(SELECT c.id AS Id_Organizacao, COALESCE(NULLIF(o.trade_name,''), NULLIF(o.nickname,''), o.company_name) AS Nome_Empresa, o.company_name AS Razao_Social, o.cnpj AS Cnpj, CASE WHEN e.active=1 THEN -1 ELSE 0 END AS Flag_Ativo, "
        . "(SELECT s.city FROM shr_address s WHERE s.entity_id=e.id AND s.deleted=0 ORDER BY s.`default` DESC, s.id LIMIT 1) AS Municipio_Endereco, (SELECT s.state FROM shr_address s WHERE s.entity_id=e.id AND s.deleted=0 ORDER BY s.`default` DESC, s.id LIMIT 1) AS Uf_Endereco, "
        . "(SELECT COALESCE(SUM(x.total_value),0) FROM qte_quote x WHERE x.customer_id=c.id AND x.deleted=0 AND x.status='WON') AS Receita_Gerada, (SELECT COUNT(*) FROM qte_quote x WHERE x.customer_id=c.id AND x.deleted=0 AND x.status='WON') AS Qtd_Orcs_Ganhos, "
        . "(SELECT COUNT(*) FROM qte_quote x WHERE x.customer_id=c.id AND x.deleted=0 AND x.status='LOST') AS Qtd_Orcs_Perdidos, (SELECT DATE(" . $tz('MAX(x.created_at)') . ") FROM qte_quote x WHERE x.customer_id=c.id AND x.deleted=0) AS Ultimo_Contato, "
        . $tz('c.created_at') . " AS Data_Criacao FROM pty_customer c JOIN pty_party_base e ON e.id=c.entity_id AND e.deleted=0 AND e.type='PJ' JOIN pty_organization o ON o.entity_id=e.id AND o.deleted=0 WHERE c.deleted=0)");
    define('ERP_V_PESSOA', "(SELECT p.id AS Id_Pessoa, CASE WHEN e.active=1 THEN -1 ELSE 0 END AS Ativo FROM pty_person p JOIN pty_party_base e ON e.id=p.entity_id AND e.deleted=0 WHERE p.deleted=0)");
    define('ERP_V_ORCAMENTO', "(SELECT x.id AS Id_Orc, x.customer_id AS Id_Organizacao, CASE x.status WHEN 'WON' THEN 3 WHEN 'LOST' THEN 4 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END AS Id_Status, x.business_type AS Tipo_Negocio, x.total_value AS Valor_Final, "
        . "(SELECT u.name FROM sys_user u WHERE u.id=x.salesperson_id) AS Nome_Vendedor, " . $tz('x.won_at') . " AS Data_Ganho, " . $tz('x.created_at') . " AS Data_Criacao, x.loss_reason AS Motivo_Perda, " . $tz('x.lost_at') . " AS Data_Perda FROM qte_quote x WHERE x.deleted=0)");
    define('ERP_V_CONTAS_A_RECEBER', "(SELECT p.id AS Id, cr.customer_id AS Id_Organizacao, p.value AS Valor, p.due_date AS Vencimento, CASE WHEN p.status IN ('OPEN','PARTIAL','OVERDUE') THEN 1 WHEN p.status IN ('RECEIVED','RECOVERED') THEN 2 ELSE 3 END AS Id_Situacao, p.status AS Situacao "
        . "FROM fin_accounts_receivable_installment p JOIN fin_accounts_receivable cr ON cr.id=p.accounts_receivable_id AND cr.deleted=0 WHERE p.deleted=0)");
    // 26/11 CP-003 (ChatGPT, LOTE7, incorporado): uma linha por fornecedor NÃO excluído com entidade NÃO excluída (o 0002 não filtrava e.deleted);
    // organização/pessoa só pelo TIPO da entidade e só quando há exatamente 1 subtipo vigente (sem escolher "o primeiro"); requisições sem
    // canceladas; Total_Pago = NULL (o pago real é a BAIXA, fonte ainda não confirmada); status cadastral com o desconhecido separado.
    define('ERP_V_FORNECEDOR', "(SELECT f.id AS Id_Fornecedor, e.type AS Tipo, o.cnpj AS Cnpj, p.cpf AS Cpf, COALESCE(p.name, o.company_name) AS Nome, o.company_name AS Nome_Empresa, NULLIF(o.trade_name,'') AS Fantasia, CASE WHEN e.active=1 THEN -1 ELSE 0 END AS Ativo, "
        . "(SELECT COUNT(*) FROM fin_payment_request r WHERE r.supplier_id=f.id AND r.deleted=0 AND r.status NOT IN ('CANCELLED','ACCOUNTS_CANCELLED')) AS Qtd_Requisicoes, NULL AS Total_Pago, "
        . "CASE f.status WHEN 'UP_TO_DATE' THEN 'Atualizado' WHEN 'OUTDATED' THEN 'Desatualizado' ELSE 'Desconhecido' END AS Status, "
        . "(SELECT ct.`key` FROM pty_supplier_email fe JOIN shr_contact ct ON ct.id=fe.contact_id AND ct.deleted=0 WHERE fe.supplier_id=f.id ORDER BY ct.`default` DESC, ct.id LIMIT 1) AS Email, "
        . "(SELECT ct.`key` FROM pty_supplier_telephone ft JOIN shr_contact ct ON ct.id=ft.contact_id AND ct.deleted=0 WHERE ft.supplier_id=f.id ORDER BY ct.`default` DESC, ct.id LIMIT 1) AS Telefone, NULL AS Celular, f.supplier_type AS Tipo_Relacao, "
        . "ad.street AS Endereco_Logradouro, ad.number AS Endereco_Numero, ad.neighborhood AS Endereco_Bairro, ad.city AS Endereco_Municipio, ad.state AS Endereco_Uf, ad.zip_code AS Endereco_Cep, " . $tz('f.created_at') . " AS Data_Criacao, " . $tz('f.updated_at') . " AS Ultima_Modificacao "
        . "FROM pty_supplier f JOIN pty_party_base e ON e.id=f.entity_id AND e.deleted=0 "
        . "LEFT JOIN pty_organization o ON o.entity_id=e.id AND e.type='PJ' AND o.deleted=0 AND (SELECT COUNT(*) FROM pty_organization oc WHERE oc.entity_id=e.id AND oc.deleted=0)=1 "
        . "LEFT JOIN pty_person p ON p.entity_id=e.id AND e.type='PF' AND p.deleted=0 AND (SELECT COUNT(*) FROM pty_person pc WHERE pc.entity_id=e.id AND pc.deleted=0)=1 "
        . "LEFT JOIN shr_address ad ON ad.id=(SELECT s.id FROM shr_address s WHERE s.entity_id=e.id AND s.deleted=0 ORDER BY s.`default` DESC, s.id LIMIT 1) WHERE f.deleted=0)");
    define('ERP_V_FORNECEDOR_CONTA_BANCARIA', "(SELECT b.id AS Id_Conta, b.supplier_id AS Id_Fornecedor, NULL AS Cpf_Cnpj, b.beneficiary AS Nome_Titular, b.branch AS Agencia, CONCAT_WS(' ', b.bank, b.account_number) AS Conta, "
        . "(SELECT px.pix_key FROM fin_bank_account_pix_key px WHERE px.supplier_id=b.supplier_id AND px.deleted=0 AND px.active=1 ORDER BY px.id LIMIT 1) AS Pix FROM fin_bank_account_bank_data b WHERE b.deleted=0 AND b.supplier_id IS NOT NULL "
        . "UNION ALL SELECT px.id+1000000, px.supplier_id, NULL, NULL, NULL, NULL, px.pix_key FROM fin_bank_account_pix_key px WHERE px.deleted=0 AND px.active=1 AND px.supplier_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM fin_bank_account_bank_data b WHERE b.supplier_id=px.supplier_id AND b.deleted=0))");
    unset($tz, $fornecedorNome);
}
