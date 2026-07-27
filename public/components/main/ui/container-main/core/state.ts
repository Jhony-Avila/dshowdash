// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:state
// PURPOSE: container-main/core/state.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_MAIN_EVENTS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStateProxy() — exported function
//   createStateEmitter() — exported function
//   getInitialState() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CONTAINER_MAIN_EVENTS.STATE_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_MAIN_EVENTS } from './constants.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-main:state';

export function createStateProxy(initialState: Record<string, unknown>, containerId: string, onStateChange: (prop: string, value: unknown, oldValue: unknown, containerId: string) => void) {
  const state = { ...initialState };
  return new Proxy(state, {
    set(target, prop, value) {
      const key = String(prop);
      const oldValue = target[key];
      target[key] = value;
      if (oldValue !== value && typeof onStateChange === 'function') { onStateChange(key, value, oldValue, containerId); }
      return true;
    }
  });
}

export function createStateEmitter(eventBridge: { emit: (event: string, data: Record<string, unknown>) => void }, containerId: string) {
  return function emitStateChanged(state: Record<string, unknown>) {
    eventBridge.emit(CONTAINER_MAIN_EVENTS.STATE_CHANGED, {
      containerId,
      state: { mounted: state.mounted || false, collapsed: state.collapsed || false, fullscreen: state.fullscreen || false, minimized: state.minimized || false, loading: state.loading || false, attachMode: state.attachMode || false }
    });
  };
}

export function getInitialState(isAttachMode = false) {
  return { mounted: false, collapsed: false, fullscreen: false, minimized: false, loading: false, error: null as Record<string, unknown> | null, attachMode: isAttachMode };
}

export function healthCheck() {
  const checks = { proxySupported: typeof Proxy !== 'undefined', stateReady: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, proxySupported: typeof Proxy !== 'undefined', initialStateKeys: Object.keys(getInitialState()) };
}
