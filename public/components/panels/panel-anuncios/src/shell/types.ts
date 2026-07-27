// shell/types.ts — contratos do painel Anúncios (Consultor Google Ads).
// @version 1.0.0  @created 2026-07-27

/** Config entregue pelo adaptador index.js no mount (espelha panel-ads). */
export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

/** Envelope padrão da API do dshowdash: {ok,data,error,meta}. */
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  meta?: { message?: string; [k: string]: unknown };
}

/** Origem de uma unidade de conhecimento (rastreabilidade da metodologia). */
export interface UnidadeSource {
  file: string;
  physical_phase: number;
  logical_phase: number;
  block: string | null;
  block_title: string | null;
  question_number: number;
  line_start: number;
  line_end: number;
}

/** Unidade de conhecimento retornada pelo Decision Engine (subset exibido). */
export interface Unidade {
  id: string;
  question: string;
  answer: string;
  operational_rule: string | null;
  knowledge_type: string;
  domain: string;
  segment: string | null;
  authority: string;
  status: string;
  score: number;
  source: UnidadeSource;
}

/** Resposta do POST /ask do Decision Engine (repassada pelo proxy PHP). */
export interface AskResposta {
  mode: 'consultant' | 'retrieval_only';
  answer: string | null;
  units: Unidade[];
  query: string;
}

/** Um turno da conversa (pergunta + resposta) mantido em memória. */
export interface Turno {
  id: number;
  pergunta: string;
  estado: 'carregando' | 'ok' | 'erro';
  resposta?: AskResposta;
  erro?: string;
}
