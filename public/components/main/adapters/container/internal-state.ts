// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-internal-state
// PURPOSE: Container Internal State - Estado Interno Compartilhado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATE, POLICY, BUDGET from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getContainers() — exported function
//   getContainerApis() — exported function
//   getListeners() — exported function
//   getPolicy() — exported function
//   getActiveId() — exported function
//   getSlotsCreated() — exported function
//   getGenerationToken() — exported function
//   getAdapterState() — exported function
//   getMetrics() — exported function
//   setPolicy() — exported function
//   setActiveId() — exported function
//   setSlotsCreated() — exported function
//   incrementGenerationToken() — exported function
//   setAdapterState() — exported function
//   incrementCreated() — exported function
//   incrementDestroyed() — exported function
//   incrementRecoveries() — exported function
//   incrementRollbacks() — exported function
//   ... and 5 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STATE, POLICY, BUDGET } from './constants.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-internal-state';

// Estado compartilhado
const _containers = new Map();
const _containerApis = new Map();
const _listeners = new Map();

let _policy: string = POLICY.EPHEMERAL;
let _activeContainerId: string | null = null;
let _slotsCreated = false;
let _generationToken = 0;
let _adapterState: string = STATE.READY;

const _metrics = {
  totalCreated: 0,
  totalDestroyed: 0,
  totalRecoveries: 0,
  totalRollbacks: 0,
  titleUpdates: 0,
  opsThisCycle: 0,
  lastCycleReset: Date.now()
};

// Getters
export function getContainers() { return _containers; }
export function getContainerApis() { return _containerApis; }
export function getListeners() { return _listeners; }
export function getPolicy() { return _policy; }
export function getActiveId() { return _activeContainerId; }
export function getSlotsCreated() { return _slotsCreated; }
export function getGenerationToken() { return _generationToken; }
export function getAdapterState() { return _adapterState; }
export function getMetrics() { return { ..._metrics }; }

// Setters
export function setPolicy(p: string) { _policy = p; }
export function setActiveId(id: string | null) { _activeContainerId = id; }
export function setSlotsCreated(v: boolean) { _slotsCreated = v; }
export function incrementGenerationToken() { return ++_generationToken; }
export function setAdapterState(s: string) { _adapterState = s; }

// Métricas
export function incrementCreated() { _metrics.totalCreated++; }
export function incrementDestroyed() { _metrics.totalDestroyed++; }
export function incrementRecoveries() { _metrics.totalRecoveries++; }
export function incrementRollbacks() { _metrics.totalRollbacks++; }
export function incrementTitleUpdates() { _metrics.titleUpdates++; }

// Budget check
export function checkBudget(operation: string) {
  if (Date.now() - _metrics.lastCycleReset > 1000) {
    _metrics.opsThisCycle = 0;
    _metrics.lastCycleReset = Date.now();
  }
  _metrics.opsThisCycle++;
  if (_metrics.opsThisCycle > BUDGET.MAX_OPS_PER_CYCLE) {

    _adapterState = STATE.DEGRADED;
    return { ok: false, reason: 'ops budget exceeded' };
  }
  if (_containers.size >= BUDGET.MAX_CONTAINERS && operation === 'create') {
    return { ok: false, reason: 'container budget exceeded' };
  }
  return { ok: true };
}

// Listener helpers
export function setupListeners(rootEl: HTMLElement, id: string, handler: EventListener) {
  const toggleBtn = rootEl.querySelector('.dsd-container__toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', handler);
    _listeners.set(id, { element: toggleBtn, type: 'click', handler });
  }
}

export function teardownListeners(id: string) {
  const listenerInfo = _listeners.get(id);
  if (listenerInfo) {
    listenerInfo.element?.removeEventListener?.(listenerInfo.type, listenerInfo.handler);
    _listeners.delete(id);
  }
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      containerCount: _containers.size,
      apiCount: _containerApis.size,
      listenerCount: _listeners.size,
      policy: _policy,
      activeId: _activeContainerId,
      adapterState: _adapterState
    }
  };
}

export default {
  getContainers, getContainerApis, getListeners, getPolicy, getActiveId,
  getSlotsCreated, getGenerationToken, getAdapterState, getMetrics,
  setPolicy, setActiveId, setSlotsCreated, incrementGenerationToken, setAdapterState,
  incrementCreated, incrementDestroyed, incrementRecoveries, incrementRollbacks, incrementTitleUpdates,
  checkBudget, setupListeners, teardownListeners, healthCheck,
  VERSION, MODULE_ID
};
