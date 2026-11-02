
// Timeline Panel - Main Module (Orquestrador)
// DEPENDENCY CONTRACT — BARREL FILE
// @version 1.1.0-ENTERPRISE
// @changelog v1.1.0-ENTERPRISE - Added healthCheck()
// Refatorado em módulos por responsabilidade
'use strict';

import { MODULE_ID as CONST_MODULE_ID } from './constants.js';

// @ts-expect-error TS migration - TS2305
import { localState, resetState } from './state.js';
import { render } from './render.js';

// @ts-expect-error TS migration - TS2305
import { handleClick, handleInput, handleNewEvent } from './handlers.js';
import { injectStyles } from './styles.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = CONST_MODULE_ID;

export function mount(container: HTMLElement, options: Record<string, unknown> = {}) {
  if (!container) return { success: false, error: 'Container required' };
  localState.container = container;
  localState.eventTimeline = options.eventTimeline || window.EventTimeline;
  if (localState.eventTimeline?.getEvents) { localState.events = localState.eventTimeline.getEvents(); }
  if (localState.eventTimeline?.subscribe) { localState.unsubscribe = localState.eventTimeline.subscribe(handleNewEvent); }
  localState.container.addEventListener('click', handleClick);
  localState.container.addEventListener('input', handleInput);
  (render as any)();
  injectStyles();
  return { success: true, eventCount: localState.events.length };
}

export function unmount() {
  if (localState.unsubscribe) { localState.unsubscribe(); }
  if (localState.container) {
    localState.container.removeEventListener('click', handleClick);
    localState.container.removeEventListener('input', handleInput);
    localState.container.innerHTML = '';
  }
  resetState();
}

export function refresh() {
  if (localState.eventTimeline?.getEvents) { localState.events = localState.eventTimeline.getEvents(); }
  (render as any)();
}

export function healthCheck() {
  const mounted = !!localState.container;
  const hasEventTimeline = !!localState.eventTimeline;
  const checks = { mounted, hasEventTimeline, hasEvents: localState.events.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 2 ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mounted: !!localState.container,
    eventCount: localState.events.length,
    paused: localState.paused,
    filters: { ...localState.filters }
  };
}

export default Object.freeze({ VERSION, MODULE_ID, mount, unmount, refresh, healthCheck, info });
