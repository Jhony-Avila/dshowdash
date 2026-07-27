import { CONFIG as _CONFIG, logger } from "./config.js";
const CONFIG = _CONFIG;
const MODULE_ID = "components-permission-audit-client-api";
const VERSION = "2.0.1-P18EC";
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
    _abortController.abort();
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
function list(options, metrics, trackTelemetry, emit) {
  const params = new URLSearchParams();
  if (options.limit) params.append("limit", options.limit);
  if (options.offset) params.append("offset", options.offset);
  if (options.user_id) params.append("user_id", options.user_id);
  if (options.permission) params.append("permission", options.permission);
  if (options.action_type) params.append("action_type", options.action_type);
  if (options.days) params.append("days", options.days);
  const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : "");
  return fetchWithRetry(url).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("list", { count: Array.isArray(data.logs) ? data.logs.length : 0 });
      emit("list", { logs: data.logs, total: data.total });
      return data;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "list", error: error.message });
    emit("error", { action: "list", error: error.message });
    throw error;
  });
}
function getStats(days, metrics, trackTelemetry, emit) {
  return fetchWithRetry(`${CONFIG.endpoints.stats}&days=${days}`).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("stats", { days });
      emit("stats", data);
      return data;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "stats", error: error.message });
    emit("error", { action: "stats", error: error.message });
    throw error;
  });
}
function getUserHistory(userId, limit, metrics, trackTelemetry, emit) {
  let url = `${CONFIG.endpoints.userHistory}&limit=${limit}`;
  if (userId) url += `&user_id=${userId}`;
  return fetchWithRetry(url).then((response) => response.json()).then((data) => {
    if (data.ok) {
      trackTelemetry("user-history", { userId: data.user_id, count: Array.isArray(data.logs) ? data.logs.length : 0 });
      emit("user-history", { user_id: data.user_id, logs: data.logs });
      return data;
    }
    throw new Error(data.error || "FETCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "userHistory", error: error.message });
    emit("error", { action: "userHistory", error: error.message });
    throw error;
  });
}
function log(permissionKey, action, options, metrics, trackTelemetry, emit) {
  return fetchWithRetry(CONFIG.endpoints.log, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permission_key: permissionKey, action, resource_type: options.resourceType || null, resource_id: options.resourceId || null, context: options.context || null }) }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.logCount++;
      trackTelemetry("logged", { permissionKey, action });
      emit("logged", { log_id: data.log_id, permission_key: permissionKey, action });
      return data;
    }
    throw new Error(data.error || "LOG_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "log", error: error.message });
    emit("error", { action: "log", error: error.message });
    throw error;
  });
}
function sendBatch(entries, metrics, trackTelemetry, emit) {
  return fetchWithRetry(CONFIG.endpoints.batch, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) }).then((response) => response.json()).then((data) => {
    if (data.ok) {
      metrics.flushCount++;
      trackTelemetry("flushed", { count: entries.length });
      emit("flushed", { inserted: data.inserted, errors: data.errors });
      return data;
    }
    throw new Error(data.error || "BATCH_ERROR");
  }).catch((error) => {
    metrics.errorCount++;
    trackTelemetry("error", { action: "flush", error: error.message });
    emit("error", { action: "flush", error: error.message });
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
  createAbortController,
  fetchWithRetry,
  getAbortController,
  getStats,
  getUserHistory,
  healthCheck,
  info,
  list,
  log,
  sendBatch
};
