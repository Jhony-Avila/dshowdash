const MODULE_ID = "panel-16.ports.auth.port";
const VERSION = "9.3.0-P2-ENTERPRISE";
let authInstance = null;
function setAuth(auth) {
  authInstance = auth;
}
function getAuth() {
  return authInstance || window.AuthService;
}
function isAuthenticated() {
  const auth = getAuth();
  return auth?.isAuthenticated?.() ?? false;
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
