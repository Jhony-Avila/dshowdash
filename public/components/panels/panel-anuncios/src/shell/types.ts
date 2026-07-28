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

/** Resposta do POST ask.php (engine + persistência). */
export interface AskResposta {
  conversa_id: number;
  message_id: number;
  mode: 'consultant' | 'retrieval_only';
  answer: string | null;
  units: Unidade[];
  query: string;
}

/** Valor de feedback de uma resposta: 1=👍, -1=👎, null=sem avaliação. */
export type Feedback = 1 | -1 | null;

/** Um turno da conversa (pergunta + resposta) exibido na tela. */
export interface Turno {
  id: number;
  pergunta: string;
  estado: 'carregando' | 'ok' | 'erro';
  resposta?: AskResposta;
  erro?: string;
  feedback?: Feedback;
}

/** Item da lista de conversas (histórico do usuário). */
export interface Conversa {
  id: number;
  titulo: string;
  updated_at: string;
  perguntas: number;
}

/** Mensagem persistida retornada por conversas.php?id=N. */
export interface MensagemPersistida {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  mode: string | null;
  units: Unidade[];
  feedback: Feedback;
  created_at: string;
}
