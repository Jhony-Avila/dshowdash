const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:breakpoint-config";
const DEFAULT_BREAKPOINT_CONFIG = {
  xs: {
    view: "card",
    pageSize: 10,
    showToolbar: "minimal",
    showPagination: "simple",
    showSearch: true,
    showFilters: false,
    showExport: false,
    columns: "minimal",
    rowActions: "swipe"
  },
  sm: {
    view: "card",
    pageSize: 15,
    showToolbar: "compact",
    showPagination: "simple",
    showSearch: true,
    showFilters: false,
    showExport: false,
    columns: "essential",
    rowActions: "swipe"
  },
  md: {
    view: "table",
    pageSize: 20,
    showToolbar: "compact",
    showPagination: "standard",
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: "standard",
    rowActions: "hover"
  },
  lg: {
    view: "table",
    pageSize: 25,
    showToolbar: "full",
    showPagination: "full",
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: "all",
    rowActions: "hover"
  },
  xl: {
    view: "table",
    pageSize: 50,
    showToolbar: "full",
    showPagination: "full",
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: "all",
    rowActions: "hover"
  }
};
class BreakpointConfigManager {
  constructor(options = {}) {
    this._config = { ...DEFAULT_BREAKPOINT_CONFIG, ...options.config };
    this._breakpoints = options.breakpoints || {
      xs: 480,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280
    };
    this._currentBreakpoint = "lg";
    this._listeners = /* @__PURE__ */ new Set();
    this._mediaQueries = /* @__PURE__ */ new Map();
  }
  init() {
    this._setupMediaQueries();
    this._detectBreakpoint();
    return this;
  }
  _setupMediaQueries() {
    const entries = Object.entries(this._breakpoints).sort((a, b) => a[1] - b[1]);
    entries.forEach(([name, minWidth], index) => {
      const maxWidth = entries[index + 1]?.[1] - 1;
      let query;
      if (index === 0) {
        query = `(max-width: ${minWidth - 1}px)`;
      } else if (index === entries.length - 1) {
        query = `(min-width: ${minWidth}px)`;
      } else {
        query = `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      }
      const mql = window.matchMedia(query);
      mql.addEventListener("change", () => this._detectBreakpoint());
      this._mediaQueries.set(name, mql);
    });
  }
  _detectBreakpoint() {
    const width = window.innerWidth;
    let detected = "xl";
    const sorted = Object.entries(this._breakpoints).sort((a, b) => b[1] - a[1]);
    for (const [name, minWidth] of sorted) {
      if (width >= minWidth) {
        detected = name;
        break;
      }
    }
    if (width < this._breakpoints.xs) {
      detected = "xs";
    }
    if (detected !== this._currentBreakpoint) {
      const oldBreakpoint = this._currentBreakpoint;
      this._currentBreakpoint = detected;
      this._notify(oldBreakpoint, detected);
    }
  }
  getCurrentBreakpoint() {
    return this._currentBreakpoint;
  }
  getCurrentConfig() {
    return this._config[this._currentBreakpoint] || this._config.lg;
  }
  getConfigFor(breakpoint) {
    return this._config[breakpoint] || this._config.lg;
  }
  setConfig(breakpoint, config) {
    this._config[breakpoint] = { ...this._config[breakpoint], ...config };
  }
  isMobile() {
    return ["xs", "sm"].includes(this._currentBreakpoint);
  }
  isTablet() {
    return this._currentBreakpoint === "md";
  }
  isDesktop() {
    return ["lg", "xl"].includes(this._currentBreakpoint);
  }
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
  _notify(oldBreakpoint, newBreakpoint) {
    const config = this.getCurrentConfig();
    this._listeners.forEach((l) => l({
      oldBreakpoint,
      newBreakpoint,
      config,
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop()
    }));
  }
  destroy() {
    this._mediaQueries.forEach((mql) => {
      mql.removeEventListener?.("change", this._detectBreakpoint);
    });
    this._mediaQueries.clear();
    this._listeners.clear();
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      currentBreakpoint: this._currentBreakpoint,
      isMobile: this.isMobile(),
      config: this.getCurrentConfig()
    };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
  }
}
function createBreakpointConfigManager(options = {}) {
  return new BreakpointConfigManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var breakpoint_config_default = { createBreakpointConfigManager, DEFAULT_BREAKPOINT_CONFIG, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_BREAKPOINT_CONFIG,
  MODULE_ID,
  VERSION,
  createBreakpointConfigManager,
  breakpoint_config_default as default,
  healthCheck,
  info
};
