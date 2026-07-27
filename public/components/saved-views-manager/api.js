import { CONFIG, logger } from "./config.js";
import { SAVED_VIEWS_EVENTS } from "/core/runtime/events/catalog/saved-views.events.js";
const MODULE_ID = "components-saved-views-manager-api";
const VERSION = "2.1.0-P18EC";
let _abortController = null;
function getAbortController() {
  return _abortController;
}
function createAbortController() {
  _abortController = new AbortController();
  return _abortController;
}
function abortAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
function fetchWithRetry(url, options = {}, attempt = 1) {
  const maxAttempts = CONFIG.retry.maxAttempts;
  const baseDelay = CONFIG.retry.baseDelay;
  const maxDelay = CONFIG.retry.maxDelay;
  if (!_abortController || _abortController.signal.aborted) _abortController = new AbortController();
  const fetchOptions = Object.assign({}, options, { credentials: "include", signal: _abortController.signal });
  const timeoutId = setTimeout(() => {
    if (_abortController) _abortController.abort();
  }, CONFIG.timeout);
  return fetch(url, fetchOptions).then((response) => {
    clearTimeout(timeoutId);
    if (!response.ok && attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
      return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1));
    }
    return response;
  }).catch((error) => {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") throw new Error("REQUEST_TIMEOUT");
    if (attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request error, retry ${attempt}/${maxAttempts} in ${delay}ms: ${error.message}`);
      return sleep(delay).then(() => {
        _abortController = new AbortController();
        return fetchWithRetry(url, options, attempt + 1);
      });
    }
    throw error;
  });
}
function list(options, state, metrics, trackTelemetry, emit) {
  const params = new URLSearchParams();
  if (options.type) params.append("type", options.type);
  if (options.shared !== void 0) params.append("shared", options.shared);
  const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : "");
  return fetchWithRetry(url).then((response) => response.json()).then((data) => {
    if (data.ok) {
      state.setViews(data.views || []);
      metrics.listCount++;
      trackTelemetry("list", { count: state.getViews().length });
      emit(SAVED_VIEWS_EVENTS.LIST, { views: state.getViews(), total: data.total });
      return state.getViews();
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "list", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "list", error: error.message });
    throw error;
  });
}
function get(idOrKey, trackTelemetry, emit) {
  const param = typeof idOrKey === "number" ? `id=${idOrKey}` : `key=${idOrKey}`;
  return fetchWithRetry(`${CONFIG.endpoints.get}&${param}`).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("loaded", { idOrKey });
      emit(SAVED_VIEWS_EVENTS.LOADED, { view: data.view });
      return data.view;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    trackTelemetry("error", { action: "get", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "get", error: error.message });
    throw error;
  });
}
function getTypes(state, trackTelemetry) {
  return fetchWithRetry(CONFIG.endpoints.types).then((response) => response.json()).then((data) => {
    if (data.ok) {
      state.setViewTypes(data.types || []);
      trackTelemetry("types", { count: state.getViewTypes().length });
      return state.getViewTypes();
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    trackTelemetry("error", { action: "types", error: error.message });
    throw error;
  });
}
function create(viewData, listFn, metrics, trackTelemetry, emit) {
  return fetchWithRetry(CONFIG.endpoints.create, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(viewData) }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.createCount++;
      trackTelemetry("created", { viewId: data.view_id });
      emit(SAVED_VIEWS_EVENTS.CREATED, { view_id: data.view_id });
      return listFn().then(() => data);
    }
    throw new Error(data.error || "CREATE_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "create", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "create", error: error.message });
    throw error;
  });
}
function update(viewId, updates, listFn, metrics, trackTelemetry, emit) {
  return fetchWithRetry(CONFIG.endpoints.update, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ id: viewId }, updates)) }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.updateCount++;
      trackTelemetry("updated", { viewId });
      emit(SAVED_VIEWS_EVENTS.UPDATED, { view_id: viewId });
      return listFn().then(() => data);
    }
    throw new Error(data.error || "UPDATE_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "update", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "update", error: error.message });
    throw error;
  });
}
function setDefault(viewId, state, trackTelemetry, emit) {
  return fetchWithRetry(`${CONFIG.endpoints.setDefault}&id=${viewId}`, { method: "PATCH" }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      state.updateViewDefault(viewId);
      trackTelemetry("default-changed", { viewId });
      emit(SAVED_VIEWS_EVENTS.DEFAULT_CHANGED, { view_id: viewId });
      return data;
    }
    throw new Error(data.error || "SET_DEFAULT_ERROR");
  }).catch((error) => {
    trackTelemetry("error", { action: "setDefault", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "setDefault", error: error.message });
    throw error;
  });
}
function remove(viewId, state, metrics, trackTelemetry, emit) {
  return fetchWithRetry(`${CONFIG.endpoints.delete}?id=${viewId}`, { method: "DELETE" }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      state.removeView(viewId);
      metrics.deleteCount++;
      trackTelemetry("removed", { viewId });
      emit(SAVED_VIEWS_EVENTS.REMOVED, { view_id: viewId });
      return data;
    }
    throw new Error(data.error || "DELETE_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "remove", error: error.message });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "remove", error: error.message });
    throw error;
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  abortAll,
  create,
  createAbortController,
  fetchWithRetry,
  get,
  getAbortController,
  getTypes,
  healthCheck,
  info,
  list,
  remove,
  setDefault,
  update
};
