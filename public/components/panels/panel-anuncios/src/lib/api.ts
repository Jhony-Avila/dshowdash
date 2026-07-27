// lib/api.ts — cliente do proxy same-origin /api/anuncios (Decision Engine).
// @version 1.0.0  @created 2026-07-27
//
// Envelope {ok,data,error,meta}: ok:false com HTTP 200 é possível, então checa os dois.
// Escrita exige CSRF (mesmo padrão do panel-ads/lib/api.ts).
// O token do Decision Engine fica NO SERVIDOR (ask.php) — nunca no navegador.
import type { ApiEnvelope, AskResposta } from '../shell/types';

const ASK_URL = '/api/anuncios/ask.php';

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

/** Envia a pergunta ao Decision Engine via proxy PHP autenticado. */
export async function perguntar(
  question: string,
  filtros: PerguntaFiltros = {},
  signal?: AbortSignal
): Promise<AskResposta> {
  const res = await fetch(ASK_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': await csrfToken(),
    },
    body: JSON.stringify({ question, ...filtros }),
    signal,
  });
  let body: ApiEnvelope<AskResposta> | null = null;
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
