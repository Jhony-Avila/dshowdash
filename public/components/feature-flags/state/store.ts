// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.state.store
// PURPOSE: In-memory feature flags store with subscriptions and overrides
// ───────────────────────────────────────────────────────────────
// @contract GET_STATE - getState() returns complete store state
// @contract GET_FLAGS - getFlags() returns merged flags (defaults + flags + overrides)
// @contract GET_FLAG - getFlag(key) returns specific flag value
// @contract SET_FLAG - setFlag(key, value) sets flag value
// @contract SET_FLAGS - setFlags(flags) sets multiple flags
// @contract SET_OVERRIDE - setOverride(key, value) sets override value
// @contract REMOVE_OVERRIDE - removeOverride(key) removes specific override
// @contract CLEAR_OVERRIDES - clearOverrides() clears all overrides
// @contract SET_DEFAULTS - setDefaults(defaults) sets default values
// @contract RESET - reset() resets store to initial state
// @contract SUBSCRIBE - subscribe(fn) subscribes to store changes
// @contract TO_JSON - toJSON() exports store state to JSON
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: featureFlagsStore, getState, getFlags, getFlag, setFlag,
//           setFlags, setOverride, removeOverride, clearOverrides,
//           setDefaults, reset, subscribe, toJSON, healthCheck, info,
//           VERSION, MODULE_ID
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-ENTERPRISE-AAA: Added setOverride, removeOverride,
//            clearOverrides, toJSON (NR-FULL P0)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.state.store';

interface StoreState {
  flags: Record<string, unknown>;
  defaults: Record<string, unknown>;
  overrides: Record<string, unknown>;
}

type StoreSubscriber = (event: Record<string, unknown>) => void;

let _state: StoreState = { flags: {}, defaults: {}, overrides: {} };
let _subscribers: StoreSubscriber[] = [];

export function getState() {
  return { ..._state };
}

export function getFlags() {
  return {
    ..._state.defaults,
    ..._state.flags,
    ..._state.overrides
  };
}

export function getFlag(key: string): unknown {
  if (_state.overrides[key] !== undefined) return _state.overrides[key];
  if (_state.flags[key] !== undefined) return _state.flags[key];
  return _state.defaults[key] ?? false;
}

export function setFlag(key: string, value: unknown): boolean {
  _state.flags[key] = value;
  _notify({ action: 'flag-changed', flag: key, value });
  return true;
}

export function setFlags(flags: Record<string, unknown>): boolean {
  _state.flags = { ..._state.flags, ...flags };
  _notify({ action: 'flags-changed', flags: Object.keys(flags) });
  return true;
}

export function setOverride(key: string, value: unknown): boolean {
  _state.overrides[key] = value;
  _notify({ action: 'override-set', flag: key, value });
  return true;
}

export function removeOverride(key: string): boolean {
  if (_state.overrides[key] !== undefined) {
    delete _state.overrides[key];
    _notify({ action: 'override-removed', flag: key });
    return true;
  }
  return false;
}

export function clearOverrides() {
  const count = Object.keys(_state.overrides).length;
  _state.overrides = {};
  _notify({ action: 'overrides-cleared', count });
  return true;
}

export function setDefaults(defaults: Record<string, unknown>): boolean {
  _state.defaults = { ..._state.defaults, ...defaults };
  return true;
}

export function reset() {
  _state = { flags: {}, defaults: {}, overrides: {} };
  _notify({ action: 'reset' });
  return true;
}

export function subscribe(fn: StoreSubscriber): () => void {
  if (typeof fn === 'function') {
    _subscribers.push(fn);
  }
  return () => {
    _subscribers = _subscribers.filter(s => s !== fn);
  };
}

function _notify(event: Record<string, unknown>): void {
  _subscribers.forEach(fn => {
    try {
      fn(event);
    } catch (e) {
      // Silent subscriber error
    }
  });
}

export function toJSON() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    exportedAt: Date.now(),
    state: {
      flags: { ..._state.flags },
      defaults: { ..._state.defaults },
      overrides: { ..._state.overrides }
    },
    computed: {
      allFlags: getFlags(),
      flagCount: Object.keys(_state.flags).length,
      overrideCount: Object.keys(_state.overrides).length,
      defaultCount: Object.keys(_state.defaults).length
    }
  };
}

export function healthCheck() {
  const checks = {
    hasState: _state !== null && typeof _state === 'object',
    hasFlags: typeof _state.flags === 'object',
    hasOverrides: typeof _state.overrides === 'object',
    hasDefaults: typeof _state.defaults === 'object'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    flagCount: Object.keys(_state.flags).length,
    overrideCount: Object.keys(_state.overrides).length,
    subscriberCount: _subscribers.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagCount: Object.keys(_state.flags).length,
    overrideCount: Object.keys(_state.overrides).length,
    subscriberCount: _subscribers.length,
    flags: Object.keys(_state.flags),
    overrides: Object.keys(_state.overrides),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export const featureFlagsStore = {
  getState,
  getFlags,
  getFlag,
  setFlag,
  setFlags,
  setOverride,
  removeOverride,
  clearOverrides,
  setDefaults,
  reset,
  subscribe,
  toJSON,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};

export default featureFlagsStore;
