import { MODULE_ID, VERSION } from "./core/constants.js";
import { STATES } from "./core/contracts.js";
import * as State from "./core/state.js";
import * as Cache from "./cache/cache-manager.js";
import { loadFromAPI } from "./api/loader.js";
import { getFallbackModel, isFallbackModel } from "./api/fallback.js";
import { track, trackLoad } from "./telemetry/tracker.js";
import * as Events from "./events/bindings.js";
import { isValidModel, normalizeModel } from "./utils/helpers.js";
let abortController = null;
let seqPedido = 0;
const donoAtual = () => {
  try {
    const a = Events.getPorts()?.auth;
    const u = a?.getUser?.() ?? a?.getCurrentUser?.() ?? null;
    const id = u?.id ?? u?.user_id ?? u?.userId ?? null;
    return id !== null && id !== void 0 && String(id) !== "" ? String(id) : null;
  } catch (_e) {
    return null;
  }
};
let assinouAuth = false;
const limparRespostasApiDoSW = async () => {
  try {
    const cs = globalThis.caches;
    if (!cs || !cs.keys) return 0;
    let n = 0;
    for (const nome of await cs.keys()) {
      const c = await cs.open(nome);
      for (const req of await c.keys()) {
        try {
          if (new URL(req.url).pathname.startsWith("/api/")) {
            await c.delete(req);
            n++;
          }
        } catch (_e) {
        }
      }
    }
    track("cache:sw-api-clear", { n });
    return n;
  } catch (_e) {
    return 0;
  }
};
const limparSessao = () => {
  seqPedido++;
  try {
    if (abortController) abortController.abort();
  } catch (_e) {
  }
  abortController = null;
  Cache.invalidateAll();
  limparRespostasApiDoSW();
  State.resetState();
  publicarIdentidade(null, "sessao-encerrada");
  track("cache:auth-clear");
};
const EVENTOS_SESSAO = ["auth.logout", "auth.logout.success", "auth.logout.completed", "auth.logout.detected", "auth:logout", "header.logout.requested", "auth.login.success"];
const assinarAuth = () => {
  if (assinouAuth) return;
  try {
    if (!Events.getPorts()?.eventBus?.on) return;
    for (const ev of EVENTOS_SESSAO) Events.on(ev, limparSessao);
    assinouAuth = true;
  } catch (_e) {
  }
};
const lerIdentidade = (meta) => {
  const m = meta && typeof meta === "object" ? meta.menu ?? null : null;
  if (!m || m.generation === void 0 || m.generation === null) return null;
  const g = Number(m.generation);
  if (!Number.isFinite(g)) return null;
  return { revision: String(m.revision ?? ""), generation: g, checksum: String(m.checksum ?? "") };
};
const identidadeDoModelo = (model) => model && model.metadata && model.metadata.menuConsumido || null;
const publicarIdentidade = (id, source) => {
  try {
    const g = globalThis;
    g.__dshowMenuConsumido = id ? { ...id, source, at: Date.now() } : { revision: null, generation: null, checksum: null, source, at: Date.now() };
    const el = typeof document !== "undefined" ? document.documentElement : null;
    if (!el) return;
    if (id) {
      el.setAttribute("data-menu-revision", id.revision);
      el.setAttribute("data-menu-generation", String(id.generation));
      el.setAttribute("data-menu-checksum", id.checksum);
    } else {
      el.removeAttribute("data-menu-revision");
      el.removeAttribute("data-menu-generation");
      el.removeAttribute("data-menu-checksum");
    }
    el.setAttribute("data-menu-source", source);
  } catch (_e) {
  }
};
const load = async (options = {}) => {
  const { force = false, skipCache = false } = options;
  const startTime = Date.now();
  if (State.isLoading()) {
    track("load:already-loading");
    return { success: false, reason: "already-loading" };
  }
  if (!force && State.isLoaded()) {
    const model = State.getModel();
    if (model && !isFallbackModel(model)) {
      track("load:already-loaded");
      return { success: true, model, source: "memory" };
    }
  }
  State.setStatus(STATES.LOADING);
  Events.emitLoadStart();
  assinarAuth();
  const dono = donoAtual();
  if (!skipCache && !force) {
    const cached = Cache.getCached(dono);
    if (cached && isValidModel(cached.data)) {
      const model = normalizeModel(cached.data);
      if (model && cached.data && cached.data.metadata && cached.data.metadata.menuConsumido) model.metadata = { ...model.metadata || {}, menuConsumido: cached.data.metadata.menuConsumido };
      State.setModel(model, cached.source);
      publicarIdentidade(identidadeDoModelo(model), String(cached.source || "cache"));
      State.setStatus(STATES.LOADED);
      Events.emitCacheHit(cached.source);
      Events.emitLoadSuccess(model, cached.source);
      Events.emitModelReady(model);
      trackLoad(cached.source, Date.now() - startTime);
      revalidar(dono);
      return { success: true, model, source: cached.source };
    }
    Events.emitCacheMiss();
  }
  const meuPedido = ++seqPedido;
  abortController = new AbortController();
  const apiResult = await loadFromAPI({ signal: abortController.signal });
  if (meuPedido !== seqPedido) {
    track("load:superseded", { meuPedido, atual: seqPedido });
    return { success: false, reason: "superseded" };
  }
  if (donoAtual() !== dono) {
    State.resetState();
    track("load:owner-changed", { inicio: dono });
    return { success: false, reason: "owner-changed" };
  }
  abortController = null;
  if (apiResult.success && isValidModel(apiResult.data)) {
    const nova = lerIdentidade(apiResult.meta);
    const atualModel = State.getModel();
    const vigente = identidadeDoModelo(atualModel);
    if (nova && vigente && nova.generation < vigente.generation && atualModel && !isFallbackModel(atualModel)) {
      State.setStatus(STATES.LOADED);
      track("load:stale-rejected", { recebida: nova.generation, consumida: vigente.generation });
      publicarIdentidade(vigente, "api-stale-rejected");
      return { success: true, model: atualModel, source: "memory", staleRejected: true, rejected: nova };
    }
    const model = normalizeModel(apiResult.data);
    if (model) model.metadata = { ...model.metadata || {}, menuConsumido: nova, dono };
    State.setModel(model, "api");
    publicarIdentidade(nova, "api");
    State.setStatus(STATES.LOADED);
    Cache.saveToCache(model, dono);
    Events.emitLoadSuccess(model, "api");
    Events.emitModelReady(model);
    trackLoad("api", Date.now() - startTime);
    return { success: true, model, source: "api" };
  }
  if (apiResult.authRequired) {
    State.setStatus(STATES.ERROR);
    State.setError({ message: "Auth required" });
    Events.emitLoadError({ type: "auth", status: apiResult.status });
    track("load:auth-required");
    return { success: false, authRequired: true, status: apiResult.status };
  }
  track("load:using-fallback", { reason: apiResult.error });
  const fallback = getFallbackModel(apiResult.error || "api-error");
  State.setModel(fallback, "fallback");
  State.setStatus(STATES.FALLBACK);
  Events.emitLoadFallback(apiResult.error);
  Events.emitModelReady(fallback);
  trackLoad("fallback", Date.now() - startTime, false);
  return { success: true, model: fallback, source: "fallback", degraded: true };
};
const conferirDono = (motivo) => {
  const m = State.getModel();
  if (!m) return;
  const d = donoAtual();
  const donoModelo = m && m.metadata ? m.metadata.dono ?? null : null;
  if (!d || d !== donoModelo) {
    limparSessao();
    track("cache:owner-check-clear", { motivo, trocou: !!d });
    reload(true);
  }
};
const aoRestaurarDoHistorico = (e) => {
  if (e && e.persisted) conferirDono("bfcache");
};
const aoFicarVisivel = () => {
  try {
    if (typeof document !== "undefined" && document.visibilityState === "visible") conferirDono("visivel");
  } catch (_e) {
  }
};
try {
  if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("pageshow", aoRestaurarDoHistorico);
  if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("visibilitychange", aoFicarVisivel);
  if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("click", (e) => {
    try {
      const t = e && e.target;
      if (t && t.closest && t.closest('[data-action="logout"], [data-intent$=".logout"], .logout[data-action]')) {
        limparSessao();
        track("cache:logout-click-clear");
      }
    } catch (_e) {
    }
  }, true);
} catch (_e) {
}
const revalidar = async (dono) => {
  const meu = ++seqPedido;
  let r;
  try {
    r = await loadFromAPI({});
  } catch (_e) {
    return;
  }
  if (meu !== seqPedido) return;
  if (donoAtual() !== dono) {
    track("revalidate:owner-changed", { inicio: dono });
    return;
  }
  if (r && r.authRequired) {
    Cache.invalidateAll();
    State.resetState();
    publicarIdentidade(null, "auth-required");
    Events.emitLoadError({ type: "auth", status: r.status });
    track("revalidate:auth-cleared", { status: r.status });
    return;
  }
  if (!r || !r.success || !isValidModel(r.data)) return;
  const nova = lerIdentidade(r.meta);
  const atual = State.getModel();
  const vig = identidadeDoModelo(atual);
  if (vig && nova && nova.generation < vig.generation) {
    track("revalidate:older-rejected", { nova: nova.generation, vigente: vig.generation });
    return;
  }
  const model = normalizeModel(r.data);
  if (!model) return;
  model.metadata = { ...model.metadata || {}, menuConsumido: nova, dono };
  State.setModel(model, "api");
  State.setStatus(STATES.LOADED);
  Cache.saveToCache(model, dono);
  publicarIdentidade(nova, "api-revalidate");
  Events.emitLoadSuccess(model, "api");
  Events.emitModelReady(model);
  track("revalidate:updated", { de: vig && vig.generation, para: nova && nova.generation });
};
const reload = async (force) => {
  Cache.invalidateAll();
  Events.emitCacheInvalidate();
  State.resetState();
  return load({ force: true, skipCache: true });
};
const abort = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
    track("load:aborted");
  }
};
const getModel = () => State.getModel();
const getStatus = () => State.getStatus();
const isReady = () => State.isLoaded();
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  state: State.getState(),
  hasModel: !!State.getModel(),
  isFallback: isFallbackModel(State.getModel())
});
const healthCheck = () => {
  const state = State.getState();
  return {
    healthy: state.status === STATES.LOADED && !!state.model,
    status: state.status,
    lastLoad: state.lastLoad,
    source: state.source,
    isFallback: isFallbackModel(state.model)
  };
};
var navigation_model_loader_default = {
  load,
  reload,
  abort,
  getModel,
  getStatus,
  isReady,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};
export {
  MODULE_ID,
  VERSION,
  abort,
  navigation_model_loader_default as default,
  getModel,
  getStatus,
  healthCheck,
  info,
  isReady,
  load,
  reload
};
