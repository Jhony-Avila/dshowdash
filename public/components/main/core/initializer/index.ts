// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Initializer - Setup inicial do Main
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, MAIN_CONTAINER_EVENTS, PANEL_HOME_PATH from ./constants.js
//   initializeMain from ./core/main-init.js
//   bootstrapPrimaryContainer from ./bootstrap/container-bootstrap.js
//   createPlaceholder from ./ui/placeholder.js
//   unmountPanelHome, isPanelHomeMounted from ./panel-home/panel-home-manager.js
//   getMetrics, info, healthCheck from ./diagnostics/health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MAIN_CONTAINER_EVENTS — exported value
//   PANEL_HOME_PATH — exported value
//   initializeMain — exported value
//   bootstrapPrimaryContainer — exported value
//   createPlaceholder — exported value
//   unmountPanelHome — exported value
//   isPanelHomeMounted — exported value
//   getMetrics — exported value
//   info — exported value
//   healthCheck — exported value
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

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION, MODULE_ID, MAIN_CONTAINER_EVENTS, PANEL_HOME_PATH } from './constants.js';
import { initializeMain } from './core/main-init.js';
import { bootstrapPrimaryContainer } from './bootstrap/container-bootstrap.js';
import { createPlaceholder } from './ui/placeholder.js';
import { unmountPanelHome, isPanelHomeMounted } from './panel-home/panel-home-manager.js';
import { getMetrics, info, healthCheck } from './diagnostics/health.js';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { VERSION, MODULE_ID, MAIN_CONTAINER_EVENTS, PANEL_HOME_PATH };
export { initializeMain };
export { bootstrapPrimaryContainer };
export { createPlaceholder };
export { unmountPanelHome, isPanelHomeMounted };
export { getMetrics, info, healthCheck };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  initializeMain,
  bootstrapPrimaryContainer,
  createPlaceholder,
  unmountPanelHome,
  isPanelHomeMounted,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  MAIN_CONTAINER_EVENTS,
  PANEL_HOME_PATH
};
