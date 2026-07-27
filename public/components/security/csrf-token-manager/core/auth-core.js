const VERSION = "2.1.0-ENTERPRISE-FIX";
const MODULE_ID = "csrf-token-manager-auth-core";
let _authenticated = false;
let _user = null;
let _bearerToken = null;
let _tokenStore = null;
function setTokenStore(store) {
  _tokenStore = store;
}
function isAuthenticated() {
  return _authenticated;
}
function setAuthenticated(val, user = null) {
  _authenticated = val;
  _user = user;
}
function getUser() {
  return _user;
}
function setBearerToken(token) {
  _bearerToken = token;
}
function getBearerToken() {
  if (_tokenStore && typeof _tokenStore.get === "function") {
    return _tokenStore.get("bearerToken") || _bearerToken;
  }
  return _bearerToken;
}
function logout() {
  _authenticated = false;
  _user = null;
  _bearerToken = null;
}
function _getCsrfToken() {
  if (_tokenStore && typeof _tokenStore.get === "function") {
    const token = _tokenStore.get("csrfToken");
    if (token) return token;
  }
  if (typeof window !== "undefined" && window.CSRF_TOKEN) {
    return window.CSRF_TOKEN;
  }
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute("content");
  }
  return null;
}
function getHeaders() {
  const csrfToken = _getCsrfToken();
  if (!csrfToken) {
    return {};
  }
  return {
    "X-CSRF-TOKEN": csrfToken,
    "X-Requested-With": "XMLHttpRequest"
  };
}
function getAuthHeaders() {
  const headers = getHeaders();
  const bearer = getBearerToken();
  if (bearer) {
    headers["Authorization"] = `Bearer ${bearer}`;
  }
  return headers;
}
function hasValidAuthHeaders() {
  const headers = getAuthHeaders();
  return !!headers["X-CSRF-TOKEN"] || !!headers["Authorization"];
}
function getHeadersInfo() {
  const csrfToken = _getCsrfToken();
  const bearer = getBearerToken();
  return {
    hasCsrfToken: !!csrfToken,
    hasBearerToken: !!bearer,
    csrfTokenPreview: csrfToken ? `${csrfToken.substring(0, 8)}...` : null,
    bearerTokenPreview: bearer ? `${bearer.substring(0, 8)}...` : null,
    headersAvailable: hasValidAuthHeaders()
  };
}
function healthCheck() {
  const checks = {
    hasState: true,
    hasCsrfToken: !!_getCsrfToken(),
    hasBearerToken: !!getBearerToken()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 2 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    authenticated: _authenticated,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    authenticated: _authenticated,
    hasUser: !!_user,
    headersInfo: getHeadersInfo(),
    timestamp: Date.now()
  };
}
var auth_core_default = {
  isAuthenticated,
  setAuthenticated,
  getUser,
  setBearerToken,
  getBearerToken,
  logout,
  setTokenStore,
  getHeaders,
  getAuthHeaders,
  hasValidAuthHeaders,
  getHeadersInfo,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  auth_core_default as default,
  getAuthHeaders,
  getBearerToken,
  getHeaders,
  getHeadersInfo,
  getUser,
  hasValidAuthHeaders,
  healthCheck,
  info,
  isAuthenticated,
  logout,
  setAuthenticated,
  setBearerToken,
  setTokenStore
};
