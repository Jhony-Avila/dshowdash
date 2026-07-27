// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Print Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES, DEFAUL...
//   _instance, setInstance, getConfig, setConfig, isPrinting, _listeners, getMetr...
//   _log from ./helpers/logger.js
//   print, printElement from ./operations/print.js
//   printPreview from ./operations/preview.js
//   addPageBreak, removePageBreaks, markAvoidBreak, markKeepTogether from ./opera...
//
// PROVIDES:
//   configure() — exported function
//   createPrintManager() — exported function
//   getPrintManager() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   print — exported value
//   printElement — exported value
//   printPreview — exported value
//   addPageBreak — exported value
//   removePageBreaks — exported value
//   markAvoidBreak — exported value
//   markKeepTogether — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, MODULE_ID, PRINT_ORIENTATIONS, PRINT_SIZES, PAGE_BREAK_MODES, DEFAULT_CONFIG } from './constants.js';
import { _instance, setInstance, getConfig, setConfig, isPrinting, _listeners, getMetrics } from './state.js';
import { _log } from './helpers/logger.js';
import { print, printElement } from './operations/print.js';
import { printPreview } from './operations/preview.js';
import { addPageBreak, removePageBreaks, markAvoidBreak, markKeepTogether } from './operations/page-breaks.js';

export function configure(options: Record<string, unknown>) {
  const currentConfig = getConfig();
  const newConfig = { ...DEFAULT_CONFIG, ...currentConfig, ...options };
  if (options.margins) {
    newConfig.margins = { ...DEFAULT_CONFIG.margins, ...currentConfig.margins, ...(options.margins as Record<string, unknown>) };
  }
  setConfig(newConfig);
}

export function createPrintManager(options: Record<string, unknown> = {}) {
  const newConfig = { ...DEFAULT_CONFIG, ...(options as Record<string, unknown>) };
  if (options.margins) {
    newConfig.margins = { ...DEFAULT_CONFIG.margins, ...(options.margins as Record<string, unknown>) };
  }
  setConfig(newConfig);
  
  _log('info', 'Print Manager created');
  
  return {
    print,
    printElement,
    printPreview,
    configure,
    getConfig: () => ({ ...getConfig() }),
    isPrinting,
    addPageBreak,
    removePageBreaks,
    markAvoidBreak,
    markKeepTogether,
    subscribe,
    healthCheck,
    info
  };
}

export function getPrintManager(options: Record<string, unknown> = {}) {
  if (!_instance) {
    setInstance(createPrintManager(options));
  }
  return _instance;
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    printSupported: typeof window !== 'undefined' && typeof window.print === 'function',
    notPrinting: !isPrinting(),
    noErrors: metrics.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    orientations: Object.values(PRINT_ORIENTATIONS),
    pageSizes: Object.values(PRINT_SIZES),
    pageBreakModes: Object.values(PAGE_BREAK_MODES),
    config: {
      orientation: config.orientation,
      pageSize: config.pageSize,
      margins: config.margins,
      showHeader: config.showHeader,
      showFooter: config.showFooter,
      showPageNumbers: config.showPageNumbers
    },
    isPrinting: isPrinting(),
    metrics: getMetrics()
  };
}

// Re-exports
export { print, printElement };
export { printPreview };
export { addPageBreak, removePageBreaks, markAvoidBreak, markKeepTogether };
