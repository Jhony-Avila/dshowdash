// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-NCS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-collapse
// PURPOSE: Sidebar V2 - Collapse Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_CLASSES as C from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CAPABILITIES — exported value
//   createCollapseHandler() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CSS_CLASSES as C } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.0.0-NCS';
export const MODULE_ID = 'sidebar-collapse';

export const CAPABILITIES = Object.freeze({
  canCollapse: true,
  canExpand: true,
  canToggle: true,
  emitsLayoutRequest: false,
  manipulatesOwnDOM: true,
  manipulatesGlobalDOM: false
});

export class CollapseHandler {
  [key: string]: any;
  constructor(sidebar: DynObj, options: { collapsed?: boolean; onToggle?: () => void } = {}) {
    this._sidebar = sidebar;
    this._collapsed = options.collapsed ?? false;
    this._onToggle = options.onToggle || (() => {});
    this._status = 'healthy';
    this._lastError = null;
    this._initialized = false;
    this._metrics = {
      toggles: 0,
      collapses: 0,
      expands: 0,
      errors: 0
    };
  }

  get collapsed() { return this._collapsed; }
  get status() { return this._status; }

  init() {
    try {
      if (!this._sidebar) {
        this._status = 'degraded';
        this._lastError = 'Sidebar element not provided';
        return { success: false, error: this._lastError };
      }
      this._initialized = true;
      this._status = 'healthy';
      return { success: true };
    } catch (error: any) {
      this._status = 'error';
      this._lastError = error.message;
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  setCollapsed(value: DynObj) {
    try {
      this._collapsed = value;
      
      this._sidebar?.classList.toggle(C.MOD_COLLAPSED, value);
      
      const toggle = this._sidebar?.querySelector(`.${C.TOGGLE}`);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!value));
        toggle.setAttribute('aria-label', value ? 'Expandir menu' : 'Recolher menu');
      }
      
      if (value) this._metrics.collapses++;
      else this._metrics.expands++;
      
      this._status = 'healthy';
      return { success: true, collapsed: value };
    } catch (error: any) {
      this._status = 'degraded';
      this._lastError = error.message;
      this._metrics.errors++;
      return { success: false, error: error.message };
    }
  }

  toggle() {
    this._metrics.toggles++;
    const result = this.setCollapsed(!this._collapsed);
    if (result.success) {
      try { this._onToggle(this._collapsed); } 
      catch (error: any) { this._lastError = `Callback error: ${error.message}`; }
    }
    return this._collapsed;
  }

  collapse() { return this.setCollapsed((true as DynObj)); }
  expand() { return this.setCollapsed((false as DynObj)); }

  getMetrics() { return { ...this._metrics }; }

  reset() {
    this._collapsed = false;
    this._status = 'healthy';
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
    const isHealthy = this._status === 'healthy';
    
    const checks = {
      hasSidebar,
      sidebarInDOM,
      noErrors,
      isHealthy,
      initialized: this._initialized
    };
    
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    
    let status = 'HEALTHY';
    if (!hasSidebar) status = 'UNHEALTHY';
    else if (!sidebarInDOM || !isHealthy) status = 'DEGRADED';
    
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

export function createCollapseHandler(sidebar: DynObj, options: DynObj) {
  const handler = new CollapseHandler(sidebar, options);
  handler.init();
  return handler;
}

export default { VERSION, MODULE_ID, CAPABILITIES, CollapseHandler, createCollapseHandler };
