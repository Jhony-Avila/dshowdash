// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Accessibility Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES from ./c...
//   createAccessibilityManager, getAccessibilityManager, init, destroy, announce,...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   A11Y_FEATURES — exported value
//   ARIA_LIVE_REGIONS — exported value
//   CONTRAST_MODES — exported value
//   createAccessibilityManager — exported value
//   getAccessibilityManager — exported value
//   init — exported value
//   destroy — exported value
//   announce — exported value
//   setFocus — exported value
//   trapFocus — exported value
//   releaseFocus — exported value
//   setContrastMode — exported value
//   setTextScale — exported value
//   enableFeature — exported value
//   disableFeature — exported value
//   isFeatureEnabled — exported value
//   setAriaLabel — exported value
//   setAriaDescribedBy — exported value
//   ... and 6 more exports
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

export { VERSION, MODULE_ID, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES } from './constants.js';

export {
  createAccessibilityManager,
  getAccessibilityManager,
  init,
  destroy,
  announce,
  setFocus,
  trapFocus,
  releaseFocus,
  setContrastMode,
  setTextScale,
  enableFeature,
  disableFeature,
  isFeatureEnabled,
  setAriaLabel,
  setAriaDescribedBy,
  setAriaLive,
  setRole,
  markAsLandmark,
  subscribe,
  healthCheck,
  info
} from './api.js';

import { VERSION, MODULE_ID, A11Y_FEATURES, ARIA_LIVE_REGIONS, CONTRAST_MODES } from './constants.js';
import {
  createAccessibilityManager,
  getAccessibilityManager,
  init,
  destroy,
  announce,
  setFocus,
  trapFocus,
  releaseFocus,
  setContrastMode,
  setTextScale,
  enableFeature,
  disableFeature,
  isFeatureEnabled,
  setAriaLabel,
  setAriaDescribedBy,
  setAriaLive,
  setRole,
  markAsLandmark,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  A11Y_FEATURES,
  ARIA_LIVE_REGIONS,
  CONTRAST_MODES,
  createAccessibilityManager,
  getAccessibilityManager,
  init,
  destroy,
  announce,
  setFocus,
  trapFocus,
  releaseFocus,
  setContrastMode,
  setTextScale,
  enableFeature,
  disableFeature,
  isFeatureEnabled,
  setAriaLabel,
  setAriaDescribedBy,
  setAriaLive,
  setRole,
  markAsLandmark,
  subscribe,
  healthCheck,
  info
};
