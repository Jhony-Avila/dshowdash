<?php
// /sql/koala/seed-propostas-mock.php
// SEED de propostas MOCK para avaliar o visual da LISTA antes do redesign.
// Usa o FLUXO REAL: numeração atômica (koala_sequence via NumberingService),
// totais reais (PricingCalculationService via ProposalItemService), criadas
// pelo usuário koala admin. Persiste em uma ÚNICA transação (commit no fim).
//
// Todas as propostas levam o prefixo "[TESTE]" no título → removíveis pelo
// cleanup-propostas-mock.php. NÃO toca em nada existente.
//
// Uso:  php /var/www/dshowdash/sql/koala/seed-propostas-mock.php
// @module koala.seed.propostas-mock @version 1.0.0
declare(strict_types=1);

$b = '/var/www/dshowdash';
require_once $b . '/config/db_connection.php';
require_once $b . '/api/_helpers/ApiResponse.php';
foreach ([
    'services/PermissionService', 'services/NumberingService',
    'repositories/ProposalRepository', 'repositories/ProposalItemRepository',
    'repositories/ItemRepository', 'repositories/ClientSnapshotRepository',
    'services/PricingCalculationService', 'services/ProposalService', 'services/ProposalItemService',
] as $c) {
    require_once $b . '/api/koala/' . $c . '.php';
}

$pdo = getConnection('DSHOWDASH');

// --- usuário koala admin real (criador das propostas) ---
$adminRow = $pdo->query("SELECT id, role FROM koala_users WHERE role = 'admin' ORDER BY id LIMIT 1")
    ->fetch(\PDO::FETCH_ASSOC);
if (!$adminRow) {
    fwrite(STDERR, "ERRO: nenhum koala_user admin encontrado. Abortando.\n");
    exit(2);
}
$admin = ['id' => (int) $adminRow['id'], 'role' => $adminRow['role'], 'is_active' => 1];

// --- guarda de idempotência: não duplicar se já existe seed [TESTE] ---
$already = (int) $pdo->query("SELECT COUNT(*) FROM koala_proposals WHERE title LIKE '[TESTE]%'")->fetchColumn();
if ($already > 0) {
    fwrite(STDERR, "Já existem $already propostas [TESTE]. Rode o cleanup antes de re-semear:\n");
    fwrite(STDERR, "  php $b/sql/koala/cleanup-propostas-mock.php\n");
    exit(1);
}

