/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/init/performance.ts
 * @version 1.0.0
 * Performance metrics
 * ═══════════════════════════════════════════════════════════════ */

import { MODULE_ID } from '../core/constants.js';

let _mountStart = 0;

export function markMountStart(): void {
  _mountStart = performance.now();
}

export function markMountEnd(): void {
  if (_mountStart > 0) {
    const duration = performance.now() - _mountStart;
    console.debug(`[${MODULE_ID}] Mount completed in ${duration.toFixed(1)}ms`);
    _mountStart = 0;
  }
}
