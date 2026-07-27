// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accessibility-manager.state.store
// PURPOSE: State management for accessibility settings
// ───────────────────────────────────────────────────────────────
// @contract GET_STATE - getState() returns current accessibility state
// @contract GET_SETTINGS - getSettings() returns accessibility settings
// @contract UPDATE_SETTINGS - updateSettings(settings) updates accessibility settings
// @contract SUBSCRIBE - subscribe(fn) registers state change listener
// @contract GET_METADATA - getMetadata() returns store metadata
// @contract TO_JSON - toJSON() returns serializable state
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: getState, getSettings, updateSettings, subscribe, getMetadata, toJSON,
//           healthCheck, info, getVersion, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accessibility-manager.state.store';

let _state = {
  enabled: true,
  settings: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    fontSize: 'normal'
  }
};

let _subscribers: Array<(state: unknown) => void> = [];

const _metadata: { createdAt: number; lastUpdated: number | null; updateCount: number } = {
  createdAt: Date.now(),
  lastUpdated: null,
  updateCount: 0
};

function _notify() {
  for (const fn of _subscribers) {
    try {
      fn(_state);
    } catch (e) {
      /* ignore subscriber errors */
    }
  }
}

export function getState() {
  return { ..._state };
}

export function getSettings() {
  return { ..._state.settings };
}

export function updateSettings(settings: Record<string, unknown>) {
  _state.settings = { ..._state.settings, ...settings };
  _metadata.lastUpdated = Date.now();
  _metadata.updateCount++;
  _notify();
  return true;
}

export function subscribe(fn: (state: unknown) => void) {
  if (typeof fn === 'function') {
    _subscribers.push(fn);
  }
  return () => {
    _subscribers = _subscribers.filter(s => s !== fn);
  };
}

export function getMetadata() {
  return { ..._metadata };
}

export function toJSON() {
  return {
    state: getState(),
    metadata: getMetadata()
  };
}

export function getVersion() {
  return VERSION;
}

export function healthCheck() {
  const checks = {
    hasState: !!_state,
    enabled: _state.enabled,
    hasSettings: !!_state.settings
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    settings: _state.settings,
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
    enabled: _state.enabled,
    settings: _state.settings,
    metadata: getMetadata(),
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}

export default {
  getState,
  getSettings,
  updateSettings,
  subscribe,
  getMetadata,
  toJSON,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
