import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { SESSION_ADMIN_EVENTS } from "/core/runtime/events/catalog/session-admin.events.js";
import { API_CONFIG } from "../core/contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin.adapters.backend-api";
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
const API_BASE = API_CONFIG && API_CONFIG.BASE_URL ? API_CONFIG.BASE_URL : "/api/sessions";
let _abortController = null;
const _metrics = {
  requests: 0,
  errors: 0,
  lastRequestAt: null,
  lastError: null,
  lastFetchDurationMs: 0
};
function _emit(event, data = {}) {
  try {
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
    }
  } catch (e) {
  }
}
function _getCSRFToken() {
  const securityCSRF = _getPort("securityCSRF");
  if (securityCSRF && securityCSRF.getToken) {
    return securityCSRF.getToken();
  }
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.content : "";
}
function _request(url, options = {}) {
  const startTime = Date.now();
  _metrics.requests++;
  _metrics.lastRequestAt = startTime;
  const headers = Object.assign({
    "Content-Type": "application/json",
    "X-CSRF-Token": _getCSRFToken()
  }, options.headers || {});
  const fetchOptions = Object.assign({
    credentials: "include",
    headers,
    signal: _abortController ? _abortController.signal : void 0
  }, options);
  return fetch(url, fetchOptions).then((response) => {
    _metrics.lastFetchDurationMs = Date.now() - startTime;
    if (response.status === 401) {
      _emit(AUTH_EVENTS.SESSION_EXPIRED);
      throw new Error("SESSION_EXPIRED");
    }
    if (response.status === 403) {
      throw new Error("ACCESS_DENIED");
    }
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    return response.json();
  }).then((data) => {
    if (data.ok === false) {
      throw new Error(data.error || "API_ERROR");
    }
    return data;
  }).catch((e) => {
    _metrics.errors++;
    _metrics.lastError = { message: e.message, timestamp: Date.now() };
    throw e;
  });
}
function initAbortController() {
  if (_abortController) {
    _abortController.abort();
  }
  _abortController = new AbortController();
}
function cleanupAbortController() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
// Normaliza a sessão da API (/api/sessions action=list) para o modelo do UI (2026-07-08).
// Backend (por segurança) só devolve token MASCARADO (token_preview) + is_current; NÃO o token real.
// Campos da API: device_type, browser, os, origin_ip, is_active, created_at, last_activity_at,
// expires_at, token_preview, is_current. Usamos token_preview como identidade de linha (id/session_token).
function _normalizeSession(raw) {
  if (!raw || typeof raw !== "object") return null;
  const preview = raw.token_preview || raw.session_token || "";
  const rowId = String(raw.id != null ? raw.id : preview);
  let status = "active";
  if (raw.expires_at) {
    const exp = new Date(String(raw.expires_at).replace(" ", "T")).getTime();
    if (!isNaN(exp) && exp < Date.now()) status = "expired";
  }
  if (status === "active" && !(raw.is_active === 1 || raw.is_active === true || raw.is_active === "1")) {
    status = "expired";
  }
  return {
    id: rowId,
    session_token: rowId,            // identidade de linha/seleção/expansão = PK do banco (p/ revoke por id)
    token_preview: preview,          // exibição (mascarado); o token real nunca trafega
    is_current: !!raw.is_current,
    user_name: raw.user_name || raw.userName || "",   // "minhas sessões": sem nome (fica "-"); admin: via JOIN
    user_email: raw.user_email || raw.userEmail || "",
    ip_address: raw.origin_ip || raw.ip_address || "",
    device: raw.device_type || raw.device || "",
    browser: raw.browser || "",
    os: raw.os || "",
    location: raw.location || "",
    user_agent: [raw.browser, raw.os].filter(Boolean).join(" \xB7 "),
    created_at: raw.created_at || "",
    last_activity: raw.last_activity_at || raw.last_activity || "",
    expires_at: raw.expires_at || "",
    status
  };
}
function _extractSessions(resp) {
  // ApiResponse::success -> { ok:true, data:[...], meta:{count} }. Tolera formas legadas.
  const arr = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp?.sessions) ? resp.sessions : Array.isArray(resp) ? resp : [];
  return arr.map(_normalizeSession).filter(Boolean);
}
function loadMySessions() {
  return _request(`${API_BASE}/?action=list&scope=mine`).then(_extractSessions);
}
function loadAllSessions() {
  return _request(`${API_BASE}/?action=list&scope=all`).then(_extractSessions);
}
function terminateSession(sessionToken) {
  if (!sessionToken) return Promise.reject(new Error("SESSION_TOKEN_REQUIRED"));
  return _request(`${API_BASE}/?action=revoke`, {
    method: "POST",
    body: JSON.stringify({ session_token: sessionToken })
  }).then((data) => {
    _emit(SESSION_ADMIN_EVENTS.SESSION_TERMINATED, { sessionToken });
    return data;
  });
}
function terminateAllOthers() {
  return _request(`${API_BASE}/?action=revoke_all`, {
    method: "POST"
  }).then((data) => {
    _emit(SESSION_ADMIN_EVENTS.SESSION_TERMINATE_ALL);
    return data;
  });
}
function terminateByIds(ids) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter((x) => x != null && x !== "");
  if (!list.length) return Promise.reject(new Error("IDS_REQUIRED"));
  return _request(`${API_BASE}/?action=revoke_by_id`, {
    method: "POST",
    body: JSON.stringify({ ids: list })
  }).then((data) => {
    _emit(SESSION_ADMIN_EVENTS.SESSION_TERMINATED, { ids: list });
    return data;
  });
}
function getCurrentSession() {
  return _request(`${API_BASE}/?action=current`).then((data) => data.session || null);
}
function updateActivity() {
  return _request(`${API_BASE}/?action=activity`, {
    method: "POST"
  });
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function getLastError() {
  return _metrics.lastError;
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const errorRate = _metrics.requests > 0 ? _metrics.errors / _metrics.requests : 0;
  return {
    status: errorRate > 0.5 ? "DEGRADED" : "HEALTHY",
    metrics: Object.assign({}, _metrics),
    errorRate: Math.round(errorRate * 100),
    available: true,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
var backend_api_default = {
  VERSION,
  MODULE_ID,
  initAbortController,
  cleanupAbortController,
  loadMySessions,
  loadAllSessions,
  terminateSession,
  terminateAllOthers,
  terminateByIds,
  getCurrentSession,
  updateActivity,
  getMetrics,
  getLastError,
  getVersion,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanupAbortController,
  backend_api_default as default,
  getCurrentSession,
  getLastError,
  getMetrics,
  getPorts,
  getVersion,
  healthCheck,
  initAbortController,
  injectPorts,
  loadAllSessions,
  loadMySessions,
  terminateAllOthers,
  terminateByIds,
  terminateSession,
  updateActivity
};
