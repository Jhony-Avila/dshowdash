import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-16.ports.auth.port";
const VERSION = "9.3.1-P2-ENTERPRISE";
let authInstance = null;
function setAuth(auth) {
  authInstance = auth;
}
let _corePorts = null;
function _coreAuth() {
  try {
    if (!_corePorts) {
      _corePorts = createPanelPorts({ moduleId: MODULE_ID });
      _corePorts?.init?.();
    }
    const auth = _corePorts?.get?.("auth");
    return auth && typeof auth === "object" ? auth : null;
  } catch {
    return null;
  }
}
function getAuth() {
  return authInstance || _coreAuth() || window.AuthService;
}
function _sessionManagerFallback() {
  if (typeof window === "undefined") return void 0;
  const adapter = window.Core?.windowAdapter;
  if (!adapter?.get) return void 0;
  const sm = adapter.get("SessionManager");
  if (typeof sm?.isAuthenticated !== "function") return void 0;
  return !!sm.isAuthenticated();
}
function isAuthenticated() {
  const auth = getAuth();
  const viaPort = auth?.isAuthenticated?.();
  if (typeof viaPort === "boolean") return viaPort;
  return _sessionManagerFallback() ?? false;
}
function getCurrentUser() {
  const auth = getAuth();
  return auth?.getCurrentUser?.() ?? null;
}
function hasPermission(permission) {
  const auth = getAuth();
  return auth?.hasPermission?.(permission) ?? false;
}
var auth_port_default = { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };
const AuthPort = { setAuth, getAuth, isAuthenticated, getCurrentUser, hasPermission };
export {
  AuthPort,
  MODULE_ID,
  VERSION,
  auth_port_default as default,
  getAuth,
  getCurrentUser,
  hasPermission,
  isAuthenticated,
  setAuth
};
