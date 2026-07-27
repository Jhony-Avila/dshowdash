import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { LOTTIE_EVENTS } from "/core/runtime/events/catalog/lottie.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-lotties-management.state.store";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const initialState = {
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
let _state = Object.assign({}, initialState);
const _subscribers = [];
function _notify() {
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](_state);
    } catch (e) {
    }
  }
}
const state = {
  getState() {
    return Object.assign({}, _state);
  },
  setLotties(lotties) {
    _state.lotties = lotties;
    _state.lastUpdate = Date.now();
    _notify();
  },
  setComponents(components) {
    _state.components = components;
    _state.lastUpdate = Date.now();
    _notify();
  },
  setAssignments(assignments) {
    _state.assignments = Object.assign({}, _state.assignments, assignments);
    _state.lastUpdate = Date.now();
    _notify();
  },
  assignLottie(componentId, lottieId) {
    _initPorts();
    _state.assignments[componentId] = lottieId;
    _state.lastUpdate = Date.now();
    _notify();
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(LOTTIE_EVENTS.ASSIGNED, { componentId, lottieId });
    }
  },
  unassignLottie(componentId) {
    _initPorts();
    delete _state.assignments[componentId];
    _state.lastUpdate = Date.now();
    _notify();
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(LOTTIE_EVENTS.UNASSIGNED, { componentId });
    }
  },
  setSelectedLottie(lottieId) {
    _state.selectedLottie = lottieId;
    _notify();
  },
  setSelectedComponent(componentId) {
    _state.selectedComponent = componentId;
    _notify();
  },
  setPreview(lottieId) {
    _state.previewActive = !!lottieId;
    _state.previewLottie = lottieId;
    _notify();
  },
  clearPreview() {
    _state.previewActive = false;
    _state.previewLottie = null;
    _notify();
  },
  setLoading(loading) {
    _state.loading = loading;
    _notify();
  },
  setError(error) {
    _state.error = error;
    _notify();
  },
  subscribe(fn) {
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
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
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
var store_default = { state, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  store_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  state
};
