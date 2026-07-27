// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Snapshot Manager - Serializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   serializeOverlay() — exported function
//   serializeOverlays() — exported function
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
export const MODULE_ID = 'overlay-layer.state.snapshot-manager.core.serializer';

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serializa um overlay para snapshot
 * @param {Object} overlay
 * @returns {Object|null}
 */
export function serializeOverlay(overlay: DynObj) {
  if (!overlay) return null;
  
  return {
    id: overlay.id,
    type: overlay.type,
    scope: overlay.scope || 'global',
    content: typeof overlay.content === 'string' ? overlay.content : null,
    config: overlay.config ? Object.assign({}, overlay.config) : {},
    meta: overlay.meta ? Object.assign({}, overlay.meta) : {},
    data: overlay.data ? Object.assign({}, overlay.data) : {},
    runtime: overlay.runtime ? {
      visible: overlay.runtime.visible,
      createdAt: overlay.runtime.createdAt,
      openedAt: overlay.runtime.openedAt
    } : null
  };
}

/**
 * Serializa múltiplos overlays
 * @param {Array} stack
 * @param {Object} overlays
 * @returns {Object}
 */
export function serializeOverlays(stack: DynObj, overlays: DynObj) {
  const serialized = {};
  
  for (let i = 0; i < stack.length; i++) {
    const id = stack[i];
    const overlay = overlays[id];
    if (overlay) {
      (serialized as DynObj)[id] = serializeOverlay(overlay);
    }
  }
  
  return serialized;
}

export default {
  serializeOverlay,
  serializeOverlays
};
