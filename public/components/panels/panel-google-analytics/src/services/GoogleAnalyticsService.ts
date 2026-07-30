// services/GoogleAnalyticsService.ts — o contrato da §54 do briefing.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ REGRA DO MÓDULO: nenhuma tela chama `fetch` direto. Todas consomem esta interface.
// É isso que permite trocar a fonte (mock → Data API → BigQuery) sem reconstruir tela,
// que é o critério de aceite técnico da §83.
//
// ⚠️ E o front NUNCA fala com o Google. Fala com `/api/google-analytics/*`, que é quem tem
// credencial. A §83 proíbe o front acessar API externa direta — e é também a única forma de
// não vazar `api_secret`/token para o navegador (§45.4).
import type {
  ApiEnvelope, Kpi, PontoSerie, ItemAtencao, MetaProcedencia,
} from '../shell/types';

// ── Filtros ──────────────────────────────────────────────────────────────
export interface FiltrosAnalytics {
  periodo?: string;
  inicio?: string;
  fim?: string;
  comparar?: string;
  cenario?: string;
  /** Cross-filter (§63): a seleção de um componente vira filtro dos outros. */
  canal?: string | null;
  campanha?: string | null;
  dispositivo?: string | null;
  pagina?: string | null;
  evento?: string | null;
  limite?: number;
}

// ── Formas de resposta ───────────────────────────────────────────────────
export interface RespostaOverview {
  kpis: Kpi[];
  serie: PontoSerie[];
  serie_anterior: PontoSerie[];
  atencao: ItemAtencao[];
}

export interface LinhaCanal {
  canal: string; usuarios: number; sessoes: number; conversoes: number;
  receita: number; custo: number | null; taxa_conversao: number; cpa: number | null;
}

export interface LinhaCampanha {
  campanha: string; canal: string; origem: string; midia: string;
  usuarios: number; sessoes: number; sessoes_engajadas: number; taxa_engajamento: number;
  conversoes: number; taxa_conversao: number; receita: number;
  custo: number | null; custo_fonte: string | null; cpa: number | null; roas: number | null;
  utm_ok: boolean;
}

export interface DiagnosticoUtm {
  severidade: 'alta' | 'media' | 'baixa';
  campanha: string; problema: string; detalhe: string; sessoes: number;
}

export interface RespostaAquisicao {
  por_canal: LinhaCanal[];
  campanhas: LinhaCampanha[];
  diagnosticos: DiagnosticoUtm[];
}

export interface RespostaTempoReal {
  ativos_agora: number; ativos_5min: number; ativos_30min: number;
  por_minuto: { minuto: string; usuarios: number }[];
  por_canal: { canal: string; usuarios: number }[];
  por_pagina: { path: string; titulo: string; usuarios: number }[];
  por_dispositivo: { dispositivo: string; usuarios: number }[];
  por_regiao: { uf: string; regiao: string; usuarios: number }[];
  eventos_recentes: { evento: string; quando: string; importante: boolean }[];
}

export interface LinhaPagina {
  path: string; titulo: string; tipo: string;
  visualizacoes: number; usuarios: number; entradas: number; saidas: number;
  taxa_engajamento: number; tempo_medio_seg: number; conversoes: number; receita: number;
  e_entrada: boolean; score?: number;
}

export interface RespostaPaginas {
  paginas: LinhaPagina[];
  landings: LinhaPagina[];
  aviso_score: string;
}

export interface LinhaEvento {
  evento: string; classe: string; importante: boolean;
  contagem: number; usuarios: number; por_sessao: number;
  primeira_ocorrencia: string; ultima_ocorrencia: string;
  diagnosticos: { nivel: 'info' | 'aviso' | 'erro'; texto: string }[];
  taxa?: number; valor?: number | null;
}

export interface RespostaEventos {
  eventos: LinhaEvento[];
  ausentes: { evento: string; motivo: string }[];
}

export interface CrmLeads {
  disponivel: boolean;
  fonte: string;
  banco?: string;
  motivo?: string;
  total: number | null;
  convertidos_em_negocio?: number;
  valor_total?: number;
  por_origem?: { origem: string; rotulo: string; total: number }[];
  pct_manual?: number | null;
  por_dia: { data: string; leads: number }[];
  aviso_origem?: string;
}

export interface RespostaConversoes {
  importantes: LinhaEvento[];
  conciliacao_crm: {
    ga4_generate_lead: number;
    ga4_fonte: string;
    crm_leads: number | null;
    crm_fonte: string | null;
    crm: CrmLeads;
    /** ⚠️ `false` quando um lado é simulado: a tela NÃO mostra diferença nesse caso. */
    comparavel: boolean;
    motivo_nao_comparavel: string | null;
    diferenca: number | null;
    diferenca_pct: number | null;
    status: string;
    motivos_possiveis: string[];
    aviso: string;
  };
}

