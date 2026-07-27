import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as Manager from "../core/manager.js";
const VERSION = "2.2.0-P17WI";
const MODULE_ID = "overlay-layer.adapters.loading-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const LOADING_ID = "global-loading";
const _metrics = { showCount: 0, hideCount: 0 };
function show(message) {
  if (!message) message = "Carregando...";
  _metrics.showCount++;
  return Manager.open({ id: LOADING_ID, type: "loading", content: message, config: { closable: false } });
}
function hide() {
  _metrics.hideCount++;
  return Manager.close(LOADING_ID);
}
function showLoading(message) {
  return show(message);
}
function hideLoading() {
  return hide();
}
function isVisible() {
  const state = Manager.info ? Manager.info() : null;
  return state && state.currentStack ? state.currentStack.indexOf(LOADING_ID) !== -1 : false;
}
function getMetrics() {
  return { showCount: _metrics.showCount, hideCount: _metrics.hideCount };
}
function healthCheck() {
  const checks = { managerAvailable: !!Manager, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return { status: passed === keys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${keys.length}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, loadingId: LOADING_ID, isVisible: isVisible(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var loading_adapter_default = { show, hide, showLoading, hideLoading, isVisible, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  loading_adapter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  hide,
  hideLoading,
  info,
  injectPorts,
  isVisible,
  show,
  showLoading
};
