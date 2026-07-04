// Cliente HTTP do Koala Docs. Herda a sessão PHP (credentials:'include'); CSRF via X-CSRF-Token.
// 401 -> redireciona ao login do sistema (useAuthGuard).
const BASE = '/api/koala';
let csrf: string | null = null;

export function goLogin(): void {
  window.location.href = '/';
}

async function ensureCsrf(): Promise<string> {
  if (csrf) return csrf;
  try {
    // IMPORTANTE: o endpoint é /api/auth/check.php (COM .php). Sem a extensão o nginx
    // cai no fallback SPA e devolve HTML -> r.json() lança -> CSRF vazio -> todo write dá 403.
    const r = await fetch('/api/auth/check.php', { credentials: 'include', cache: 'no-store' });
    const ct = r.headers.get('content-type') || '';
    if (r.ok && ct.includes('application/json')) {
      const j: any = await r.json();
      csrf = j?.csrf_token ?? j?.data?.csrf_token ?? j?.data?.session?.csrf_token ?? '';
    } else {
      csrf = '';
    }
  } catch {
    csrf = '';
  }
  return csrf || '';
}

async function parse(r: Response): Promise<any> {
  if (r.status === 401) {
    goLogin();
    throw new Error('AUTH');
  }
  const j: any = await r.json().catch(() => ({ ok: false, error: 'PARSE_ERROR' }));
  if (!j.ok) {
    const err: any = new Error(j.error || 'ERRO');
    err.meta = j.meta ?? null; // mensagem amigável do backend (ex.: 422 de estrutura) fica em meta.message
    throw err;
  }
  return j.data;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  return parse(await fetch(BASE + path, { credentials: 'include', cache: 'no-store' })) as Promise<T>;
}

// Upload multipart (imagens). NÃO seta Content-Type: o browser define o boundary do multipart.
export async function apiUpload(path: string, form: FormData): Promise<any> {
  const token = await ensureCsrf();
  return parse(
    await fetch(BASE + path, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'X-CSRF-Token': token },
      body: form,
    }),
  );
}

export async function apiSend(method: string, path: string, body?: any): Promise<any> {
  const token = await ensureCsrf();
  return parse(
    await fetch(BASE + path, {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}
