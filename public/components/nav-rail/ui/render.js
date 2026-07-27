import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "nav-rail-render";
const VERSION = "5.1.0-ES6";
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`, ...args]);
};
const NavRailRender = { _root: null, _currentMode: "desktop", _initialized: false, _metrics: { renders: 0, modeChanges: 0, activeItemChanges: 0 }, init(root) {
  if (this._initialized && this._root === root) return this;
  this._root = root;
  this._initialized = true;
  _log("info", "Render initialized");
  return this;
}, apply(html) {
  if (!this._root) {
    _log("error", "Root element not found");
    return this;
  }
  this._root.innerHTML = html;
  this._metrics.renders++;
  return this;
}, getDesktopNav() {
  return this._root ? this._root.querySelector(".nav-rail--desktop") : null;
}, getMobileNav() {
  return this._root ? this._root.querySelector(".nav-rail--mobile") : null;
}, activateDesktop() {
  const desktop = this.getDesktopNav();
  const mobile = this.getMobileNav();
  if (desktop) desktop.style.display = "flex";
  if (mobile) mobile.style.display = "none";
  if (this._currentMode !== "desktop") {
    this._currentMode = "desktop";
    this._metrics.modeChanges++;
  }
  if (this._root) {
    this._root.classList.remove("nav-rail-wrapper--mobile");
    this._root.classList.add("nav-rail-wrapper--desktop");
  }
  return this;
}, activateMobile() {
  const desktop = this.getDesktopNav();
  const mobile = this.getMobileNav();
  if (desktop) desktop.style.display = "none";
  if (mobile) mobile.style.display = "flex";
  if (this._currentMode !== "mobile") {
    this._currentMode = "mobile";
    this._metrics.modeChanges++;
  }
  if (this._root) {
    this._root.classList.remove("nav-rail-wrapper--desktop");
    this._root.classList.add("nav-rail-wrapper--mobile");
  }
  return this;
}, getCurrentMode() {
  return this._currentMode;
}, setActiveItem(itemId) {
  if (this._root) {
    this._root.querySelectorAll(".nav-rail__item").forEach((item) => {
      item.classList.remove("nav-rail__item--active");
      item.removeAttribute("aria-current");
    });
    this._root.querySelectorAll(".navrail-btn").forEach((btn) => {
      btn.classList.remove("is-active");
      btn.removeAttribute("aria-current");
    });
  }
  if (itemId && this._root) {
    const targetItem = this._root.querySelector(`[data-item-id="${itemId}"]`);
    const targetBtn = this._root.querySelector(`[data-button-id="${itemId}"]`);
    if (targetItem) {
      targetItem.classList.add("nav-rail__item--active");
      targetItem.setAttribute("aria-current", "page");
    }
    if (targetBtn) {
      targetBtn.classList.add("is-active");
      targetBtn.setAttribute("aria-current", "page");
    }
    this._metrics.activeItemChanges++;
  }
  return this;
}, getActiveItem() {
  if (!this._root) return null;
  const activeItem = this._root.querySelector(".nav-rail__item--active");
  const activeBtn = this._root.querySelector(".navrail-btn.is-active");
  return activeItem && activeItem.dataset && activeItem.dataset.itemId || activeBtn && activeBtn.dataset && activeBtn.dataset.buttonId || null;
}, destroy() {
  if (this._root) {
    this._root.innerHTML = "";
  }
  this._root = null;
  this._initialized = false;
  this._currentMode = "desktop";
  _log("info", "Render destroyed");
  return this;
}, healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort("logger");
  const checks = { initialized: this._initialized, hasRoot: !!this._root, hasDesktopNav: !!this.getDesktopNav(), hasMobileNav: !!this.getMobileNav(), validMode: ["desktop", "mobile"].indexOf(this._currentMode) !== -1, loggerAvailable: !!logger, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, currentMode: this._currentMode, metrics: Object.assign({}, this._metrics), version: VERSION, moduleId: MODULE_ID, portsInitialized: ps._initialized, timestamp: Date.now() };
}, info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, currentMode: this._currentMode, hasRoot: !!this._root, activeItem: this.getActiveItem(), metrics: Object.assign({}, this._metrics), portsInitialized: ps._initialized, timestamp: Date.now() };
} };
var render_default = NavRailRender;
export {
  MODULE_ID,
  NavRailRender,
  VERSION,
  render_default as default,
  getPorts,
  injectPorts
};
