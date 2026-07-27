import { log } from "../ports.js";
const VERSION = "5.2.0-ENTERPRISE";
const MODULE_ID = "session-helpers";
const _metrics = { deepClones: 0, sessionIdsGenerated: 0, jwtParses: 0, jwtParseErrors: 0, sanitizations: 0, safeCallErrors: 0 };
function deepClone(obj) {
  _metrics.deepClones++;
  if (obj === null || typeof obj !== "object") return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}
function generateSessionId() {
  _metrics.sessionIdsGenerated++;
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function calculateExpiresAt(expiresInSeconds = 604800) {
  return Date.now() + expiresInSeconds * 1e3;
}
function isSessionExpired(lastActivity, timeoutMs = 18e5) {
  if (!lastActivity) return true;
  return Date.now() - lastActivity > timeoutMs;
}
function isTokenExpiringSoon(expiresAt, thresholdMs = 3e5) {
  if (!expiresAt) return false;
  return expiresAt - Date.now() < thresholdMs;
}
function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}
function parseJWT(token) {
  _metrics.jwtParses++;
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    _metrics.jwtParseErrors++;
    return null;
  }
}
function getJWTExpiration(token) {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1e3;
}
function sanitizeUser(user) {
  _metrics.sanitizations++;
  if (!user) return null;
  const sanitized = Object.assign({}, user);
  delete sanitized.password;
  delete sanitized.senha;
  delete sanitized.hash;
  delete sanitized.secret;
  return sanitized;
}
function formatSessionDuration(startTime) {
  if (!startTime) return "0s";
  const durationMs = Date.now() - startTime;
  const seconds = Math.floor(durationMs / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
function safeCall(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    _metrics.safeCallErrors++;
    log.warn("safeCall error", { error: e.message });
    return fallback;
  }
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), jwtParseSuccessRate: _metrics.jwtParses > 0 ? `${((_metrics.jwtParses - _metrics.jwtParseErrors) / _metrics.jwtParses * 100).toFixed(1)}%` : "N/A", timestamp: Date.now() };
}
function healthCheck() {
  const checks = { functionsAvailable: typeof deepClone === "function" && typeof parseJWT === "function", lowJwtParseErrors: _metrics.jwtParses === 0 || _metrics.jwtParseErrors / _metrics.jwtParses < 0.3, lowSafeCallErrors: _metrics.safeCallErrors < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var helpers_default = { deepClone, generateSessionId, calculateExpiresAt, isSessionExpired, isTokenExpiringSoon, isTokenExpired, parseJWT, getJWTExpiration, sanitizeUser, formatSessionDuration, safeCall, getVersion, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  calculateExpiresAt,
  deepClone,
  helpers_default as default,
  formatSessionDuration,
  generateSessionId,
  getJWTExpiration,
  getVersion,
  healthCheck,
  info,
  isSessionExpired,
  isTokenExpired,
  isTokenExpiringSoon,
  parseJWT,
  safeCall,
  sanitizeUser
};
