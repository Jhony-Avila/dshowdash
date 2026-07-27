// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Compare
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   compare() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.operations.compare';

// ============================================================================
// COMPARE
// ============================================================================

/**
 * Compara dois snapshots
 * @param {Object} snapshot1
 * @param {Object} snapshot2
 * @returns {Object}
 */
export function compare(snapshot1: DynObj, snapshot2: DynObj) {
  if (!snapshot1 || !snapshot2) {
    return { ok: false, error: 'invalid-snapshots' };
  }
  
  const stack1 = snapshot1.stack || [];
  const stack2 = snapshot2.stack || [];
  const overlays1 = snapshot1.overlays || {};
  const overlays2 = snapshot2.overlays || {};
  
  // IDs em comum
  const common = stack1.filter((id: DynObj) => stack2.indexOf(id) !== -1);
  
  // IDs apenas no snapshot1
  const onlyIn1 = stack1.filter((id: DynObj) => stack2.indexOf(id) === -1);
  
  // IDs apenas no snapshot2
  const onlyIn2 = stack2.filter((id: DynObj) => stack1.indexOf(id) === -1);
  
  // Comparar overlays em comum
  const modified = [];
  for (let i = 0; i < common.length; i++) {
    const id = common[i];
    const o1 = overlays1[id];
    const o2 = overlays2[id];
    if (JSON.stringify(o1) !== JSON.stringify(o2)) {
      modified.push({
        id,
        differences: {
          type: o1 && o2 ? o1.type !== o2.type : true,
          scope: o1 && o2 ? o1.scope !== o2.scope : true,
          config: JSON.stringify(o1 && o1.config) !== JSON.stringify(o2 && o2.config)
        }
      });
    }
  }
  
  return {
    ok: true,
    snapshot1Id: snapshot1.id,
    snapshot2Id: snapshot2.id,
    counts: {
      snapshot1: stack1.length,
      snapshot2: stack2.length,
      common: common.length,
      onlyIn1: onlyIn1.length,
      onlyIn2: onlyIn2.length,
      modified: modified.length
    },
    common,
    onlyIn1,
    onlyIn2,
    modified,
    identical: onlyIn1.length === 0 && onlyIn2.length === 0 && modified.length === 0
  };
}

export default {
  compare
};
