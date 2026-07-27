// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-07.state.store
// PURPOSE: Reactive state management for Card 07 with lock support
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
// @changelog v8.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.3.0-P17WI: Initial version with prototype pattern
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STATES } from '../core/constants.js';

export const VERSION = '8.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-07.state.store';

export function CardState(this: any, cardId: string) {
  this.cardId = cardId;
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
  this._listeners = [];
}

CardState.prototype.withLock = function(operation: string, callback: () => unknown) {
  const self = this;
  if (self.locked) { return Promise.resolve(); }
  self.locked = true;
  return Promise.resolve().then(callback).finally(() => { self.locked = false; });
};

CardState.prototype.setState = function(newState: string, data?: unknown) {
  const oldState = this.state;
  this.state = newState;
  if (newState === STATES.SUCCESS) { this.data = data; this.error = null; }
  else if (newState === STATES.ERROR) { this.error = data; }
  this._notify({ oldState, newState, data });
};

CardState.prototype.getState = function() {
  return { cardId: this.cardId, state: this.state, data: this.data, error: this.error, locked: this.locked };
};

CardState.prototype.is = function(state: string) { return this.state === state; };
CardState.prototype.isLoading = function() { return this.state === STATES.LOADING; };
CardState.prototype.isSuccess = function() { return this.state === STATES.SUCCESS; };
CardState.prototype.isError = function() { return this.state === STATES.ERROR; };
CardState.prototype.isPaused = function() { return this.state === STATES.PAUSED; };

CardState.prototype.reset = function() {
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
  this._notify({ reset: true });
};

CardState.prototype.subscribe = function(fn: (state: unknown) => void) {
  const self = this;
  this._listeners.push(fn);
  return () => { self._listeners = self._listeners.filter((l: unknown) => l !== fn); };
};

CardState.prototype._notify = function(event: unknown) {
  const self = this;
  this._listeners.forEach((fn: (...args: unknown[]) => void) => { try { fn(self.getState(), event); } catch (e) {} });
};

CardState.prototype.destroy = function() {
  this._listeners = [];
  this.state = STATES.IDLE;
  this.data = null;
  this.error = null;
  this.locked = false;
};

export function createStore(cardId: string) { return new (CardState as any)(cardId); }

export function healthCheck() { const checks = { createStoreReady: typeof createStore === 'function', cardStateReady: typeof CardState === 'function' }; const allOk = Object.values(checks).every(Boolean); return { status: allOk ? 'HEALTHY' : 'DEGRADED', checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['CardState', 'createStore'], timestamp: Date.now() }; }

export default { CardState, createStore };
