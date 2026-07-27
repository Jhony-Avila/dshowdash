// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: depth
// PURPOSE: UX Enhancements - Depth Indicator (#1)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setDepth() — exported function
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
export const MODULE_ID = 'main.ui.container-main.components.ux-enhancements.utils.depth';

export function setDepth(container: HTMLElement, depth: number) {
  if (!container || depth < 1 || depth > 3) return;
  container.setAttribute('data-depth', String(depth));
}
