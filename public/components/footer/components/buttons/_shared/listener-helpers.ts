// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-shared-listeners
// PURPOSE: Footer Shared - Listener Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   addListener() — exported function
//   addKeyboardListener() — exported function
//   runCleanups() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

const VERSION = '1.1.0-ENTERPRISE';
const MODULE_ID = 'footer-shared-listeners';

let _metrics = { listenersAdded: 0, cleanups: 0 };

export function addListener(element: HTMLElement|null, event: string, handler: Function, cleanups = []) {
  if (!element || !event || !handler) return null;
  
  _metrics.listenersAdded++;
  // @ts-expect-error TS migration - TS2769
  element.addEventListener(event, handler);
  
  const cleanup = () => {
    // @ts-expect-error TS migration - TS2769
    element.removeEventListener(event, handler);
  };
  
  // @ts-expect-error strict migration — TS2345
  cleanups.push(cleanup);
  return cleanup;
}

export function addKeyboardListener(element: HTMLElement|null, handler: Function, cleanups = []) {
  if (!element || !handler) return null;
  
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
  
  return addListener(element, 'keydown', keyHandler, cleanups);
}

export function runCleanups(cleanups: (()=>void)[]) {
  if (!Array.isArray(cleanups)) return;
  _metrics.cleanups++;
  cleanups.forEach(fn => {
    try { if (typeof fn === 'function') fn(); } catch (e) {}
  });
  cleanups.length = 0;
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { addListener, addKeyboardListener, runCleanups, getMetrics, info, healthCheck, VERSION, MODULE_ID };
