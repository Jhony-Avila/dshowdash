import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components._shared.permissions.integration.user-detection";
const VERSION = "1.2.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
function detectCurrentUser(log) {
  _initPorts();
  const gs = _getPort("globalState");
  if (gs && gs.getState) {
    try {
      const state = gs.getState();
      const userId = state && state.auth && state.auth.user && state.auth.user.id || state && state.user && state.user.id || state && state.session && state.session.userId;
      if (userId) {
        if (log) log("user-detected", { userId: String(userId), source: "GlobalState" });
        return Promise.resolve(String(userId));
      }
    } catch (e) {
    }
  }
  return fetch("/api/auth/check.php", {
    credentials: "include",
    headers: { "Accept": "application/json" }
  }).then((response) => {
    if (response.ok) {
      return response.json().then((data) => {
        if (data.ok && data.authenticated && data.user && data.user.id) {
          if (log) log("user-detected", { userId: String(data.user.id), source: "auth-api" });
          return String(data.user.id);
        }
        return null;
      });
    }
    return null;
  }).catch((e) => {
    if (log) log("user-detect-api-error", e.message);
    return null;
  }).then((result) => {
    if (result) return result;
    try {
      const sessionData = sessionStorage.getItem("dsd_session");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.userId) {
          if (log) log("user-detected", { userId: String(parsed.userId), source: "sessionStorage" });
          return String(parsed.userId);
        }
      }
    } catch (e) {
    }
    if (log) log("user-fallback", { userId: "anonymous" });
    return "anonymous";
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
var user_detection_default = { MODULE_ID, VERSION, detectCurrentUser, injectPorts, getPorts, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  user_detection_default as default,
  detectCurrentUser,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
