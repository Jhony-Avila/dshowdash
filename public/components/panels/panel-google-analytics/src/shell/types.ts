// shell/types.ts — tipos e catálogo de telas do painel Google Analytics.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ ESTE ARQUIVO É A FONTE DA VERDADE DAS TELAS, junto com `api/google-analytics/index.php`.
// Quem quiser saber o que existe de verdade no módulo lê `TELAS` aqui e as rotas lá — NUNCA
// só o documento de fases. Essa regra já custou caro no Pipedrive: o doc dizia uma coisa e o
// código, outra.

/** Envelope da API interna. ⚠️ A chave é `ok`, NUNCA `success`. */
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: string | null;
  meta?: MetaProcedencia & Record<string, unknown>;
}

/**
 * Procedência do dado (§49 do briefing). Vem em TODA resposta e a tela mostra.
 * ⚠️ A §49 é explícita: divergência entre a Data API e a interface do GA4 existe e não deve
 * ser escondida. Sem estes campos a tela não tem como ser honesta.
 */
export interface MetaProcedencia {
  fonte?: 'mock' | 'ga4-data-api' | 'bigquery' | 'cache';
  categoria_quota?: 'core' | 'realtime' | 'funnel' | 'admin';
  atualizado_em?: string;
  parcial?: boolean;
  cenario?: string;
  seed?: number;
  property_id?: string;
  measurement_id?: string;
  aviso?: string;
  observacao?: string;
  nota_custo?: string;
  filtros?: { periodo: string; inicio: string; fim: string; dias: number };
}

/** Unidade governa a formatação — nunca formatar por adivinhação no componente. */
export type Unidade = 'int' | 'pct' | 'currency' | 'decimal' | 'seg';

export interface Kpi {
  chave: string;
  rotulo: string;
  valor: number;
  unidade: Unidade;
  anterior?: number | null;
  variacao_pct?: number | null;
  /** §15.3: crescer NÃO é automaticamente bom. Quem sabe o sentido é o backend. */
  maior_melhor?: boolean;
  sparkline?: number[];
}

export interface PontoSerie {
  data: string;
  sessoes: number;
  usuarios: number;
  novos_usuarios: number;
  sessoes_engajadas: number;
  visualizacoes: number;
  eventos: number;
  conversoes: number;
  taxa_conversao: number;
  receita: number;
}

export interface ItemAtencao {
  severidade: 'alta' | 'media' | 'baixa';
  metrica: string;
  titulo: string;
  impacto: string;
  causa: string;
  recomendacao: string;
  tela: TelaId;
}

// ── Catálogo de telas ────────────────────────────────────────────────────
// O briefing pede 55 telas (§10). Esta é a Fase 1: as telas abaixo existem DE VERDADE,
// com dados. `disponivel: false` é uma promessa explícita de fase seguinte — preferível a
// um item de menu que abre uma tela vazia sem explicação.

export type TelaId =
  | 'visao-geral' | 'tempo-real' | 'diretoria'
  | 'aquisicao' | 'canais' | 'campanhas'
  | 'paginas' | 'landing-pages' | 'jornada'
  | 'eventos' | 'conversoes' | 'funis'
  | 'ecommerce' | 'produtos'
  | 'usuarios' | 'dispositivos' | 'localizacoes' | 'retencao'
  | 'qualidade' | 'tagging'
  | 'alertas' | 'insights'
  | 'propriedades' | 'quotas';

export interface GrupoTelas {
  id: string;
  titulo: string;
  telas: Tela[];
}

export interface Tela {
  id: TelaId;
  titulo: string;
  /** Nome do ícone Lucide (§68) — sem emoji como ícone principal (§81). */
  icone: string;
  /** Já implementada com dados nesta fase? */
  disponivel: boolean;
  /** Quando indisponível, o motivo aparece na tela — nunca uma tela muda. */
  motivo?: string;
  /** Categoria de quota que a tela consome — mostrada no rodapé (§57). */
  quota?: 'core' | 'realtime' | 'funnel' | 'admin';
}

