// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: collapse
// PURPOSE: Split View Manager - Collapse Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getGutter from ../state.js
//   toggleCollapse from ../operations/panel.js
//
// PROVIDES:
//   _setupCollapseHandlers() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getGutter } from '../state.js';
import { toggleCollapse } from '../operations/panel.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.handlers.collapse';

export function _setupCollapseHandlers() {
  const gutter = getGutter();
  const buttons = (gutter as HTMLElement).querySelectorAll('.dsd-split-view__collapse-btn');
  // @ts-expect-error strict migration — TS2345
  buttons.forEach((btn: HTMLButtonElement) => {
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      const panel = btn.dataset.collapse;
      // @ts-expect-error TS migration - TS2345
      toggleCollapse(panel);
    });
  });
}
