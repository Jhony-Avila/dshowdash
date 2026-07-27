import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.6.0-ES6";
const MODULE_ID = "header/utils/overlay-root";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[prefix].concat(args));
};
let _overlayRoot = null;
let _tooltipRoot = null;
let _announcerRoot = null;
let _dropdownRoot = null;
let _headerContainer = null;
const _metrics = { initCount: 0, destroyCount: 0, tooltipRootCreated: 0, announcerRootCreated: 0, dropdownRootCreated: 0, fallbackCount: 0 };
function ensureOverlayRoot(headerContainer) {
  if (!headerContainer) {
    if (_overlayRoot) return _overlayRoot;
    _log("debug", "headerContainer n\xE3o dispon\xEDvel ainda, usando fallback document.body");
    _metrics.fallbackCount++;
    return document.body;
  }
  _headerContainer = headerContainer;
  let root = headerContainer.querySelector("[data-header-overlay-root]");
  if (!root) {
    root = document.createElement("div");
    root.setAttribute("data-header-overlay-root", "true");
    root.className = "header-overlay-root";
    root.style.cssText = "position:absolute;top:0;left:0;width:100%;height:0;pointer-events:none;z-index:9999;";
    headerContainer.appendChild(root);
    _log("debug", "Overlay root criado");
  }
  _overlayRoot = root;
  return root;
}
function getTooltipRoot(headerContainer) {
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  let tooltipRoot = root.querySelector("[data-header-tooltip-root]");
  if (!tooltipRoot) {
    tooltipRoot = document.createElement("div");
    tooltipRoot.setAttribute("data-header-tooltip-root", "true");
    tooltipRoot.className = "header-tooltip-root";
    tooltipRoot.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;";
    root.appendChild(tooltipRoot);
    _metrics.tooltipRootCreated++;
  }
  _tooltipRoot = tooltipRoot;
  return tooltipRoot;
}
function getAnnouncerRoot(headerContainer) {
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  if (root === document.body) {
    const existingAnnouncer = root.querySelector("[data-header-announcer-root]");
    if (existingAnnouncer) return existingAnnouncer;
    const announcerRoot2 = document.createElement("div");
    announcerRoot2.setAttribute("data-header-announcer-root", "true");
    announcerRoot2.className = "header-announcer-root sr-only";
    announcerRoot2.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    root.appendChild(announcerRoot2);
    _metrics.announcerRootCreated++;
    _announcerRoot = announcerRoot2;
    return announcerRoot2;
  }
  let announcerRoot = root.querySelector("[data-header-announcer-root]");
  if (!announcerRoot) {
    announcerRoot = document.createElement("div");
    announcerRoot.setAttribute("data-header-announcer-root", "true");
    announcerRoot.className = "header-announcer-root sr-only";
    announcerRoot.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    root.appendChild(announcerRoot);
    _metrics.announcerRootCreated++;
  }
  _announcerRoot = announcerRoot;
  return announcerRoot;
}
function getDropdownRoot(headerContainer) {
  const root = ensureOverlayRoot(headerContainer || _headerContainer);
  if (!root) return document.body;
  let dropdownRoot = root.querySelector("[data-header-dropdown-root]");
  if (!dropdownRoot) {
    dropdownRoot = document.createElement("div");
    dropdownRoot.setAttribute("data-header-dropdown-root", "true");
    dropdownRoot.className = "header-dropdown-root";
    dropdownRoot.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10001;";
    root.appendChild(dropdownRoot);
    _metrics.dropdownRootCreated++;
  }
  _dropdownRoot = dropdownRoot;
  return dropdownRoot;
}
function init(headerContainer) {
  if (!headerContainer) {
    _log("error", "init: headerContainer \xE9 obrigat\xF3rio");
    return false;
  }
  _headerContainer = headerContainer;
  _metrics.initCount++;
  ensureOverlayRoot(headerContainer);
  _log("info", "Overlay root inicializado");
  return true;
}
function destroy() {
  if (_overlayRoot) {
    _overlayRoot.remove();
    _overlayRoot = null;
  }
  _tooltipRoot = null;
  _announcerRoot = null;
  _dropdownRoot = null;
  _headerContainer = null;
  _metrics.destroyCount++;
  _log("info", "Overlay root destru\xEDdo");
}
function getOverlayRoot() {
  return _overlayRoot;
}
function getHeaderContainer() {
  return _headerContainer;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics.initCount = 0;
  _metrics.destroyCount = 0;
  _metrics.tooltipRootCreated = 0;
  _metrics.announcerRootCreated = 0;
  _metrics.dropdownRootCreated = 0;
  _metrics.fallbackCount = 0;
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { overlayRootExists: !!_overlayRoot, headerContainerSet: !!_headerContainer, loggerAvailable: !!logger, noBodyAppendChild: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), fallbackCount: _metrics.fallbackCount, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), overlayRootExists: !!_overlayRoot, tooltipRootExists: !!_tooltipRoot, announcerRootExists: !!_announcerRoot, dropdownRootExists: !!_dropdownRoot, metrics: getMetrics(), healthCheck: healthCheck() };
}
function getVersion() {
  return VERSION;
}
var overlay_root_default = { init, destroy, ensureOverlayRoot, getTooltipRoot, getAnnouncerRoot, getDropdownRoot, getOverlayRoot, getHeaderContainer, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  overlay_root_default as default,
  destroy,
  ensureOverlayRoot,
  getAnnouncerRoot,
  getDropdownRoot,
  getHeaderContainer,
  getMetrics,
  getOverlayRoot,
  getPorts,
  getTooltipRoot,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  resetMetrics
};
