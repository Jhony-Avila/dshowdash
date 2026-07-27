import { CSS_CLASSES as C } from "./constants.js";
const VERSION = "6.0.0-NCS";
const MODULE_ID = "sidebar-collapse";
const CAPABILITIES = Object.freeze({
  canCollapse: true,
  canExpand: true,
  canToggle: true,
  emitsLayoutRequest: false,
  manipulatesOwnDOM: true,
  manipulatesGlobalDOM: false
});
class CollapseHandler {
  constructor(sidebar, options = {}) {
    this._sidebar = sidebar;
    this._collapsed = options.collapsed ?? false;
    this._onToggle = options.onToggle || (() => {
    });
    this._status = "healthy";
    this._lastError = null;
    this._initialized = false;
    this._metrics = {
      toggles: 0,
      collapses: 0,
      expands: 0,
      errors: 0
    };
  }
  get collapsed() {
    return this._collapsed;
  }
  get status() {
    return this._status;
  }
  init() {
    try {
      if (!this._sidebar) {
        this._status = "degraded";
        this._lastError = "Sidebar element not provided";
        return { success: false, error: this._lastError };
      }
      this._initialized = true;
      this._status = "healthy";
      return { success: true };
    } catch (error) {
      this._status = "error";
      this._lastError = error.message;
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }
  setCollapsed(value) {
    try {
      this._collapsed = value;
      this._sidebar?.classList.toggle(C.MOD_COLLAPSED, value);
      const toggle = this._sidebar?.querySelector(`.${C.TOGGLE}`);
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(!value));
        toggle.setAttribute("aria-label", value ? "Expandir menu" : "Recolher menu");
      }
      if (value) this._metrics.collapses++;
      else this._metrics.expands++;
      this._status = "healthy";
      return { success: true, collapsed: value };
    } catch (error) {
      this._status = "degraded";
      this._lastError = error.message;
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }
  toggle() {
    this._metrics.toggles++;
    const result = this.setCollapsed(!this._collapsed);
    if (result.success) {
      try {
        this._onToggle(this._collapsed);
      } catch (error) {
        this._lastError = `Callback error: ${error.message}`;
      }
    }
    return this._collapsed;
  }
  collapse() {
    return this.setCollapsed(true);
  }
  expand() {
    return this.setCollapsed(false);
  }
  getMetrics() {
    return { ...this._metrics };
  }
  reset() {
    this._collapsed = false;
    this._status = "healthy";
    this._lastError = null;
    this._sidebar?.classList.remove(C.MOD_COLLAPSED);
  }
  destroy() {
    this.reset();
    this._sidebar = null;
    this._initialized = false;
  }
  healthCheck() {
    const hasSidebar = !!this._sidebar;
    const sidebarInDOM = hasSidebar && document.contains(this._sidebar);
    const noErrors = this._metrics.errors === 0;
    const isHealthy = this._status === "healthy";
    const checks = {
      hasSidebar,
      sidebarInDOM,
      noErrors,
      isHealthy,
      initialized: this._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = "HEALTHY";
    if (!hasSidebar) status = "UNHEALTHY";
    else if (!sidebarInDOM || !isHealthy) status = "DEGRADED";
    return {
      status,
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      collapsed: this._collapsed,
      metrics: this._metrics,
      lastError: this._lastError,
      capabilities: CAPABILITIES,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      collapsed: this._collapsed,
      status: this._status,
      metrics: this._metrics,
      capabilities: CAPABILITIES,
      healthCheck: this.healthCheck()
    };
  }
}
function createCollapseHandler(sidebar, options) {
  const handler = new CollapseHandler(sidebar, options);
  handler.init();
  return handler;
}
var collapse_default = { VERSION, MODULE_ID, CAPABILITIES, CollapseHandler, createCollapseHandler };
export {
  CAPABILITIES,
  CollapseHandler,
  MODULE_ID,
  VERSION,
  createCollapseHandler,
  collapse_default as default
};
