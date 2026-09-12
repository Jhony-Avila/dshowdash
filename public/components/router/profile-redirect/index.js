const VERSION = "1.0.0";
const MODULE_ID = "router/profile-redirect";
const FLAG = "as6.profile_redirect";
const ROTA_ORIGEM = "/profile";
const ROTA_ALVO = "/panel-avatar-studio";
const LOCAL_KEY = "dshow.avst.flags.v1";
const RESOLVE_URL = `/api/feature-flags?action=resolve&flag=${encodeURIComponent(FLAG)}`;
const RESOLVE_TIMEOUT_MS = 1500;
const LIMITE_BOOT_MS = 12e3;
const INTERVALO_MS = 150;
const RAIZ_DO_HOME = "#main .dsd-container__content [data-geral-react-root]";
const state = {
  resolved: null,
  source: "none",
  redirects: 0,
  lastAt: 0,
  navegando: false
};
function log(nivel, msg) {
  try {
    const w = window;
    const l = w.LoggerGlobal || w.logger;
    if (l && typeof l[nivel] === "function") {
      l[nivel](`[${MODULE_ID}] ${msg}`);
      return;
    }
  } catch {
  }
  if (nivel === "error" || nivel === "warn") console[nivel](`[${MODULE_ID}] ${msg}`);
}
function roteador() {
  const w = window;
  const rg = w.RouterGlobal || w.Router;
  return rg && typeof rg.navigate === "function" ? rg : null;
}
function ehRotaOrigem(hash) {
  const h = (hash || "").replace(/^#/, "");
  if (!h.startsWith("/")) return false;
  const semQuery = h.split("?")[0].split("&")[0];
  return semQuery === ROTA_ORIGEM || semQuery.startsWith(ROTA_ORIGEM + "/");
}
function overrideLocal() {
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}");
    if (Object.prototype.hasOwnProperty.call(local, FLAG)) return !!local[FLAG];
  } catch {
  }
  return null;
}
async function resolve() {
  const local = overrideLocal();
  if (local !== null) {
    state.source = "local";
    state.resolved = local;
    return local;
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const r = await fetch(RESOLVE_URL, { credentials: "include", cache: "no-store", signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!r.ok) {
      state.source = "default";
      state.resolved = false;
      return false;
    }
    const corpo = await r.json();
    const f = corpo?.data?.flag ?? corpo?.flag;
    const ligada = !!(f && f.enabled === true);
    state.source = "remote";
    state.resolved = ligada;
    return ligada;
  } catch {
    state.source = "default";
    state.resolved = false;
    return false;
  } finally {
    clearTimeout(t);
  }
}
function reescreverHashSemEvento() {
  try {
    history.replaceState(history.state, "", `#${ROTA_ALVO}`);
  } catch {
    location.replace(`#${ROTA_ALVO}`);
  }
}
async function navegarQuandoPronto() {
  if (state.navegando) return;
  state.navegando = true;
  const prazo = Date.now() + LIMITE_BOOT_MS;
  try {
    while (Date.now() < prazo) {
      if (location.hash !== `#${ROTA_ALVO}`) {
        log("debug", "hash mudou durante a espera; nada a fazer");
        return;
      }
      const rg = roteador();
      if (rg && document.querySelector(RAIZ_DO_HOME)) {
        try {
          void rg.navigate(ROTA_ALVO, { replace: true, source: MODULE_ID });
          state.redirects++;
          state.lastAt = Date.now();
          document.documentElement.setAttribute("data-profile-redirect", ROTA_ALVO);
          log("info", `${ROTA_ORIGEM} \u2192 ${ROTA_ALVO} (boot)`);
        } catch (e) {
          log("warn", `navigate() falhou: ${e?.message}`);
        }
        return;
      }
      await new Promise((r) => setTimeout(r, INTERVALO_MS));
    }
    log("warn", `desisti de redirecionar: roteador/shell n\xE3o ficaram prontos em ${LIMITE_BOOT_MS}ms`);
  } finally {
    state.navegando = false;
  }
}
function aoMudarHash(e) {
  if (state.resolved !== true) return;
  if (!ehRotaOrigem(location.hash)) return;
  if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
  state.redirects++;
  state.lastAt = Date.now();
  document.documentElement.setAttribute("data-profile-redirect", ROTA_ALVO);
  log("info", `${ROTA_ORIGEM} \u2192 ${ROTA_ALVO} (hashchange)`);
  location.replace(`#${ROTA_ALVO}`);
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, flag: FLAG, resolved: state.resolved, source: state.source, redirects: state.redirects, lastAt: state.lastAt, from: ROTA_ORIGEM, to: ROTA_ALVO };
}
async function boot() {
  const w = window;
  if (w.__profileRedirect) return;
  w.__profileRedirect = { VERSION, MODULE_ID, FLAG, info, resolve, ehRotaOrigem };
  window.addEventListener("hashchange", aoMudarHash, { capture: true });
  const hashInicial = location.hash;
  const ligada = await resolve();
  if (!ligada) return;
  if (ehRotaOrigem(hashInicial) && ehRotaOrigem(location.hash)) {
    reescreverHashSemEvento();
    void navegarQuandoPronto();
  }
}
if (typeof window !== "undefined" && typeof document !== "undefined") void boot();
var index_default = { VERSION, MODULE_ID, FLAG, info, resolve, ehRotaOrigem };
export {
  FLAG,
  MODULE_ID,
  ROTA_ALVO,
  ROTA_ORIGEM,
  VERSION,
  index_default as default,
  ehRotaOrigem,
  info,
  resolve
};
