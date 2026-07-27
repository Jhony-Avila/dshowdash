import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { VERSION as ADAPTER_VERSION, POLICY, DOCK_SLOTS, LAYOUT_MODE, BUDGET, ENTERPRISE_DEFAULTS } from "./constants.js";
import { getSlotElement } from "./dom-factory.js";
import { getContainers, getContainerApis, getListeners, getPolicy, getActiveId, getSlotsCreated, getGenerationToken, getAdapterState, getMetrics, setPolicy, incrementRollbacks, incrementRecoveries } from "./internal-state.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-management";
function createManagement(deps = {}) {
  const { domAdapter, eventsPort, stateMachine, transactions, recovery, stateActions } = deps;
  const _containers = getContainers();
  const _containerApis = getContainerApis();
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  return {
    list() {
      const result = [];
      _containers.forEach((instance, id) => {
        const api = _containerApis.get(id);
        result.push({ id, state: instance.state, active: instance.active, variant: instance.options?.variant || "default", title: instance.options?.title || "", createdAt: instance.createdAt, lastActivatedAt: instance.lastActivatedAt, lastTransition: instance.lastTransition, dockSpec: instance.dockSpec, layoutPolicy: instance.layoutPolicy, hasApi: !!api, apiHealthy: api?.healthCheck?.()?.status === "HEALTHY" });
      });
      return result;
    },
    bringToFront(id) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const slotName = instance.dockSpec?.slot || DOCK_SLOTS.PRIMARY;
      const host = domAdapter?.selectMainContainer?.();
      const slotEl = getSlotElement(host, slotName);
      if (slotEl && instance.wrapperEl?.parentNode === slotEl) slotEl.appendChild(instance.wrapperEl);
      stateActions?.activate(id);
      _emit(CONTAINER_EVENTS.READY, { id, action: "bringToFront" });
      return true;
    },
    setPolicy(policy) {
      if (policy === POLICY.EPHEMERAL || policy === POLICY.PERSISTENT) {
        setPolicy(policy);
        return true;
      }
      return false;
    },
    getPolicy() {
      return getPolicy();
    },
    setDock(id, dockSpec) {
      const instance = _containers.get(id);
      if (!instance) return false;
      transactions.begin();
      try {
        const oldSlot = instance.dockSpec?.slot;
        instance.dockSpec = { ...instance.dockSpec, ...dockSpec };
        if (dockSpec.slot && dockSpec.slot !== oldSlot) {
          const host = domAdapter?.selectMainContainer?.();
          const newSlotEl = getSlotElement(host, dockSpec.slot);
          if (newSlotEl && instance.wrapperEl) newSlotEl.appendChild(instance.wrapperEl);
          instance.wrapperEl?.setAttribute?.("data-dock-slot", dockSpec.slot);
        }
        _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, dockSpec: instance.dockSpec, change: "dockChanged" });
        transactions.commit();
        return true;
      } catch (error) {
        transactions.rollback(error.message);
        incrementRollbacks();
        return false;
      }
    },
    getDock(id) {
      return _containers.get(id)?.dockSpec || null;
    },
    setLayoutPolicy(id, layoutPolicy) {
      const instance = _containers.get(id);
      if (!instance) return false;
      instance.layoutPolicy = { ...instance.layoutPolicy, ...layoutPolicy };
      instance.wrapperEl?.setAttribute?.("data-layout-mode", layoutPolicy.mode || LAYOUT_MODE.INHERIT);
      if (layoutPolicy.layout) instance.wrapperEl?.setAttribute?.("data-layout", layoutPolicy.layout);
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, layoutPolicy: instance.layoutPolicy, change: "layoutPolicyChanged" });
      return true;
    },
    getLayoutPolicy(id) {
      return _containers.get(id)?.layoutPolicy || null;
    },
    getActiveId() {
      return getActiveId();
    },
    recover() {
      const results = recovery.autoRecover();
      const repairedCount = results.filter((r) => r.action === "repaired").length;
      for (let i = 0; i < repairedCount; i++) incrementRecoveries();
      return results;
    },
    snapshot() {
      return { version: ADAPTER_VERSION, timestamp: Date.now(), policy: getPolicy(), activeContainerId: getActiveId(), adapterState: getAdapterState(), metrics: getMetrics(), containers: Array.from(_containers.values()).map((inst) => ({ id: inst.id, state: inst.state, options: inst.options, dockSpec: inst.dockSpec, layoutPolicy: inst.layoutPolicy, active: inst.active, createdAt: inst.createdAt, lastTransition: inst.lastTransition })) };
    },
    restore(snapshotData) {
      if (!snapshotData?.containers) return false;
      transactions.begin();
      try {
        setPolicy(snapshotData.policy || POLICY.EPHEMERAL);
        transactions.commit();
        return true;
      } catch (error) {
        transactions.rollback(error.message);
        incrementRollbacks();
        return false;
      }
    },
    info() {
      return { version: ADAPTER_VERSION, moduleId: "container-adapter", policy: getPolicy(), adapterState: getAdapterState(), containerCount: _containers.size, activeContainerId: getActiveId(), containerIds: Array.from(_containers.keys()), containerStates: Array.from(_containers.values()).reduce((acc, inst) => {
        acc[inst.state] = (acc[inst.state] || 0) + 1;
        return acc;
      }, {}), slotsCreated: getSlotsCreated(), listenerCount: getListeners().size, generationToken: getGenerationToken(), metrics: getMetrics(), budget: { ...BUDGET }, recentTransitions: stateMachine.getHistory(10), enterpriseDefaults: ENTERPRISE_DEFAULTS, features: ["toast", "progress", "tabs", "badge", "toolbar", "zoom", "accessibility", "debug", "fullscreen"] };
    },
    healthCheck() {
      const hasHost = !!domAdapter?.selectMainContainer?.();
      const orphans = recovery.findOrphans();
      const slotInconsistencies = recovery.findSlotInconsistencies();
      const invariantViolations = recovery.validateInvariants();
      let recoveryResults = [];
      if (orphans.length >= BUDGET.ORPHAN_THRESHOLD) {
        recoveryResults = recovery.autoRecover();
        const repairedCount = recoveryResults.filter((r) => r.action === "repaired").length;
        for (let i = 0; i < repairedCount; i++) incrementRecoveries();
      }
      const apiHealthChecks = {};
      _containerApis.forEach((api, id) => {
        if (api?.healthCheck) apiHealthChecks[id] = api.healthCheck();
      });
      const hasDegradation = orphans.length > 0 || slotInconsistencies.length > 0 || invariantViolations.length > 0;
      return { status: !hasHost ? "UNHEALTHY" : hasDegradation ? "DEGRADED" : "HEALTHY", version: ADAPTER_VERSION, adapterState: getAdapterState(), policy: getPolicy(), containerCount: _containers.size, activeContainerId: getActiveId(), hasHost, slotsCreated: getSlotsCreated(), listenerCount: getListeners().size, orphans, slotInconsistencies, invariantViolations, recoveryResults, metrics: getMetrics(), generationToken: getGenerationToken(), apiHealthChecks };
    }
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var management_default = { createManagement, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createManagement,
  management_default as default,
  healthCheck
};
