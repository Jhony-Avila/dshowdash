// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Export Content Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, DEFAULT_CONFIG from ./constants.js
//   getInstance, setInstance, hasInstance, getConfig, setConfig, isExporting, get...
//   createExportContentManager from ./manager.js
//
// PROVIDES:
//   getExportContentManager() — exported function
//   configure() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { VERSION, MODULE_ID, DEFAULT_CONFIG } from './constants.js';
import { getInstance, setInstance, hasInstance, getConfig, setConfig, isExporting, getListeners, getMetrics } from './state.js';
import { createExportContentManager } from './manager.js';

declare const html2canvas: unknown;
declare const jsPDF: unknown;
declare const jspdf: unknown;
export function getExportContentManager(options: Record<string, unknown> = {}) {
  if (!hasInstance()) {
    setInstance(createExportContentManager(options));
  }
  return getInstance();
}

export function configure(options: Record<string, unknown>) {
  const currentConfig = getConfig();
  setConfig({ ...DEFAULT_CONFIG, ...currentConfig, ...options });
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  const listeners = getListeners();
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function healthCheck() {
  const hasHtml2Canvas = typeof html2canvas !== 'undefined';
  const hasJsPDF = typeof jspdf !== 'undefined' || typeof jsPDF !== 'undefined';
  
  const checks = {
    canExportImages: true,
    hasHtml2Canvas,
    hasJsPDF,
    notExporting: !isExporting(),
    noErrors: getMetrics().errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed >= 3 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    capabilities: {
      png: true,
      jpeg: true,
      svg: true,
      pdf: hasJsPDF
    },
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
    formats: ['png', 'jpeg', 'pdf', 'svg'],
    qualityLevels: ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'],
    config: {
      format: config.format,
      quality: config.quality,
      scale: config.scale,
      includeDateInFilename: config.includeDateInFilename
    },
    isExporting: isExporting(),
    metrics: getMetrics()
  };
}
