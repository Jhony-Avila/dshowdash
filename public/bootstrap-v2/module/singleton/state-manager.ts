// Singleton State Manager
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   SINGLETON_KEY, SINGLETON_STATES from ../constants.js
//   logWarn from ../utils/index.js
// WINDOW ACCESS:
//   window[SINGLETON_KEY] — LEGÍTIMO: singleton state for boot guard
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SINGLETON_KEY, SINGLETON_STATES } from '../constants.js';
import { logWarn } from '../utils/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.singleton.state-manager';

interface SingletonState {
  state: string;
  startCount: number;
  timestamp: number | null;
  bootLoopDetected: boolean;
  [key: string]: unknown;
}

function getWindowState(): SingletonState | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as Record<string, unknown>)[SINGLETON_KEY] as SingletonState | undefined;
}

function setWindowState(state: SingletonState): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[SINGLETON_KEY] = state;
}

export function initSingletonState() {
  if (typeof window === 'undefined') return;

  const current = getWindowState();
  if (!current) {
    setWindowState({
      state: SINGLETON_STATES.IDLE,
      startCount: 0,
      timestamp: null,
      bootLoopDetected: false
    });
  } else if (
    current.state === SINGLETON_STATES.RUNNING ||
    current.state === SINGLETON_STATES.COMPLETED
  ) {

    // @ts-expect-error TS migration - TS2554
    logWarn('Bootstrap already ' + current.state + ', blocking duplicate execution');
  }
}

export function getSingletonState(): SingletonState | null {
  const state = getWindowState();
  return state || null;
}

export function setSingletonState(updates: Partial<SingletonState>) {
  const current = getWindowState();
  if (!current) return;

  for (const key in updates) {
    if (updates.hasOwnProperty(key)) {
      current[key] = updates[key];
    }
  }
}

export function resetSingletonState() {
  const current = getWindowState();
  if (current) {
    current.state = SINGLETON_STATES.IDLE;
    current.bootLoopDetected = false;
  }
}

export default { initSingletonState, getSingletonState, setSingletonState, resetSingletonState };
