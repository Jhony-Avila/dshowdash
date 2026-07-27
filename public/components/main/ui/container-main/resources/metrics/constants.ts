// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:metrics-persistence
// PURPOSE: Metrics Constants
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:metrics-persistence';

// Tipos de métricas
export const METRIC_TYPES = Object.freeze({
  TIMING: 'timing',
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  SUMMARY: 'summary'
});

// Períodos de agregação
export const AGGREGATION_PERIODS = Object.freeze({
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000
});

// Configurações padrão
export const DEFAULT_CONFIG = Object.freeze({
  STORAGE_PREFIX: 'dsd-metrics',
  MAX_ENTRIES_PER_PANEL: 1000,
  MAX_TOTAL_ENTRIES: 10000,
  PERSIST_INTERVAL: 30000
});

export default {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG
};
