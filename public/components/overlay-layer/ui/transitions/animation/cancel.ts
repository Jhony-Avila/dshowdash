// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - Cancel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getActiveTransitions from ../state.js
//
// PROVIDES:
//   cancel() — exported function
//   cancelAll() — exported function
//   getActiveCount() — exported function
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

import { getActiveTransitions } from '../state.js';

export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.ui.transitions.animation.cancel';

export function cancel(element: HTMLElement) {
  if (!element) return { ok: false, error: 'invalid-element' };
  
  let cancelled = 0;
  
  if (typeof element.getAnimations === 'function') {
    const animations = element.getAnimations();
    for (const anim of animations) {
      anim.cancel();
      cancelled++;
    }
  }
  
  element.style.transition = '';
  element.style.transform = '';
  element.style.opacity = '';
  
  return { ok: true, cancelled };
}

export function cancelAll() {
  let cancelled = 0;
  const activeTransitions = getActiveTransitions();
  
  for (const [id, animation] of activeTransitions) {
    try {
      animation.cancel();
      cancelled++;
    } catch (e) {}
  }
  
  activeTransitions.clear();
  
  return { ok: true, cancelled };
}

export function getActiveCount() {
  return getActiveTransitions().size;
}
