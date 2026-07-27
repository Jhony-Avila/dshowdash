// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Print Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   _instance — exported value
//   setInstance() — exported function
//   getInstance() — exported function
//   _config — exported value
//   getConfig() — exported function
//   setConfig() — exported function
//   resetConfig() — exported function
//   _isPrinting — exported value
//   isPrinting() — exported function
//   setIsPrinting() — exported function
//   _printStylesheet — exported value
//   getPrintStylesheet() — exported function
//   setPrintStylesheet() — exported function
//   _listeners — exported value
//   _metrics — exported value
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
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.state';

export let _instance: Record<string, unknown> | null = null;
export function setInstance(inst: Record<string, unknown> | null) { _instance = inst; }
export function getInstance() { return _instance; }

export let _config = { ...DEFAULT_CONFIG };
export function getConfig() { return _config; }
// @ts-expect-error TS migration - TS2740
export function setConfig(cfg: Record<string, unknown>) { _config = cfg; }
export function resetConfig() { _config = { ...DEFAULT_CONFIG }; }

export let _isPrinting = false;
export function isPrinting() { return _isPrinting; }
export function setIsPrinting(val: boolean) { _isPrinting = val; }

export let _printStylesheet: unknown | null = null;
export function getPrintStylesheet() { return _printStylesheet; }
export function setPrintStylesheet(el: HTMLElement) { _printStylesheet = el; }

export const _listeners: Array<(...args: unknown[]) => void> = [];

export const _metrics = {
  printAttempts: 0,
  printSuccesses: 0,
  previews: 0,
  errors: 0
};

export function incrementMetric(key: string) {
  // @ts-expect-error TS migration - TS2356
  if (_metrics.hasOwnProperty(key)) (_metrics as Record<string, unknown>)[key]++;
}

export function getMetrics() { return { ..._metrics }; }
