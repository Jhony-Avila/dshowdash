// lib/api.ts — cliente do proxy same-origin /api/anuncios (Decision Engine).
// @version 1.1.0  @created 2026-07-27
//
// Envelope {ok,data,error,meta}: ok:false com HTTP 200 é possível, então checa os dois.
// Escrita exige CSRF (mesmo padrão do panel-ads/lib/api.ts).
// O token do Decision Engine fica NO SERVIDOR (ask.php) — nunca no navegador.
// v1.1.0: conversas persistentes (conversa_id no ask; conversas.php; feedback.php).
import type {
  ApiEnvelope, AskResposta, Conversa, Feedback, MensagemPersistida, Stats,
} from '../shell/types';

const ASK_URL       = '/api/anuncios/ask.php';
const CONVERSAS_URL = '/api/anuncios/conversas.php';
const FEEDBACK_URL  = '/api/anuncios/feedback.php';
const STATS_URL     = '/api/anuncios/stats.php';

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

/** Lista as conversas recentes do usuário. */
export async function listarConversas(signal?: AbortSignal): Promise<Conversa[]> {
  const data = await get<{ conversas: Conversa[] }>(CONVERSAS_URL, signal);
  return data.conversas;
}

/** Carrega as mensagens de uma conversa. */
export function carregarConversa(
  id: number,
  signal?: AbortSignal
): Promise<{ conversa: { id: number; titulo: string }; mensagens: MensagemPersistida[] }> {
  return get(`${CONVERSAS_URL}?id=${id}`, signal);
}

/** Agregados do painel de aprendizado (Fase 22). */
export function carregarStats(signal?: AbortSignal): Promise<Stats> {
  return get<Stats>(STATS_URL, signal);
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
