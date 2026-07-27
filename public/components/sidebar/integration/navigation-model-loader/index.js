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
  if (!skipCache && !force) {
    const cached = Cache.getCached();
    if (cached && isValidModel(cached.data)) {
      const model = normalizeModel(cached.data);
      State.setModel(model, cached.source);
      State.setStatus(STATES.LOADED);
      Events.emitCacheHit(cached.source);
      Events.emitLoadSuccess(model, cached.source);
      Events.emitModelReady(model);
      trackLoad(cached.source, Date.now() - startTime);
      return { success: true, model, source: cached.source };
    }
    Events.emitCacheMiss();
  }
  abortController = new AbortController();
  const apiResult = await loadFromAPI({ signal: abortController.signal });
  abortController = null;
  if (apiResult.success && isValidModel(apiResult.data)) {
    const model = normalizeModel(apiResult.data);
    State.setModel(model, "api");
    State.setStatus(STATES.LOADED);
    Cache.saveToCache(model);
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
