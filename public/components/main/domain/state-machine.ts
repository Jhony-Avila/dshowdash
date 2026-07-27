// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-state-machine
// PURPOSE: StateMachine - Máquina de Estados Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STATES — exported value
//   createStateMachine() — exported function
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

export const VERSION = '9.0.0-P1-HEX';
export const MODULE_ID = 'main-state-machine';

export const STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  NAVIGATING: 'navigating',
  LOADING_PANEL: 'loading-panel',
  MOUNTING: 'mounting',
  UNMOUNTING: 'unmounting',
  ERROR: 'error',
  RECOVERING: 'recovering',
  DESTROYED: 'destroyed'
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  [STATES.IDLE]: [STATES.INITIALIZING],
  [STATES.INITIALIZING]: [STATES.READY, STATES.ERROR],
  [STATES.READY]: [STATES.NAVIGATING, STATES.DESTROYED, STATES.ERROR],
  [STATES.NAVIGATING]: [STATES.LOADING_PANEL, STATES.READY, STATES.ERROR, STATES.UNMOUNTING],
  [STATES.LOADING_PANEL]: [STATES.MOUNTING, STATES.ERROR, STATES.READY],
  [STATES.MOUNTING]: [STATES.READY, STATES.ERROR],
  [STATES.UNMOUNTING]: [STATES.READY, STATES.NAVIGATING, STATES.DESTROYED, STATES.LOADING_PANEL],
  [STATES.ERROR]: [STATES.READY, STATES.RECOVERING, STATES.DESTROYED],
  [STATES.RECOVERING]: [STATES.READY, STATES.ERROR, STATES.DESTROYED],
  [STATES.DESTROYED]: [] as string[]
};

const STATE_TIMEOUTS = {
  [STATES.NAVIGATING]: 15000,
  [STATES.LOADING_PANEL]: 10000,
  [STATES.MOUNTING]: 5000,
  [STATES.UNMOUNTING]: 3000,
  [STATES.RECOVERING]: 10000
};

export class StateMachine {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this._state = STATES.IDLE;
    this._history = [];
    this._listeners = new Set();
    this._guards = new Map();
    this._effects = new Map();
    this._timeoutId = null;
    this._stateEnteredAt = Date.now();
    this._enableTimeouts = options.enableTimeouts !== false;
    this._timerPort = options.timerPort || null;
    
    this._metrics = {
      transitions: 0, invalidAttempts: 0, guardBlocks: 0,
      timeouts: 0, errorTransitions: 0, recoveries: 0, timeInStates: {}
    };
    