export const GRUPOS: GrupoTelas[] = [
  {
    id: 'visao', titulo: 'Visão',
    telas: [
      { id: 'visao-geral', titulo: 'Visão Geral', icone: 'LayoutDashboard', disponivel: true, quota: 'core' },
      { id: 'tempo-real', titulo: 'Tempo Real', icone: 'Radio', disponivel: true, quota: 'realtime' },
      { id: 'diretoria', titulo: 'Diretoria', icone: 'Presentation', disponivel: false, motivo: 'Fase 2: recorte executivo da Visão Geral, com metas.' },
    ],
  },
  {
    id: 'aquisicao', titulo: 'Aquisição',
    telas: [
      { id: 'aquisicao', titulo: 'Aquisição Geral', icone: 'MousePointerClick', disponivel: true, quota: 'core' },
      { id: 'canais', titulo: 'Canais', icone: 'Share2', disponivel: true, quota: 'core' },
      { id: 'campanhas', titulo: 'Campanhas', icone: 'Megaphone', disponivel: true, quota: 'core' },
      { id: 'jornada', titulo: 'Fluxo de Aquisição', icone: 'Route', disponivel: false, motivo: 'Fase 2: Sankey em D3. O endpoint /acquisition/flow já devolve nós e links.' },
    ],
  },
  {
    id: 'comportamento', titulo: 'Comportamento',
    telas: [
      { id: 'paginas', titulo: 'Páginas', icone: 'Files', disponivel: true, quota: 'core' },
      { id: 'landing-pages', titulo: 'Landing Pages', icone: 'PanelsTopLeft', disponivel: true, quota: 'core' },
    ],
  },
  {
    id: 'conversoes', titulo: 'Conversões',
    telas: [
      { id: 'eventos', titulo: 'Eventos', icone: 'Zap', disponivel: true, quota: 'core' },
      { id: 'conversoes', titulo: 'Eventos Importantes', icone: 'BadgeCheck', disponivel: true, quota: 'core' },
      { id: 'funis', titulo: 'Funis', icone: 'Filter', disponivel: true, quota: 'funnel' },
      { id: 'ecommerce', titulo: 'E-commerce', icone: 'ShoppingCart', disponivel: true, quota: 'core' },
      { id: 'produtos', titulo: 'Produtos', icone: 'Package', disponivel: true, quota: 'core' },
    ],
  },
  {
    id: 'usuarios', titulo: 'Usuários',
    telas: [
      { id: 'usuarios', titulo: 'Usuários', icone: 'Users', disponivel: true, quota: 'core' },
      { id: 'dispositivos', titulo: 'Dispositivos', icone: 'MonitorSmartphone', disponivel: true, quota: 'core' },
      { id: 'localizacoes', titulo: 'Localizações', icone: 'Map', disponivel: true, quota: 'core' },
      { id: 'retencao', titulo: 'Retenção e Coortes', icone: 'Repeat2', disponivel: true, quota: 'core' },
    ],
  },
  {
    id: 'qualidade', titulo: 'Qualidade',
    telas: [
      { id: 'qualidade', titulo: 'Qualidade da Coleta', icone: 'ShieldCheck', disponivel: true, quota: 'core' },
      { id: 'tagging', titulo: 'Tagging e GTM', icone: 'Tags', disponivel: true, quota: 'core' },
    ],
  },
  {
    id: 'inteligencia', titulo: 'Inteligência',
    telas: [
      { id: 'alertas', titulo: 'Alertas', icone: 'BellRing', disponivel: true, quota: 'core' },
      { id: 'insights', titulo: 'Insights', icone: 'Lightbulb', disponivel: false, motivo: 'Fase 3: regras de anomalia sobre a série histórica.' },
    ],
  },
  {
    id: 'admin', titulo: 'Administração',
    telas: [
      { id: 'propriedades', titulo: 'Propriedades', icone: 'Database', disponivel: true, quota: 'admin' },
      { id: 'quotas', titulo: 'Quotas', icone: 'Gauge', disponivel: true, quota: 'admin' },
    ],
  },
];

export const TELAS: Tela[] = GRUPOS.flatMap((g) => g.telas);

export function acharTela(id: string): Tela | undefined {
  return TELAS.find((t) => t.id === id);
}

/** Períodos do §14.1. `dias` serve só para rótulo; a janela real é resolvida no backend. */
export const PERIODOS: { id: string; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'ontem', rotulo: 'Ontem' },
  { id: '7d', rotulo: 'Últimos 7 dias' },
  { id: '14d', rotulo: 'Últimos 14 dias' },
  { id: '28d', rotulo: 'Últimos 28 dias' },
  { id: '30d', rotulo: 'Últimos 30 dias' },
  { id: '90d', rotulo: 'Últimos 90 dias' },
  { id: '365d', rotulo: 'Últimos 12 meses' },
];

/** Cenários do mock (§70). Só aparecem quando a fonte é `mock`. */
export const CENARIOS: { id: string; rotulo: string }[] = [
  { id: 'saudavel', rotulo: 'Operação saudável' },
  { id: 'pico', rotulo: 'Pico de tráfego' },
  { id: 'queda_conversao', rotulo: 'Queda de conversão' },
  { id: 'compra_parada', rotulo: 'Compra interrompida' },
  { id: 'mobile_ruim', rotulo: 'Mobile com baixa conversão' },
  { id: 'coleta_quebrada', rotulo: 'Coleta quebrada' },
  { id: 'ecommerce', rotulo: 'E-commerce instrumentado' },
  { id: 'sem_dados', rotulo: 'Sem dados' },
];
