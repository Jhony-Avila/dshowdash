import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createApiPorts } from "/core/runtime/ports-profiles.js";
import { API } from "../config.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-03/api/media-api";
const Ports = createApiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
function _emitIntent(intent, data) {
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}
const MediaAPI = {};
MediaAPI.loadFiles = (options) => {
  if (options === void 0) options = {};
  const filterType = options.filterType || "all";
  const searchQuery = options.searchQuery || "";
  const sortBy = options.sortBy || "created_at";
  const sortOrder = options.sortOrder || "DESC";
  const limit = options.limit || 100;
  const params = new URLSearchParams({ limit: String(limit), sort: sortBy, order: sortOrder });
  if (filterType !== "all") params.set("type", filterType);
  if (searchQuery) params.set("search", searchQuery);
  _log("debug", "Loading files...");
  return fetch(`${API.LIST}?${params.toString()}`, { credentials: "include", signal: options.signal }).then((res) => res.json()).then((data) => {
    if (data.success) {
      const files = data.data.files || [];
      _log("info", `Loaded ${files.length} files`);
      return { success: true, files, folders: data.data.folders || [], stats: data.data.stats || {}, storageUsed: data.data.stats && data.data.stats.totalSize ? data.data.stats.totalSize : 0, storageLimit: data.data.stats && data.data.stats.storageLimit ? data.data.stats.storageLimit : 5 * 1024 * 1024 * 1024 };
    }
    throw new Error(data.error || "Erro ao carregar");
  }).catch((error) => {
    _log("error", "Load failed:", error.message);
    return { success: false, error: error.message };
  });
};
MediaAPI.deleteFile = (fileId, { signal } = {}) => {
  _log("debug", "Deleting file:", fileId);
  return fetch(API.DELETE, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: fileId }), signal }).then((res) => res.json()).then((data) => {
    if (data.success) {
      _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "Arquivo exclu\xEDdo", type: "success" });
      _log("info", "File deleted:", fileId);
      return { success: true };
    }
    throw new Error(data.error || "Erro ao excluir");
  }).catch((error) => {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "Erro ao excluir", type: "error" });
    _log("error", "Delete failed:", error.message);
    return { success: false, error: error.message };
  });
};
MediaAPI.deleteMultiple = (fileIds, { signal } = {}) => {
  const results = { success: 0, failed: 0 };
  _log("debug", "Deleting multiple files:", fileIds.length);
  let chain = Promise.resolve();
  for (let i = 0; i < fileIds.length; i++) {
    ((id) => {
      chain = chain.then(() => fetch(API.DELETE, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id }), signal }).then((res) => res.json()).then((data) => {
        if (data.success) results.success++;
        else results.failed++;
      }).catch(() => {
        results.failed++;
      }));
    })(fileIds[i]);
  }
  return chain.then(() => {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: `${results.success} arquivo(s) exclu\xEDdo(s)`, type: results.failed > 0 ? "warning" : "success" });
    _log("info", `Deleted ${results.success}/${fileIds.length} files`);
    return results;
  });
};
MediaAPI.toggleStar = (fileId, { signal } = {}) => {
  _log("debug", "Toggling star:", fileId);
  return fetch(API.STAR, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: fileId }), signal }).then((res) => res.json()).then((data) => {
    if (data.success) {
      _log("info", "Star toggled:", fileId, data.data.starred);
      return { success: true, starred: data.data.starred };
    }
    throw new Error(data.error || "Erro ao favoritar");
  }).catch((error) => {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "Erro ao favoritar", type: "error" });
    _log("error", "Star toggle failed:", error.message);
    return { success: false, error: error.message };
  });
};
MediaAPI.getFile = (fileId, { signal } = {}) => fetch(`${API.GET}?id=${fileId}`, { credentials: "include", signal }).then((res) => res.json()).then((data) => {
  if (data.success) return { success: true, file: data.data };
  throw new Error(data.error || "Erro ao buscar arquivo");
}).catch((error) => {
  _log("error", "Get file failed:", error.message);
  return { success: false, error: error.message };
});
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort("logger");
  const checks = { apiReady: true, endpointsConfigured: !!API.LIST, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized, p18IntentsAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, usingP18Intents: true, healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var media_api_default = MediaAPI;
export {
  MODULE_ID,
  MediaAPI,
  VERSION,
  media_api_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
