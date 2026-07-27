import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PREFERENCES_EVENTS } from "/core/runtime/events/catalog/preferences.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.services.preference-service";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _cache = { preferences: null, lastFetch: 0, ttl: 6e4 };
function _isCacheValid() {
  return _cache.preferences && Date.now() - _cache.lastFetch < _cache.ttl;
}
function _updateCache(prefs) {
  _cache.preferences = prefs;
  _cache.lastFetch = Date.now();
}
function clearCache() {
  _cache.preferences = null;
  _cache.lastFetch = 0;
}
function _emit(event, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
}
async function getPreferences(forceRefresh = false) {
  _initPorts();
  if (!forceRefresh && _isCacheValid()) return { ok: true, data: _cache.preferences, fromCache: true };
  try {
    const api = _getPort("apiClient");
    if (api && api.get) {
      const response = await api.get("/api/user/preferences");
      if (response.ok) {
        _updateCache(response.data);
        return { ok: true, data: response.data, fromCache: false };
      }
      return { ok: false, error: response.error || "Erro ao buscar prefer\xEAncias" };
    }
    return { ok: false, error: "ApiClient n\xE3o dispon\xEDvel" };
  } catch (e) {
    return { ok: false, error: e.message || "Erro desconhecido" };
  }
}
async function savePreferences(preferences) {
  _initPorts();
  try {
    const api = _getPort("apiClient");
    if (api && api.post) {
      const response = await api.post("/api/user/preferences", preferences);
      if (response.ok) {
        _updateCache(preferences);
        _emit(PREFERENCES_EVENTS.SAVED, { preferences });
        return { ok: true, data: response.data };
      }
      return { ok: false, error: response.error || "Erro ao salvar prefer\xEAncias" };
    }
    return { ok: false, error: "ApiClient n\xE3o dispon\xEDvel" };
  } catch (e) {
    return { ok: false, error: e.message || "Erro desconhecido" };
  }
}
async function resetPreferences() {
  _initPorts();
  try {
    const api = _getPort("apiClient");
    if (api && api.post) {
      const response = await api.post("/api/user/preferences/reset");
      if (response.ok) {
        clearCache();
        _emit(PREFERENCES_EVENTS.RESET, {});
        return { ok: true, data: response.data };
      }
      return { ok: false, error: response.error || "Erro ao resetar prefer\xEAncias" };
    }
    return { ok: false, error: "ApiClient n\xE3o dispon\xEDvel" };
  } catch (e) {
    return { ok: false, error: e.message || "Erro desconhecido" };
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, cacheValid: _isCacheValid(), portsInitialized: Ports.isInitialized() };
}
var preference_service_default = { getPreferences, savePreferences, resetPreferences, clearCache, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clearCache,
  preference_service_default as default,
  getPorts,
  getPreferences,
  healthCheck,
  info,
  injectPorts,
  resetPreferences,
  savePreferences
};
