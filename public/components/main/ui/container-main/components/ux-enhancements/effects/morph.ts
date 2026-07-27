// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: morph
// PURPOSE: UX Enhancements - Morph Transitions (#22)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   enableMorphTransitions() — exported function
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

export const VERSION = '3.0.0-UX-ENHANCED';
export const MODULE_ID = 'main.ui.container-main.components.ux-enhancements.effects.morph';

export function enableMorphTransitions(container: HTMLElement) {
  container?.classList?.add('dsd-container--morph-transitions');
  return {
    disable() {
      container?.classList?.remove('dsd-container--morph-transitions');
    }
  };
}
