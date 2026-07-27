// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-09.state.store
// PURPOSE: Reactive state management for Card 09 with lock support
// ───────────────────────────────────────────────────────────────
// @contract STATE_MACHINE - setState/getState/is/isLoading/isSuccess/isError/isPaused
// @contract SUBSCRIPTION - subscribe(fn) returns unsubscribe function
// @contract LOCK - withLock(operation, callback) prevents concurrent mutations
// @contract RESET - reset() clears state to IDLE
// @contract CLEANUP - destroy() clears all listeners and resets state
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: STATES from ../core/constants.js
// PROVIDES: CardState, createStore, VERSION, MODULE_ID, healthCheck(), info()
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ENTERPRISE: ES6 class conversion, Set for listeners
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STATES } from '../core/constants.js';

export const VERSION = '8.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-09.state.store';

export class CardState {
  [key: string]: any;
  constructor(cardId: string) {
    this.cardId = cardId;
    this.state = STATES.IDLE;
    this.data = null;
    this.error = null;
    this.locked = false;
    this._listeners = new Set();
  }

  withLock(operation: string, callback: () => unknown) {
    if (this.locked) return Promise.resolve();
    this.locked = true;
    return Promise.resolve().then(callback).finally(() => { this.locked = false; });
  }

  setState(newState: string, data?: unknown) {
    const oldState = this.state;
    this.state = newState;
    if (newState === STATES.SUCCESS) { this.data = data; this.error = null; }
    else if (newState === STATES.ERROR) { this.error = data; }
    this._notify({ oldState, newState, data });
  }

  getState() {
    return {
      cardId: this.cardId,
      state: this.state,
      data: this.data,
      error: this.error,
      locked: this.locked
    };
  }

  is(state: string) { return this.state === state; }
  isLoading() { return this.state === STATES.LOADING; }
  isSuccess() { return this.state === STATES.SUCCESS; }
  isError() { return this.state === STATES.ERROR; }
  isPaused() { return this.state === STATES.PAUSED; }

  reset() {
    this.state = STATES.IDLE;
    this.data = null;
    this.error = null;
    this.locked = false;
    this._notify({ reset: true });
  }

  subscribe(fn: (state: unknown) => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify(event: unknown) {
    this._listeners.forEach((fn: (...args: unknown[]) => void) => {
      try { fn(this.getState(), event); } catch {}
    });
  }
  destroy() { this._listeners.clear(); this.state = STATES.IDLE; this.data = null; this.error = null; this.locked = false; }
}

export const createStore = (cardId: string) => new CardState(cardId);

export function healthCheck() { const checks = { createStoreReady: typeof createStore === 'function', cardStateReady: typeof CardState === 'function' }; const allOk = Object.values(checks).every(Boolean); return { status: allOk ? 'HEALTHY' : 'DEGRADED', checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  exports: ['CardState', 'createStore'],
  timestamp: Date.now()
});

export default { CardState, createStore };
