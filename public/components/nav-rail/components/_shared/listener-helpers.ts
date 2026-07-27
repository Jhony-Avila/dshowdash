// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-shared-listeners
// PURPOSE: NavRail Shared - Listener Helpers P3 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   addListener() — exported function
//   addKeyboardListener() — exported function
//   runCleanups() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'navrail-shared-listeners';

// Adiciona listener com tracking para cleanup
export function addListener(element: EventTarget, event: string, handler: EventListener, cleanups: (() => void)[] = []) {
  if (!element || !event || !handler) return null;
  
  element.addEventListener(event, handler);
  
  const cleanup = () => {
    element.removeEventListener(event, handler);
  };
  
  cleanups.push(cleanup);
  return cleanup;
}

// Adiciona listener de teclado (Enter/Space)
export function addKeyboardListener(element: EventTarget, handler: (e: KeyboardEvent) => void, cleanups: (() => void)[] = []) {
  if (!element || !handler) return null;

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };
  
  // @ts-expect-error strict migration — TS2345
  return addListener(element, 'keydown', keyHandler, cleanups);
}

// Executa todos os cleanups
export function runCleanups(cleanups: (() => void)[]) {
  if (!Array.isArray(cleanups)) return;
  cleanups.forEach(fn => {
    try { if (typeof fn === 'function') fn(); } catch (e) {}
  });
  cleanups.length = 0;
}

export default { addListener, addKeyboardListener, runCleanups, VERSION, MODULE_ID };

