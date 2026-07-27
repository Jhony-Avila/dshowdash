// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:uarps
// PURPOSE: container-main/core/uarps.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UARPS_REGION from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyUarpsRegion() — exported function
//   hasUarpsRegion() — exported function
//   getUarpsRegion() — exported function
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

import { UARPS_REGION } from './constants.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-main:uarps';

export function applyUarpsRegion(element: HTMLElement) {
  if (element && !element.hasAttribute('data-uarps-region')) { element.setAttribute('data-uarps-region', UARPS_REGION); }
}

export function hasUarpsRegion(element: HTMLElement) { return element?.hasAttribute('data-uarps-region') || false; }

export function getUarpsRegion(element: HTMLElement) { return element?.getAttribute('data-uarps-region') || null; }

export function healthCheck() {
  const checks = { uarpsRegionDefined: !!UARPS_REGION, helperReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, uarpsRegion: UARPS_REGION, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, uarpsRegion: UARPS_REGION };
}