// ---------------------------------------------------------------------------
// Especificação das ~8 propostas mock (variedade proposital).
//   status ∈ 9 reais: draft|generated|sent|viewed|expired|won|lost|canceled|user_deleted
//   snapshot: array mock (inserido local, SEM tocar no ERP remoto) ou null
//   valid_days: dias a partir de hoje p/ valid_until (negativo = vencida)
//   freight/install: somam ao total_final (frete/instalação)
// ---------------------------------------------------------------------------
$specs = [
    [
        'title' => '[TESTE] Painel LED Shopping Morumbi',
        'currency' => 'BRL', 'status' => 'won', 'valid_days' => 20,
        'freight' => 3500.0, 'install' => 0.0,
        'snapshot' => [
            'client_name' => '[TESTE] Shopping Morumbi Empreendimentos Ltda',
            'legal_name' => '[TESTE] Shopping Morumbi Empreendimentos Ltda',
            'document_type' => 'CNPJ', 'document_number' => '12.345.678/0001-90',
            'contact_email' => 'contato@teste-morumbi.example', 'budget' => '2026-4821',
        ],
        'items' => [
            ['description' => 'Módulo LED P3 externo (unid)', 'quantity' => 120, 'unit_price' => 1800.0],
            ['description' => 'Estrutura metálica + instalação', 'quantity' => 1, 'unit_price' => 28000.0],
            ['description' => 'Projeto e comissionamento', 'quantity' => 1, 'unit_price' => 12000.0, 'discount_value' => 6000.0],
        ],
    ],
    [
        'title' => '[TESTE] Locação telão evento corporativo',
        'currency' => 'BRL', 'status' => 'sent', 'valid_days' => 15,
        'freight' => 2200.0, 'install' => 0.0,
        'snapshot' => [
            'client_name' => '[TESTE] Ápice Eventos e Produções Ltda',
            'legal_name' => '[TESTE] Ápice Eventos e Produções Ltda',
            'document_type' => 'CNPJ', 'document_number' => '98.765.432/0001-10',
            'contact_email' => 'eventos@teste-apice.example', 'budget' => '2026-4907',
        ],
        'items' => [
            ['description' => 'Locação painel LED 6x3m (diária)', 'quantity' => 3, 'unit_price' => 4500.0],
            ['description' => 'Operador técnico (diária)', 'quantity' => 3, 'unit_price' => 800.0],
        ],
    ],
    [
        'title' => '[TESTE] Videowall recepção corporativa',
        'currency' => 'BRL', 'status' => 'viewed', 'valid_days' => 45,
        'freight' => 0.0, 'install' => 4200.0,
        'snapshot' => [
            'client_name' => '[TESTE] Meridiano Corporate Center Ltda',
            'legal_name' => '[TESTE] Meridiano Corporate Center Ltda',
            'document_type' => 'CNPJ', 'document_number' => '45.678.912/0001-34',
            'contact_email' => 'facilities@teste-meridiano.example', 'budget' => '2026-5012',
        ],
        'items' => [
            ['description' => "Display 55'' videowall (unid)", 'quantity' => 9, 'unit_price' => 3800.0],
            ['description' => 'Suporte de parede full-service', 'quantity' => 9, 'unit_price' => 450.0],
            ['description' => 'Cabeamento e controladora', 'quantity' => 1, 'unit_price' => 4200.0],
        ],
    ],
    [
        'title' => '[TESTE] Painel LED fachada de loja',
        'currency' => 'BRL', 'status' => 'draft', 'valid_days' => 30,
        'freight' => 0.0, 'install' => 0.0, 'snapshot' => null,
        'items' => [
            ['description' => 'Módulo LED P4 externo (unid)', 'quantity' => 24, 'unit_price' => 520.0],
            ['description' => 'Fonte + cabeamento', 'quantity' => 1, 'unit_price' => 1800.0, 'discount_percent' => 10],
        ],
    ],
    [
        'title' => '[TESTE] Digital signage rede varejo',
        'currency' => 'USD', 'status' => 'generated', 'valid_days' => 25,
        'freight' => 0.0, 'install' => 900.0, 'snapshot' => null,
        'items' => [
            ['description' => 'Media player Android (unit)', 'quantity' => 20, 'unit_price' => 320.0],
            ['description' => 'CMS license (annual, per screen)', 'quantity' => 20, 'unit_price' => 240.0],
        ],
    ],
    [
        'title' => '[TESTE] Manutenção painel LED (contrato)',
        'currency' => 'BRL', 'status' => 'lost', 'valid_days' => 7,
        'freight' => 0.0, 'install' => 0.0, 'snapshot' => null,
        'items' => [
            ['description' => 'Visita técnica preventiva', 'quantity' => 6, 'unit_price' => 850.0],
            ['description' => 'Reposição de módulos (estimado)', 'quantity' => 4, 'unit_price' => 480.0],
        ],
    ],
    [
        'title' => '[TESTE] Locação totem interativo feira',
        'currency' => 'BRL', 'status' => 'expired', 'valid_days' => -15, // vencida
        'freight' => 0.0, 'install' => 0.0, 'snapshot' => null,
        'items' => [
            ['description' => "Totem touch 43'' (diária)", 'quantity' => 2, 'unit_price' => 900.0],
            ['description' => 'Conteúdo interativo básico', 'quantity' => 1, 'unit_price' => 1200.0],
        ],
    ],
    [
        'title' => '[TESTE] Videowall control room',
        'currency' => 'USD', 'status' => 'canceled', 'valid_days' => -3, // vencida
        'freight' => 0.0, 'install' => 1400.0, 'snapshot' => null,
        'items' => [
            ['description' => "Display 46'' narrow-bezel (unit)", 'quantity' => 12, 'unit_price' => 2100.0],
            ['description' => 'Video processor 4K', 'quantity' => 1, 'unit_price' => 6800.0],
        ],
    ],
];

