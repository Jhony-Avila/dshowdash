// lib/api.ts — cliente do proxy same-origin /api/anuncios (Decision Engine).
// @version 1.1.0  @created 2026-07-27
//
// Envelope {ok,data,error,meta}: ok:false com HTTP 200 é possível, então checa os dois.
// Escrita exige CSRF (mesmo padrão do panel-ads/lib/api.ts).
// O token do Decision Engine fica NO SERVIDOR (ask.php) — nunca no navegador.
// v1.1.0: conversas persistentes (conversa_id no ask; conversas.php; feedback.php).
import type {
  AcaoConversa, ApiEnvelope, AskResposta, Conversa, ConversaDetalhe,
  Feedback, MensagemPersistida, Stats, Unidade,
} from '../shell/types';

const ASK_URL       = '/api/anuncios/ask.php';
const STREAM_URL    = '/api/anuncios/ask-stream.php';
const CONVERSAS_URL = '/api/anuncios/conversas.php';
const FEEDBACK_URL  = '/api/anuncios/feedback.php';
const STATS_URL     = '/api/anuncios/stats.php';
const SEGMENTOS_URL = '/api/anuncios/segmentos.php';

export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
  get ehAuth(): boolean {
    return this.status === 401 || this.code === 'AUTH_REQUIRED' || this.code === 'NOT_AUTHENTICATED';
  }
}

function csrfDoDom(): string {
  try {
    const g = (window as unknown as { SecurityCSRF?: { getToken?: () => string } }).SecurityCSRF;
    if (g?.getToken) { const t = g.getToken(); if (t) return t; }
  } catch { /* ignora */ }
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta?.getAttribute('content')) return meta.getAttribute('content') as string;
  const c = document.cookie.split('; ').find((x) => x.startsWith('csrf_token='));
  return c ? decodeURIComponent(c.split('=')[1]) : '';
}

let _csrfCache = '';
export async function csrfToken(): Promise<string> {
  const local = csrfDoDom();
  if (local) return local;
  if (_csrfCache) return _csrfCache;
  try {
    const r = await fetch('/api/auth/check.php', {
      credentials: 'same-origin', headers: { Accept: 'application/json' },
    });
    if (r.ok) {
      const j = await r.json();
      _csrfCache = j?.data?.session?.csrf_token ?? '';
    }
  } catch { /* backend recusa e a UI mostra o erro */ }
  return _csrfCache;
}

export interface PerguntaFiltros {
  domain?: string;
  segment?: string;
  k?: number;
  /** Modo de resposta do consultor: rapida | executiva | completa. */
  style?: string;
  /** Perfil de consulta: consultor | qualificacao. */
  profile?: string;
}

/** POST JSON autenticado (CSRF) com tratamento do envelope padrão. */
async function post<T>(url: string, corpo: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': await csrfToken(),
    },
    body: JSON.stringify(corpo),
    signal,
  });
  let body: ApiEnvelope<T> | null = null;
  try { body = await res.json(); } catch { /* não-JSON */ }

  if (!res.ok || !body || body.ok === false || !body.data) {
    const code = body?.error ?? `HTTP_${res.status}`;
    const msg = body?.meta?.message
      ?? (res.status === 502
        ? 'O Decision Engine não respondeu. Verifique se o serviço está no ar.'
        : 'Falha ao consultar o Decision Engine.');
    throw new ApiError(msg, code, res.status);
  }
  return body.data;
}

/** GET JSON autenticado com tratamento do envelope padrão. */
async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal,
  });
  let body: ApiEnvelope<T> | null = null;
  try { body = await res.json(); } catch { /* não-JSON */ }
  if (!res.ok || !body || body.ok === false || !body.data) {
    throw new ApiError(
      body?.meta?.message ?? 'Falha ao carregar o histórico.',
      body?.error ?? `HTTP_${res.status}`,
      res.status
    );
  }
  return body.data;
}

/** Envia a pergunta (com memória, se conversaId) ao Decision Engine. */
export function perguntar(
  question: string,
  conversaId: number | null,
  filtros: PerguntaFiltros = {},
  signal?: AbortSignal
): Promise<AskResposta> {
  return post<AskResposta>(
    ASK_URL,
    { question, ...(conversaId ? { conversa_id: conversaId } : {}), ...filtros },
    signal
  );
}

/** Lista as conversas do usuário (favoritas primeiro; arquivadas à parte). */
export async function listarConversas(
  arquivadas = false,
  signal?: AbortSignal
): Promise<Conversa[]> {
  const url = arquivadas ? `${CONVERSAS_URL}?arquivadas=1` : CONVERSAS_URL;
  const data = await get<{ conversas: Conversa[] }>(url, signal);
  return data.conversas;
}

/** Carrega as mensagens de uma conversa. */
export function carregarConversa(
  id: number,
  signal?: AbortSignal
): Promise<{ conversa: ConversaDetalhe; mensagens: MensagemPersistida[] }> {
  return get(`${CONVERSAS_URL}?id=${id}`, signal);
}

/** Executa uma ação sobre a conversa (renomear/favoritar/arquivar...). */
export function acaoConversa(
  id: number,
  action: AcaoConversa,
  titulo?: string
): Promise<unknown> {
  return post(CONVERSAS_URL, { id, action, ...(titulo ? { titulo } : {}) });
}

