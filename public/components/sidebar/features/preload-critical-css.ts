// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.2.0-REGION-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-preload-critical-css
// PURPOSE: Sidebar Features - Preload Critical CSS
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   addCustomCSS() — exported function
//   removeCustomCSS() — exported function
//   getCriticalCSS() — exported function
//   cleanup() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.CRITICAL_CSS_INJECTED
//   SIDEBAR_EVENTS.PRELOAD_CSS_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.2.0-REGION-AWARE';
export const MODULE_ID = 'sidebar-preload-critical-css';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _injectedStyles: DynObj[] = [];
let _metrics = { injects: 0, customAdds: 0, removes: 0 };

// v6.2.0: Removido position:fixed, left, top, bottom - posicionamento agora via região #sidebar
const CRITICAL_CSS = `.dsd-sidebar{position:relative;width:100%;height:100%;background:var(--sidebar-bg,#0E0E12);z-index:1;display:flex;flex-direction:column;transition:width var(--sidebar-transition-slow,300ms)}.dsd-sidebar.dsd-sidebar--collapsed{width:var(--sidebar-width-collapsed,72px);min-width:var(--sidebar-width-collapsed,72px)}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-text,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__section-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-title,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__search,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__badge,.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__group-chevron{display:none}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__link{justify-content:center;padding:12px}.dsd-sidebar.dsd-sidebar--collapsed .dsd-sidebar__item-icon{margin:0}.dsd-sidebar__header{flex-shrink:0;padding:1rem;border-bottom:1px solid var(--sidebar-border,rgba(255,255,255,0.06))}.dsd-sidebar__nav{flex:1;overflow-y:auto;overflow-x:hidden}.dsd-sidebar__link{display:flex;align-items:center;padding:0.625rem 1rem;color:var(--sidebar-text-secondary,rgba(229,231,235,1));text-decoration:none;transition:background var(--sidebar-transition-fast,150ms),color var(--sidebar-transition-fast,150ms)}.dsd-sidebar__item-icon{width:var(--sidebar-icon-size,20px);height:var(--sidebar-icon-size,20px);margin-right:0.75rem;flex-shrink:0}.dsd-sidebar__item-text{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:768px){.dsd-sidebar{transform:translateX(-100%);transition:transform 0.3s ease,width 0.3s ease}.dsd-sidebar--mobile-open{transform:translateX(0)}}`;

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  injectCriticalCSS();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) { eb.emit(SIDEBAR_EVENTS.CRITICAL_CSS_INJECTED); eb.emit(SIDEBAR_EVENTS.PRELOAD_CSS_INITIALIZED); }
}

function injectCriticalCSS() {
  if (document.getElementById('dsd-sidebar-critical-css')) return;
  const style = document.createElement('style');
  style.id = 'dsd-sidebar-critical-css';
  style.textContent = CRITICAL_CSS;
  document.head.insertBefore(style, document.head.firstChild);
  _injectedStyles.push(style);
  _metrics.injects++;
}

export function addCustomCSS(css: string, id: string) {
  const styleId = id || ('dsd-sidebar-custom-' + Date.now());
  if (id) { const existing = document.getElementById(styleId); if (existing) existing.remove(); }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
  _injectedStyles.push(style);
  _metrics.customAdds++;
  return styleId;
}

export function removeCustomCSS(id: string) { const style = document.getElementById(id); if (style) { style.remove(); _injectedStyles = _injectedStyles.filter(function(s) { return s.id !== id; }); _metrics.removes++; return true; } return false; }

export function getCriticalCSS() { return CRITICAL_CSS; }
export function cleanup() { _injectedStyles.forEach(function(style) { style.remove(); }); _injectedStyles = []; }

export function destroy() { cleanup(); }

export function getMetrics() { return Object.assign({}, _metrics, { injectedStyles: _injectedStyles.length }); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), injectedStyles: _injectedStyles.length, criticalCSSPresent: !!document.getElementById('dsd-sidebar-critical-css'), metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { injectedStyles: _injectedStyles.length, criticalCSSPresent: !!document.getElementById('dsd-sidebar-critical-css') }, metrics: getMetrics() }; }

export default { init: init, addCustomCSS: addCustomCSS, removeCustomCSS: removeCustomCSS, getCriticalCSS: getCriticalCSS, cleanup: cleanup, destroy: destroy, injectPorts: injectPorts, getPorts: getPorts, getMetrics: getMetrics, info: info, healthCheck: healthCheck, VERSION: VERSION, MODULE_ID: MODULE_ID };
