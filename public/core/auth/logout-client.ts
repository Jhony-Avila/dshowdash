// =====================================================
// FILE: core/auth/logout-client.ts
// PURPOSE: DSHOW-110 (decisão do Jhony, 23/11) — o ÚNICO cliente de logout do Dash.
//   - CSRF: relê o token no /api/auth/check.php (o guardado fica velho quando a sessão renova) e manda X-CSRF-Token.
//   - Espera a CONFIRMAÇÃO do servidor: só 2xx do POST /api/auth/logout.php é sucesso. Falha de rede, timeout, 403 de CSRF ou 5xx = falha
//     (a tela mostra o erro e não finge que saiu).
//   - Já sem sessão no servidor (check.php diz authenticated:false — ex.: outra aba saiu antes) = sucesso: não há o que encerrar.
//   - Uma chamada por vez: cliques repetidos recebem a MESMA promessa.
//   Quem navega para /login é quem chama, DEPOIS do sucesso (a navegação antes abortava o POST — achado de 23/11).
// =====================================================

export interface ResultadoLogout {
  ok: boolean;
  status: number;
  motivo?: 'rede' | 'timeout' | 'csrf' | 'servidor' | 'sem-sessao';
}

const ENDPOINT_CHECK = '/api/auth/check.php';
const ENDPOINT_LOGOUT = '/api/auth/logout.php';
let emCurso: Promise<ResultadoLogout> | null = null;

function lerCsrf(d: Record<string, any>): { autenticado: boolean | null; csrf: string } {
  const dados = (d && d.data) || d || {};
  const sessao = dados.session || {};
  const autenticado = typeof dados.authenticated === 'boolean' ? dados.authenticated : null;
  return { autenticado, csrf: typeof sessao.csrf_token === 'string' ? sessao.csrf_token : '' };
}

async function executar(timeoutMs: number): Promise<ResultadoLogout> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const c = await fetch(ENDPOINT_CHECK, { method: 'GET', credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controle.signal });
    let csrf = '';
    if (c.ok) {
      const info = lerCsrf(await c.json().catch(() => ({})));
      if (info.autenticado === false) return { ok: true, status: c.status, motivo: 'sem-sessao' };
      csrf = info.csrf;
    } else if (c.status === 401) {
      return { ok: true, status: 401, motivo: 'sem-sessao' };
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const r = await fetch(ENDPOINT_LOGOUT, { method: 'POST', credentials: 'include', cache: 'no-store', headers, body: '{}', signal: controle.signal });
    // lê a resposta INTEIRA antes de devolver: a navegação que vem depois não interrompe nada em curso
    await r.text().catch(() => '');
    if (r.ok) return { ok: true, status: r.status };
    return { ok: false, status: r.status, motivo: r.status === 403 ? 'csrf' : 'servidor' };
  } catch (e) {
    return { ok: false, status: 0, motivo: e && (e as Error).name === 'AbortError' ? 'timeout' : 'rede' };
  } finally {
    clearTimeout(relogio);
  }
}

/** Encerra a sessão NO SERVIDOR e só resolve com ok:true depois da confirmação. Nunca rejeita. */
export function encerrarSessao(timeoutMs = 10000): Promise<ResultadoLogout> {
  if (emCurso) return emCurso;
  emCurso = executar(timeoutMs).finally(() => { emCurso = null; });
  return emCurso;
}

export default { encerrarSessao };
