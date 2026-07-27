import { log } from "../ports.js";
import { StoragePort } from "../ports/storage-port.js";
import { parseJWT, getJWTExpiration, isTokenExpired, isTokenExpiringSoon } from "../utils/helpers.js";
const VERSION = "5.1.0-P17WI";
const MODULE_ID = "session-token";
const STORAGE_KEY = "dshowdash.session.token";
const _metrics = { tokensSet: 0, tokensCleared: 0, csrfSet: 0, csrfCleared: 0, persistSuccess: 0, persistFailed: 0, restoreSuccess: 0, restoreFailed: 0 };
const jwtState = { jwt: null, jwtExp: null };
function persistToken(token) {
  try {
    if (token) {
      const exp = getJWTExpiration(token);
      const result = StoragePort.set(STORAGE_KEY, { token, exp, savedAt: Date.now() });
      if (result) {
        _metrics.persistSuccess++;
        return true;
      }
    } else {
      StoragePort.remove(STORAGE_KEY);
      _metrics.persistSuccess++;
      return true;
    }
    _metrics.persistFailed++;
    return false;
  } catch (e) {
    _metrics.persistFailed++;
    log.warn("Failed to persist token", { error: e.message });
    return false;
  }
}
function restoreToken() {
  try {
    const data = StoragePort.get(STORAGE_KEY);
    if (!data || !data.token) return null;
    if (data.exp && isTokenExpired(data.exp)) {
      log.info("Restored token is expired, clearing");
      StoragePort.remove(STORAGE_KEY);
      return null;
    }
    _metrics.restoreSuccess++;
    log.info("Token restored from storage");
    return data;
  } catch (e) {
    _metrics.restoreFailed++;
    log.warn("Failed to restore token", { error: e.message });
    return null;
  }
}
function initFromStorage() {
  const stored = restoreToken();
  if (stored && stored.token) {
    jwtState.jwt = stored.token;
    jwtState.jwtExp = stored.exp || getJWTExpiration(stored.token);
    return true;
  }
  return false;
}
initFromStorage();
function getSecurityCSRF() {
  if (typeof window !== "undefined" && window.SecurityCSRF) return window.SecurityCSRF;
  return null;
}
function setToken(token) {
  _metrics.tokensSet++;
  jwtState.jwt = token;
  jwtState.jwtExp = token ? getJWTExpiration(token) : null;
  persistToken(token);
  return true;
}
function getToken() {
  return jwtState.jwt;
}
function clearToken() {
  _metrics.tokensCleared++;
  jwtState.jwt = null;
  jwtState.jwtExp = null;
  persistToken(null);
  return true;
}
function isTokenValid() {
  if (!jwtState.jwt) return false;
  if (!jwtState.jwtExp) return true;
  return !isTokenExpired(jwtState.jwtExp);
}
function getTokenInfo() {
  if (!jwtState.jwt) return { hasToken: false, payload: null, expiresAt: null, isExpired: true };
  const payload = parseJWT(jwtState.jwt);
  return { hasToken: true, payload, expiresAt: jwtState.jwtExp, isExpired: isTokenExpired(jwtState.jwtExp), isExpiringSoon: isTokenExpiringSoon(jwtState.jwtExp) };
}
function setCsrf(csrf) {
  _metrics.csrfSet++;
  const securityCsrf = getSecurityCSRF();
  if (securityCsrf && securityCsrf.setToken) {
    try {
      return securityCsrf.setToken(csrf);
    } catch (e) {
      log.warn("SecurityCSRF.setToken failed", { error: e.message });
      return false;
    }
  }
  log.debug("SecurityCSRF not ready yet (expected during boot)");
  return false;
}
function getCsrf() {
  const securityCsrf = getSecurityCSRF();
  if (securityCsrf && securityCsrf.getToken) {
    try {
      return securityCsrf.getToken();
    } catch (e) {
      log.warn("SecurityCSRF.getToken failed", { error: e.message });
      return null;
    }
  }
  return null;
}
function clearCsrf() {
  _metrics.csrfCleared++;
  const securityCsrf = getSecurityCSRF();
  if (securityCsrf && securityCsrf.clearToken) {
    try {
      securityCsrf.clearToken();
      return true;
    } catch (e) {
      log.warn("SecurityCSRF.clearToken failed", { error: e.message });
      return false;
    }
  }
  return false;
}
function clearAll() {
  clearToken();
  clearCsrf();
  return true;
}
function getAuthHeaders() {
  const securityCsrf = getSecurityCSRF();
  if (securityCsrf && securityCsrf.getAuthHeaders) {
    try {
      const headers2 = securityCsrf.getAuthHeaders();
      if (jwtState.jwt && !headers2["Authorization"]) headers2["Authorization"] = `Bearer ${jwtState.jwt}`;
      return headers2;
    } catch (e) {
      log.warn("SecurityCSRF.getAuthHeaders failed", { error: e.message });
    }
  }
  const headers = {};
  if (jwtState.jwt) headers["Authorization"] = `Bearer ${jwtState.jwt}`;
  const csrf = getCsrf();
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return headers;
}
function getVersion() {
  return VERSION;
}
function info() {
  const securityCsrf = getSecurityCSRF();
  const csrf = getCsrf();
  return { moduleId: MODULE_ID, version: VERSION, hasJwtToken: !!jwtState.jwt, jwtExp: jwtState.jwtExp, jwtExpired: jwtState.jwtExp ? isTokenExpired(jwtState.jwtExp) : null, jwtExpiringSoon: jwtState.jwtExp ? isTokenExpiringSoon(jwtState.jwtExp) : null, hasCsrf: !!csrf, csrfSource: "SecurityCSRF", storageAdapter: StoragePort.getAdapterType(), persistenceKey: STORAGE_KEY, metrics: Object.assign({}, _metrics), securityCsrf: securityCsrf ? { available: true, initialized: securityCsrf.isInitialized ? securityCsrf.isInitialized() : false, version: securityCsrf.version || "unknown" } : { available: false }, timestamp: Date.now() };
}
function healthCheck() {
  const storageHealth = StoragePort.healthCheck();
  const checks = { jwtStateValid: jwtState !== null, tokenNotExpired: !jwtState.jwt || !jwtState.jwtExp || !isTokenExpired(jwtState.jwtExp), securityCSRFAvailable: !!getSecurityCSRF(), storagePortHealthy: storageHealth.status === "HEALTHY" || storageHealth.status === "DEGRADED", lowPersistFailRate: _metrics.persistSuccess + _metrics.persistFailed === 0 || _metrics.persistFailed / (_metrics.persistSuccess + _metrics.persistFailed) < 0.2 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, healthy: passed >= 4, checks, hasToken: !!jwtState.jwt, storageAdapter: StoragePort.getAdapterType(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const TokenManager = { setToken, getToken, clearToken, isTokenValid, getTokenInfo, setCsrf, getCsrf, clearCsrf, clearAll, getAuthHeaders, info, healthCheck, getVersion, initFromStorage, restoreToken };
var token_default = TokenManager;
export {
  MODULE_ID,
  TokenManager,
  VERSION,
  token_default as default
};
