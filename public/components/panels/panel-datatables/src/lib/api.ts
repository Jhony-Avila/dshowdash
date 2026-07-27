// lib/api.ts — cliente do backend + TanStack Query.
// @version 1.0.0  @created 2026-07-20
//
// Envelope do DShowDash: {ok, data, error, meta}. `ok:false` com HTTP 200 e
// possivel, entao NAO basta checar res.ok — os dois precisam ser verificados.
import { QueryClient } from '@tanstack/react-query';
import type { ApiEnvelope } from '../shell/types';

const BASE = '/api/datatables';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
  /** Sessao expirada exige recarregar; nao adianta o Query tentar de novo. */
  get ehAuth(): boolean {
    return this.status === 401 || this.code === 'AUTH_REQUIRED';
  }
}

export async function apiGet<T>(
  caminho: string,
  params?: Record<string, string | number | boolean | undefined | null>,
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
  try { body = await res.json(); } catch { /* resposta nao-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    const code = body?.error ?? `HTTP_${res.status}`;
    const msg = body?.meta?.message ?? `Falha ao carregar ${caminho}`;
    throw new ApiError(msg, code, res.status);
  }
  return body.data;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O catalogo muda por ciclo de cron (5 min), nao por segundo.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentativa, erro) => {
        // Sessao expirada nunca melhora com retry — so irrita e polui o log.
        if (erro instanceof ApiError && (erro.ehAuth || erro.status === 404)) return false;
        return tentativa < 2;
      },
      retryDelay: (t) => Math.min(1000 * 2 ** t, 8000),
    },
  },
});

/** Chaves centralizadas: evita invalidacao errada por string solta. */
export const chaves = {
  dashboard: ['dt', 'dashboard'] as const,
  lookups:   ['dt', 'lookups'] as const,
  conexoes:  ['dt', 'connections'] as const,
  qualidade: ['dt', 'quality'] as const,
  alertas:   ['dt', 'alerts'] as const,
  dependencias: ['dt', 'dependencies'] as const,
  infra:     ['dt', 'infrastructure'] as const,
  tabelas: (f: Record<string, unknown>) => ['dt', 'tables', f] as const,
};

// ═══════════════════════════════════════════════════════════════
// ESCRITA (CSRF)
// ═══════════════════════════════════════════════════════════════
// Cascata do projeto: DOM → global → cookie → /api/auth/check.php.
// O sufixo .php é OBRIGATÓRIO: sem ele a requisição cai no fallback SPA e
// todo write volta 403.

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
  } catch { /* sem token: o backend recusa e a UI mostra o erro */ }
  return _csrfCache;
}

export async function apiWrite<T>(
  caminho: string,
  metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  corpo?: unknown
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const res = await fetch(BASE + caminho, {
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
  try { body = await res.json(); } catch { /* resposta não-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(
      body?.meta?.message ?? `Falha em ${metodo} ${caminho}`,
      body?.error ?? `HTTP_${res.status}`,
      res.status
    );
  }
  return { data: body.data, meta: body.meta ?? {} };
}
