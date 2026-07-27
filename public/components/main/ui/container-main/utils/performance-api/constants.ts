// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:performance-api
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   METRIC_TYPES — exported value
//   METRIC_CATEGORIES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Performance API - Constants
 * @module performance-api/constants
 */
'use strict';

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:performance-api';

export const METRIC_TYPES = Object.freeze({
  TIMING: 'timing',
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram'
});

export const METRIC_CATEGORIES = Object.freeze({
  RENDER: 'render',
  LOAD: 'load',
  INTERACTION: 'interaction',
  NETWORK: 'network',
  MEMORY: 'memory',
  CUSTOM: 'custom'
});
