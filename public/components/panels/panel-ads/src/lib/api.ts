// lib/api.ts — cliente do backend /api/ads + TanStack Query.
// @version 1.0.0  @created 2026-07-21
//
// Envelope {ok,data,error,meta}: ok:false com HTTP 200 é possível, então checa os dois.
// Escrita exige CSRF; o sufixo .php em /api/auth/check.php é OBRIGATÓRIO (senão 403).
import { QueryClient } from '@tanstack/react-query';
import type { ApiEnvelope } from '../shell/types';

const BASE = '/api/ads';

export class ApiError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
  get ehAuth(): boolean {
    return this.status === 401 || this.code === 'AUTH_REQUIRED' || this.code === 'NOT_AUTHENTICATED';
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
  try { body = await res.json(); } catch { /* não-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    const code = body?.error ?? `HTTP_${res.status}`;
    const msg = body?.meta?.message ?? `Falha ao carregar ${caminho}`;
    throw new ApiError(msg, code, res.status);
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

export interface WriteResult<T> { data: T; meta: Record<string, unknown>; }

export async function apiWrite<T>(
  caminho: string,
  metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  corpo?: unknown
): Promise<WriteResult<T>> {
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
  try { body = await res.json(); } catch { /* não-JSON */ }

  if (!res.ok || !body || body.ok === false) {
    throw new ApiError(
      body?.meta?.message ?? `Falha em ${metodo} ${caminho}`,
      body?.error ?? `HTTP_${res.status}`,
      res.status
    );
  }
  return { data: body.data as T, meta: (body.meta ?? {}) as Record<string, unknown> };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentativa, erro) => {
        if (erro instanceof ApiError && (erro.ehAuth || erro.status === 404)) return false;
        return tentativa < 2;
      },
      retryDelay: (t) => Math.min(1000 * 2 ** t, 8000),
    },
  },
});

export const chaves = {
  status: ['ads', 'status'] as const,
  accounts: ['ads', 'accounts'] as const,
  dashboard: (acc: number, period: string) => ['ads', 'dashboard', acc, period] as const,
  board: (acc: number, period: string) => ['ads', 'board', acc, period] as const,
  campaigns: (acc: number) => ['ads', 'campaigns', acc] as const,
  adGroups: (acc: number) => ['ads', 'ad-groups', acc] as const,
  ads: (acc: number) => ['ads', 'ads', acc] as const,
  keywords: (acc: number) => ['ads', 'keywords', acc] as const,
  searchTerms: (acc: number) => ['ads', 'search-terms', acc] as const,
  recommendations: (acc: number) => ['ads', 'recommendations', acc] as const,
  devices: (acc: number) => ['ads', 'devices', acc] as const,
  locations: (acc: number) => ['ads', 'locations', acc] as const,
  hours: (acc: number) => ['ads', 'hours', acc] as const,
  conversions: (acc: number) => ['ads', 'conversions', acc] as const,
  audiences: (acc: number) => ['ads', 'audiences', acc] as const,
  landingPages: (acc: number) => ['ads', 'landing-pages', acc] as const,
  budgets: (acc: number) => ['ads', 'budgets', acc] as const,
  quality: (acc: number) => ['ads', 'quality', acc] as const,
  funnel: (acc: number) => ['ads', 'funnel', acc] as const,
  alerts: (acc: number) => ['ads', 'alerts', acc] as const,
  reports: ['ads', 'reports'] as const,
  history: (acc: number) => ['ads', 'history', acc] as const,
};