export interface EtapaFunil {
  etapa: string; evento: string; usuarios: number;
  taxa_da_anterior: number; abandono: number; taxa_do_topo: number; tempo_medio_seg: number;
}

export interface RespostaFunil {
  funis_disponiveis: { id: string; nome: string; disponivel: boolean; motivo: string | null }[];
  funil_ativo: string;
  etapas: EtapaFunil[];
}

export interface RespostaEcommerce {
  instrumentado: boolean;
  motivo?: string;
  eventos_necessarios?: string[];
  acao_sugerida?: string;
  como_demonstrar?: string;
  kpis: Kpi[];
  produtos: {
    item: string; item_id: string; categoria: string;
    visualizacoes: number; add_to_cart: number; compras: number;
    quantidade: number; receita: number; taxa_conversao: number; abandono: number;
  }[];
  checkout: { etapa: string; usuarios: number; taxa: number; perda: number }[];
}

export interface NoFluxo { id: string; nome: string; camada: string; valor: number }
export interface LinkFluxo { origem: string; destino: string; valor: number }

export interface RespostaFluxo {
  nos: NoFluxo[];
  links: LinkFluxo[];
  camadas: { id: string; rotulo: string }[];
}

export interface NoJornadaApi {
  id: string; nome: string; titulo: string; tipo: string;
  usuarios: number; converteu: number; filhos: NoJornadaApi[];
}

export interface RespostaJornada {
  inicio: string;
  inicios_disponiveis: { path: string; titulo: string }[];
  arvore: NoJornadaApi;
}

export interface RespostaUsuarios {
  kpis: Kpi[];
  por_dispositivo: { dispositivo: string; usuarios: number; conversoes: number; taxa_conversao: number; taxa_engajamento: number }[];
  por_regiao: { uf: string; regiao: string; usuarios: number; conversoes: number; taxa_conversao: number }[];
  coortes: { coorte: string; tamanho: number; semanas: number[] }[];
  aviso_privacidade: string;
}

export interface RespostaQualidade {
  resumo: { streams_ativos: number; eventos_recebidos: number; eventos_ausentes: number; eventos_com_aviso: number; achados_abertos: number };
  achados: { severidade: string; item: string; detalhe: string; classificacao: string }[];
  tagging: {
    container: string; measurement_id: string; ua_legado: string; onde_esta_a_tag: string;
    tipos_de_tag: Record<string, number>;
    checklist: { item: string; ok: boolean | null }[];
  };
}

export interface RespostaAlertas {
  alertas: (ItemAtencao & { id: string; quando: string; estado: string; confianca: string })[];
  regras: { id: string; nome: string; metrica: string; limite: string; comparacao: string; ativa: boolean }[];
}

export interface RespostaStatus {
  provedor: string; pronto: boolean;
  measurement_id?: string; gtm_container?: string; property_id?: string;
  cenarios?: string[];
  pendencias_para_real: string[];
}

export interface RespostaPropriedades {
  contas: {
    id: string; nome: string; pais: string;
    propriedades: {
      id: string; property_id: string; nome: string; measurement_id: string;
      moeda: string; timezone: string; tipo: string; criada_em: string;
      streams: { id: string; nome: string; tipo: string; dominio: string; measurement_id: string; ativo: boolean; ultima_coleta: string }[];
    }[];
  }[];
  aviso_inventario: string;
}

export interface RespostaQuotas {
  medindo: boolean;
  observacao: string | null;
  categorias: { categoria: string; rotulo: string; consumo: number | null; limite: number | null; descricao: string }[];
  politica: string[];
}

/** Resultado com procedência — a tela precisa do `meta` para ser honesta (§49, §69.4). */
export interface ComMeta<T> {
  dados: T;
  meta: MetaProcedencia;
}

