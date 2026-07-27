// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   config, logger, setLogger, setMetricsCollector from ../state.js
//
// PROVIDES:
//   log() — exported function
//   inject() — exported function
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

import { MODULE_ID } from '../constants.js';
import { config, logger, setLogger, setMetricsCollector } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';

export function log(level: DynObj, ...args: DynObj[]) {
  if (!config.logToConsole) return;
  
  if (logger?.[level]) {
    logger[level](`[${MODULE_ID}]`, ...args);
  } else if (typeof console !== 'undefined') {
    (console as DynObj)[level]?.(`[${MODULE_ID}]`, ...args);
  }
}

export function inject(dependencies: DynObj) {
  if (dependencies.logger) setLogger(dependencies.logger);
  if (dependencies.metricsCollector) setMetricsCollector(dependencies.metricsCollector);
}
