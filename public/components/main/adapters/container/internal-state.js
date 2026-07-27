import { STATE, POLICY, BUDGET } from "./constants.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-internal-state";
const _containers = /* @__PURE__ */ new Map();
const _containerApis = /* @__PURE__ */ new Map();
const _listeners = /* @__PURE__ */ new Map();
let _policy = POLICY.EPHEMERAL;
let _activeContainerId = null;
let _slotsCreated = false;
let _generationToken = 0;
let _adapterState = STATE.READY;
const _metrics = {
  totalCreated: 0,
  totalDestroyed: 0,
  totalRecoveries: 0,
  totalRollbacks: 0,
  titleUpdates: 0,
  opsThisCycle: 0,
  lastCycleReset: Date.now()
};
function getContainers() {
  return _containers;
}
function getContainerApis() {
  return _containerApis;
}
function getListeners() {
  return _listeners;
}
function getPolicy() {
  return _policy;
}
function getActiveId() {
  return _activeContainerId;
}
function getSlotsCreated() {
  return _slotsCreated;
}
function getGenerationToken() {
  return _generationToken;
}
function getAdapterState() {
  return _adapterState;
}
function getMetrics() {
  return { ..._metrics };
}
function setPolicy(p) {
  _policy = p;
}
function setActiveId(id) {
  _activeContainerId = id;
}
function setSlotsCreated(v) {
  _slotsCreated = v;
}
function incrementGenerationToken() {
  return ++_generationToken;
}
function setAdapterState(s) {
  _adapterState = s;
}
function incrementCreated() {
  _metrics.totalCreated++;
}
function incrementDestroyed() {
  _metrics.totalDestroyed++;
}
function incrementRecoveries() {
  _metrics.totalRecoveries++;
}
function incrementRollbacks() {
  _metrics.totalRollbacks++;
}
function incrementTitleUpdates() {
  _metrics.titleUpdates++;
}
function checkBudget(operation) {
  if (Date.now() - _metrics.lastCycleReset > 1e3) {
    _metrics.opsThisCycle = 0;
    _metrics.lastCycleReset = Date.now();
  }
  _metrics.opsThisCycle++;
  if (_metrics.opsThisCycle > BUDGET.MAX_OPS_PER_CYCLE) {
    _adapterState = STATE.DEGRADED;
    return { ok: false, reason: "ops budget exceeded" };
  }
  if (_containers.size >= BUDGET.MAX_CONTAINERS && operation === "create") {
    return { ok: false, reason: "container budget exceeded" };
  }
  return { ok: true };
}
function setupListeners(rootEl, id, handler) {
  const toggleBtn = rootEl.querySelector(".dsd-container__toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", handler);
    _listeners.set(id, { element: toggleBtn, type: "click", handler });
  }
}
function teardownListeners(id) {
  const listenerInfo = _listeners.get(id);
  if (listenerInfo) {
    listenerInfo.element?.removeEventListener?.(listenerInfo.type, listenerInfo.handler);
    _listeners.delete(id);
  }
}
function healthCheck() {
  return {
    status: "HEALTHY",
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
var internal_state_default = {
  getContainers,
  getContainerApis,
  getListeners,
  getPolicy,
  getActiveId,
  getSlotsCreated,
  getGenerationToken,
  getAdapterState,
  getMetrics,
  setPolicy,
  setActiveId,
  setSlotsCreated,
  incrementGenerationToken,
  setAdapterState,
  incrementCreated,
  incrementDestroyed,
  incrementRecoveries,
  incrementRollbacks,
  incrementTitleUpdates,
  checkBudget,
  setupListeners,
  teardownListeners,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  checkBudget,
  internal_state_default as default,
  getActiveId,
  getAdapterState,
  getContainerApis,
  getContainers,
  getGenerationToken,
  getListeners,
  getMetrics,
  getPolicy,
  getSlotsCreated,
  healthCheck,
  incrementCreated,
  incrementDestroyed,
  incrementGenerationToken,
  incrementRecoveries,
  incrementRollbacks,
  incrementTitleUpdates,
  setActiveId,
  setAdapterState,
  setPolicy,
  setSlotsCreated,
  setupListeners,
  teardownListeners
};
