const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-activity/api/health";
let _lastCheck = null;
let _status = "unknown";
async function check(endpoint = "/api/health", { signal } = {}) {
  try {
    const start = Date.now();
    const response = await fetch(endpoint, { method: "HEAD", cache: "no-store", signal });
    const latency = Date.now() - start;
    _lastCheck = { timestamp: Date.now(), latency, status: response.ok ? "healthy" : "unhealthy" };
    _status = _lastCheck.status;
    return _lastCheck;
  } catch (error) {
    _lastCheck = { timestamp: Date.now(), latency: -1, status: "error", error: error.message };
    _status = "error";
    return _lastCheck;
  }
}
function getLastCheck() {
  return _lastCheck;
}
function getStatus() {
  return _status;
}
function healthCheck() {
  const normalizedStatus = _status === "healthy" ? "HEALTHY" : _status === "unknown" ? "DEGRADED" : "UNHEALTHY";
  return { status: normalizedStatus, version: VERSION, moduleId: MODULE_ID, lastCheck: _lastCheck, rawStatus: _status };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, status: _status, lastCheck: _lastCheck, healthCheck: healthCheck() };
}
var health_default = { check, getLastCheck, getStatus, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  check,
  health_default as default,
  getLastCheck,
  getStatus,
  healthCheck,
  info
};
