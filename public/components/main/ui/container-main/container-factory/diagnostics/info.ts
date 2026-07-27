// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: info
// PURPOSE: Info Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//
// PROVIDES:
//   info() — exported function
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

import { VERSION, MODULE_ID } from '../constants.js';

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    description: 'Unified Container Factory - Single Source of Truth',
    methods: ['createContainer'],
    features: [
      'controls', 'header', 'errorBoundary', 'eventHooks', 'configPresets',
      'contextMenu', 'keyboard', 'drag', 'resize', 'breadcrumb', 'splitView',
      'notificationBadge', 'statePersistence', 'toolbar', 'searchBox',
      'progressBar', 'toast', 'snapDock', 'zoomControls', 'accessibility', 'debugPanel'
    ]
  };
}

export default { info };
