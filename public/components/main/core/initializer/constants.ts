// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-initializer
// PURPOSE: Initializer - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MAIN_CONTAINER_EVENTS — exported value
//   PANEL_HOME_PATH — exported value
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

export const VERSION = '3.6.0-PATH-FIX';
export const MODULE_ID = 'main-initializer';

export const MAIN_CONTAINER_EVENTS = Object.freeze({
  PRIMARY_READY: 'main.container.primary.ready'
});

export const PANEL_HOME_PATH = '/components/panel-home/index.js';

export default {
  VERSION,
  MODULE_ID,
  MAIN_CONTAINER_EVENTS,
  PANEL_HOME_PATH
};
