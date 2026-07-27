// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ABORT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-controller-state
// PURPOSE: NavigationController - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   DEFAULT_TIMEOUT_MS — exported value
//   MAX_INTENT_HISTORY — exported value
//   createState() — exported function
//   addToIntentHistory() — exported function
//   updateTimingMetrics() — exported function
//   cleanup() — exported function
//   resetState() — exported function
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

export const MODULE_ID = 'navigation-controller-state';
export const VERSION = '8.1.0-ABORT-FIX';

export const DEFAULT_TIMEOUT_MS = 10000;
export const MAX_INTENT_HISTORY = 20;

export function createState() {
  return {
    navigating: false,
    abortController: null as string | null,
    timeoutId: null as string | null,
    navigationQueue: [] as unknown[],
    currentNavigation: null as string | null,
    lastValidNavigation: null as string | null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    intentHistory: [] as unknown[],
    cleanups: [] as (() => void)[],
    metrics: {
      navigationsCompleted: 0,
      navigationsFailed: 0,
      navigationsCancelled: 0,
      navigationsQueued: 0,
      navigationsTimedOut: 0,
      navigationsBlocked: 0,
      invalidRoutes: 0,
      intentsReceived: 0,
      intentsFromBroker: 0,
      totalNavigationTime: 0,
      avgNavigationTime: 0,
      lastNavigationTime: 0
    }
  };
}

export function addToIntentHistory(state: Record<string, unknown>, entry: Record<string, unknown>) {
  (state.intentHistory as unknown[]).unshift(entry);
  if ((state.intentHistory as unknown[]).length > MAX_INTENT_HISTORY) {
    (state.intentHistory as unknown[]).pop();
  }
}

export function updateTimingMetrics(state: Record<string, unknown>, navigationTime: number) {
  const m = state.metrics as Record<string, number>;
  m.lastNavigationTime = navigationTime;
  m.totalNavigationTime += navigationTime;
  const totalNavigations = m.navigationsCompleted + 1;
  m.avgNavigationTime = Math.round(m.totalNavigationTime / totalNavigations);
}

export function cleanup(state: Record<string, unknown>) {
  if (state.timeoutId) {
    clearTimeout(state.timeoutId as ReturnType<typeof setTimeout>);
    state.timeoutId = null;
  }
  state.navigating = false;
  state.abortController = null;
  state.currentNavigation = null;
}

export function resetState(state: Record<string, unknown>) {
  state.navigating = false;
  state.abortController = null;
  state.timeoutId = null;
  state.navigationQueue = [];
  state.currentNavigation = null;
  state.intentHistory = [];
}

export default {
  createState,
  addToIntentHistory,
  updateTimingMetrics,
  cleanup,
  resetState,
  DEFAULT_TIMEOUT_MS,
  MAX_INTENT_HISTORY
};