/** Segmentos da base de conhecimento (formulário de qualificação). */
export async function listarSegmentos(signal?: AbortSignal): Promise<string[]> {
  const data = await get<{ segmentos: string[] }>(SEGMENTOS_URL, signal);
  return data.segmentos;
}

/** Página da Biblioteca (navegação da base de conhecimento). */
export interface PaginaUnidades {
  total: number;
  offset: number;
  limit: number;
  units: Unidade[];
}

/** Navega a base de conhecimento (tela Metodologia Dshow). */
export function listarUnidades(
  params: { domain?: string; segment?: string; q?: string; offset?: number; limit?: number },
  signal?: AbortSignal
): Promise<PaginaUnidades> {
  const query = new URLSearchParams();
  if (params.domain) query.set('domain', params.domain);
  if (params.segment) query.set('segment', params.segment);
  if (params.q) query.set('q', params.q);
  if (params.offset) query.set('offset', String(params.offset));
  if (params.limit) query.set('limit', String(params.limit));
  const sufixo = query.toString();
  return get<PaginaUnidades>(`/api/anuncios/biblioteca.php${sufixo ? '?' + sufixo : ''}`, signal);
}

/** Agregados do painel de aprendizado (Fase 22). */
export function carregarStats(signal?: AbortSignal): Promise<Stats> {
  return get<Stats>(STATS_URL, signal);
}

// ── Streaming (SSE via ask-stream.php) ─────────────────────────────

export interface StreamHandlers {
  /** Recuperação concluída: modo + fontes chegam antes do texto. */
  onMeta?: (meta: { mode: AskResposta['mode']; units: Unidade[]; query: string }) => void;
  /** Pedaço de texto da resposta do consultor. */
  onDelta?: (texto: string) => void;
}

/**
 * Pergunta em tempo real. Resolve com a resposta completa (incl. message_id
 * para o feedback). Lança ApiError se o streaming não estiver disponível —
 * o chamador decide o fallback para perguntar().
 */
export async function perguntarStream(
  question: string,
  conversaId: number | null,
  handlers: StreamHandlers = {},
  filtros: PerguntaFiltros = {},
  signal?: AbortSignal
): Promise<AskResposta> {
  const res = await fetch(STREAM_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'X-CSRF-Token': await csrfToken(),
    },
    body: JSON.stringify({ question, ...(conversaId ? { conversa_id: conversaId } : {}), ...filtros }),
    signal,
  });

  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok || !ct.includes('text/event-stream') || !res.body) {
    // Erro de validação/sessão (JSON) ou streaming indisponível no caminho.
    let body: ApiEnvelope<unknown> | null = null;
    try { body = await res.json(); } catch { /* não-JSON */ }
    throw new ApiError(
      body?.meta?.message ?? 'Streaming indisponível.',
      body?.error ?? `HTTP_${res.status}`,
      res.status
    );
  }

  let meta: { mode: AskResposta['mode']; units: Unidade[]; query: string } | null = null;
  let saved: { conversa_id: number; message_id: number } | null = null;
  let answer: string | null = null;
  let partes = '';
  let erro: string | null = null;

  const processar = (bloco: string) => {
    let evento = ''; let dados: unknown = null;
    for (const linha of bloco.split('\n')) {
      if (linha.startsWith('event: ')) evento = linha.slice(7).trim();
      else if (linha.startsWith('data: ')) {
        try { dados = JSON.parse(linha.slice(6)); } catch { dados = null; }
      }
    }
    const d = dados as Record<string, unknown> | null;
    if (evento === 'meta' && d) {
      meta = {
        mode: d.mode === 'consultant' ? 'consultant' : 'retrieval_only',
        units: Array.isArray(d.units) ? (d.units as Unidade[]) : [],
        query: typeof d.query === 'string' ? d.query : question,
      };
      handlers.onMeta?.(meta);
    } else if (evento === 'delta' && d && typeof d.t === 'string') {
      partes += d.t;
      handlers.onDelta?.(d.t);
    } else if (evento === 'done' && d) {
      answer = typeof d.answer === 'string' ? d.answer : null;
    } else if (evento === 'saved' && d) {
      saved = {
        conversa_id: Number(d.conversa_id) || 0,
        message_id: Number(d.message_id) || 0,
      };
    } else if (evento === 'error' && d) {
      erro = typeof d.message === 'string' ? d.message : 'Falha no streaming.';
    }
  };

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      processar(buf.slice(0, idx));
      buf = buf.slice(idx + 2);
    }
  }
  if (buf.trim()) processar(buf);

  if (erro) throw new ApiError(erro, 'STREAM_ERROR', 502);
  if (!meta || !saved) throw new ApiError('Fluxo de streaming incompleto.', 'STREAM_INCOMPLETE', 502);

  const m = meta as { mode: AskResposta['mode']; units: Unidade[]; query: string };
  const s = saved as { conversa_id: number; message_id: number };
  return {
    conversa_id: s.conversa_id,
    message_id: s.message_id,
    mode: m.mode,
    answer: answer ?? (partes || null),
    units: m.units,
    query: m.query,
  };
}

/** Registra 👍/👎 (ou remove, com 0) numa resposta do consultor. */
export function enviarFeedback(
  messageId: number,
  feedback: Feedback | 0,
  comment?: string
): Promise<{ message_id: number; feedback: Feedback }> {
  return post(FEEDBACK_URL, {
    message_id: messageId,
    feedback: feedback ?? 0,
    ...(comment ? { comment } : {}),
  });
}
