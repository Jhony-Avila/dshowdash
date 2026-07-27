// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: visual
// PURPOSE: Loading Progress - Visual Updates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   updateVisual() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.loading-progress.dom.visual';

export function updateVisual(refs: Record<string, unknown>, progress: number) {
  if (!refs.barElement) return;
  
  (refs.barElement as HTMLElement).style.width = `${progress}%`;
  // @ts-expect-error TS migration - TS2339
  refs.element?.setAttribute('aria-valuenow', String(Math.round(progress)));
}
