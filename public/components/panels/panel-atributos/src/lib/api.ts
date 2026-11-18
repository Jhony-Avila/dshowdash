// panel-atributos/src/lib/api.ts — cliente da API do módulo (/api/atributos). GET sem CSRF; POST com CSRF (padrão dos painéis do Dash:
// meta csrf-token / window.SecurityCSRF / /api/auth/check.php). Envelope do Dash: {ok, data, error: "<CÓDIGO>", meta?: {message, campos}}.
// `?r=` funciona em produção e na validação sem rota nova no nginx.

export class ErroApi extends Error {
  constructor(public readonly http: number, public readonly codigo: string, mensagem: string, public readonly campos: string[] = []) { super(mensagem); }
  get conflito() { return this.http === 409 && this.codigo !== 'VALUE_EXISTS'; }   // VALUE_EXISTS (D10) não é conflito de versão
}

function csrfDoDom(): string {
  try {
    const g = (window as unknown as { SecurityCSRF?: { getToken?: () => string } }).SecurityCSRF;
    if (g?.getToken) { const t = g.getToken(); if (t) return t; }
  } catch { /* ignora */ }
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

let csrfCache = '';
async function csrf(): Promise<string> {
  const d = csrfDoDom();
  if (d) return d;
  if (csrfCache) return csrfCache;
  try {
    const r = await fetch('/api/auth/check.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.ok) csrfCache = (await r.json())?.data?.session?.csrf_token ?? '';
  } catch { /* o servidor recusa e a tela mostra o erro */ }
  return csrfCache;
}

const MENSAGENS: Record<number, string> = {
  401: 'Sua sessão expirou. Entre de novo.', 403: 'Seu nível não permite esta ação.', 404: 'Recurso não disponível para o seu usuário.',
  503: 'Catálogo de produtos indisponível no momento.',
};

async function tratar<T>(res: Response): Promise<T> {
  let corpo: { ok?: boolean; data?: T; error?: string | null; meta?: { message?: string; campos?: string[] } } = {};
  try { corpo = await res.json(); } catch { /* corpo não-JSON */ }
  if (!res.ok || corpo.ok === false) {
    const msg = corpo.meta?.message || MENSAGENS[res.status] || `Falha (${res.status}).`;
    throw new ErroApi(res.status, corpo.error || String(res.status), msg, corpo.meta?.campos ?? []);
  }
  return corpo.data as T;
}

export async function obter<T>(rota: string, params: Record<string, string | number> = {}, sinal?: AbortSignal): Promise<T> {
  const q = new URLSearchParams({ r: rota, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }).toString();
  return tratar<T>(await fetch(`/api/atributos/index.php?${q}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: sinal }));
}

export async function enviar<T>(rota: string, corpo: unknown): Promise<T> {
  const token = await csrf();
  return tratar<T>(await fetch(`/api/atributos/index.php?r=${encodeURIComponent(rota)}`, {
    method: 'POST', credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify(corpo),
  }));
}

/** URL da miniatura autenticada (A6). */
export const urlFoto = (id: number, lado: 480 | 1280 = 480) => `/api/atributos/index.php?r=foto&id=${id}&t=${lado}`;

/** Chave de idempotência das operações em massa. */
export const novaChave = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
