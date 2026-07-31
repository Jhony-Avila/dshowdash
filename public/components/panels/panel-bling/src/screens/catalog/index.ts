// panel-bling/src/screens/catalog/index.ts — as 52 telas do §10, declaradas
// @version 1.0.0  @created 2026-07-30
//
// ESTE ARQUIVO É A FONTE DE VERDADE DA NAVEGAÇÃO.
// A sub-sidebar, as rotas, os títulos e o que cada tela renderiza saem daqui.
// Não existe segunda lista em lugar nenhum — é o que impede a sub-sidebar
// oferecer uma tela que não existe, ou uma tela existir sem entrada no menu.
//
// `profundidade` é declarada com honestidade e aparece na interface:
//   'completa'    — tela desenhada para a função, com visualização própria
//   'estrutural'  — grid + KPIs reais sobre os mesmos dados, sem visualização
//                   dedicada ainda. Funciona, é útil, mas não é o destino final.
// Marcar tudo como 'completa' seria a forma mais rápida de perder a confiança
// do dono no primeiro clique.

export type Profundidade = 'completa' | 'estrutural';

export interface GraficoSpec {
  tipo: 'linha-tempo' | 'barras' | 'pizza' | 'funil' | 'pareto' | 'dispersao' | 'area';
  titulo: string;
  /** Campo de agrupamento para gráficos categóricos. */
  por?: string;
  /**
   * Campo de cross-filter quando ele difere do campo de agrupamento.
   *
   * Em Canais de Venda o gráfico agrupa por `nome` (o rótulo legível), mas o
   * filtro que a API entende é `canal`. Sem esta distinção o clique gerava um
   * recorte de campo `nome`, que o servidor ignora — o usuário via a barra de
   * seleção e nenhuma mudança nos números.
   */
  campoSelecao?: string;
  /** Campo de valor. Ausente = contagem. */
  valor?: string;
  /** Séries de /evolution a exibir (apenas para linha-tempo). */
  series?: string[];
  eixoDuplo?: boolean;
  limite?: number;
}

export interface TelaSpec {
  id: string;
  grupo: GrupoId;
  titulo: string;
  subtitulo: string;
  icone: string;
  profundidade: Profundidade;
  /** Recurso de /resources/{recurso} que alimenta o grid. */
  recurso?: string;
  /** Tela customizada: componente próprio em screens/custom. */
  custom?: string;
  /** Filtros oferecidos na barra (além do período, sempre presente). */
  filtros?: string[];
  graficos?: GraficoSpec[];
  /** KPIs derivados dos totais/linhas do próprio recurso. */
  kpis?: { id: string; rotulo: string; campo?: string; agregacao: 'soma' | 'contagem' | 'media' | 'total'; formato: string }[];
  selecionavel?: boolean;
}

export type GrupoId =
  | 'visao' | 'vendas' | 'produtos' | 'compras' | 'fiscal'
  | 'financeiro' | 'logistica' | 'relacionamento' | 'inteligencia' | 'administracao';

export interface GrupoSpec { id: GrupoId; rotulo: string; icone: string }

export const GRUPOS: GrupoSpec[] = [
  { id: 'visao',          rotulo: 'Visão',          icone: 'LayoutDashboard' },
  { id: 'vendas',         rotulo: 'Vendas',         icone: 'ShoppingCart' },
  { id: 'produtos',       rotulo: 'Produtos',       icone: 'Package' },
  { id: 'compras',        rotulo: 'Compras',        icone: 'ShoppingBag' },
  { id: 'fiscal',         rotulo: 'Fiscal',         icone: 'FileText' },
  { id: 'financeiro',     rotulo: 'Financeiro',     icone: 'Landmark' },
  { id: 'logistica',      rotulo: 'Logística',      icone: 'Truck' },
  { id: 'relacionamento', rotulo: 'Relacionamento', icone: 'Users' },
  { id: 'inteligencia',   rotulo: 'Inteligência',   icone: 'Sparkles' },
  { id: 'administracao',  rotulo: 'Administração',  icone: 'Settings' },
];

const g = (t: GraficoSpec) => t;

