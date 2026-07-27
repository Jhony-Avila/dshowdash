// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-icon-financial-helpers
// PURPOSE: financial Icon - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTRACTS from ../core/contracts.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   Helpers — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { CONTRACTS } from '../core/contracts.js';

export const MODULE_ID = 'footer-icon-financial-helpers';
export const VERSION = '1.2.0-ENTERPRISE';

let _metrics = { sizeResolves: 0, classBuilds: 0 };

export const Helpers = {
  getSizeValue(s: unknown) {
    _metrics.sizeResolves++;
    return (CONTRACTS.SIZES as Record<string,unknown>)[s as string] || CONTRACTS.SIZES.md;
  },
  buildClasses(p: Record<string, unknown> = {}) {
    _metrics.classBuilds++;
    return ['dsd-icon', 'dsd-icon--financial', `dsd-icon--${p.variant || 'primary'}`, `dsd-icon--size-${p.size || 'md'}`, `dsd-icon--state-${p.state || 'default'}`, p.clickable ? 'dsd-icon--clickable' : ''].filter(Boolean).join(' ');
  }
};

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() };
}


export default { ...Helpers, getMetrics, info, healthCheck, MODULE_ID, VERSION };
