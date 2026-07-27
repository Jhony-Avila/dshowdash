import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-container";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const PANELS = [
  "panel-01",
  "panel-02",
  "panel-03",
  "panel-04",
  "panel-05",
  "panel-06",
  "panel-07",
  "panel-08",
  "panel-09",
  "panel-10",
  "panel-11",
  "panel-12",
  "panel-13",
  "panel-14",
  "panel-15",
  "panel-16",
  "panel-17",
  "panel-18",
  "panel-19",
  "panel-cards",
  "panel-dashboard",
  "panel-audit-trail",
  "panel-orchestrator",
  "panel-permissions-admin",
  "panel-session-admin",
  "panel-user-management",
  "panel-user-preferences",
  "panel-feature-flags-admin",
  "panel-header-admin",
  "panel-navrail-admin"
];
const getPanels = () => PANELS.slice();
const getPanelCount = () => PANELS.length;
const info = () => ({ version: VERSION, moduleId: MODULE_ID, panels: PANELS, totalPanels: PANELS.length, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
const healthCheck = () => {
  const checks = { portsInitialized: Ports.isInitialized(), panelsAvailable: PANELS.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const cleanup = () => ({ success: true, moduleId: MODULE_ID });
const reset = () => cleanup();
const destroy = () => cleanup();
var panels_default = { VERSION, MODULE_ID, getPanels, getPanelCount, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  panels_default as default,
  destroy,
  getPanelCount,
  getPanels,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  reset
};
