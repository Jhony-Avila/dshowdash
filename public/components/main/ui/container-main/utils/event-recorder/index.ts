// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Event Recorder Module - Barrel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RECORDER_STATES — exported value
//   EVENT_TYPES — exported value
//   createEventStore — exported value
//   createListenerSetup — exported value
//   createReplayEngine — exported value
//   createExportManager — exported value
//   createPersistence — exported value
//   createStatsReporter — exported value
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

export { VERSION, MODULE_ID, RECORDER_STATES, EVENT_TYPES } from './constants.js';
export { createEventStore } from './event-store.js';
export { createListenerSetup } from './listener-setup.js';
export { createReplayEngine } from './replay-engine.js';
export { createExportManager } from './export-manager.js';
export { createPersistence } from './persistence.js';
export { createStatsReporter } from './stats-reporter.js';
