// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:responsive-columns
// PURPOSE: Table Engine - Responsive Columns
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BREAKPOINTS — exported value
//   PRIORITY — exported value
//   createResponsiveColumnManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:responsive-columns';

// Breakpoints padrão
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Prioridades de coluna (maior = mais importante)
export const PRIORITY = {
  essential: 100,
  high: 75,
  medium: 50,
  low: 25,
  optional: 0
};

class ResponsiveColumnManager {
  [key: string]: any;
  constructor(options: { breakpoints?: Record<string, number> } = {}) {
    this._columns = [];
    this._containerWidth = 0;
    this._breakpoints = { ...BREAKPOINTS, ...options.breakpoints };
    this._hiddenColumns = new Set();
    this._listeners = new Set();
    this._resizeObserver = null;
  }

  init(container: HTMLElement | null, columns: Record<string, unknown>[]) {
    this._columns = columns.map((col, index) => ({
      ...col,
      priority: col.priority ?? (col.responsive as Record<string, unknown> | undefined)?.priority ?? PRIORITY.medium,
      minWidth: col.minWidth ?? (col.responsive as Record<string, unknown> | undefined)?.minWidth ?? 100,
      hideAt: col.hideAt ?? (col.responsive as Record<string, unknown> | undefined)?.hideAt ?? null
    }));

    if (container && typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(entries => {
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

    this._columns.forEach((col: Record<string, unknown>) => {
      if (col.hideAt && this._shouldHideAtBreakpoint(col.hideAt as string, currentBreakpoint)) {
        this._hiddenColumns.add(col.id);
      }
    });

    const totalMinWidth = this._columns
      .filter((c: Record<string, unknown>) => !this._hiddenColumns.has(c.id))
      .reduce((sum: number, c: Record<string, unknown>) => sum + (c.minWidth as number), 0);

    if (totalMinWidth > this._containerWidth) {
      const sortedByPriority = [...this._columns]
        .filter(c => !this._hiddenColumns.has(c.id))
        .sort((a, b) => a.priority - b.priority);

      let currentWidth = totalMinWidth;

      for (const col of sortedByPriority) {
        if (currentWidth <= this._containerWidth) break;
        if (col.priority < PRIORITY.essential) {
          this._hiddenColumns.add(col.id);
          currentWidth -= col.minWidth;
        }
      }
    }

    const hasChanged = oldHidden.size !== this._hiddenColumns.size ||
      [...oldHidden].some(id => !this._hiddenColumns.has(id));

    if (hasChanged) {
      this._notify();
    }
  }

  _getCurrentBreakpoint() {
    const width = this._containerWidth;
    if (width < this._breakpoints.xs) return 'xs';
    if (width < this._breakpoints.sm) return 'sm';
    if (width < this._breakpoints.md) return 'md';
    if (width < this._breakpoints.lg) return 'lg';
    if (width < this._breakpoints.xl) return 'xl';
    return '2xl';
  }

  _shouldHideAtBreakpoint(hideAt: string, current: string) {
    const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const hideIndex = order.indexOf(hideAt);
    const currentIndex = order.indexOf(current);
    return currentIndex <= hideIndex;
  }

  getVisibleColumns() {
    return this._columns.filter((c: Record<string, unknown>) => !this._hiddenColumns.has(c.id));
  }

  getHiddenColumns() {
    return this._columns.filter((c: Record<string, unknown>) => this._hiddenColumns.has(c.id));
  }

  isColumnVisible(columnId: string) {
    return !this._hiddenColumns.has(columnId);
  }

  forceShow(columnId: string) {
    this._hiddenColumns.delete(columnId);
    this._notify();
  }

  forceHide(columnId: string) {
    this._hiddenColumns.add(columnId);
    this._notify();
  }

  subscribe(listener: (data: Record<string, unknown>) => void) {
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
    this._listeners.forEach((l: (data: Record<string, unknown>) => void) => l(data));
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
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }
}

export function createResponsiveColumnManager(options: { breakpoints?: Record<string, number> } = {}) {
  return new ResponsiveColumnManager(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, breakpoints: Object.keys(BREAKPOINTS) };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { createResponsiveColumnManager, BREAKPOINTS, PRIORITY, info, healthCheck, VERSION, MODULE_ID };
