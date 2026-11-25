// =====================================================
// FILE: core/auth/logout-client.ts
// PURPOSE: DSHOW-110 (decisão do Jhony, 23/11) — o ÚNICO cliente de logout do Dash.
//   - CSRF: relê o token no /api/auth/check.php (o guardado fica velho quando a sessão renova) e manda X-CSRF-Token.
//   - Espera a CONFIRMAÇÃO do servidor: só o ENVELOPE de sucesso do POST /api/auth/logout.php (ApiResponse::success = JSON com ok === true)
//     é saída confirmada. 2xx ambíguo (HTML de proxy, JSON inválido, {ok:false}, 204) só vale se o check.php PROVAR authenticated:false;
//     sem prova = falha 'desconhecido' (R7, DSHOW-115). Falha de rede, timeout, 403 de CSRF ou 5xx = falha
//     (a tela mostra o erro e não finge que saiu).
//   - Já sem sessão no servidor (outra aba saiu antes) = sucesso: não há o que encerrar. A prova é SÓ o validador único
//     core/auth/sessao-encerrada (Codex DSHOW-115B): 200 + JSON + envelope de sucesso do check.php (ok:true, error:null) + data.authenticated
//     === false. {ok:false, authenticated:false}, 401 de proxy, HTML, JSON inválido = DESCONHECIDO, nunca saída.
//   - Uma chamada por vez: cliques repetidos recebem a MESMA promessa.
//   Quem navega para /login é quem chama, DEPOIS do sucesso (a navegação antes abortava o POST — achado de 23/11).
// =====================================================

import { lerRespostaCheck } from './sessao-encerrada.js';

export interface ResultadoLogout {
  ok: boolean;
  status: number;
  motivo?: 'rede' | 'timeout' | 'csrf' | 'servidor' | 'sem-sessao' | 'desconhecido';
}

const ENDPOINT_CHECK = '/api/auth/check.php';
const ENDPOINT_LOGOUT = '/api/auth/logout.php';
let emCurso: Promise<ResultadoLogout> | null = null;

/** Envelope de sucesso do POST /api/auth/logout.php (ApiResponse::success): 2xx + JSON com `ok === true`. Qualquer outra coisa não confirma. */
export function envelopeDeSucesso(status: number, tipo: string | null, corpo: string): boolean {
  if (status < 200 || status > 299) return false;
  if (!/application\/json/i.test(tipo ?? '')) return false;
  try { const j = JSON.parse(corpo); return !!j && typeof j === 'object' && j.ok === true; } catch { return false; }
}

async function executar(timeoutMs: number): Promise<ResultadoLogout> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const c = await fetch(ENDPOINT_CHECK, { method: 'GET', credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controle.signal });
    // Codex DSHOW-115B: o check é lido SÓ pelo validador único. 'encerrada' = já sem sessão; 'ativa' = relê o CSRF; 'desconhecido' = sem CSRF
    // e sem conclusão (o POST segue e o servidor decide: sem CSRF ele recusa e a tela mostra "Erro ao sair").
    const leitura = await lerRespostaCheck(c);
    if (leitura.estado === 'encerrada') return { ok: true, status: c.status, motivo: 'sem-sessao' };
    const csrf = leitura.estado === 'ativa' ? leitura.csrf : '';
    // 401 NÃO é prova de "sem sessão": o check.php só emite 200 (authenticated:true/false) ou 503; 401 vem de proxy/WAF (revisão da
    // ACIMA_ESQUERDA, DSHOW-115B). Sem prova, o logout segue para o servidor (sem CSRF ele recusa e a tela mostra "Erro ao sair").
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    const r = await fetch(ENDPOINT_LOGOUT, { method: 'POST', credentials: 'include', cache: 'no-store', headers, body: '{}', signal: controle.signal });
    // lê a resposta INTEIRA antes de devolver: a navegação que vem depois não interrompe nada em curso
    const corpo = await r.text().catch(() => '');
    if (!r.ok) return { ok: false, status: r.status, motivo: r.status === 403 ? 'csrf' : 'servidor' };
    const tipo = r.headers && typeof r.headers.get === 'function' ? r.headers.get('content-type') : null;
    if (envelopeDeSucesso(r.status, tipo, corpo)) return { ok: true, status: r.status };
    {
      // 2xx AMBÍGUO: só conta como saída se o check.php PROVAR que a sessão acabou; senão é desconhecido (nunca "saiu" sem prova)
      try {
        const p = await fetch(ENDPOINT_CHECK, { method: 'GET', credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controle.signal });
        if ((await lerRespostaCheck(p)).estado === 'encerrada') return { ok: true, status: p.status, motivo: 'sem-sessao' };
      } catch { /* sem prova */ }
      return { ok: false, status: r.status, motivo: 'desconhecido' };
    }
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
