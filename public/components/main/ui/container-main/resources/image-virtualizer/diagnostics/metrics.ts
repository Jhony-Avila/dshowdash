// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics
// PURPOSE: Image Virtualizer - Metrics & Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, LOAD_STRATEGIES, IMAGE_QUALITY from ../config/constants.js
//   getFormatSupport from ../core/format-detector.js
//
// PROVIDES:
//   createMetrics() — exported function
//   getMetricsReport() — exported function
//   performHealthCheck() — exported function
//   getInfo() — exported function
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

import { VERSION, MODULE_ID, LOAD_STRATEGIES, IMAGE_QUALITY } from '../config/constants.js';
import { getFormatSupport } from '../core/format-detector.js';

export function createMetrics() {
  return {
    totalImages: 0,
    loaded: 0,
    errors: 0,
    fromCache: 0,
    totalBytes: 0,
    avgLoadTime: 0,
    loadTimes: [] as unknown[]
  };
}

export function getMetricsReport(metrics: Record<string, unknown>, loader: Record<string, (...args: unknown[]) => unknown> | null) {
  return {
    ...metrics,
    pending: loader?.getQueueLength() || 0,
    activeLoads: loader?.getActiveLoads() || 0,
    formatSupport: getFormatSupport()
  };
}

export function performHealthCheck(metrics: Record<string, unknown>, config: Record<string, unknown>, loader: Record<string, (...args: unknown[]) => unknown> | null, observer: Record<string, (...args: unknown[]) => unknown> | null) {
  const report = getMetricsReport(metrics, loader) as Record<string, unknown>;
  const errorRate = (report.totalImages as number) > 0 ? (report.errors as number) / (report.totalImages as number) : 0;

  let status = 'HEALTHY';
  if (errorRate > 0.3) status = 'ERROR';
  else if (errorRate > 0.1) status = 'WARNING';
  else if ((report.activeLoads as number) >= (config.maxConcurrent as number)) status = 'BUSY';

  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: report,
    observerActive: observer?.isActive?.() || false
  };
}

export function getInfo(images: Map<string, unknown>) {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalImages: images?.size || 0,
    formatSupport: getFormatSupport(),
    strategies: Object.keys(LOAD_STRATEGIES),
    qualities: Object.keys(IMAGE_QUALITY)
  };
}

export default { createMetrics, getMetricsReport, performHealthCheck, getInfo };
