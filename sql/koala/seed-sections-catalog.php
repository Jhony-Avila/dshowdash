<?php
// /sql/koala/seed-sections-catalog.php
// Seed do CATÁLOGO REAL de seções (38, deduplicadas pelo revisor) + estrutura default por seção.
// Fluxo REAL: usa SectionService::create / SectionRepository (NÃO INSERT cru).
// IDEMPOTENTE: match por section_key — rodar 2x não duplica (atualiza meta + estrutura).
// Estas seções NÃO são [TESTE]: são o catálogo inicial de produção.
// @created 2026-07-04  @module koala.sections.seed
//
// Uso:  php /var/www/dshowdash/sql/koala/seed-sections-catalog.php
declare(strict_types=1);

require_once __DIR__ . '/../../api/koala/_init.php';

$pdo = getConnection('DSHOWDASH');

// Admin do Koala para created_by (fluxo real exige o "quem").
$admin = $pdo->query("SELECT id, name FROM koala_users WHERE role='admin' AND is_active=1 ORDER BY id LIMIT 1")
             ->fetch(PDO::FETCH_ASSOC);
if (!$admin) { fwrite(STDERR, "ERRO: nenhum koala_users admin ativo.\n"); exit(1); }
$koala = ['id' => (int) $admin['id']];

$repo = new SectionRepository($pdo);
$svc  = new SectionService($pdo);

// Seções obviamente tabulares ganham um placeholder de tabela (usa proposal.items de sampleData).
$TABULAR = ['itens-da-proposta', 'composicao-financeira'];

/** Estrutura default nível-seção: título + texto placeholder (+ tabela se tabular). */
function buildStructure(string $key, string $name): string
{
    $st = SectionRenderService::defaultStructure($key, $name);
    global $TABULAR;
    if (in_array($key, $TABULAR, true)) {
        $st['components'][] = [
            'component_type' => 'price_table',
            'bindings_json'  => ['rows' => 'proposal.items', 'total' => 'proposal.total_final'],
        ];
    }
    return json_encode($st, JSON_UNESCAPED_UNICODE);
}

// [nome, key, descrição] — ORDEM = display_order. section_type = key.
$SECTIONS = [
    ['Capa',                          'capa',                          'Página inicial: título da proposta, cliente e data'],
    ['Identificação da proposta',     'identificacao-da-proposta',     'Número, versão, data e validade da proposta'],
    ['Dados da empresa',              'dados-da-empresa',              'Identificação e informações da empresa que propõe'],
    ['Dados do cliente',              'dados-do-cliente',              'Identificação e documentos do cliente destinatário'],
    ['Contatos',                      'contatos',                      'Contatos do cliente e do responsável comercial'],
    ['Equipe comercial',              'equipe-comercial',              'Vendedor e equipe responsável pela proposta'],
    ['Carta de apresentação',         'carta-de-apresentacao',         'Texto de abertura apresentando a empresa e a proposta'],
    ['Resumo executivo',              'resumo-executivo',              'Síntese objetiva da proposta para leitura rápida'],
    ['Cenário atual',                 'cenario-atual',                 'Contexto e situação atual do cliente'],
    ['Diagnóstico',                   'diagnostico',                   'Análise de necessidades e problemas identificados'],
    ['Objetivos do projeto',          'objetivos-do-projeto',          'Metas e resultados esperados do projeto'],
    ['Escopo do projeto',             'escopo-do-projeto',             'Delimitação do que está incluído no projeto'],
    ['Escopo técnico',                'escopo-tecnico',                'Detalhamento técnico da solução e entregáveis'],
    ['Solução proposta',              'solucao-proposta',              'Descrição da solução recomendada ao cliente'],
    ['Produtos e serviços',           'produtos-e-servicos',           'Catálogo de produtos e serviços ofertados'],
    ['Itens da proposta',             'itens-da-proposta',             'Tabela de itens, quantidades e valores'],
    ['Composição financeira',         'composicao-financeira',         'Detalhamento de valores, descontos e totais'],
    ['Condições comerciais',          'condicoes-comerciais',          'Termos comerciais gerais da proposta'],
    ['Condições de pagamento',        'condicoes-de-pagamento',        'Formas, prazos e parcelamento de pagamento'],
    ['Logística',                     'logistica',                     'Transporte, prazos e condições de entrega'],
    ['Instalação',                    'instalacao',                    'Condições e responsabilidades de instalação'],
    ['Treinamento',                   'treinamento',                   'Capacitação e treinamento incluídos'],
    ['Suporte técnico',               'suporte-tecnico',               'Suporte técnico oferecido durante o contrato'],
    ['Garantias',                     'garantias',                     'Garantias de produtos e serviços'],
    ['SLA',                           'sla',                           'Acordo de nível de serviço e prazos de atendimento'],
    ['Responsabilidades',             'responsabilidades',             'Responsabilidades de cada parte'],
    ['Premissas',                     'premissas',                     'Premissas assumidas para a proposta'],
    ['Restrições',                    'restricoes',                    'Restrições e limitações do escopo'],
    ['Cases de sucesso',              'cases-de-sucesso',              'Projetos anteriores e resultados alcançados'],
    ['Depoimentos',                   'depoimentos',                   'Depoimentos e recomendações de clientes'],
    ['FAQ',                           'faq',                           'Perguntas frequentes sobre a proposta'],
    ['Aceite',                        'aceite',                        'Termo de aceite da proposta pelo cliente'],
    ['Assinaturas',                   'assinaturas',                   'Campos de assinatura das partes'],
    ['Renderizações/simulações',      'renderizacoes-simulacoes',      'Imagens de renderização e simulações do projeto'],
    ['Prazo de entrega',              'prazo-de-entrega',              'Cronograma e prazo de entrega do projeto'],
    ['Local de instalação/entrega',   'local-de-instalacao-entrega',   'Endereço e condições do local de instalação/entrega'],
    ['Suporte pós-venda',             'suporte-pos-venda',             'Atendimento e suporte após a entrega'],
    ['Termos e condições',            'termos-e-condicoes',            'Termos legais e condições gerais do contrato'],
];

$created = 0; $updated = 0;
foreach ($SECTIONS as $i => [$name, $key, $desc]) {
    $order = $i + 1;
    $json  = buildStructure($key, $name);
    $existingId = $repo->idByKey($key);
    if ($existingId !== null) {
        $repo->updateMeta($existingId, [
            'name' => $name, 'description' => $desc, 'section_type' => $key, 'display_order' => $order,
        ]);
        $repo->setStructure($existingId, $json);
        $updated++;
    } else {
        $svc->create($koala, [
            'name' => $name, 'section_key' => $key, 'description' => $desc,
            'section_type' => $key, 'display_order' => $order, 'structure_json' => $json,
        ]);
        $created++;
    }
}

// Reconciliação: as 5 placeholders da F1 (nunca ligadas a template) saem da lista (soft-delete reversível).
$legacy = ['cover', 'presentation', 'items', 'terms', 'closing'];
$retired = 0;
foreach ($legacy as $k) {
    $lid = $repo->idByKey($k);
    if ($lid !== null) { $repo->softDelete($lid); $retired++; }
}

printf("Seed catálogo de seções: criadas=%d atualizadas=%d placeholders-F1-aposentadas=%d\n", $created, $updated, $retired);
$total = (int) $pdo->query("SELECT COUNT(*) FROM koala_sections_catalog WHERE deleted_at IS NULL")->fetchColumn();
printf("Total de seções vivas agora: %d\n", $total);
