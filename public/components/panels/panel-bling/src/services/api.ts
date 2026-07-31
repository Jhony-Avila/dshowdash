// panel-bling/src/services/api.ts — cliente da API interna
// @version 1.0.0  @created 2026-07-30
//
// Contrato do §48. O front-end fala APENAS com /api/bling — nunca com o Bling.
//
// ⚠️ ENVELOPE: a resposta é `{ ok, data, error }`. NUNCA `{ success }`.
// O widget legado do header (panel-integration-bling) testa `j.success` contra
// esta mesma API e por isso está preso em "--" desde sempre, devolvendo HTTP 200
// o tempo todo. Ver docs/BLING/00-fase0-investigacao.md §7.8. Toda leitura aqui
// passa por `desembrulhar()`, que trata `ok !== true` como erro de verdade.

export const BASE = '/api/bling';

export interface MetaResposta {
  provider: string;
  simulado: boolean;
  ultima_sync: string | null;
  correlation_id: string;
  gerado_em: string;
  total?: number;
  pagina?: number;
  limite?: number;
  paginas?: number;
  recurso?: string;
  filtros?: Record<string, unknown>;
}

export interface Resposta<T> { dados: T; meta: MetaResposta }

export class ErroApi extends Error {
  constructor(
    public readonly codigo: string,
    public readonly http: number,
    public readonly correlationId: string | null,
    public readonly detalhe: Record<string, unknown> | null,
    mensagem: string,
  ) { super(mensagem); this.name = 'ErroApi'; }
}

const MENSAGENS: Record<string, string> = {
  AUTH_REQUIRED: 'Sua sessão expirou. Recarregue a página para entrar novamente.',
  INSUFFICIENT_LEVEL: 'Seu nível de acesso não permite ver o módulo Bling.',
  RECURSO_DESCONHECIDO: 'Esta tela pede um recurso que a API não conhece.',
  ROTA_NAO_ENCONTRADA: 'Esta tela pede um endereço que a API não conhece.',
  BLING_PROVIDER_INDISPONIVEL: 'O provedor real do Bling ainda não está disponível.',
  ERRO_INTERNO: 'O servidor encontrou um erro ao montar esta resposta.',
};

async function desembrulhar<T>(res: Response): Promise<Resposta<T>> {
  let corpo: any = null;
  try { corpo = await res.json(); } catch {
    throw new ErroApi('RESPOSTA_INVALIDA', res.status, null, null,
      'A resposta do servidor não é JSON válido.');
  }

  // A checagem é `ok !== true` de propósito: um corpo sem `ok` (por exemplo, a
  // resposta de outro handler que interceptou a rota) precisa falhar alto, e não
  // passar como sucesso com dados vazios.
  if (corpo?.ok !== true) {
    const codigo = String(corpo?.error ?? 'ERRO_DESCONHECIDO');
    const meta = corpo?.meta ?? {};
    throw new ErroApi(
      codigo, res.status,
      meta.correlation_id ?? null, meta,
      MENSAGENS[codigo] ?? meta.message ?? `Falha na requisição (${codigo}).`,
    );
  }

  return { dados: corpo.data as T, meta: corpo.meta as MetaResposta };
}

