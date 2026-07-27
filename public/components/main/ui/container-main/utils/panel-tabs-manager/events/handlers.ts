// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: handlers
// PURPOSE: Panel Tabs Manager - Event Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   closeTab, activateTab from ../api.js
//
// PROVIDES:
//   _handleTabClick() — exported function
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

import { closeTab, activateTab } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.events.handlers';

export function _handleTabClick(e: Event) {
  const tabEl = (e.target as HTMLElement).closest('.dsd-pt-tab');
  if (!tabEl) return;
  
  // @ts-expect-error TS migration - TS2339
  const tabId = tabEl.dataset.tabId;
  
  // Check if close button was clicked
  if ((e.target as HTMLElement).closest('.dsd-pt-tab-close')) {
    closeTab(tabId);
    return;
  }
  
  // Activate tab
  activateTab(tabId);
}
