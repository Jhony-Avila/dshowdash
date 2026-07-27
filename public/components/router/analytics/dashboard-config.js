import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.analytics.dashboard-config";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const CONFIG = { refreshInterval: 5e3, maxDataPoints: 60, chartHeight: 200, colors: { primary: "#3b82f6", success: "#10b981", warning: "#f59e0b", danger: "#ef4444", muted: "#6b7280", background: "#1f2937", surface: "#374151", text: "#f9fafb", textMuted: "#9ca3af" } };
function getColor(name) {
  return CONFIG.colors[name] || CONFIG.colors.muted;
}
function getColors() {
  return { ...CONFIG.colors };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
export {
  CONFIG,
  MODULE_ID,
  VERSION,
  getColor,
  getColors,
  getPorts,
  healthCheck,
  injectPorts
};