function montarUrl(caminho: string, params?: Record<string, unknown>): string {
  const url = new URL(`${BASE}${caminho}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.pathname + url.search;
}

/**
 * GET com timeout e cancelamento.
 * O sinal externo (do React, ao trocar de tela) e o timeout interno são
 * combinados: sem o timeout, uma resposta que nunca chega deixa a tela em
 * "carregando" para sempre.
 */
export async function obter<T>(
  caminho: string,
  params?: Record<string, unknown>,
  sinal?: AbortSignal,
): Promise<Resposta<T>> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 30000);
  const aoAbortar = () => ctrl.abort();
  sinal?.addEventListener('abort', aoAbortar);

  try {
    const res = await fetch(montarUrl(caminho, params), {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    return await desembrulhar<T>(res);
  } catch (e: unknown) {
    if (e instanceof ErroApi) throw e;
    if ((e as Error)?.name === 'AbortError') {
      // Cancelamento pelo React não é erro; timeout é.
      if (sinal?.aborted) throw e;
      throw new ErroApi('TIMEOUT', 0, null, null,
        'O servidor demorou demais para responder. Tente novamente.');
    }
    throw new ErroApi('FALHA_REDE', 0, null, null,
      'Não foi possível falar com o servidor. Verifique a conexão.');
  } finally {
    window.clearTimeout(timer);
    sinal?.removeEventListener('abort', aoAbortar);
  }
}

/* ── Tipos das respostas ───────────────────────────────────── */

export interface ColunaApi {
  id: string; rotulo: string; tipo?: string;
  alinhamento?: 'esquerda' | 'direita'; ordenavel?: boolean;
  largura?: number; destaque?: boolean; semaforo?: boolean;
  monoespacada?: boolean; mascarado?: boolean; tooltip?: string;
}

export interface RespostaRecurso {
  itens: Record<string, unknown>[];
  colunas: ColunaApi[];
  totais: Record<string, number>;
  facetas: Record<string, { valor: string; quantidade: number }[]>;
}

export interface KpiApi {
  id: string; rotulo: string; valor: number; formato: string;
  variacao: number | null; tendencia: string;
  sparkline: { data: string; valor: number }[] | null;
  drilldown: string | null; semantica: 'ok' | 'atencao' | 'critico';
  tooltip: string | null; definicao?: string;
}

export interface IndicadorSaude {
  id: string; rotulo: string; detalhe: string;
  chave: string; cor: string;
}

export interface Ocorrencia {
  id: string; severidade: string; modulo: string; descricao: string;
  quantidade: number; valor_impactado: number | null;
  acao_recomendada: string; tela: string; responsavel: string;
}

export interface SerieEvolucao {
  id: string; rotulo: string; formato: string;
  eixo: 'esquerda' | 'direita'; pontos: { data: string; valor: number }[];
}

export interface Evolucao {
  granularidade: string;
  series: SerieEvolucao[];
  media_movel: Record<string, { data: string; valor: number }[]>;
}

export interface Sankey {
  nos: { id: string; nome: string; tipo?: string }[];
  links: { origem: string; destino: string; valor: number; quantidade?: number }[];
  nota?: string;
}

export interface RespostaOverview {
  kpis: KpiApi[];
  saude: IndicadorSaude[];
  atencao: Ocorrencia[];
  evolucao: Evolucao;
  fluxo: Sankey;
  periodo: { de: string; ate: string; rotulo: string };
}

export interface Insight {
  id: string; severidade: string; titulo: string; evidencia: string;
  periodo: { de: string | null; ate: string | null };
  impacto: number | null; recomendacao: string; confianca: string;
  origem: string; tela: string; dados: Record<string, unknown>;
}

export interface ResumoHeader {
  titulo: string;
  estado: { chave: string; rotulo: string; cor: string };
  linhas: { rotulo: string; valor: number; formato: string; tela: string }[];
  badge: { motivo: string; descricao: string; quantidade: number; severidade: string; cor: string; tela: string } | null;
  total_pendencias: number;
  ultima_sync: string | null;
  rota: string;
}

/* ── Chamadas nomeadas ─────────────────────────────────────── */

export const api = {
  status:      (s?: AbortSignal) => obter<any>('/status', undefined, s),
  configuracoes: (s?: AbortSignal) => obter<any>('/settings', undefined, s),
  integracoes: (s?: AbortSignal) => obter<any>('/integrations', undefined, s),
  contas:      (s?: AbortSignal) => obter<any>('/accounts', undefined, s),
  headerResumo:(s?: AbortSignal) => obter<ResumoHeader>('/header/summary', undefined, s),

  overview:    (p: Record<string, unknown>, s?: AbortSignal) => obter<RespostaOverview>('/overview', p, s),
  operacional: (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/operations', p, s),
  diretoria:   (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/board', p, s),
  indicadores: (p: Record<string, unknown>, s?: AbortSignal) => obter<{ kpis: KpiApi[] }>('/indicators', p, s),
  evolucao:    (p: Record<string, unknown>, s?: AbortSignal) => obter<Evolucao>('/evolution', p, s),
  fluxo:       (p: Record<string, unknown>, s?: AbortSignal) => obter<Sankey>('/flow', p, s),
  rede:        (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/network', p, s),

  recurso: (nome: string, p: Record<string, unknown>, s?: AbortSignal) =>
    obter<RespostaRecurso>(`/resources/${nome}`, p, s),

  abc:          (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/abc', p, s),
  rentabilidade:(p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/profitability', p, s),
  funilFiscal:  (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/fiscal-funnel', p, s),
  fluxoCaixa:   (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/cashflow', p, s),
  fluxoFinanceiro:(p: Record<string, unknown>, s?: AbortSignal) => obter<Sankey>('/financial-flow', p, s),
  matrizEstoque:(p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/inventory-matrix', p, s),
  fluxoDepositos:(p: Record<string, unknown>, s?: AbortSignal) => obter<Sankey>('/warehouse-flow', p, s),
  simulador:    (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/price-simulator', p, s),
  qualidade:    (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/quality', p, s),
  insights:     (p: Record<string, unknown>, s?: AbortSignal) => obter<{ insights: Insight[] }>('/insights', p, s),
  previsoes:    (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/forecast', p, s),
  relatorios:   (s?: AbortSignal) => obter<any>('/reports', undefined, s),

  // Fase 3 — séries históricas e análises profundas
  historicoPreco:   (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/price-history', p, s),
  analiseEstoque:   (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/inventory-analytics', p, s),
  analiseLogistica: (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/logistics-analytics', p, s),
  margemVolume:     (p: Record<string, unknown>, s?: AbortSignal) => obter<any>('/margin-volume', p, s),
  formatosExport:   (s?: AbortSignal) => obter<any>('/export', undefined, s),
  sincronizacao:(s?: AbortSignal) => obter<any>('/sync', undefined, s),
};
