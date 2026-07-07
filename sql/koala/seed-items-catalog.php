<?php
// Seed do CATÁLOGO DE ITENS (real, empresa de painéis de LED). Fluxo REAL (ItemCatalogService).
// IDEMPOTENTE por nome (categorias e itens). NÃO são [TESTE] (catálogo real). USD ~ BRL/5,2.
// Uso: php sql/koala/seed-items-catalog.php
declare(strict_types=1);
$_SERVER['REQUEST_METHOD'] = 'CLI';
require __DIR__ . '/../../api/koala/_init.php';

$pdo = getConnection('DSHOWDASH');
$koala = (new AuthKoalaService($pdo))->provisionAndGet(75, 'jhony', 'jhony@dshow.com.br');
$svc = new ItemCatalogService($pdo);
$uid = (int) ($koala['id'] ?? 0) ?: null;

// ── categorias (cria as que faltarem; match por nome) ──
$CATS = [
    'Painéis LED Indoor'       => 'Painéis de LED para uso interno (indoor).',
    'Painéis LED Outdoor'      => 'Painéis de LED para uso externo (outdoor).',
    'Processamento e Controle' => 'Controladoras, processadores e scalers de vídeo.',
    'Estruturas e Acessórios'  => 'Treliças, suportes e acessórios de instalação.',
    'Serviços'                 => 'Operação, logística e serviços técnicos.',
];
function catByName(\PDO $pdo, string $name): ?array
{
    $st = $pdo->prepare('SELECT id, name FROM koala_item_categories WHERE name = ? LIMIT 1');
    $st->execute([$name]);
    return $st->fetch(\PDO::FETCH_ASSOC) ?: null;
}
$catId = [];
foreach ($CATS as $name => $desc) {
    $ex = catByName($pdo, $name);
    if ($ex) { $catId[$name] = (int) $ex['id']; echo "  [CAT SKIP] '$name' (id={$ex['id']})\n"; continue; }
    $c = $svc->createCategory(['name' => $name, 'description' => $desc]);
    $catId[$name] = (int) $c['id'];
    echo "  [CAT NEW] '$name' (id={$c['id']})\n";
}

// ── itens ──
$ITEMS = [
    ['PAINEL DE LED INDOOR P1.53', 'Painéis LED Indoor',  'm2',     4500.00, 865.38, 'Pitch fino de alta resolução para uso corporativo e estúdios; imagem nítida a curta distância.'],
    ['PAINEL DE LED INDOOR P2.5',  'Painéis LED Indoor',  'm2',     2800.00, 538.46, 'Alta resolução para palcos e eventos indoor; equilíbrio entre nitidez e custo.'],
    ['PAINEL DE LED INDOOR P3.0',  'Painéis LED Indoor',  'm2',     2200.00, 423.08, 'Custo-benefício para indoor; ideal para igrejas e auditórios.'],
    ['PAINEL DE LED OUTDOOR P3.0', 'Painéis LED Outdoor', 'm2',     3200.00, 615.38, 'Alta definição para ambientes externos; fachadas premium com brilho elevado.'],
    ['PAINEL DE LED OUTDOOR P4.0', 'Painéis LED Outdoor', 'm2',     2600.00, 500.00, 'Uso geral externo para publicidade; robusto e de alto brilho.'],
    ['PAINEL DE LED OUTDOOR P5.0', 'Painéis LED Outdoor', 'm2',     2100.00, 403.85, 'Grandes formatos e longa distância de visualização; máximo custo-benefício externo.'],
    ['PROCESSADOR DE VIDEO LED 4K', 'Processamento e Controle', 'un', 12000.00, 2307.69, 'Controladora/scaler 4K para até 3,9M de pixels; múltiplas entradas e saídas.'],
    ['ESTRUTURA DE TRELICA Q30',   'Estruturas e Acessórios', 'm',   180.00,  34.62, 'Treliça de alumínio Q30 para sustentação e ground support; preço por metro linear.'],
    ['TECNICO OPERADOR DE PAINEL', 'Serviços', 'diária',              650.00, 125.00, 'Operação assistida do painel em evento; diária de 10 horas.'],
    ['FRETE E LOGISTICA',          'Serviços', 'km',                    8.00,   1.54, 'Transporte de ida e volta do equipamento; valor por km rodado.'],
];
function itemByName(\PDO $pdo, string $name): ?array
{
    $st = $pdo->prepare('SELECT id, name FROM koala_items_catalog WHERE name = ? AND deleted_at IS NULL LIMIT 1');
    $st->execute([$name]);
    return $st->fetch(\PDO::FETCH_ASSOC) ?: null;
}
$created = 0; $skipped = 0;
foreach ($ITEMS as $it) {
    [$name, $cat, $unit, $brl, $usd, $desc] = $it;
    $ex = itemByName($pdo, $name);
    if ($ex) { echo "  [ITEM SKIP] '$name' (id={$ex['id']})\n"; $skipped++; continue; }
    $r = $svc->createItem([
        'name' => $name,
        'description' => $desc,
        'category_id' => $catId[$cat] ?? null,
        'unit_measure' => $unit,
        'default_unit_price_brl' => $brl,
        'default_unit_price_usd' => $usd,
    ], $uid);
    echo "  [ITEM NEW] '$name' id={$r['id']} | $cat | $unit | R$ $brl / US$ $usd\n";
    $created++;
}

echo "\nResumo itens: created=$created skipped=$skipped | categorias: " . count($catId) . "\n";
