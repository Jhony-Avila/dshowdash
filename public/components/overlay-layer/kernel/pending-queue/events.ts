// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   config, refs from ./state.js
//
// PROVIDES:
//   emit() — exported function
//   inject() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   overlay:mode-change
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from './constants.js';
import { config, refs } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';

export function emit(event: string, data: DynObj) {
  if (refs.eventBus?.emit) {
    refs.eventBus.emit(event, { ...data, moduleId: MODULE_ID, timestamp: Date.now() });
  }
}

export function inject(dependencies: DynObj) {
  if (dependencies.openOverlay) refs.openOverlay = dependencies.openOverlay;
  if (dependencies.canOpenOverlay) refs.canOpenOverlay = dependencies.canOpenOverlay;
  if (dependencies.eventBus) refs.eventBus = dependencies.eventBus;
  
  if (config.processOnModeChange && refs.eventBus?.on) {
    refs.eventBus.on('overlay:mode-change', () => {
      if (config.autoProcess) {
        // Will be called from process module
        import('./process.js').then(m => m.process());
      }
    });
  }
}