$proposalSvc = new ProposalService($pdo);
$itemSvc = new ProposalItemService($pdo);
$snapRepo = new ClientSnapshotRepository($pdo);
$propRepo = new ProposalRepository($pdo);

$pdo->beginTransaction(); // tudo-ou-nada: commit no fim; qualquer exit() do service = rollback
$created = [];
foreach ($specs as $spec) {
    // 1. cria rascunho (número atômico)
    $p = $proposalSvc->create($admin, ['title' => $spec['title'], 'currency' => $spec['currency']]);
    $pid = (int) $p['id'];

    // 2. snapshot mock (opcional) — inserido LOCAL, nunca busca no remoto
    if (!empty($spec['snapshot'])) {
        $s = $spec['snapshot'];
        $snapId = $snapRepo->insert([
            'client_name' => $s['client_name'], 'legal_name' => $s['legal_name'],
            'document_type' => $s['document_type'], 'document_number' => $s['document_number'],
            'contact_email' => $s['contact_email'] ?? null,
            'raw' => ['mock' => true, 'origem' => 'seed-propostas-mock'],
        ]);
        $propRepo->setClientSnapshot($pid, $snapId, $s['budget'] ?? null);
    }

    // 3. line items (totais REAIS pelo PricingCalculationService)
    foreach ($spec['items'] as $it) {
        $itemSvc->addManual($admin, $pid, $it);
    }

    // 4. frete/instalação (somam ao total_final) — dispara recompute
    $upd = [];
    if (!empty($spec['freight'])) { $upd['freight_value'] = $spec['freight']; }
    if (!empty($spec['install'])) { $upd['installation_value'] = $spec['install']; }
    // 5. validade variada (algumas vencidas)
    $upd['valid_until'] = date('Y-m-d', strtotime($spec['valid_days'] . ' days'));
    $proposalSvc->update($admin, $pid, $upd);

    // 6. status final (create nasce draft)
    if ($spec['status'] !== 'draft') {
        $proposalSvc->setStatus($admin, $pid, $spec['status']);
    }

    $final = $propRepo->findById($pid);
    $created[] = $final;
}
$pdo->commit();

// --- prova: SELECT da lista (número, título, status, moeda, total) ---
echo "\n== SEED CONCLUÍDO: " . count($created) . " propostas [TESTE] criadas ==\n\n";
printf("%-11s | %-40s | %-10s | %-4s | %14s | %-6s\n", 'Número', 'Título', 'Status', 'Cur', 'Total', 'Snap');
echo str_repeat('-', 100) . "\n";
foreach ($created as $r) {
    printf(
        "%-11s | %-40s | %-10s | %-4s | %14s | %-6s\n",
        $r['proposal_number'],
        mb_strimwidth($r['title'], 0, 40, '…'),
        $r['status'],
        $r['currency'],
        number_format((float) $r['total_final'], 2, ',', '.'),
        $r['client_snapshot_id'] ? 'sim' : '—'
    );
}
echo "\nMoedas: BRL=" . count(array_filter($created, fn($r) => $r['currency'] === 'BRL'))
    . "  USD=" . count(array_filter($created, fn($r) => $r['currency'] === 'USD'))
    . "  | Com snapshot: " . count(array_filter($created, fn($r) => $r['client_snapshot_id'])) . "\n";
echo "Limpeza: php $b/sql/koala/cleanup-propostas-mock.php\n";
exit(0);
