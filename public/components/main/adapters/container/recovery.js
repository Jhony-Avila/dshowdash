import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { STATE, DOCK_SLOTS } from "./constants.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-recovery";
function createRecoveryManager(deps = {}) {
  const { containers, listeners, eventsPort, domAdapter, stateMachine, getSlotElement } = deps;
  let _recoveryHistory = [];
  let _maxHistory = 50;
  let _metrics = { orphansFound: 0, repaired: 0, invariantViolations: 0, errors: 0 };
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  return {
    findOrphans() {
      const orphans = [];
      if (!containers) return orphans;
      containers.forEach((instance, id) => {
        if (!instance.rootEl?.parentNode) {
          orphans.push({ id, state: instance.state, reason: "detached-from-dom" });
          _metrics.orphansFound++;
        }
      });
      return orphans;
    },
    findSlotInconsistencies() {
      const inconsistencies = [];
      if (!containers) return inconsistencies;
      containers.forEach((instance, id) => {
        const expectedSlot = instance.dockSpec?.slot || DOCK_SLOTS.PRIMARY;
        const actualSlot = instance.rootEl?.getAttribute?.("data-dock-slot");
        if (actualSlot && actualSlot !== expectedSlot) {
          inconsistencies.push({ id, expected: expectedSlot, actual: actualSlot, reason: "slot-mismatch" });
        }
      });
      return inconsistencies;
    },
    validateInvariants() {
      const violations = [];
      if (!containers) return violations;
      let activeCount = 0;
      containers.forEach((instance, id) => {
        if (instance.active) activeCount++;
        if (!Object.values(STATE).includes(instance.state)) {
          violations.push({ id, type: "invalid-state", state: instance.state });
          _metrics.invariantViolations++;
        }
        if (instance.state === STATE.DESTROYED) {
          violations.push({ id, type: "destroyed-in-map" });
          _metrics.invariantViolations++;
        }
      });
      if (activeCount > 1) {
        violations.push({ type: "multiple-active", count: activeCount });
        _metrics.invariantViolations++;
      }
      return violations;
    },
    repair(containerId) {
      const instance = containers?.get?.(containerId);
      if (!instance) return { success: false, reason: "not-found" };
      try {
        if (!instance.rootEl?.parentNode) {
          const host = domAdapter?.selectMainContainer?.();
          if (host && getSlotElement) {
            const slot = getSlotElement(host, instance.dockSpec?.slot || DOCK_SLOTS.PRIMARY);
            if (slot) {
              slot.appendChild(instance.rootEl);
              _metrics.repaired++;
              _emit(CONTAINER_EVENTS.REPAIRED, { id: containerId, action: "re-attached" });
              return { success: true, action: "re-attached" };
            }
          }
          return { success: false, reason: "cannot-reattach" };
        }
        const expectedSlot = instance.dockSpec?.slot || DOCK_SLOTS.PRIMARY;
        const actualSlot = instance.rootEl?.getAttribute?.("data-dock-slot");
        if (actualSlot !== expectedSlot) {
          instance.rootEl.setAttribute("data-dock-slot", expectedSlot);
          _metrics.repaired++;
          _emit(CONTAINER_EVENTS.REPAIRED, { id: containerId, action: "slot-fixed" });
          return { success: true, action: "slot-fixed" };
        }
        return { success: true, action: "no-repair-needed" };
      } catch (error) {
        _metrics.errors++;
        return { success: false, reason: error.message };
      }
    },
    autoRecover() {
      const results = [];
      const orphans = this.findOrphans();
      orphans.forEach((orphan) => {
        const result = this.repair(orphan.id);
        results.push({ id: orphan.id, ...result, type: "orphan" });
      });
      const inconsistencies = this.findSlotInconsistencies();
      inconsistencies.forEach((inc) => {
        const result = this.repair(inc.id);
        results.push({ id: inc.id, ...result, type: "slot-inconsistency" });
      });
      const violations = this.validateInvariants();
      violations.forEach((v) => {
        if (v.type === "destroyed-in-map" && v.id) {
          containers?.delete?.(v.id);
          results.push({ id: v.id, success: true, action: "removed-destroyed", type: "invariant" });
        }
      });
      if (results.length > 0) {
        _recoveryHistory.push({ timestamp: Date.now(), results, orphansFound: orphans.length, inconsistencies: inconsistencies.length, violations: violations.length });
        if (_recoveryHistory.length > _maxHistory) _recoveryHistory.shift();
        _emit(CONTAINER_EVENTS.RECOVERY_COMPLETE, { resultsCount: results.length });
      }
      return results;
    },
    getHistory(limit = 20) {
      return _recoveryHistory.slice(-limit);
    },
    getMetrics() {
      return { ..._metrics, historySize: _recoveryHistory.length };
    },
    healthCheck() {
      const orphans = this.findOrphans();
      const inconsistencies = this.findSlotInconsistencies();
      const violations = this.validateInvariants();
      const totalIssues = orphans.length + inconsistencies.length + violations.length;
      return { status: totalIssues === 0 ? "HEALTHY" : totalIssues < 3 ? "DEGRADED" : "UNHEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { orphans: orphans.length, inconsistencies: inconsistencies.length, violations: violations.length, totalIssues }, metrics: this.getMetrics() };
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics() };
    }
  };
}
let _recoveryAttempts = [];
let _maxAttempts = 50;
let _legacyMetrics = { attempts: 0, successes: 0, failures: 0 };
function attemptRecovery(error, context = {}) {
  _legacyMetrics.attempts++;
  const record = { error: error instanceof Error ? error.message : String(error), context, timestamp: Date.now(), success: true };
  _legacyMetrics.successes++;
  _recoveryAttempts.push(record);
  if (_recoveryAttempts.length > _maxAttempts) _recoveryAttempts.shift();
  return record;
}
function getAttempts() {
  return [..._recoveryAttempts];
}
function clearAttempts() {
  _recoveryAttempts = [];
}
function getMetrics() {
  return { ..._legacyMetrics };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}
var recovery_default = { createRecoveryManager, attemptRecovery, getAttempts, clearAttempts, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  attemptRecovery,
  clearAttempts,
  createRecoveryManager,
  recovery_default as default,
  getAttempts,
  getMetrics,
  healthCheck
};
