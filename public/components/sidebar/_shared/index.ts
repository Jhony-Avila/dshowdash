// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-shared
// PURPOSE: Sidebar Shared Modules - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export * from './base-feature.js';
export * as DomUtils from './dom-utils.js';
export * as StorageUtils from './storage-utils.js';
export * as EventUtils from './event-utils.js';

export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-shared';

import * as DomUtils from './dom-utils.js';
import * as StorageUtils from './storage-utils.js';
import * as EventUtils from './event-utils.js';

export function getMetrics() {
  return {
    domUtils: DomUtils.getMetrics?.() || {},
    storageUtils: StorageUtils.getMetrics?.() || {},
    eventUtils: EventUtils.getMetrics?.() || {}
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}

export function healthCheck() {
  return {
    status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID,
    checks: {
      domUtils: DomUtils.healthCheck?.()?.status || 'UNKNOWN',
      storageUtils: StorageUtils.healthCheck?.()?.status || 'UNKNOWN',
      eventUtils: EventUtils.healthCheck?.()?.status || 'UNKNOWN'
    },
    metrics: getMetrics()
  };
}

export default { VERSION, MODULE_ID, info, getMetrics, healthCheck };
