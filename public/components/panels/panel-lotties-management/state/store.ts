// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management.state.store
// PURPOSE: Panel Lotties Management - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LOTTIE_EVENTS from /core/runtime/events/catalog/lottie.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   state — exported value
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LOTTIE_EVENTS.ASSIGNED
//   LOTTIE_EVENTS.UNASSIGNED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LOTTIE_EVENTS } from '/core/runtime/events/catalog/lottie.events.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-lotties-management.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

interface LottieItem {
  id: string;
  file: string;
  name: string;
  description: string;
}

interface ComponentItem {
  id: string;
  name: string;
  slot: string;
  current: string | null;
}

interface StoreState {
  lotties: LottieItem[];
  components: ComponentItem[];
  assignments: Record<string, string>;
  selectedLottie: string | null;
  selectedComponent: string | null;
  previewActive: boolean;
  previewLottie: string | null;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
}

const initialState: StoreState = {
  lotties: [],
  components: [],
  assignments: {},
  selectedLottie: null,
  selectedComponent: null,
  previewActive: false,
  previewLottie: null,
  loading: false,
  error: null,
  lastUpdate: null
};

let _state: StoreState = Object.assign({}, initialState);
const _subscribers: Array<(state: StoreState) => void> = [];

function _notify() {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](_state); } catch (e) {}
  }
}

const state = {
  getState() { return Object.assign({}, _state); },
  
  setLotties(lotties: LottieItem[]) {
    _state.lotties = lotties;
    _state.lastUpdate = Date.now();
    _notify();
  },
  
  setComponents(components: ComponentItem[]) {
    _state.components = components;
    _state.lastUpdate = Date.now();
    _notify();
  },
  
  setAssignments(assignments: Record<string, string>) {
    _state.assignments = Object.assign({}, _state.assignments, assignments);
    _state.lastUpdate = Date.now();
    _notify();
  },
  
  assignLottie(componentId: string, lottieId: string) {
    _initPorts();
    _state.assignments[componentId] = lottieId;
    _state.lastUpdate = Date.now();
    _notify();
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit(LOTTIE_EVENTS.ASSIGNED, { componentId, lottieId });
    }
  },
  
  unassignLottie(componentId: string) {
    _initPorts();
    delete _state.assignments[componentId];
    _state.lastUpdate = Date.now();
    _notify();
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit(LOTTIE_EVENTS.UNASSIGNED, { componentId });
    }
  },
  
  setSelectedLottie(lottieId: string | null) {
    _state.selectedLottie = lottieId;
    _notify();
  },
  
  setSelectedComponent(componentId: string | null) {
    _state.selectedComponent = componentId;
    _notify();
  },
  
  setPreview(lottieId: string | null) {
    _state.previewActive = !!lottieId;
    _state.previewLottie = lottieId;
    _notify();
  },
  
  clearPreview() {
    _state.previewActive = false;
    _state.previewLottie = null;
    _notify();
  },
  
  setLoading(loading: boolean) {
    _state.loading = loading;
    _notify();
  },
  
  setError(error: string | null) {
    _state.error = error;
    _notify();
  },
  
  subscribe(fn: (state: StoreState) => void) {
    _subscribers.push(fn);
    return () => {
      const idx = _subscribers.indexOf(fn);
      if (idx > -1) _subscribers.splice(idx, 1);
    };
  },
  
  reset() {
    _state = Object.assign({}, initialState);
    _notify();
  }
};

function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    subscriberCount: _subscribers.length,
    hasState: !!_state,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state: state.getState(),
    subscriberCount: _subscribers.length,
    portsInitialized: Ports.isInitialized()
  };
}

export { state, healthCheck, info, VERSION, MODULE_ID };
export default { state, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
