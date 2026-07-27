import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { MODULE_ID as API_ENDPOINTS } from "../core/constants.js";
const MODULE_ID = "panel-account-security.services.api";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
const DEFAULT_TIMEOUT = 15e3;
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, credentials: "include" });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
async function loadSecurityInfo() {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.GET_SECURITY_INFO);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Erro ao carregar informa\xE7\xF5es");
    return data.data || data;
  } catch (error) {
    _getPort("logger")?.error(`[${MODULE_ID}] loadSecurityInfo error:`, error);
    throw error;
  }
}
async function changePassword(currentPassword, newPassword) {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.CHANGE_PASSWORD, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Erro ao alterar senha");
    return data;
  } catch (error) {
    _getPort("logger")?.error(`[${MODULE_ID}] changePassword error:`, error);
    throw error;
  }
}
var api_default = { loadSecurityInfo, changePassword };
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { apiReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  changePassword,
  api_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  loadSecurityInfo
};
