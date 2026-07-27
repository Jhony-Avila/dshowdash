// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Export Content Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   _listeners — exported value
//   metrics — exported value
//   getInstance() — exported function
//   setInstance() — exported function
//   hasInstance() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   isExporting() — exported function
//   setExporting() — exported function
//   getListeners() — exported function
//   incrementMetric() — exported function
//   getMetrics() — exported function
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

import { DEFAULT_CONFIG } from './constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.state';

let _instance: Record<string, unknown> | null = null;
let _config = { ...DEFAULT_CONFIG };
let _isExporting = false;
export let _listeners: Array<(...args: unknown[]) => void> = [];

export const metrics = {
  exports: 0,
  pngExports: 0,
  jpegExports: 0,
  pdfExports: 0,
  svgExports: 0,
  errors: 0,
  totalBytes: 0,
  lastExportAt: null as Record<string, unknown> | null
};

export function getInstance() { return _instance; }
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }
export function hasInstance() { return _instance !== null; }

export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }

export function isExporting() { return _isExporting; }
export function setExporting(val: boolean) { _isExporting = val; }

export function getListeners() { return _listeners; }

export function incrementMetric(key: string, amount = 1) {
  // @ts-expect-error TS migration - TS2365
  if (metrics.hasOwnProperty(key)) (metrics as Record<string, unknown>)[key] += amount;
}

export function getMetrics() {
  return { ...metrics };
}
