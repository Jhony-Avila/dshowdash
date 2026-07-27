const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-overlay";
let _overlayRoot = null;
let _overlay = null;
let _domAdapter = null;
let _metrics = { shows: 0, hides: 0, errors: 0 };
function setDOMAdapter(adapter) {
  _domAdapter = adapter;
}
function _createElement(tag, options = {}) {
  if (_domAdapter?.createElement) return _domAdapter.createElement(tag, options);
  const el = document.createElement(tag);
  if (options.id) el.id = options.id;
  if (options.className) el.className = options.className;
  if (options.attributes) Object.entries(options.attributes).forEach(([k, v]) => el.setAttribute(k, v));
  if (options.style) el.style.cssText = options.style;
  return el;
}
function _querySelector(selector) {
  if (_domAdapter?.querySelector) return _domAdapter.querySelector(selector);
  return document.querySelector(selector);
}
function _getElementById(id) {
  if (_domAdapter?.getElementById) return _domAdapter.getElementById(id);
  return document.getElementById(id);
}
function ensureOverlayRoot() {
  try {
    if (_overlayRoot && document.contains(_overlayRoot)) return _overlayRoot;
    _overlayRoot = _getElementById("app-overlay-root");
    if (!_overlayRoot) {
      _overlayRoot = _createElement("div", { id: "app-overlay-root", attributes: { "data-overlay-root": "true" }, style: "position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;" });
      const parent = _getElementById("app-shell") || document.documentElement;
      parent.appendChild(_overlayRoot);
    }
    return _overlayRoot;
  } catch (error) {
    _metrics.errors++;
    return null;
  }
}
function showOverlay() {
  try {
    if (!_overlay || !document.contains(_overlay)) _overlay = _querySelector(".dsd-sidebar-overlay");
    if (!_overlay) {
      _overlay = _createElement("div", { className: "dsd-sidebar-overlay", attributes: { "aria-hidden": "true" }, style: "pointer-events:auto;" });
      const root = ensureOverlayRoot();
      if (root) root.appendChild(_overlay);
    }
    _overlay.classList.add("dsd-sidebar-overlay--visible");
    _metrics.shows++;
    return { success: true };
  } catch (error) {
    _metrics.errors++;
    return { success: false, error: error.message };
  }
}
function hideOverlay() {
  try {
    if (!_overlay) _overlay = _querySelector(".dsd-sidebar-overlay");
    _overlay?.classList.remove("dsd-sidebar-overlay--visible");
    _metrics.hides++;
    return { success: true };
  } catch (error) {
    _metrics.errors++;
    return { success: false, error: error.message };
  }
}
function removeOverlay() {
  try {
    if (!_overlay) _overlay = _querySelector(".dsd-sidebar-overlay");
    _overlay?.remove();
    _overlay = null;
    return { success: true };
  } catch (error) {
    _metrics.errors++;
    return { success: false, error: error.message };
  }
}
function isOverlayVisible() {
  if (!_overlay) _overlay = _querySelector(".dsd-sidebar-overlay");
  return _overlay?.classList.contains("dsd-sidebar-overlay--visible") ?? false;
}
function getMetrics() {
  return { ..._metrics };
}
function reset() {
  _overlay = null;
  _overlayRoot = null;
  _metrics = { shows: 0, hides: 0, errors: 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasAdapter: !!_domAdapter, overlayVisible: isOverlayVisible(), metrics: getMetrics() };
}
function healthCheck() {
  const hasAdapter = !!_domAdapter;
  const overlayExists = !!_overlay && document.contains(_overlay);
  const rootExists = !!_overlayRoot && document.contains(_overlayRoot);
  let status = "HEALTHY";
  if (_metrics.errors > 5) status = "DEGRADED";
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasAdapter, overlayExists, rootExists, isVisible: isOverlayVisible() }, metrics: getMetrics() };
}
var overlay_default = { setDOMAdapter, ensureOverlayRoot, showOverlay, hideOverlay, removeOverlay, isOverlayVisible, getMetrics, reset, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  overlay_default as default,
  ensureOverlayRoot,
  getMetrics,
  healthCheck,
  hideOverlay,
  info,
  isOverlayVisible,
  removeOverlay,
  reset,
  setDOMAdapter,
  showOverlay
};
