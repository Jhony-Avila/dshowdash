// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-globals
// PURPOSE: Preloader Globals - Enterprise Autocontained
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   getProgressSource from ./container-resolver.js
//
// PROVIDES:
//   registerWindowGlobals() — exported function
//   setupPageHideHandler() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Preloader
//   window.PreloaderController
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { getProgressSource } from './container-resolver.js';

const MODULE_ID = 'preloader-globals';
const VERSION = '1.7.0-P2-ENTERPRISE';

export function registerWindowGlobals(getInstanceFn: () => Record<string, any> | null) {
  if (typeof window === 'undefined') return;

  const preloaderControllerApi = {
    getInstance: getInstanceFn,
    show() { const i = getInstanceFn(); return i ? i.show() : undefined; },
    hide(cb?: () => void) { const i = getInstanceFn(); return i ? i.hide(cb) : undefined; },
    setProgress(pct: number) { const i = getInstanceFn(); return i ? i.setProgress(pct) : undefined; },
    getStatus() { const i = getInstanceFn(); return i ? i.getStatus() : undefined; },
    getVersion() { const i = getInstanceFn(); return i ? i.getVersion() : undefined; },
    healthCheck() { const i = getInstanceFn(); return i ? i.healthCheck() : undefined; },
    info() { const i = getInstanceFn(); return i ? i.info() : undefined; },
    isInitialized() { const i = getInstanceFn(); return i ? i.isInitialized() : undefined; },
    reset() { const i = getInstanceFn(); return i ? i.reset() : undefined; },
    getTrace() { const i = getInstanceFn(); return i ? i.bootTrace : undefined; },
    getBootId() { const i = getInstanceFn(); return i ? i.bootId : undefined; },
    getOrchestratorState() { const i = getInstanceFn(); return i ? i.getOrchestratorState() : undefined; },
    getMetrics() { const i = getInstanceFn(); return i ? i.getMetrics() : undefined; },
    getIntegrationsStatus() { const i = getInstanceFn(); return i ? i.getIntegrationsStatus() : undefined; },
    notifyAuthReady() { const i = getInstanceFn(); return i ? i.notifyAuthReady() : undefined; }
  };

  const preloaderApi = {
    notifyAuthReady() { const i = getInstanceFn(); return i ? i.notifyAuthReady() : undefined; },
    getStatus() { const i = getInstanceFn(); return i ? i.getStatus() : undefined; },
    getVersion() { const i = getInstanceFn(); return i ? i.getVersion() : undefined; },
    healthCheck() { const i = getInstanceFn(); return i ? i.healthCheck() : undefined; }
  };

  const preloaderDevApi = {
    getInstance: getInstanceFn,
    mount(el: Element) { const i = getInstanceFn(); return i ? i.mount(el) : undefined; },
    show() { const i = getInstanceFn(); return i ? i.show() : undefined; },
    hide(cb?: () => void) { const i = getInstanceFn(); return i ? i.hide(cb) : undefined; },
    setProgress(pct: number) { const i = getInstanceFn(); return i ? i.setProgress(pct) : undefined; },
    cleanup() { const i = getInstanceFn(); return i ? i.cleanup() : undefined; },
    reset() { const i = getInstanceFn(); return i ? i.reset() : undefined; },
    getStatus() { const i = getInstanceFn(); return i ? i.getStatus() : undefined; },
    getVersion() { const i = getInstanceFn(); return i ? i.getVersion() : undefined; },
    healthCheck() { const i = getInstanceFn(); return i ? i.healthCheck() : undefined; },
    info() { const i = getInstanceFn(); return i ? i.info() : undefined; },
    isInitialized() { const i = getInstanceFn(); return i ? i.isInitialized() : undefined; },
    getTrace() { const i = getInstanceFn(); return i ? i.bootTrace : undefined; },
    getBootId() { const i = getInstanceFn(); return i ? i.bootId : undefined; },
    // v1.5.0: Bootstrap-v2 é a fonte única de progresso
    getProgressSource() { return getProgressSource(); },
    getOrchestratorState() { const i = getInstanceFn(); return i ? i.getOrchestratorState() : undefined; },
    getMetrics() { const i = getInstanceFn(); return i ? i.getMetrics() : undefined; },
    getIntegrationsStatus() { const i = getInstanceFn(); return i ? i.getIntegrationsStatus() : undefined; },
    forceFinish(motivo?: string) { const i = getInstanceFn(); return i ? i.finalizar(motivo || 'debug-force', true) : undefined; }
  };

  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.preloader = preloaderDevApi;

  // Exposição global condicional baseada em strict mode
  if (!isStrict()) {
    if (!(window as any).PreloaderController) {
      (window as any).PreloaderController = preloaderControllerApi;
    }
    (window as any).Preloader = preloaderApi;
  } else {
    // Em strict mode, registrar violação mas ainda permitir acesso (para não quebrar)
    if (!(window as any).PreloaderController) {
      Object.defineProperty(window, 'PreloaderController', {
        get() {
          recordViolation('WINDOW_ACCESS', { module: MODULE_ID, property: 'PreloaderController', access: 'global-access' });
          return preloaderControllerApi;
        },
        configurable: true
      });
    }
    Object.defineProperty(window, 'Preloader', {
      get() {
        recordViolation('WINDOW_ACCESS', { module: MODULE_ID, property: 'Preloader', access: 'global-access' });
        return preloaderApi;
      },
      configurable: true
    });
  }
}

export function setupPageHideHandler(getInstanceFn: () => Record<string, any> | null) { window.addEventListener('pagehide', () => { const i = getInstanceFn(); if (i && i.destroy) i.destroy(); }); }

export { MODULE_ID, VERSION };
export default { MODULE_ID, VERSION, registerWindowGlobals, setupPageHideHandler };
