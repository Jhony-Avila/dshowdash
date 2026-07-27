// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Loading Progress - Trickle Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOADING_STATES from ../constants.js
//
// PROVIDES:
//   startTrickle() — exported function
//   stopTrickle() — exported function
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

import { LOADING_STATES } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.loading-progress.trickle.manager';

export function startTrickle(state: Record<string, unknown>, config: Record<string, unknown>, setProgress: unknown, getProgress: unknown) {
  if (state.trickleInterval) return;
  
  state.trickleInterval = setInterval(() => {
    if (state.loadingState !== LOADING_STATES.LOADING) {
      stopTrickle(state);
      return;
    }
    
    const currentProgress = (getProgress as (...args: unknown[]) => unknown)();
    let amount = config.trickleAmount;
    if ((currentProgress as number) > 80) amount = 0.5;
    else if ((currentProgress as number) > 60) amount = 1;
    else if ((currentProgress as number) > 40) amount = 1.5;
    
    const newProgress = Math.min(95, (currentProgress as number) + (amount as number) * Math.random());
    (setProgress as (...args: unknown[]) => unknown)(newProgress);
  // @ts-expect-error TS migration - TS2769
  }, config.trickleSpeed);
}

export function stopTrickle(state: Record<string, unknown>) {
  if (state.trickleInterval) {
    // @ts-expect-error TS migration - TS2769
    clearInterval(state.trickleInterval);
    state.trickleInterval = null;
  }
}
