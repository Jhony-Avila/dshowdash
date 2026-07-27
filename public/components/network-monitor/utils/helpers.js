const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "network-monitor-helpers";
function isOnline() {
  return navigator.onLine ?? true;
}
function getConnectionInfo() {
  const nav = navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return null;
  return { type: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt };
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, helpers: ["isOnline", "getConnectionInfo"], online: isOnline(), timestamp: Date.now() };
}
function formatSpeed(bps) {
  if (bps > 1e6) return (bps / 1e6).toFixed(2) + " Mbps";
  if (bps > 1e3) return (bps / 1e3).toFixed(2) + " Kbps";
  return bps + " bps";
}
function calculateLatency() {
  return getConnectionInfo()?.rtt || 0;
}
function getConnectionType() {
  return getConnectionInfo()?.type || "unknown";
}
var helpers_default = { isOnline, getConnectionInfo, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  calculateLatency,
  helpers_default as default,
  formatSpeed,
  getConnectionInfo,
  getConnectionType,
  healthCheck,
  info,
  isOnline
};
