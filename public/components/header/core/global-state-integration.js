import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { log, _integrationsStatus } from "./logger.js";
const VERSION = "2.2.0-P17WI";
const MODULE_ID = "header-core-global-state-integration";
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
function setupGlobalStateIntegration(headerInstance) {
  const gs = _getPort("globalState");
  if (!gs) {
    log("warn", "GlobalState n\xE3o dispon\xEDvel");
    return [];
  }
  _integrationsStatus.globalStateConnected = true;
  const cleanups = [];
  const unsubscribeTheme = gs.subscribe((theme) => {
    log("debug", "Tema global alterado:", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, "preferences.theme");
  cleanups.push(unsubscribeTheme);
  const unsubscribeAuth = gs.subscribe((session) => {
    if (session.isAuthenticated) {
      log("debug", "Sess\xE3o autenticada detectada");
      updateUserDisplay(session);
    }
  }, "session");
  cleanups.push(unsubscribeAuth);
  log("info", "Global State integration configurada (P17WI)");
  return cleanups;
}
function updateUserDisplay(session) {
  const userNameEl = document.querySelector(".header-user-name");
  if (userNameEl) {
    const displayName = session.user?.name || session.user?.username || session.userId || "Usu\xE1rio";
    userNameEl.textContent = displayName;
  }
  const avatarEl = document.querySelector(".header-user-avatar img");
  if (avatarEl && session.user?.avatar_url) {
    avatarEl.src = session.user.avatar_url;
    avatarEl.alt = session.user?.name || "Avatar";
  }
  const userRoleEl = document.querySelector(".header-user-role");
  if (userRoleEl && session.user?.funcao) {
    userRoleEl.textContent = session.user.funcao;
  }
  const userDeptEl = document.querySelector(".header-user-dept");
  if (userDeptEl && session.user?.departamento) {
    userDeptEl.textContent = session.user.departamento;
  }
}
function cleanupGlobalStateIntegration(cleanups) {
  if (Array.isArray(cleanups)) {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === "function") cleanup();
    });
  }
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = { globalStateAvailable: !!_getPort("globalState"), integrationsStatusTracked: !!_integrationsStatus };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), globalStateConnected: _integrationsStatus.globalStateConnected, healthCheck: healthCheck() };
}
var global_state_integration_default = { setupGlobalStateIntegration, updateUserDisplay, cleanupGlobalStateIntegration, getVersion, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  cleanupGlobalStateIntegration,
  global_state_integration_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  setupGlobalStateIntegration,
  updateUserDisplay
};
