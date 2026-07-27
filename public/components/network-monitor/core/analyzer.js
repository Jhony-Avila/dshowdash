const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "network-monitor-analyzer";
function getConnectionInfo() {
  const nav = navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (!conn) return null;
  return { type: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt, saveData: conn.saveData };
}
function isSlowConnection() {
  const info2 = getConnectionInfo();
  if (!info2) return false;
  return info2.effectiveType === "slow-2g" || info2.effectiveType === "2g" || info2.rtt > 500;
}
function healthCheck() {
  const nav = navigator;
  const checks = { connectionApiSupported: !!(nav.connection || nav.mozConnection || nav.webkitConnection) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, connectionInfo: getConnectionInfo(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, connectionInfo: getConnectionInfo(), isSlow: isSlowConnection(), timestamp: Date.now() };
}
const QualityAnalyzer = { getConnectionInfo, isSlowConnection, healthCheck, info };
var analyzer_default = { getConnectionInfo, isSlowConnection, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  QualityAnalyzer,
  VERSION,
  analyzer_default as default,
  getConnectionInfo,
  healthCheck,
  info,
  isSlowConnection
};
