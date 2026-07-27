import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { SETTINGS_EVENTS } from "/core/runtime/events/catalog/settings.events.js";
import { MODULE_ID as PANEL_MODULE_ID, logger, emit, showToast, trackTelemetry } from "../state/state.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-06-services-settings-api";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const API_BASE = "/api/settings";
function request(url, options, abortController) {
  options = options || {};
  const fetchOpts = Object.assign({ credentials: "include", headers: { "Content-Type": "application/json" } }, options);
  if (abortController && abortController.signal) fetchOpts.signal = abortController.signal;
  return fetch(url, fetchOpts).then((res) => {
    if (res.status === 401) {
      trackTelemetry("auth_expired", { url });
      const eb = _getPort("eventBus");
      if (eb && eb.emit) eb.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: PANEL_MODULE_ID });
      throw new Error("Sess\xE3o expirada. Fa\xE7a login novamente.");
    }
    if (res.status === 403) throw new Error("Sem permiss\xE3o para esta a\xE7\xE3o.");
    return res.json();
  }).then((data) => {
    if (!data.ok) throw new Error(data.error || "REQUEST_ERROR");
    return data;
  });
}
function loadSettings(state, abortController, category) {
  let url = `${API_BASE}/?action=list`;
  if (category) url += `&category=${category}`;
  return request(url, {}, abortController).then((data) => {
    state.settings = data.settings || [];
    logger.info("Settings loaded:", state.settings.length);
    return data;
  });
}
function loadCategories(state, abortController) {
  return request(`${API_BASE}/?action=categories`, {}, abortController).then((data) => {
    state.categories = data.categories || [];
    return data;
  });
}
function getSetting(key, abortController) {
  return request(`${API_BASE}/?action=get&key=${encodeURIComponent(key)}`, {}, abortController).then((data) => data.setting);
}
function updateSetting(key, value, abortController) {
  return request(`${API_BASE}/?action=update`, { method: "PUT", body: JSON.stringify({ setting_key: key, setting_value: value }) }, abortController).then((data) => {
    emit(SETTINGS_EVENTS.UPDATED, { key, value });
    showToast("Configura\xE7\xE3o salva", "success");
    trackTelemetry("setting_updated", { key });
    return data;
  });
}
function createSetting(settingData, abortController) {
  return request(`${API_BASE}/?action=create`, { method: "POST", body: JSON.stringify(settingData) }, abortController).then((data) => {
    emit(SETTINGS_EVENTS.CREATED, settingData);
    showToast("Configura\xE7\xE3o criada", "success");
    return data;
  });
}
function deleteSetting(key, abortController) {
  return request(`${API_BASE}/?action=delete&key=${encodeURIComponent(key)}`, { method: "DELETE" }, abortController).then((data) => {
    emit(SETTINGS_EVENTS.DELETED, { key });
    showToast("Configura\xE7\xE3o removida", "success");
    return data;
  });
}
function bulkUpdate(settings, abortController) {
  return request(`${API_BASE}/?action=bulk-update`, { method: "POST", body: JSON.stringify({ settings }) }, abortController).then((data) => {
    emit(SETTINGS_EVENTS.BULK_UPDATED, { count: data.updated });
    showToast(`${data.updated} configura\xE7\xF5es salvas`, "success");
    return data;
  });
}
function info() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized };
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  return { status: portsSnapshot._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, portsInitialized: portsSnapshot._initialized } };
}
export {
  MODULE_ID,
  VERSION,
  bulkUpdate,
  createSetting,
  deleteSetting,
  getPorts,
  getSetting,
  healthCheck,
  info,
  injectPorts,
  loadCategories,
  loadSettings,
  request,
  updateSetting
};
