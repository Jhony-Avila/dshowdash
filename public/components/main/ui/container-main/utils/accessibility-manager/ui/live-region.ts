// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: live-region
// PURPOSE: Accessibility Manager - Live Region
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getLiveRegion, setLiveRegion from ../state.js
//
// PROVIDES:
//   _createLiveRegion() — exported function
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

import { getLiveRegion, setLiveRegion } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.ui.live-region';

export function _createLiveRegion() {
  if (getLiveRegion()) return getLiveRegion();
  
  const liveRegion = document.createElement('div');
  liveRegion.id = 'dsd-a11y-live-region';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'dsd-a11y-sr-only';
  
  liveRegion.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(liveRegion);
  setLiveRegion(liveRegion);
  return liveRegion;
}
