const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:responsive-columns";
const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536
};
const PRIORITY = {
  essential: 100,
  high: 75,
  medium: 50,
  low: 25,
  optional: 0
};
class ResponsiveColumnManager {
  constructor(options = {}) {
    this._columns = [];
    this._containerWidth = 0;
    this._breakpoints = { ...BREAKPOINTS, ...options.breakpoints };
    this._hiddenColumns = /* @__PURE__ */ new Set();
    this._listeners = /* @__PURE__ */ new Set();
    this._resizeObserver = null;
  }
  init(container, columns) {
    this._columns = columns.map((col, index) => ({
      ...col,
      priority: col.priority ?? col.responsive?.priority ?? PRIORITY.medium,
      minWidth: col.minWidth ?? col.responsive?.minWidth ?? 100,
      hideAt: col.hideAt ?? col.responsive?.hideAt ?? null
    }));
    if (container && typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this._containerWidth = entry.contentRect.width;
          this._calculateVisibility();
        }
      });
      this._resizeObserver.observe(container);
    }
    this._containerWidth = container?.offsetWidth || window.innerWidth;
    this._calculateVisibility();
    return this;
  }
  _calculateVisibility() {
    const oldHidden = new Set(this._hiddenColumns);
    this._hiddenColumns.clear();
    const currentBreakpoint = this._getCurrentBreakpoint();
    this._columns.forEach((col) => {
      if (col.hideAt && this._shouldHideAtBreakpoint(col.hideAt, currentBreakpoint)) {
        this._hiddenColumns.add(col.id);
      }
    });
    const totalMinWidth = this._columns.filter((c) => !this._hiddenColumns.has(c.id)).reduce((sum, c) => sum + c.minWidth, 0);
    if (totalMinWidth > this._containerWidth) {
      const sortedByPriority = [...this._columns].filter((c) => !this._hiddenColumns.has(c.id)).sort((a, b) => a.priority - b.priority);
      let currentWidth = totalMinWidth;
      for (const col of sortedByPriority) {
        if (currentWidth <= this._containerWidth) break;
        if (col.priority < PRIORITY.essential) {
          this._hiddenColumns.add(col.id);
          currentWidth -= col.minWidth;
        }
      }
    }
    const hasChanged = oldHidden.size !== this._hiddenColumns.size || [...oldHidden].some((id) => !this._hiddenColumns.has(id));
    if (hasChanged) {
      this._notify();
    }
  }
  _getCurrentBreakpoint() {
    const width = this._containerWidth;
    if (width < this._breakpoints.xs) return "xs";
    if (width < this._breakpoints.sm) return "sm";
    if (width < this._breakpoints.md) return "md";
    if (width < this._breakpoints.lg) return "lg";
    if (width < this._breakpoints.xl) return "xl";
    return "2xl";
  }
  _shouldHideAtBreakpoint(hideAt, current) {
    const order = ["xs", "sm", "md", "lg", "xl", "2xl"];
    const hideIndex = order.indexOf(hideAt);
    const currentIndex = order.indexOf(current);
    return currentIndex <= hideIndex;
  }
  getVisibleColumns() {
    return this._columns.filter((c) => !this._hiddenColumns.has(c.id));
  }
  getHiddenColumns() {
    return this._columns.filter((c) => this._hiddenColumns.has(c.id));
  }
  isColumnVisible(columnId) {
    return !this._hiddenColumns.has(columnId);
  }
  forceShow(columnId) {
    this._hiddenColumns.delete(columnId);
    this._notify();
  }
  forceHide(columnId) {
    this._hiddenColumns.add(columnId);
    this._notify();
  }
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
  _notify() {
    const data = {
      visible: this.getVisibleColumns(),
      hidden: this.getHiddenColumns(),
      breakpoint: this._getCurrentBreakpoint(),
      containerWidth: this._containerWidth
    };
    this._listeners.forEach((l) => l(data));
  }
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._listeners.clear();
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      breakpoint: this._getCurrentBreakpoint(),
      visibleCount: this.getVisibleColumns().length,
      hiddenCount: this.getHiddenColumns().length
    };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
  }
}
function createResponsiveColumnManager(options = {}) {
  return new ResponsiveColumnManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, breakpoints: Object.keys(BREAKPOINTS) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var columns_default = { createResponsiveColumnManager, BREAKPOINTS, PRIORITY, info, healthCheck, VERSION, MODULE_ID };
export {
  BREAKPOINTS,
  MODULE_ID,
  PRIORITY,
  VERSION,
  createResponsiveColumnManager,
  columns_default as default,
  healthCheck,
  info
};