export const TELAS: TelaSpec[] = [
  // ── Visão (1–4) ──────────────────────────────────────────────
  { id: 'visao-geral', grupo: 'visao', titulo: 'Visão Geral', icone: 'LayoutDashboard',
    subtitulo: 'Retrato executivo e operacional do período', profundidade: 'completa', custom: 'VisaoGeral' },
  { id: 'central-operacional', grupo: 'visao', titulo: 'Central Operacional', icone: 'ListChecks',
    subtitulo: 'Filas de trabalho pendentes, por área', profundidade: 'completa', custom: 'CentralOperacional' },
  { id: 'diretoria', grupo: 'visao', titulo: 'Diretoria', icone: 'Presentation',
    subtitulo: 'Leitura executiva: resultado, margem e prioridades', profundidade: 'completa', custom: 'Diretoria' },
  { id: 'indicadores', grupo: 'visao', titulo: 'Indicadores', icone: 'Gauge',
    subtitulo: 'Todos os indicadores com a definição de cálculo', profundidade: 'completa', custom: 'Indicadores' },

  // ── Vendas (5–9) ─────────────────────────────────────────────
  { id: 'pedidos-venda', grupo: 'vendas', titulo: 'Pedidos de Venda', icone: 'ShoppingCart',
    subtitulo: 'Gestão operacional dos pedidos', profundidade: 'completa',
    recurso: 'sales-orders', filtros: ['situacao', 'canal', 'vendedor'], selecionavel: true,
    graficos: [
      g({ tipo: 'linha-tempo', titulo: 'Evolução de pedidos e faturamento', series: ['faturamento', 'pedidos'], eixoDuplo: true }),
      g({ tipo: 'funil', titulo: 'Pedidos por situação', por: 'situacao' }),
    ],
    kpis: [
      { id: 'pedidos', rotulo: 'Pedidos', agregacao: 'total', formato: 'inteiro' },
      { id: 'total', rotulo: 'Faturamento', campo: 'total', agregacao: 'soma', formato: 'moeda' },
      { id: 'ticket', rotulo: 'Ticket médio', campo: 'total', agregacao: 'media', formato: 'moeda' },
      { id: 'desconto', rotulo: 'Descontos', campo: 'desconto', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'vendas', grupo: 'vendas', titulo: 'Vendas', icone: 'TrendingUp',
    subtitulo: 'Vendas consolidadas por dia e canal', profundidade: 'completa',
    recurso: 'sales', filtros: ['canal'],
    graficos: [
      g({ tipo: 'linha-tempo', titulo: 'Faturamento, ticket médio e margem', series: ['faturamento', 'ticket_medio', 'margem'], eixoDuplo: true }),
      g({ tipo: 'barras', titulo: 'Receita por canal', por: 'canal', valor: 'receita' }),
    ],
    kpis: [
      { id: 'receita', rotulo: 'Receita', campo: 'receita', agregacao: 'soma', formato: 'moeda' },
      { id: 'pedidos', rotulo: 'Pedidos', campo: 'pedidos', agregacao: 'soma', formato: 'inteiro' },
      { id: 'unidades', rotulo: 'Unidades', campo: 'unidades', agregacao: 'soma', formato: 'inteiro' },
      { id: 'margem', rotulo: 'Margem média', campo: 'margem_pct', agregacao: 'media', formato: 'percentual' },
    ] },
  { id: 'canais-venda', grupo: 'vendas', titulo: 'Canais de Venda', icone: 'Store',
    subtitulo: 'Comparação e participação por canal', profundidade: 'completa',
    recurso: 'channels',
    graficos: [
      g({ tipo: 'barras', titulo: 'Faturamento por canal', por: 'nome', valor: 'faturamento', campoSelecao: 'canal' }),
      g({ tipo: 'pizza', titulo: 'Participação no faturamento', por: 'nome', valor: 'faturamento', campoSelecao: 'canal' }),
    ],
    kpis: [
      { id: 'faturamento', rotulo: 'Faturamento', campo: 'faturamento', agregacao: 'soma', formato: 'moeda' },
      { id: 'canais', rotulo: 'Canais ativos', agregacao: 'total', formato: 'inteiro' },
      { id: 'cancel', rotulo: 'Cancelamentos', campo: 'cancelamentos', agregacao: 'soma', formato: 'inteiro' },
      { id: 'erros', rotulo: 'Notas com erro', campo: 'notas_erro', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'vendedores', grupo: 'vendas', titulo: 'Vendedores', icone: 'UserCheck',
    subtitulo: 'Desempenho, meta e comissão por vendedor', profundidade: 'completa',
    recurso: 'sellers',
    graficos: [
      g({ tipo: 'barras', titulo: 'Faturamento por vendedor', por: 'nome', valor: 'faturamento', campoSelecao: 'vendedor' }),
      g({ tipo: 'dispersao', titulo: 'Faturamento × margem', por: 'nome', valor: 'faturamento' }),
    ],
    kpis: [
      { id: 'faturamento', rotulo: 'Faturamento', campo: 'faturamento', agregacao: 'soma', formato: 'moeda' },
      { id: 'meta', rotulo: 'Meta do período', campo: 'meta', agregacao: 'soma', formato: 'moeda' },
      { id: 'comissao', rotulo: 'Comissão', campo: 'comissao_valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'clientes', rotulo: 'Clientes atendidos', campo: 'clientes', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'comissoes', grupo: 'vendas', titulo: 'Comissões', icone: 'Percent',
    subtitulo: 'Comissão devida e provisionada por pedido', profundidade: 'completa',
    recurso: 'commissions', filtros: ['vendedor'],
    graficos: [g({ tipo: 'barras', titulo: 'Comissão por vendedor', por: 'vendedor', valor: 'valor' })],
    kpis: [
      { id: 'valor', rotulo: 'Comissão total', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'base', rotulo: 'Base de cálculo', campo: 'base', agregacao: 'soma', formato: 'moeda' },
      { id: 'lancamentos', rotulo: 'Lançamentos', agregacao: 'total', formato: 'inteiro' },
    ] },

  // ── Produtos (10–16) ─────────────────────────────────────────
  { id: 'produtos', grupo: 'produtos', titulo: 'Produtos', icone: 'Package',
    subtitulo: 'Central de produtos com qualidade cadastral', profundidade: 'completa',
    recurso: 'products', filtros: ['categoria', 'marca', 'tipo'], selecionavel: true,
    graficos: [
      g({ tipo: 'barras', titulo: 'Receita por categoria', por: 'categoria', valor: 'receita' }),
      g({ tipo: 'pareto', titulo: 'Concentração de receita por produto', por: 'nome', valor: 'receita', limite: 25 }),
    ],
    kpis: [
      { id: 'produtos', rotulo: 'Produtos', agregacao: 'total', formato: 'inteiro' },
      { id: 'receita', rotulo: 'Receita', campo: 'receita', agregacao: 'soma', formato: 'moeda' },
      { id: 'estoque', rotulo: 'Unidades em estoque', campo: 'estoque', agregacao: 'soma', formato: 'inteiro' },
      { id: 'qualidade', rotulo: 'Qualidade média', campo: 'qualidade_score', agregacao: 'media', formato: 'percentual' },
    ] },
  { id: 'variacoes', grupo: 'produtos', titulo: 'Variações', icone: 'GitBranch',
    subtitulo: 'Variações por atributo e seus saldos', profundidade: 'estrutural',
    recurso: 'variations', filtros: ['atributo'],
    graficos: [g({ tipo: 'barras', titulo: 'Variações por atributo', por: 'atributo' })],
    kpis: [
      { id: 'variacoes', rotulo: 'Variações', agregacao: 'total', formato: 'inteiro' },
      { id: 'estoque', rotulo: 'Estoque', campo: 'estoque', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'kits', grupo: 'produtos', titulo: 'Kits e Estruturas', icone: 'Boxes',
    subtitulo: 'Composição e divergência de custo dos kits', profundidade: 'completa',
    recurso: 'kits',
    graficos: [g({ tipo: 'barras', titulo: 'Divergência de custo por kit', por: 'sku', valor: 'divergencia_custo', limite: 20 })],
    kpis: [
      { id: 'kits', rotulo: 'Kits', agregacao: 'total', formato: 'inteiro' },
      { id: 'componentes', rotulo: 'Componentes', campo: 'componentes', agregacao: 'soma', formato: 'inteiro' },
      { id: 'estoque', rotulo: 'Estoque', campo: 'estoque', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'categorias', grupo: 'produtos', titulo: 'Categorias', icone: 'FolderTree',
    subtitulo: 'Receita, estoque e qualidade por categoria', profundidade: 'completa',
    recurso: 'categories',
    graficos: [
      g({ tipo: 'barras', titulo: 'Receita por categoria', por: 'nome', valor: 'receita', campoSelecao: 'categoria' }),
      g({ tipo: 'pizza', titulo: 'Participação por categoria', por: 'nome', valor: 'receita', campoSelecao: 'categoria' }),
    ],
    kpis: [
      { id: 'categorias', rotulo: 'Categorias', agregacao: 'total', formato: 'inteiro' },
      { id: 'receita', rotulo: 'Receita', campo: 'receita', agregacao: 'soma', formato: 'moeda' },
      { id: 'produtos', rotulo: 'Produtos', campo: 'produtos', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'precos', grupo: 'produtos', titulo: 'Preços', icone: 'Tags',
    subtitulo: 'Preço, custo, margem e simulador', profundidade: 'completa', custom: 'Precos' },
  { id: 'estoque', grupo: 'produtos', titulo: 'Estoque', icone: 'Warehouse',
    subtitulo: 'Saldo, giro, cobertura e matriz giro × margem', profundidade: 'completa', custom: 'Estoque' },
  { id: 'depositos', grupo: 'produtos', titulo: 'Depósitos', icone: 'Building2',
    subtitulo: 'Saldos por depósito e fluxo entre eles', profundidade: 'completa', custom: 'Depositos' },

  // ── Compras (17–20) ──────────────────────────────────────────
  { id: 'pedidos-compra', grupo: 'compras', titulo: 'Pedidos de Compra', icone: 'ShoppingBag',
    subtitulo: 'Acompanhamento de compras e prazos', profundidade: 'completa',
    recurso: 'purchase-orders', filtros: ['situacao', 'fornecedor'], selecionavel: true,
    graficos: [
      g({ tipo: 'funil', titulo: 'Pedidos por situação', por: 'situacao' }),
      g({ tipo: 'barras', titulo: 'Valor por fornecedor', por: 'fornecedor', valor: 'valor', limite: 15 }),
    ],
    kpis: [
      { id: 'pedidos', rotulo: 'Pedidos', agregacao: 'total', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor comprado', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'pendente', rotulo: 'Itens pendentes', campo: 'pendente', agregacao: 'soma', formato: 'inteiro' },
      { id: 'atraso', rotulo: 'Atraso médio', campo: 'dias_atraso', agregacao: 'media', formato: 'numero' },
    ] },
  { id: 'fornecedores', grupo: 'compras', titulo: 'Fornecedores', icone: 'Factory',
    subtitulo: 'Desempenho e score interno de fornecedores', profundidade: 'completa',
    recurso: 'suppliers', filtros: ['uf'],
    graficos: [
      g({ tipo: 'barras', titulo: 'Total comprado por fornecedor', por: 'nome', valor: 'total_comprado', limite: 15, campoSelecao: 'fornecedor' }),
      g({ tipo: 'dispersao', titulo: 'Pontualidade × volume', por: 'nome', valor: 'total_comprado' }),
    ],
    kpis: [
      { id: 'fornecedores', rotulo: 'Fornecedores', agregacao: 'total', formato: 'inteiro' },
      { id: 'comprado', rotulo: 'Total comprado', campo: 'total_comprado', agregacao: 'soma', formato: 'moeda' },
      { id: 'divergencias', rotulo: 'Divergências', campo: 'divergencias', agregacao: 'soma', formato: 'inteiro' },
      { id: 'pontualidade', rotulo: 'Pontualidade média', campo: 'pontualidade', agregacao: 'media', formato: 'percentual' },
    ] },
  { id: 'recebimentos', grupo: 'compras', titulo: 'Recebimentos de Mercadoria', icone: 'PackageCheck',
    subtitulo: 'Conferência de entrada e divergências', profundidade: 'completa',
    recurso: 'receipts',
    graficos: [g({ tipo: 'barras', titulo: 'Atraso por fornecedor', por: 'fornecedor', valor: 'atraso_dias', limite: 15 })],
    kpis: [
      { id: 'recebimentos', rotulo: 'Recebimentos', agregacao: 'total', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor recebido', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'atraso', rotulo: 'Atraso médio', campo: 'atraso_dias', agregacao: 'media', formato: 'numero' },
    ] },
  { id: 'necessidades-compra', grupo: 'compras', titulo: 'Necessidades de Compra', icone: 'ClipboardList',
    subtitulo: 'Sugestões de reposição com o motivo de cada uma', profundidade: 'completa',
    recurso: 'purchase-needs', filtros: ['urgencia', 'fornecedor'], selecionavel: true,
    graficos: [g({ tipo: 'barras', titulo: 'Custo estimado por urgência', por: 'urgencia', valor: 'custo_estimado' })],
    kpis: [
      { id: 'itens', rotulo: 'Itens a repor', agregacao: 'total', formato: 'inteiro' },
      { id: 'custo', rotulo: 'Custo estimado', campo: 'custo_estimado', agregacao: 'soma', formato: 'moeda' },
      { id: 'quantidade', rotulo: 'Unidades sugeridas', campo: 'quantidade_sugerida', agregacao: 'soma', formato: 'inteiro' },
    ] },

  // ── Fiscal (21–25) ───────────────────────────────────────────
  { id: 'notas-fiscais', grupo: 'fiscal', titulo: 'Notas Fiscais', icone: 'FileText',
    subtitulo: 'Central fiscal com diagnóstico de rejeição', profundidade: 'completa', custom: 'NotasFiscais' },
  { id: 'notas-servico', grupo: 'fiscal', titulo: 'Notas de Serviço', icone: 'FileSpreadsheet',
    subtitulo: 'NFS-e emitidas no período', profundidade: 'estrutural',
    recurso: 'service-invoices',
    graficos: [g({ tipo: 'linha-tempo', titulo: 'Notas emitidas', series: ['notas'] })],
    kpis: [
      { id: 'notas', rotulo: 'Notas', agregacao: 'total', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'iss', rotulo: 'ISS', campo: 'iss_valor', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'situacoes-fiscais', grupo: 'fiscal', titulo: 'Situações Fiscais', icone: 'ListFilter',
    subtitulo: 'Distribuição das notas por situação', profundidade: 'completa',
    recurso: 'fiscal-status',
    graficos: [
      g({ tipo: 'barras', titulo: 'Notas por situação', por: 'rotulo', valor: 'quantidade' }),
      g({ tipo: 'pizza', titulo: 'Valor por situação', por: 'rotulo', valor: 'valor' }),
    ],
    kpis: [
      { id: 'notas', rotulo: 'Notas', campo: 'quantidade', agregacao: 'soma', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'tributacoes', grupo: 'fiscal', titulo: 'Tributações', icone: 'Calculator',
    subtitulo: 'NCM, alíquotas estimadas e produtos sem classificação', profundidade: 'estrutural',
    recurso: 'taxes',
    graficos: [g({ tipo: 'barras', titulo: 'Receita por NCM', por: 'ncm', valor: 'receita', limite: 20 })],
    kpis: [
      { id: 'ncms', rotulo: 'NCMs distintos', agregacao: 'total', formato: 'inteiro' },
      { id: 'produtos', rotulo: 'Produtos', campo: 'produtos', agregacao: 'soma', formato: 'inteiro' },
      { id: 'receita', rotulo: 'Receita', campo: 'receita', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'documentos', grupo: 'fiscal', titulo: 'Documentos', icone: 'Files',
    subtitulo: 'DANFE e XML dos documentos emitidos', profundidade: 'estrutural',
    recurso: 'documents', filtros: ['tipo'],
    kpis: [
      { id: 'documentos', rotulo: 'Documentos', agregacao: 'total', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
    ] },

  // ── Financeiro (26–31) ───────────────────────────────────────
  { id: 'contas-receber', grupo: 'financeiro', titulo: 'Contas a Receber', icone: 'CircleDollarSign',
    subtitulo: 'Títulos, vencimentos e inadimplência', profundidade: 'completa',
    recurso: 'receivables', filtros: ['situacao', 'forma'], selecionavel: true,
    graficos: [
      g({ tipo: 'linha-tempo', titulo: 'Recebimentos previstos', series: ['recebimentos'] }),
      g({ tipo: 'barras', titulo: 'Saldo por situação', por: 'situacao', valor: 'saldo' }),
    ],
    kpis: [
      { id: 'valor', rotulo: 'A receber', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'recebido', rotulo: 'Recebido', campo: 'recebido', agregacao: 'soma', formato: 'moeda' },
      { id: 'saldo', rotulo: 'Saldo', campo: 'saldo', agregacao: 'soma', formato: 'moeda' },
      { id: 'atraso', rotulo: 'Atraso médio', campo: 'atraso_dias', agregacao: 'media', formato: 'numero' },
    ] },
  { id: 'contas-pagar', grupo: 'financeiro', titulo: 'Contas a Pagar', icone: 'Receipt',
    subtitulo: 'Obrigações, competência e recorrências', profundidade: 'completa',
    recurso: 'payables', filtros: ['situacao', 'categoria'], selecionavel: true,
    graficos: [
      g({ tipo: 'linha-tempo', titulo: 'Pagamentos previstos', series: ['pagamentos'] }),
      g({ tipo: 'barras', titulo: 'Saldo por categoria', por: 'categoria', valor: 'saldo' }),
    ],
    kpis: [
      { id: 'valor', rotulo: 'A pagar', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'pago', rotulo: 'Pago', campo: 'pago', agregacao: 'soma', formato: 'moeda' },
      { id: 'saldo', rotulo: 'Saldo', campo: 'saldo', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'fluxo-caixa', grupo: 'financeiro', titulo: 'Fluxo de Caixa', icone: 'Waves',
    subtitulo: 'Entradas, saídas e saldo — realizado e projetado', profundidade: 'completa', custom: 'FluxoCaixa' },
  { id: 'conciliacao', grupo: 'financeiro', titulo: 'Conciliação', icone: 'GitCompare',
    subtitulo: 'Pedido × nota × título, com a divergência apontada', profundidade: 'completa',
    recurso: 'reconciliation', filtros: ['status', 'canal'], selecionavel: true,
    graficos: [g({ tipo: 'barras', titulo: 'Registros por status', por: 'status' })],
    kpis: [
      { id: 'registros', rotulo: 'Registros', agregacao: 'total', formato: 'inteiro' },
      { id: 'pedido', rotulo: 'Valor dos pedidos', campo: 'valor_pedido', agregacao: 'soma', formato: 'moeda' },
      { id: 'titulos', rotulo: 'Valor dos títulos', campo: 'valor_titulos', agregacao: 'soma', formato: 'moeda' },
      { id: 'recebido', rotulo: 'Recebido', campo: 'recebido', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'categorias-financeiras', grupo: 'financeiro', titulo: 'Categorias Financeiras', icone: 'FolderKanban',
    subtitulo: 'Receitas e despesas por categoria', profundidade: 'completa',
    recurso: 'financial-categories', filtros: ['tipo'],
    graficos: [g({ tipo: 'barras', titulo: 'Valor por categoria', por: 'nome', valor: 'valor' })],
    kpis: [
      { id: 'valor', rotulo: 'Movimentado', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'liquidado', rotulo: 'Liquidado', campo: 'liquidado', agregacao: 'soma', formato: 'moeda' },
      { id: 'saldo', rotulo: 'Saldo', campo: 'saldo', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'formas-pagamento', grupo: 'financeiro', titulo: 'Formas de Pagamento', icone: 'CreditCard',
    subtitulo: 'Prazo, taxa e inadimplência por forma', profundidade: 'completa',
    recurso: 'payment-methods',
    graficos: [
      g({ tipo: 'barras', titulo: 'Valor por forma', por: 'nome', valor: 'valor' }),
      g({ tipo: 'barras', titulo: 'Custo da taxa', por: 'nome', valor: 'custo_taxa' }),
    ],
    kpis: [
      { id: 'valor', rotulo: 'Valor', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
      { id: 'taxa', rotulo: 'Custo de taxas', campo: 'custo_taxa', agregacao: 'soma', formato: 'moeda' },
      { id: 'vencidos', rotulo: 'Títulos vencidos', campo: 'vencidos', agregacao: 'soma', formato: 'inteiro' },
    ] },

  // ── Logística (32–36) ────────────────────────────────────────
  { id: 'envios', grupo: 'logistica', titulo: 'Envios', icone: 'Truck',
    subtitulo: 'Todos os envios do período', profundidade: 'completa',
    recurso: 'shipments', filtros: ['situacao', 'transportadora', 'uf'], selecionavel: true,
    graficos: [
      g({ tipo: 'barras', titulo: 'Envios por transportadora', por: 'transportadora' }),
      g({ tipo: 'barras', titulo: 'Custo por UF', por: 'uf', valor: 'custo' }),
    ],
    kpis: [
      { id: 'envios', rotulo: 'Envios', agregacao: 'total', formato: 'inteiro' },
      { id: 'custo', rotulo: 'Custo de frete', campo: 'custo', agregacao: 'soma', formato: 'moeda' },
      { id: 'atraso', rotulo: 'Atraso médio', campo: 'atraso_dias', agregacao: 'media', formato: 'numero' },
    ] },
  { id: 'transportadoras', grupo: 'logistica', titulo: 'Transportadoras', icone: 'Route',
    subtitulo: 'Prazo prometido versus realizado, custo por região e distribuição',
    profundidade: 'completa', custom: 'Transportadoras', recurso: 'carriers' },
  { id: 'rastreamento', grupo: 'logistica', titulo: 'Rastreamento', icone: 'MapPin',
    subtitulo: 'Envios em curso e sua previsão', profundidade: 'completa',
    recurso: 'tracking', filtros: ['situacao', 'transportadora'],
    graficos: [g({ tipo: 'barras', titulo: 'Em curso por situação', por: 'situacao' })],
    kpis: [
      { id: 'emcurso', rotulo: 'Em curso', agregacao: 'total', formato: 'inteiro' },
      { id: 'atraso', rotulo: 'Atraso médio', campo: 'atraso_dias', agregacao: 'media', formato: 'numero' },
    ] },
  { id: 'expedicao', grupo: 'logistica', titulo: 'Expedição', icone: 'PackageOpen',
    subtitulo: 'Fila de separação e despacho', profundidade: 'completa',
    recurso: 'dispatch', filtros: ['situacao'], selecionavel: true,
    graficos: [g({ tipo: 'barras', titulo: 'Fila por situação', por: 'situacao' })],
    kpis: [
      { id: 'fila', rotulo: 'Na fila', agregacao: 'total', formato: 'inteiro' },
    ] },
  { id: 'ocorrencias', grupo: 'logistica', titulo: 'Ocorrências', icone: 'TriangleAlert',
    subtitulo: 'Atrasos, devoluções e ocorrências de entrega', profundidade: 'completa',
    recurso: 'incidents', filtros: ['ocorrencia', 'transportadora'],
    graficos: [g({ tipo: 'barras', titulo: 'Ocorrências por transportadora', por: 'transportadora' })],
    kpis: [
      { id: 'ocorrencias', rotulo: 'Ocorrências', agregacao: 'total', formato: 'inteiro' },
    ] },

  // ── Relacionamento (37–40) ───────────────────────────────────
  { id: 'clientes', grupo: 'relacionamento', titulo: 'Clientes', icone: 'Users',
    subtitulo: 'Visão 360º com classificação e inadimplência', profundidade: 'completa',
    recurso: 'customers', filtros: ['classe', 'uf', 'tipo'], selecionavel: true,
    graficos: [
      g({ tipo: 'pareto', titulo: 'Concentração de faturamento', por: 'nome', valor: 'faturamento', limite: 25 }),
      g({ tipo: 'pizza', titulo: 'Clientes por classificação', por: 'classe' }),
    ],
    kpis: [
      { id: 'clientes', rotulo: 'Clientes', agregacao: 'total', formato: 'inteiro' },
      { id: 'faturamento', rotulo: 'Faturamento', campo: 'faturamento', agregacao: 'soma', formato: 'moeda' },
      { id: 'ticket', rotulo: 'Ticket médio', campo: 'ticket_medio', agregacao: 'media', formato: 'moeda' },
      { id: 'vencidas', rotulo: 'Contas vencidas', campo: 'contas_vencidas', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'contatos', grupo: 'relacionamento', titulo: 'Contatos', icone: 'Contact',
    subtitulo: 'Contatos de clientes e fornecedores (dados mascarados)', profundidade: 'estrutural',
    recurso: 'contacts', filtros: ['vinculo', 'uf'],
    kpis: [{ id: 'contatos', rotulo: 'Contatos', agregacao: 'total', formato: 'inteiro' }] },
  { id: 'fornecedores-rel', grupo: 'relacionamento', titulo: 'Fornecedores', icone: 'Building',
    subtitulo: 'Relacionamento e histórico de fornecimento', profundidade: 'completa',
    recurso: 'suppliers', filtros: ['uf'],
    graficos: [g({ tipo: 'barras', titulo: 'Total comprado', por: 'nome', valor: 'total_comprado', limite: 15 })],
    kpis: [
      { id: 'fornecedores', rotulo: 'Fornecedores', agregacao: 'total', formato: 'inteiro' },
      { id: 'comprado', rotulo: 'Total comprado', campo: 'total_comprado', agregacao: 'soma', formato: 'moeda' },
    ] },
  { id: 'historico-comercial', grupo: 'relacionamento', titulo: 'Histórico Comercial', icone: 'History',
    subtitulo: 'Linha do tempo de eventos comerciais', profundidade: 'estrutural',
    recurso: 'commercial-history', filtros: ['canal'],
    graficos: [g({ tipo: 'linha-tempo', titulo: 'Eventos no período', series: ['pedidos'] })],
    kpis: [
      { id: 'eventos', rotulo: 'Eventos', agregacao: 'total', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor', campo: 'valor', agregacao: 'soma', formato: 'moeda' },
    ] },

  // ── Inteligência (41–46) ─────────────────────────────────────
  { id: 'rentabilidade', grupo: 'inteligencia', titulo: 'Rentabilidade', icone: 'ChartNoAxesCombined',
    subtitulo: 'Waterfall da margem e itens com prejuízo', profundidade: 'completa', custom: 'Rentabilidade' },
  { id: 'curva-abc', grupo: 'inteligencia', titulo: 'Curva ABC', icone: 'ChartColumnIncreasing',
    subtitulo: 'Concentração por dimensão e métrica', profundidade: 'completa', custom: 'CurvaAbc' },
  { id: 'previsoes', grupo: 'inteligencia', titulo: 'Previsões', icone: 'TrendingUpDown',
    subtitulo: 'Projeção de faturamento com qualidade do ajuste', profundidade: 'completa', custom: 'Previsoes' },
  { id: 'anomalias', grupo: 'inteligencia', titulo: 'Anomalias', icone: 'Radar',
    subtitulo: 'Insights por regra, com evidência e recomendação', profundidade: 'completa', custom: 'Anomalias' },
  { id: 'relatorios', grupo: 'inteligencia', titulo: 'Relatórios', icone: 'FileBarChart',
    subtitulo: 'Catálogo de relatórios exportáveis', profundidade: 'completa', custom: 'Relatorios' },
  { id: 'alertas', grupo: 'inteligencia', titulo: 'Alertas', icone: 'BellRing',
    subtitulo: 'Tudo que exige atenção, por severidade', profundidade: 'completa',
    recurso: 'alerts', filtros: ['severidade', 'modulo'],
    graficos: [g({ tipo: 'barras', titulo: 'Ocorrências por módulo', por: 'modulo', valor: 'quantidade' })],
    kpis: [
      { id: 'tipos', rotulo: 'Tipos de alerta', agregacao: 'total', formato: 'inteiro' },
      { id: 'quantidade', rotulo: 'Ocorrências', campo: 'quantidade', agregacao: 'soma', formato: 'inteiro' },
      { id: 'valor', rotulo: 'Valor impactado', campo: 'valor_impactado', agregacao: 'soma', formato: 'moeda' },
    ] },

  // ── Administração (47–52) ────────────────────────────────────
  { id: 'integracoes', grupo: 'administracao', titulo: 'Integrações', icone: 'Plug',
    subtitulo: 'Estado da conexão e dos canais integrados', profundidade: 'completa', custom: 'Integracoes' },
  { id: 'sincronizacao', grupo: 'administracao', titulo: 'Sincronização', icone: 'RefreshCw',
    subtitulo: 'Cursores, watermark, retry e limite consumido', profundidade: 'completa', custom: 'Sincronizacao' },
  { id: 'webhooks', grupo: 'administracao', titulo: 'Webhooks', icone: 'Webhook',
    subtitulo: 'Eventos recebidos e seu processamento', profundidade: 'completa',
    recurso: 'webhooks', filtros: ['situacao', 'evento'],
    graficos: [
      g({ tipo: 'barras', titulo: 'Eventos por situação', por: 'situacao' }),
      g({ tipo: 'barras', titulo: 'Eventos por tipo', por: 'evento' }),
    ],
    kpis: [
      { id: 'eventos', rotulo: 'Eventos', agregacao: 'total', formato: 'inteiro' },
      { id: 'tentativas', rotulo: 'Tentativas', campo: 'tentativas', agregacao: 'soma', formato: 'inteiro' },
    ] },
  { id: 'logs', grupo: 'administracao', titulo: 'Logs', icone: 'ScrollText',
    subtitulo: 'Rastro técnico com correlation ID', profundidade: 'completa',
    recurso: 'logs', filtros: ['nivel', 'origem'],
    graficos: [g({ tipo: 'barras', titulo: 'Registros por nível', por: 'nivel' })],
    kpis: [{ id: 'registros', rotulo: 'Registros', agregacao: 'total', formato: 'inteiro' }] },
  { id: 'auditoria', grupo: 'administracao', titulo: 'Auditoria', icone: 'ShieldCheck',
    subtitulo: 'Trilha de ações sobre dados sensíveis', profundidade: 'completa',
    recurso: 'audit',
    kpis: [{ id: 'registros', rotulo: 'Registros', agregacao: 'total', formato: 'inteiro' }] },
  { id: 'configuracoes', grupo: 'administracao', titulo: 'Configurações', icone: 'Settings',
    subtitulo: 'Provedor, acesso, privacidade e escrita', profundidade: 'completa', custom: 'Configuracoes' },
];

/* ── Índices derivados (não duplicam a lista) ───────────────── */

export const TELAS_POR_ID: Record<string, TelaSpec> =
  Object.fromEntries(TELAS.map(t => [t.id, t]));

export const TELAS_POR_GRUPO: Record<GrupoId, TelaSpec[]> =
  GRUPOS.reduce((acc, g2) => {
    acc[g2.id] = TELAS.filter(t => t.grupo === g2.id);
    return acc;
  }, {} as Record<GrupoId, TelaSpec[]>);

export const TELA_PADRAO = 'visao-geral';
