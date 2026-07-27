import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import * as Lifecycle from "./core/lifecycle.js";
import { MODULE_ID as PANEL_NAME } from "./core/contracts.js";
const MODULE_ID = "panel-08";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  return auth?.isAuthenticated?.() ?? false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const mount = (container, deps = {}) => {
  _initPorts();
  if (!_isAuthenticated()) {
    return { success: false, moduleId: MODULE_ID, error: "not-authenticated" };
  }
  return Lifecycle.mount(container, deps);
};
const unmount = (container, deps = {}) => Lifecycle.unmount();
const destroy = () => unmount();
const refresh = () => {
  if (!_isDocumentVisible()) return Promise.resolve();
  return Lifecycle.refresh();
};
const getStatus = () => {
  const health = Lifecycle.healthCheck();
  return { panelId: MODULE_ID, name: PANEL_NAME, version: VERSION, p22Compliant: true, timestamp: Date.now(), ...health };
};
const getVersion = () => VERSION;
const healthCheck = () => {
  const health = Lifecycle.healthCheck();
  const checks = { mounted: health.mounted === true, initialized: health.initialized === true, cssLoaded: health.cssLoaded === true, notDegraded: health.status !== "degraded" };
  const score = Object.values(checks).filter(Boolean).length;
  return { status: score === 4 ? "HEALTHY" : score >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${score}/4`, checks, panelId: MODULE_ID, version: VERSION, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() };
};
const info = () => ({ panelId: MODULE_ID, name: PANEL_NAME, version: VERSION, p22Compliant: true, timestamp: Date.now(), ...getStatus() });
var panel_08_default = { mount, unmount, destroy, refresh, getStatus, getVersion, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  panel_08_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  refresh,
  unmount
};
