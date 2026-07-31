// lib/api.ts — cliente do backend /api/google-calendar + TanStack Query.
// @version 1.0.0  @created 2026-07-29
//
// Molde: panel-pipedrive/src/lib/api.ts.
//
// DUAS ARMADILHAS DA CASA, JÁ EVITADAS AQUI:
//  1. o envelope é {ok, data, error} — NÃO `success`. Painéis que testaram
//     `j.success` montaram e nunca saíram do placeholder;
//  2. `ok:false` pode vir com HTTP 200, então checa os dois.
// Escrita exige CSRF; o sufixo .php em /api/auth/check.php é OBRIGATÓRIO
// (sem ele a requisição cai no fallback do SPA e devolve 403).
import { QueryClient } from '@tanstack/react-query';
import type { ApiEnvelope } from '../services/types';

const BASE = '/api/google-calendar';

export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly status: number,
              readonly meta?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
  }
  get ehAuth(): boolean {
    return this.status === 401 || this.code === 'AUTH_REQUIRED' || this.code === 'NOT_AUTHENTICATED';
  }
  /** 503/501 = provisionamento pendente, não falha do usuário — a UI explica diferente. */
  get ehIndisponivel(): boolean {
    return this.status === 503 || this.status === 501;
  }
}

type Param = string | number | boolean | undefined | null;

export async function apiGet<T>(
  caminho: string,
  params?: Record<string, Param>,
  signal?: AbortSignal
): Promise<T> {
  const url = new URL(BASE + caminho, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    signal,
  });
  let body: ApiEnvelope<T> | null = null;
  try { body = await res.json(); } catch { /* não-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(
      (body?.meta?.message as string) ?? `Falha ao carregar ${caminho}`,
      body?.error ?? `HTTP_${res.status}`,
      res.status,
      body?.meta as Record<string, unknown> | undefined
    );
  }
  return body.data;
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

export async function apiWrite<T>(
  caminho: string,
  metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  corpo?: unknown,
  params?: Record<string, Param>
): Promise<T> {
  const url = new URL(BASE + caminho, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method: metodo,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-Token': await csrfToken(),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  let body: ApiEnvelope<T> | null = null;
  try { body = await res.json(); } catch { /* não-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(
      (body?.meta?.message as string) ?? `Falha em ${metodo} ${caminho}`,
      body?.error ?? `HTTP_${res.status}`,
      res.status,
      body?.meta as Record<string, unknown> | undefined
    );
  }
  return body.data;
}

/** Segmento de PATH que pode conter @ e ponto (calendarId é e-mail). */
export const seg = (v: string): string => encodeURIComponent(v);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentativa, erro) => {
        // Repetir 401/404/503 só atrasa a mensagem que o usuário precisa ler.
        if (erro instanceof ApiError && (erro.ehAuth || erro.ehIndisponivel || erro.status === 404)) return false;
        return tentativa < 2;
      },
      retryDelay: (t) => Math.min(1000 * 2 ** t, 8000),
    },
  },
});

export const chaves = {
  status: ['gcal', 'status'] as const,
  overview: (tz: string) => ['gcal', 'overview', tz] as const,
  contas: ['gcal', 'contas'] as const,
  calendarios: ['gcal', 'calendarios'] as const,
  recursos: ['gcal', 'recursos'] as const,
  eventos: (f: unknown) => ['gcal', 'eventos', f] as const,
  evento: (c: string, e: string) => ['gcal', 'evento', c, e] as const,
  freebusy: (f: unknown) => ['gcal', 'freebusy', f] as const,
  convites: (f: unknown) => ['gcal', 'convites', f] as const,
  conflitos: (f: unknown) => ['gcal', 'conflitos', f] as const,
  alertas: (c: string | null) => ['gcal', 'alertas', c] as const,
  sync: ['gcal', 'sync'] as const,
  tiposRelatorio: ['gcal', 'relatorios'] as const,
  relatorio: (t: string, f: unknown) => ['gcal', 'relatorio', t, f] as const,
  fluxo: (f: unknown) => ['gcal', 'fluxo', f] as const,
  rede: (f: unknown) => ['gcal', 'rede', f] as const,
  tiposVinculo: ['gcal', 'tipos-vinculo'] as const,
  buscaVinculo: (q: string, t: string | null) => ['gcal', 'busca-vinculo', q, t] as const,
  ficha: (t: string, i: string) => ['gcal', 'ficha', t, i] as const,
};
