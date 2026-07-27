// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panels
// PURPOSE: Container-Main Panels Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AVAILABLE_PANELS — exported value
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:panels';

// Video Panel
export * from './video-panel.js';

// Chart Panel
export * from './chart-panel.js';

// Stream Panel
export * from './stream-panel.js';

// Lista de painéis disponíveis
export const AVAILABLE_PANELS = [
  'video-panel',
  'chart-panel',
  'stream-panel'
];

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    panels: AVAILABLE_PANELS
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    panelCount: AVAILABLE_PANELS.length
  };
}

export default {
  VERSION, MODULE_ID,
  AVAILABLE_PANELS,
  info, healthCheck
};
