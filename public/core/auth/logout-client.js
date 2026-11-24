const ENDPOINT_CHECK = "/api/auth/check.php";
const ENDPOINT_LOGOUT = "/api/auth/logout.php";
let emCurso = null;
function lerCsrf(d) {
  const dados = d && d.data || d || {};
  const sessao = dados.session || {};
  const autenticado = typeof dados.authenticated === "boolean" ? dados.authenticated : null;
  return { autenticado, csrf: typeof sessao.csrf_token === "string" ? sessao.csrf_token : "" };
}
async function executar(timeoutMs) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const c = await fetch(ENDPOINT_CHECK, { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" }, signal: controle.signal });
    let csrf = "";
    if (c.ok) {
      const info = lerCsrf(await c.json().catch(() => ({})));
      if (info.autenticado === false) return { ok: true, status: c.status, motivo: "sem-sessao" };
      csrf = info.csrf;
    } else if (c.status === 401) {
      return { ok: true, status: 401, motivo: "sem-sessao" };
    }
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (csrf) headers["X-CSRF-Token"] = csrf;
    const r = await fetch(ENDPOINT_LOGOUT, { method: "POST", credentials: "include", cache: "no-store", headers, body: "{}", signal: controle.signal });
    await r.text().catch(() => "");
    if (r.ok) return { ok: true, status: r.status };
    return { ok: false, status: r.status, motivo: r.status === 403 ? "csrf" : "servidor" };
  } catch (e) {
    return { ok: false, status: 0, motivo: e && e.name === "AbortError" ? "timeout" : "rede" };
  } finally {
    clearTimeout(relogio);
  }
}
function encerrarSessao(timeoutMs = 1e4) {
  if (emCurso) return emCurso;
  emCurso = executar(timeoutMs).finally(() => {
    emCurso = null;
  });
  return emCurso;
}
var logout_client_default = { encerrarSessao };
export {
  logout_client_default as default,
  encerrarSessao
};
