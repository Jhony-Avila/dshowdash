// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Metrics Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   METRIC_TYPES — exported value
//   AGGREGATION_PERIODS — exported value
//   DEFAULT_CONFIG — exported value
//   createStorageAdapter — exported value
//   calculateStats — exported value
//   aggregateByPeriod — exported value
//   calculateRate — exported value
//   movingAverage — exported value
//   createMetricsStore — exported value
//   createPersistenceIO — exported value
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

export {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG
} from './constants.js';

export { createStorageAdapter } from './storage-adapter.js';
export { calculateStats, aggregateByPeriod, calculateRate, movingAverage } from './stats-calculator.js';
export { createMetricsStore } from './metrics-store.js';
export { createPersistenceIO } from './persistence-io.js';
