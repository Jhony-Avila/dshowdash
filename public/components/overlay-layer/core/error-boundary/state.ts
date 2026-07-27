// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//
// PROVIDES:
//   config — exported value
//   errors — exported value
//   errorHandlers — exported value
//   recoveryStrategies — exported value
//   state — exported value
//   logger — exported value
//   metricsCollector — exported value
//   setLogger() — exported function
//   setMetricsCollector() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getErrors() — exported function
//   setErrors() — exported function
//   getErrorHandlers() — exported function
//   setErrorHandlers() — exported function
//   getRecoveryStrategies() — exported function
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

import { DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.state';

export let config = { ...DEFAULT_CONFIG };
export let errors: DynObj[] = [];
export let errorHandlers: DynObj[] = [];
export let recoveryStrategies = {};

export const state = {
  totalErrors: 0,
  recoveredErrors: 0,
  fatalErrors: 0,
  lastError: null as DynObj
};

export let logger: DynObj = null;
export let metricsCollector: DynObj = null;

export function setLogger(l: DynObj) { logger = l; }
export function setMetricsCollector(m: DynObj) { metricsCollector = m; }
export function getConfig() { return config; }
export function setConfig(c: DynObj) { config = c; }
export function getErrors() { return errors; }
export function setErrors(e: DynObj) { errors = e; }
export function getErrorHandlers() { return errorHandlers; }
export function setErrorHandlers(h: DynObj) { errorHandlers = h; }
export function getRecoveryStrategies() { return recoveryStrategies; }
