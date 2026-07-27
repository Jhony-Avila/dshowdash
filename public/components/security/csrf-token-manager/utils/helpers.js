const VERSION = "2.1.0-ENTERPRISE-FIX";
const MODULE_ID = "csrf-token-manager-helpers";
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function getTimestamp() {
  return Date.now();
}
function maskToken(token, visibleChars = 8) {
  if (!token || typeof token !== "string") return null;
  if (token.length <= visibleChars) return "***";
  return `${token.substring(0, visibleChars)}...`;
}
function extractTokenFromMeta() {
  if (!isBrowser()) return null;
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.content || null;
}
function isTokenExpired(expiresAt) {
  return expiresAt && Date.now() > expiresAt;
}
function getTimeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const remaining = expiresAt - Date.now();
  return Math.max(0, remaining);
}
function formatDuration(ms) {
  if (ms === null || ms === void 0) return "N/A";
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${Math.round(ms / 1e3)}s`;
  return `${Math.round(ms / 6e4)}m`;
}
function generateId(prefix = "csrf") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function healthCheck() {
  const checks = {
    available: true,
    browserEnv: isBrowser()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    helpers: ["isBrowser", "getTimestamp", "maskToken", "extractTokenFromMeta", "isTokenExpired", "getTimeRemaining", "formatDuration", "generateId"],
    timestamp: Date.now()
  };
}
var helpers_default = {
  isBrowser,
  getTimestamp,
  maskToken,
  extractTokenFromMeta,
  isTokenExpired,
  getTimeRemaining,
  formatDuration,
  generateId,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  extractTokenFromMeta,
  formatDuration,
  generateId,
  getTimeRemaining,
  getTimestamp,
  healthCheck,
  info,
  isBrowser,
  isTokenExpired,
  maskToken
};
