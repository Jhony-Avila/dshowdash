// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:breakpoint-config
// PURPOSE: Table Engine - Breakpoint Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_BREAKPOINT_CONFIG — exported value
//   createBreakpointConfigManager() — exported function
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
export const MODULE_ID = 'table-engine:breakpoint-config';

export const DEFAULT_BREAKPOINT_CONFIG = {
  xs: {
    view: 'card',
    pageSize: 10,
    showToolbar: 'minimal',
    showPagination: 'simple',
    showSearch: true,
    showFilters: false,
    showExport: false,
    columns: 'minimal',
    rowActions: 'swipe'
  },
  sm: {
    view: 'card',
    pageSize: 15,
    showToolbar: 'compact',
    showPagination: 'simple',
    showSearch: true,
    showFilters: false,
    showExport: false,
    columns: 'essential',
    rowActions: 'swipe'
  },
  md: {
    view: 'table',
    pageSize: 20,
    showToolbar: 'compact',
    showPagination: 'standard',
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: 'standard',
    rowActions: 'hover'
  },
  lg: {
    view: 'table',
    pageSize: 25,
    showToolbar: 'full',
    showPagination: 'full',
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: 'all',
    rowActions: 'hover'
  },
  xl: {
    view: 'table',
    pageSize: 50,
    showToolbar: 'full',
    showPagination: 'full',
    showSearch: true,
    showFilters: true,
    showExport: true,
    columns: 'all',
    rowActions: 'hover'
  }
};

class BreakpointConfigManager {
  [key: string]: any;
  constructor(options: { config?: Record<string, Record<string, unknown>>; breakpoints?: Record<string, number> } = {}) {
    this._config = { ...DEFAULT_BREAKPOINT_CONFIG, ...options.config };
    this._breakpoints = options.breakpoints || {
      xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280
    };
    this._currentBreakpoint = 'lg';
    this._listeners = new Set();
    this._mediaQueries = new Map();
  }

  init() {
    this._setupMediaQueries();
    this._detectBreakpoint();
    return this;
  }

  _setupMediaQueries() {
    // @ts-expect-error strict migration — TS2345
    const entries = Object.entries(this._breakpoints).sort((a: [string, number], b: [string, number]) => a[1] - b[1]);

    // @ts-expect-error strict migration — TS2345
    entries.forEach(([name, minWidth]: [string, number], index: number) => {
      const maxWidth = (entries[index + 1]?.[1] as any) - 1;
      let query;

      if (index === 0) {
        query = `(max-width: ${(minWidth as any) - 1}px)`;
      } else if (index === entries.length - 1) {
        query = `(min-width: ${minWidth}px)`;
      } else {
        query = `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
      }

      const mql = window.matchMedia(query);
      mql.addEventListener('change', () => this._detectBreakpoint());
      this._mediaQueries.set(name, mql);
    });
  }

  _detectBreakpoint() {
    const width = window.innerWidth;
    let detected = 'xl';

    // @ts-expect-error strict migration — TS2345
    const sorted = Object.entries(this._breakpoints).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
    for (const [name, minWidth] of sorted) {
      if (width >= (minWidth as any)) {
        detected = name;
        break;
      }
    }

    if (width < this._breakpoints.xs) {
      detected = 'xs';
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

  getConfigFor(breakpoint: string) {
    return this._config[breakpoint] || this._config.lg;
  }

  setConfig(breakpoint: string, config: Record<string, unknown>) {
    this._config[breakpoint] = { ...this._config[breakpoint], ...config };
  }

  isMobile() {
    return ['xs', 'sm'].includes(this._currentBreakpoint);
  }

  isTablet() {
    return this._currentBreakpoint === 'md';
  }

  isDesktop() {
    return ['lg', 'xl'].includes(this._currentBreakpoint);
  }

  subscribe(listener: (info: Record<string, unknown>) => void) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(oldBreakpoint: string, newBreakpoint: string) {
    const config = this.getCurrentConfig();
    this._listeners.forEach((l: (info: Record<string, unknown>) => void) => l({
      oldBreakpoint,
      newBreakpoint,
      config,
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop()
    }));
  }

  destroy() {
    this._mediaQueries.forEach((mql: MediaQueryList) => {
      mql.removeEventListener?.('change', this._detectBreakpoint);
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
    return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
  }
}

export function createBreakpointConfigManager(options: { config?: Record<string, Record<string, unknown>>; breakpoints?: Record<string, number> } = {}) {
  return new BreakpointConfigManager(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { createBreakpointConfigManager, DEFAULT_BREAKPOINT_CONFIG, info, healthCheck, VERSION, MODULE_ID };