/** O contrato. Uma implementação por fonte. */
export interface GoogleAnalyticsService {
  getStatus(sinal?: AbortSignal): Promise<ComMeta<RespostaStatus>>;
  getOverview(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaOverview>>;
  getRealtime(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaTempoReal>>;
  getAcquisition(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaAquisicao>>;
  getPages(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaPaginas>>;
  getEvents(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaEventos>>;
  getConversions(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaConversoes>>;
  getFunnel(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaFunil>>;
  getFlow(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaFluxo>>;
  getJourney(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaJornada>>;
  getEcommerce(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaEcommerce>>;
  getUsers(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaUsuarios>>;
  getQuality(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaQualidade>>;
  getAlerts(f: FiltrosAnalytics, sinal?: AbortSignal): Promise<ComMeta<RespostaAlertas>>;
  getProperties(sinal?: AbortSignal): Promise<ComMeta<RespostaPropriedades>>;
  getQuotas(sinal?: AbortSignal): Promise<ComMeta<RespostaQuotas>>;
}

// ── Implementação sobre a API interna ────────────────────────────────────

const BASE = '/api/google-analytics';

function query(f: FiltrosAnalytics): string {
  const q = new URLSearchParams();
  if (f.periodo) q.set('periodo', f.periodo);
  if (f.inicio) q.set('inicio', f.inicio);
  if (f.fim) q.set('fim', f.fim);
  if (f.comparar) q.set('comparar', f.comparar);
  if (f.cenario) q.set('cenario', f.cenario);
  if (f.canal) q.set('canal', f.canal);
  if (f.campanha) q.set('campanha', f.campanha);
  if (f.dispositivo) q.set('dispositivo', f.dispositivo);
  if (f.pagina) q.set('pagina', f.pagina);
  if (f.evento) q.set('evento', f.evento);
  if (f.limite) q.set('limite', String(f.limite));
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Erro com o que a tela precisa para o estado de erro da §69.3. */
export class ErroApi extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo?: string,
    readonly pendencias?: string[],
  ) {
    super(message);
    this.name = 'ErroApi';
  }
}

async function pedir<T>(rota: string, sinal?: AbortSignal): Promise<ComMeta<T>> {
  const res = await fetch(`${BASE}${rota}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal: sinal,
  });

  let corpo: ApiEnvelope<T> | null = null;
  try {
    corpo = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ErroApi('Resposta ilegível do servidor.', res.status);
  }

  // ⚠️ DOIS testes, não um. O envelope deste projeto usa `ok`, e `ok:false` pode vir com
  // HTTP 200. Testar só `res.ok` deixa passar erro; testar só `corpo.ok` perde o 503 do
  // provedor real. Isto é o bug que deixou 17 painéis presos no placeholder por meses.
  if (!res.ok || !corpo?.ok) {
    const meta = (corpo?.meta ?? {}) as Record<string, unknown>;
    throw new ErroApi(
      (meta.message as string) ?? corpo?.error ?? `Falha na requisição (HTTP ${res.status}).`,
      res.status,
      corpo?.error ?? undefined,
      (meta.pendencias as string[]) ?? undefined,
    );
  }

  return { dados: corpo.data, meta: (corpo.meta ?? {}) as MetaProcedencia };
}

export class ApiGoogleAnalyticsService implements GoogleAnalyticsService {
  /** O sinal do construtor é fallback; o preferido é o passado por chamada (uma por tela). */
  constructor(private readonly sinalPadrao?: AbortSignal) {}

  private s(sinal?: AbortSignal) { return sinal ?? this.sinalPadrao; }

  getStatus(sinal?: AbortSignal) { return pedir<RespostaStatus>('/status', this.s(sinal)); }
  getOverview(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaOverview>(`/overview${query(f)}`, this.s(sinal)); }
  getRealtime(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaTempoReal>(`/realtime${query(f)}`, this.s(sinal)); }
  getAcquisition(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaAquisicao>(`/acquisition${query(f)}`, this.s(sinal)); }
  getPages(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaPaginas>(`/pages${query(f)}`, this.s(sinal)); }
  getEvents(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaEventos>(`/events${query(f)}`, this.s(sinal)); }
  getConversions(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaConversoes>(`/conversions${query(f)}`, this.s(sinal)); }
  getFunnel(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaFunil>(`/funnel${query(f)}`, this.s(sinal)); }
  getFlow(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaFluxo>(`/acquisition/flow${query(f)}`, this.s(sinal)); }
  getJourney(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaJornada>(`/journey${query(f)}`, this.s(sinal)); }
  getEcommerce(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaEcommerce>(`/ecommerce${query(f)}`, this.s(sinal)); }
  getUsers(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaUsuarios>(`/users${query(f)}`, this.s(sinal)); }
  getQuality(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaQualidade>(`/quality${query(f)}`, this.s(sinal)); }
  getAlerts(f: FiltrosAnalytics, sinal?: AbortSignal) { return pedir<RespostaAlertas>(`/alerts${query(f)}`, this.s(sinal)); }
  getProperties(sinal?: AbortSignal) { return pedir<RespostaPropriedades>('/properties', this.s(sinal)); }
  getQuotas(sinal?: AbortSignal) { return pedir<RespostaQuotas>('/quotas', this.s(sinal)); }
}
