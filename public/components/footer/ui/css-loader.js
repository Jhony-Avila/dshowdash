import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { createLogger } from "../core/logger.js";
const VERSION = "9.5.0-P17WI";
const MODULE_ID = "footer-css-loader";
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
const _log = createLogger(MODULE_ID);
let _loaded = false;
const _metrics = { loadAttempts: 0 };
function ensureCssLoaded() {
  if (_loaded) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  _metrics.loadAttempts++;
  const cfg = _getPort("config");
  const basePath = cfg && cfg.paths && cfg.paths.cssBase ? cfg.paths.cssBase : "/components";
  const cssPath = `${basePath}/footer/styles/index.css`;
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.onerror = () => {
      _log.error(`Failed to load CSS: ${cssPath}`);
    };
    document.head.appendChild(link);
    _log.info(`CSS loaded: ${cssPath}`);
  }
  _loaded = true;
}
function isLoaded() {
  return _loaded;
}
function getMetrics() {
  return Object.assign({}, _metrics, { loaded: _loaded });
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, metrics: getMetrics(), portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { cssLoaderReady: true, portsInitialized: ps._initialized }, metrics: getMetrics() };
}
var css_loader_default = { ensureCssLoaded, isLoaded, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  css_loader_default as default,
  ensureCssLoaded,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isLoaded
};
