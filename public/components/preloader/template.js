import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "preloader-template";
const VERSION = "1.2.0-P17WI";
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
const _metrics = { renders: 0 };
function getPreloaderTemplate() {
  _initPorts();
  _metrics.renders++;
  return '<div id="loading-screen" role="status" aria-live="polite" aria-label="Carregando" aria-busy="true"><div class="loading-logo-container dsd-marca-area"><img src="/assets/brand/dshow-logo-branco.svg" alt="DShow" class="loading-logo dsd-marca-logo" width="240" height="81" decoding="async" fetchpriority="high"></div><div class="loading-text">Carregando</div><div class="loading-progress-wrapper"><div class="loading-progress"><div class="loading-progress-bar" id="loading-progress-bar"></div></div><div class="loading-percentage">0%</div></div></div>';
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  const checks = { templateReady: true, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
var template_default = { MODULE_ID, VERSION, getPreloaderTemplate, getMetrics, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  getMetrics,
  getPorts,
  getPreloaderTemplate,
  healthCheck,
  info,
  injectPorts
};
