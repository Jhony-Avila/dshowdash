<?php
// /var/www/dshowdash/sql/koala/seed-proposta-demo-completa.php
// Cria a "[TESTE] Proposta Completa - Demonstração" PELO FLUXO REAL (services), commit.
// Idempotente: aborta se já existir uma demo ativa com este título.
// Uso: php sql/koala/seed-proposta-demo-completa.php
declare(strict_types=1);
$_SERVER['REQUEST_METHOD'] = 'GET';
require __DIR__ . '/../../api/koala/_init.php';

$pdo   = getConnection('DSHOWDASH');
$TITLE = '[TESTE] Proposta Completa - Demonstração';
$koala = ['id' => 1, 'name' => 'Jhony', 'email' => 'jhony@dshow.com.br', 'phone' => '(11) 98765-4321', 'role' => 'admin', 'is_active' => 1];

$exists = $pdo->prepare('SELECT id FROM koala_proposals WHERE title = ? AND deleted_at IS NULL LIMIT 1');
$exists->execute([$TITLE]);
if ($id = $exists->fetchColumn()) {
    echo "JÁ EXISTE demo (proposal id=$id). Nada criado.\n";
    exit(0);
}

$P  = new ProposalService($pdo);
$S  = new SnapshotService($pdo);
$IT = new ProposalItemService($pdo);
$EX = new ProposalExpenseService($pdo);
$PT = new ProposalPaymentTermService($pdo);

// 1) Proposta + textos comerciais + desconto da proposta
$p   = $P->create($koala, ['title' => $TITLE, 'currency' => 'BRL']);
$pid = (int) $p['id'];
$P->update($koala, $pid, [
    'project_name'      => 'Ativação de marca — Painéis LED (evento corporativo)',
    'objective'         => 'Fornecer solução completa de painéis LED de alta resolução para o palco principal e áreas de circulação, garantindo impacto visual e confiabilidade durante todo o evento.',
    'need_context'      => 'O cliente realizará convenção anual para 3.000 participantes e precisa de sinalização digital e telão de palco com operação assistida. A infraestrutura atual do espaço não contempla estrutura de LED.',
    'executive_summary' => 'Proposta de locação e operação de 40 m² de painel LED P3 outdoor, estrutura de sustentação, equipe técnica dedicada e projeto de configuração. Inclui frete, instalação e ART.',
    'project_scope'     => 'Escopo: dimensionamento, montagem, operação e desmontagem dos painéis; fornecimento de estrutura de treliça; processamento de vídeo; equipe técnica em regime de diária; retirada ao término do evento.',
    'commercial_notes'  => 'Valores válidos por 30 dias. Reserva de equipamento mediante aprovação. Não incluso: alimentação da equipe e hospedagem fora da Grande São Paulo.',
    'seller_phone'      => '(11) 98765-4321',
    'proposal_discount_percent' => 3,
]);

// 2) Cliente (snapshot completo) + endereço
$S->updateClient($koala, $pid, [
    'legal_name'          => 'Eventos Corporativos Lumina Ltda',
    'trade_name'          => 'Lumina Eventos',
    'document_type'       => 'CNPJ',
    'document_number'     => '12.345.678/0001-90',
    'internal_client_code'=> 'CLI-2048',
    'logo_url'            => 'https://dummyimage.com/240x80/6d4bff/ffffff&text=Lumina',
    'address'             => 'Av. Paulista',
    'address_number'      => '1578',
    'address_complement'  => 'Conj. 142 — 14º andar',
    'district'            => 'Bela Vista',
    'city'                => 'São Paulo',
    'state'               => 'SP',
    'postal_code'         => '01310-200',
]);

// 3) Contatos (2)
$S->addContact($koala, $pid, ['contact_name' => 'Marina Alves', 'contact_type' => 'phone', 'contact_value' => '(11) 91234-5678']);
$S->addContact($koala, $pid, ['contact_name' => 'Rafael Souza', 'contact_type' => 'email', 'contact_value' => 'rafael.souza@lumina.com.br']);

// 4) Itens (4) — un variadas, desconto % e valor, observações
$IT->addManual($koala, $pid, ['description' => 'Painel LED P3 outdoor (locação)', 'quantity' => 40, 'unit_measure' => 'm2', 'unit_price' => 1800, 'discount_percent' => 5, 'observation' => 'Alta resolução, instalação incluída']);
$IT->addManual($koala, $pid, ['description' => 'Estrutura de treliça Q30', 'quantity' => 60, 'unit_measure' => 'm', 'unit_price' => 120]);
$IT->addManual($koala, $pid, ['description' => 'Operação técnica', 'quantity' => 3, 'unit_measure' => 'diária', 'unit_price' => 1500, 'discount_value' => 500, 'observation' => 'Equipe de 2 técnicos por diária']);
$IT->addManual($koala, $pid, ['description' => 'Projeto e configuração de vídeo', 'quantity' => 1, 'unit_measure' => 'serviço', 'unit_price' => 3500]);

// 5) Despesas (3) — frete, instalação, ART/licenças
$EX->add($koala, $pid, ['description' => 'Frete São Paulo — local do evento', 'quantity' => 1, 'unit_measure' => 'un', 'unit_price' => 2800, 'observation' => 'Ida e volta com equipe de carga']);
$EX->add($koala, $pid, ['description' => 'Instalação e desmontagem', 'quantity' => 2, 'unit_measure' => 'diária', 'unit_price' => 1200, 'discount_percent' => 10, 'observation' => 'Montagem véspera + desmontagem']);
$EX->add($koala, $pid, ['description' => 'ART e licenças', 'quantity' => 1, 'unit_measure' => 'un', 'unit_price' => 650]);

// 6) Formas de pagamento — cadastra 3 [TESTE] se catálogo vazio; vincula 2
$methods = (new PaymentMethodRepository($pdo))->listAll(true);
if (count($methods) === 0) {
    $svcPM = new PaymentTermsService($pdo);
    $svcPM->create(['name' => '[TESTE] PIX à vista', 'payment_type' => 'pix', 'description' => 'Pagamento integral via PIX'], 1);
    $svcPM->create(['name' => '[TESTE] Boleto 30 dias', 'payment_type' => 'boleto', 'description' => 'Boleto único com vencimento em 30 dias'], 1);
    $svcPM->create(['name' => '[TESTE] Cartão 3x', 'payment_type' => 'installment', 'description' => 'Parcelado em 3x sem juros'], 1);
    $methods = (new PaymentMethodRepository($pdo))->listAll(true);
}
$pixId    = null; $boletoId = null;
foreach ($methods as $m) {
    if ($pixId === null && $m['payment_type'] === 'pix') { $pixId = (int) $m['id']; }
    if ($boletoId === null && $m['payment_type'] === 'boleto') { $boletoId = (int) $m['id']; }
}
if ($pixId)    { $PT->add($koala, $pid, ['payment_method_id' => $pixId]); }
if ($boletoId) { $PT->add($koala, $pid, ['payment_method_id' => $boletoId, 'installments_quantity' => 1, 'first_due_date' => date('Y-m-d', strtotime('+30 days'))]); }

// resultado
$fin = $pdo->query("SELECT proposal_number, total_net, total_expenses, proposal_discount_percent, total_final FROM koala_proposals WHERE id = $pid")->fetch(PDO::FETCH_ASSOC);
echo "DEMO CRIADA: id=$pid numero={$fin['proposal_number']}\n";
echo "  itens_liq={$fin['total_net']} despesas={$fin['total_expenses']} desc_proposta={$fin['proposal_discount_percent']}% total_final={$fin['total_final']}\n";