    Object.values(STATES).forEach(s => this._metrics.timeInStates[s] = 0);
  }

  // P1-HEX: Timer helpers using TimerPort
  _setTimeout(fn: (...args: unknown[]) => unknown, ms: number) {
    if (this._timerPort?.setTimeout) return this._timerPort.setTimeout(fn, ms);
    return setTimeout(fn, ms);
  }
  
  _clearTimeout(id: string) {
    if (id === null || id === undefined) return;
    if (this._timerPort?.clearTimeout) return this._timerPort.clearTimeout(id);
    return clearTimeout(id);
  }

  get state() { return this._state; }

  canTransition(to: string) { return VALID_TRANSITIONS[this._state]?.includes(to) ?? false; }
  
  addGuard(from: string, to: string, guardFn: (ctx: Record<string, unknown>) => boolean | Promise<boolean>) {
    const key = `${from}:${to}`;
    if (!this._guards.has(key)) this._guards.set(key, []);
    this._guards.get(key).push(guardFn);
    return () => {
      const guards = this._guards.get(key);
      if (guards) {
        const idx = guards.indexOf(guardFn);
        if (idx > -1) guards.splice(idx, 1);
      }
    };
  }
  
  addEffect(state: string, effectFn: (ctx: Record<string, unknown>) => void) {
    if (!this._effects.has(state)) this._effects.set(state, []);
    this._effects.get(state).push(effectFn);
    return () => {
      const effects = this._effects.get(state);
      if (effects) {
        const idx = effects.indexOf(effectFn);
        if (idx > -1) effects.splice(idx, 1);
      }
    };
  }
  
  async _runGuards(from: string, to: string) {
    const key = `${from}:${to}`;
    const guards = this._guards.get(key) || [];
    for (const guard of guards) {
      try {
        const result = await guard({ from, to });
        if (result === false) { this._metrics.guardBlocks++; return false; }
      } catch (e) { return false; }
    }
    return true;
  }
  
  _runEffects(state: string, context: Record<string, unknown>) {
    const effects = this._effects.get(state) || [];
    effects.forEach((effect: (ctx: Record<string, unknown>) => void) => { try { effect(context); } catch (e) {} });
  }
  
  _clearTimeoutInternal() {
    this._clearTimeout(this._timeoutId);
    this._timeoutId = null;
  }
  
  // P1-HEX: Use TimerPort for state timeouts
  _setupTimeout(state: string) {
    this._clearTimeoutInternal();
    if (!this._enableTimeouts) return;
    // @ts-expect-error strict migration — TS7053
    const timeout = STATE_TIMEOUTS[state];
    if (timeout) {
      this._timeoutId = this._setTimeout(() => {
        this._metrics.timeouts++;
        this.transition(STATES.ERROR, { reason: 'timeout', state, timeout });
      }, timeout);
    }
  }
  
  _updateTimeInState(from: string) {
    const now = Date.now();
    const duration = now - this._stateEnteredAt;
    this._metrics.timeInStates[from] = (this._metrics.timeInStates[from] || 0) + duration;
    this._stateEnteredAt = now;
  }

  async transition(to: string, context: Record<string, unknown> = {}) {
    if (!this.canTransition(to)) { this._metrics.invalidAttempts++; return false; }
    const from = this._state;
    const canProceed = await this._runGuards(from, to);
    if (!canProceed) return false;
    this._updateTimeInState(from);
    if (to === STATES.ERROR) this._metrics.errorTransitions++;
    if (to === STATES.RECOVERING) this._metrics.recoveries++;
    this._state = to;
    this._history.push({ from, to, timestamp: Date.now(), context });
    if (this._history.length > 100) this._history.shift();
    this._metrics.transitions++;
    this._setupTimeout(to);
    this._runEffects(to, { from, to, context });
    this._listeners.forEach((fn: (...args: unknown[]) => unknown) => { try { fn({ from, to, context }); } catch(e) {} });
    return true;
  }
  
  transitionSync(to: string, context: Record<string, unknown> = {}) {
    if (!this.canTransition(to)) { this._metrics.invalidAttempts++; return false; }
    const from = this._state;
    this._updateTimeInState(from);
    if (to === STATES.ERROR) this._metrics.errorTransitions++;
    if (to === STATES.RECOVERING) this._metrics.recoveries++;
    this._state = to;
    this._history.push({ from, to, timestamp: Date.now(), context });
    if (this._history.length > 100) this._history.shift();
    this._metrics.transitions++;
    this._setupTimeout(to);
    this._runEffects(to, { from, to, context });
    this._listeners.forEach((fn: (...args: unknown[]) => unknown) => { try { fn({ from, to, context }); } catch(e) {} });
    return true;
  }

  onTransition(handler: (...args: unknown[]) => void) {
    if (typeof handler === 'function') {
      this._listeners.add(handler);
      return () => this._listeners.delete(handler);
    }
    return () => {};
  }
  
  // P1-HEX: waitFor uses TimerPort
  waitFor(targetState: string, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (this._state === targetState) { resolve(this._state); return; }
      const timeoutId = this._setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for state: ${targetState}`));
      }, timeoutMs);
      const cleanup = this.onTransition((transition: unknown) => {
        const toState = (transition as Record<string, unknown>).to;
        if (toState === targetState) {
          this._clearTimeout(timeoutId);
          cleanup();
          resolve(toState);
        }
      });
    });
  }
  
  getTimeInCurrentState() { return Date.now() - this._stateEnteredAt; }
  isNavigating() { return [STATES.NAVIGATING, STATES.LOADING_PANEL, STATES.MOUNTING, STATES.UNMOUNTING].includes(this._state); }
  isInErrorState() { return [STATES.ERROR, STATES.RECOVERING].includes(this._state); }

  reset() {
    this._clearTimeoutInternal();
    this._state = STATES.IDLE;
    this._history = [];
    this._stateEnteredAt = Date.now();
  }
  
  destroy() {
    this._clearTimeoutInternal();
    this._listeners.clear();
    this._guards.clear();
    this._effects.clear();
    this._state = STATES.DESTROYED;
  }

  getHistory(limit = 20) { return this._history.slice(-limit); }
  
  getMetrics() { 
    return { 
      ...this._metrics, currentState: this._state, timeInCurrentState: this.getTimeInCurrentState(),
      listenerCount: this._listeners.size, guardsCount: this._guards.size, effectsCount: this._effects.size
    }; 
  }

  info() {
    return {
      version: VERSION, moduleId: MODULE_ID, state: this._state,
      isNavigating: this.isNavigating(), isInErrorState: this.isInErrorState(),
      timeInCurrentState: this.getTimeInCurrentState(), historyLength: this._history.length,
      metrics: this.getMetrics(), p1HexCompliant: true
    };
  }

  healthCheck() {
    const validState = Object.values(STATES).includes(this._state);
    const isError = this._state === STATES.ERROR;
    const isDestroyed = this._state === STATES.DESTROYED;
    const stuckInState = this.getTimeInCurrentState() > 30000 && this.isNavigating();
    const errorRate = this._metrics.transitions > 0 ? (this._metrics.errorTransitions / this._metrics.transitions) * 100 : 0;
    let status = 'HEALTHY';
    if (!validState || isDestroyed) status = 'UNHEALTHY';
    else if (isError || stuckInState || errorRate > 30) status = 'DEGRADED';
    return {
      status, version: VERSION, moduleId: MODULE_ID,
      checks: { validState, currentState: this._state, isError, isDestroyed, stuckInState, errorRate: `${Math.round(errorRate)}%`, timeInCurrentState: `${Math.round(this.getTimeInCurrentState() / 1000)}s` },
      metrics: this.getMetrics(), p1HexCompliant: true
    };
  }
}

export function createStateMachine(options: Record<string, unknown>) { return new StateMachine(options); }
export default { StateMachine, createStateMachine, STATES, VERSION, MODULE_ID };
