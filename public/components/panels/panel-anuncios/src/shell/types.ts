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
  final_rule?: string | null;
  knowledge_type: string;
  domain: string;
  segment: string | null;
  authority: string;
  status: string;
  score: number;
  source: UnidadeSource;
}

/** Perfil de consulta do engine (especializa o fluxo). */
export type Perfil = 'consultor' | 'qualificacao';

/** Resposta do POST ask.php (engine + persistência). */
export interface AskResposta {
  conversa_id: number;
  message_id: number;
  profile?: Perfil;
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
  profile: Perfil;
  is_favorita: boolean;
  updated_at: string;
  perguntas: number;
}

/** Detalhe da conversa retornado por conversas.php?id=N. */
export interface ConversaDetalhe {
  id: number;
  titulo: string;
  profile: Perfil;
  is_favorita: boolean;
  arquivada: boolean;
}

/** Ações de escrita sobre uma conversa. */
export type AcaoConversa = 'renomear' | 'favoritar' | 'desfavoritar' | 'arquivar' | 'desarquivar';

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

/** Linha de pergunta+resposta nos agregados do aprendizado (stats.php). */
export interface StatsLinha {
  message_id: number;
  conversa_id: number;
  pergunta: string;
  resposta: string;
  mode: string | null;
  feedback: Feedback;
  comment: string | null;
  created_at: string;
}

/** Agregados do painel de aprendizado (Fase 22). */
export interface Stats {
  totais: {
    conversas: number;
    perguntas: number;
    positivas: number;
    negativas: number;
    sem_cobertura: number;
  };
  por_modo: Record<string, number>;
  dominios: { dominio: string; citacoes: number }[];
  negativas: StatsLinha[];
  sem_cobertura: StatsLinha[];
  recentes: StatsLinha[];
  atividade?: { dia: string; n: number }[];
}
