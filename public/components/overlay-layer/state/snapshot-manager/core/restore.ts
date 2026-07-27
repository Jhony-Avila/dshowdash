// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Restore
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SNAPSHOT_FORMAT_VERSION from ../constants.js
//
// PROVIDES:
//   restore() — exported function
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

import { SNAPSHOT_FORMAT_VERSION } from '../constants.js';
import {

  getStore,
  getOpenOverlay,
  getCloseOverlay,
  incrementRestoresPerformed
} from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.core.restore';

// ============================================================================
// RESTORE
// ============================================================================

/**
 * Restaura estado a partir de um snapshot
 * @param {Object} snapshotData
 * @param {Object} options
 * @returns {Object}
 */
export function restore(snapshotData: DynObj, options: DynObj) {
  options = options || {};
  const store = getStore();
  const openOverlay = getOpenOverlay();
  const closeOverlay = getCloseOverlay();
  
  if (!store) {
    return { ok: false, error: 'store-not-injected' };
  }
  
  if (!snapshotData || !snapshotData.version) {
    return { ok: false, error: 'invalid-snapshot' };
  }
  
  if (snapshotData.version !== SNAPSHOT_FORMAT_VERSION) {
    if (!options.ignoreVersion) {
      return {
        ok: false,
        error: 'version-mismatch',
        expected: SNAPSHOT_FORMAT_VERSION,
        received: snapshotData.version
      };
    }
  }
  
  const results = {
    closed: [] as DynObj,
    opened: [] as DynObj,
    failed: [] as DynObj,
    skipped: [] as DynObj
  };
  
  // Fechar overlays atuais
  if (options.clearCurrent !== false && closeOverlay) {
    const currentStack = store.getStack ? store.getStack() : [];
    for (let i = 0; i < currentStack.length; i++) {
      const id = currentStack[i];
      try {
        const closeResult = closeOverlay(id, 'snapshot-restore');
        if (closeResult && closeResult.ok !== false) {
          results.closed.push(id);
        } else {
          results.failed.push({ id, action: 'close', reason: closeResult ? closeResult.reason : 'unknown' });
        }
      } catch (e: any) {
        results.failed.push({ id, action: 'close', reason: e.message });
      }
    }
  }
  
  // Restaurar overlays do snapshot
  if (openOverlay && snapshotData.stack && snapshotData.overlays) {
    for (let j = 0; j < snapshotData.stack.length; j++) {
      const overlayId = snapshotData.stack[j];
      const overlayData = snapshotData.overlays[overlayId];
      
      if (!overlayData) {
        results.skipped.push({ id: overlayId, reason: 'no-data' });
        continue;
      }
      
      if (!overlayData.content && options.requireContent) {
        results.skipped.push({ id: overlayId, reason: 'no-content' });
        continue;
      }
      
      try {
        const descriptor = {
          id: options.preserveIds ? overlayData.id : undefined,
          type: overlayData.type,
          scope: overlayData.scope,
          content: overlayData.content,
          config: overlayData.config,
          meta: Object.assign({}, overlayData.meta, {
            restoredFrom: snapshotData.id,
            restoredAt: Date.now()
          }),
          data: overlayData.data
        };
        
        const openResult = openOverlay(descriptor, { 
          bypassRateLimit: true, 
          bypassKernelCheck: options.bypassKernelCheck 
        });
        
        if (openResult && openResult.ok) {
          results.opened.push(openResult.id || overlayData.id);
        } else {
          let reason = 'unknown';
          if (openResult) {
            reason = openResult.reason || (openResult.errors ? openResult.errors.join(', ') : 'unknown');
          }
          results.failed.push({ id: overlayData.id, action: 'open', reason });
        }
      } catch (e: any) {
        results.failed.push({ id: overlayData.id, action: 'open', reason: e.message });
      }
    }
  }
  
  incrementRestoresPerformed();
  
  return {
    ok: results.failed.length === 0,
    results,
    snapshotId: snapshotData.id,
    closedCount: results.closed.length,
    openedCount: results.opened.length,
    failedCount: results.failed.length,
    skippedCount: results.skipped.length
  };
}

export default {
  restore
};
