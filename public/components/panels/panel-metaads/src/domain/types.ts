// domain/types.ts — modelo de domínio do módulo Meta Ads.
// @version 1.0.0  @created 2026-07-28
//
// Contrato entre as telas e a camada de serviço (briefing §41): as telas
// nunca conhecem a origem dos dados (mock ou API real da Meta).

export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

// ── Filtros globais ─────────────────────────────────────────────────

export type PeriodoId =
  | 'hoje' | 'ontem' | '7d' | '14d' | '30d'
  | 'mes_atual' | 'mes_anterior' | 'trimestre' | 'ano' | '12m';

export type ComparacaoId = 'anterior' | 'mes_anterior' | 'ano_anterior' | 'nenhuma';

export type Objetivo = 'leads' | 'conversao' | 'trafego' | 'engajamento' | 'alcance';

export interface FiltrosGlobais {
  contaId: string | 'todas';
  periodo: PeriodoId;
  comparacao: ComparacaoId;
  objetivo: Objetivo | 'todos';
}

// ── Conta ───────────────────────────────────────────────────────────

export interface Conta {
  id: string;
  nome: string;
  idExterno: string;
  moeda: string;
  fuso: string;
  status: 'ativa' | 'atencao' | 'suspensa';
  pagina: string;
  instagram: string;
  ultimaSincronizacao: string;
}

// ── KPIs / visão geral ──────────────────────────────────────────────

export type Tendencia = 'positiva' | 'negativa' | 'neutra';

export interface Kpi {
  id: string;
  rotulo: string;
  valor: number;
  formato: 'moeda' | 'numero' | 'percentual' | 'decimal';
  variacaoPct: number | null;
  tendencia: Tendencia;
  sparkline: number[];
  dica?: string;
  drill?: SecaoId;
}

export interface PontoSerie { dia: string; [metrica: string]: number | string; }
export interface FunilEtapa { rotulo: string; valor: number; custo?: number; }
export interface DistribuicaoItem { rotulo: string; valor: number; extra?: string; }

export interface AtencaoItem {
  id: string;
  titulo: string;
  detalhe: string;
  prioridade: 1 | 2 | 3;
  secao: SecaoId;
  acao: string;
}

export interface Overview {
  kpis: Kpi[];
  serie: PontoSerie[];
  funil: FunilEtapa[];
  porObjetivo: DistribuicaoItem[];
  porPosicionamento: DistribuicaoItem[];
  porRegiao: DistribuicaoItem[];
  atencao: AtencaoItem[];
}

// ── Estrutura: campanha → conjunto → anúncio → criativo ─────────────

export type StatusEntrega =
  | 'ativa' | 'pausada' | 'encerrada' | 'em_analise'
  | 'reprovada' | 'aprendizado' | 'aprendizado_limitado' | 'sem_entrega';

export interface Metricas {
  investimento: number;
  alcance: number;
  impressoes: number;
  frequencia: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  conversoes: number;
  cpa: number;
  receita: number;
  roas: number;
}

export interface Campanha extends Metricas {
  id: string;
  nome: string;
  objetivo: Objetivo;
  status: StatusEntrega;
  orcamentoDiario: number;
  orcamentoUtilizadoPct: number;
  inicio: string;
  fim: string | null;
  contaId: string;
  diagnostico: string | null;
}

export interface Conjunto extends Metricas {
  id: string;
  nome: string;
  campanhaId: string;
  campanha: string;
  status: StatusEntrega;
  publico: string;
  posicionamento: 'automatico' | 'manual';
  estrategiaLance: string;
  contaId: string;
}

export interface Anuncio extends Metricas {
  id: string;
  nome: string;
  conjuntoId: string;
  conjunto: string;
  campanhaId: string;
  campanha: string;
  criativoId: string;
  formato: 'imagem' | 'video' | 'carrossel';
  status: StatusEntrega;
  qualidade: 'acima_media' | 'media' | 'abaixo_media';
  contaId: string;
}

export interface RetencaoVideo {
  p3s: number; p25: number; p50: number; p75: number; p95: number; p100: number;
  tempoMedio: number;
}

export interface Criativo extends Metricas {
  id: string;
  nome: string;
  formato: 'imagem' | 'video' | 'carrossel';
  campanha: string;
  diasAtivo: number;
  fadiga: 'baixa' | 'media' | 'alta';
  score: number;
  fatoresScore: { fator: string; impacto: number }[];
  retencao: RetencaoVideo | null;   // só vídeo
  contaId: string;
}

// ── Públicos / posicionamentos ──────────────────────────────────────

export interface Publico extends Metricas {
  id: string;
  nome: string;
  tipo: 'salvo' | 'personalizado' | 'semelhante' | 'remarketing';
  tamanho: number;
  saturacaoPct: number;
  sobreposicao: { com: string; pct: number }[];
  contaId: string;
}

export interface Posicionamento extends Metricas {
  id: string;
  nome: string;   // Feed FB, Feed IG, Stories, Reels, Messenger, Audience Network
  plataforma: 'facebook' | 'instagram' | 'messenger' | 'audience_network';
}

// ── Leads / pixel ───────────────────────────────────────────────────

export interface Lead {
  id: string;
  data: string;
  nome: string;          // mascarado conforme permissão
  telefone: string;      // mascarado
  email: string;         // mascarado
  formulario: string;
  campanha: string;
  conjunto: string;
  anuncio: string;
  produtoInteresse: string;
  status: 'novo' | 'em_contato' | 'qualificado' | 'desqualificado' | 'convertido';
  crmVinculado: boolean;
  receita: number | null;
  contaId: string;
}

export interface EventoPixel {
  nome: string;          // PageView, Lead, Purchase...
  recebidos: number;
  serie: { dia: string; n: number }[];
  ultimaAtividade: string;
  saude: 'ok' | 'queda' | 'sem_atividade' | 'erro';
  diagnostico: string | null;
}

export interface PixelInfo {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  eventos: EventoPixel[];
  correspondenciaPct: number;
  dedupPct: number;
}

// ── Orçamento / alertas / sync ──────────────────────────────────────

export interface ResumoOrcamento {
  orcamentoDiarioTotal: number;
  investidoPeriodo: number;
  ritmoDiario: number;
  projecaoMes: number;
  campanhasAcimaRitmo: number;
  campanhasAbaixoRitmo: number;
}

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  prioridade: 1 | 2 | 3;
  data: string;
  secao: SecaoId;
  recomendacao: string;
}

export interface SyncJob {
  recurso: string;
  status: 'ok' | 'executando' | 'erro';
  ultima: string;
  proxima: string;
  processados: number;
  novos: number;
  erros: number;
}

// ── Navegação interna / cenários ────────────────────────────────────

export type SecaoId =
  | 'visao-geral' | 'central' | 'campanhas' | 'conjuntos' | 'anuncios'
  | 'criativos' | 'publicos' | 'posicionamentos' | 'funil' | 'leads'
  | 'pixel' | 'catalogos' | 'remarketing' | 'paginas' | 'orcamentos'
  | 'performance' | 'atribuicao' | 'qualidade' | 'relatorios'
  | 'alertas' | 'automacoes' | 'sincronizacao' | 'config';

export type CenarioId =
  | 'saudavel' | 'queda_performance' | 'falha_pixel' | 'orcamento_critico'
  | 'fadiga_criativo' | 'campanha_reprovada' | 'sem_dados';
