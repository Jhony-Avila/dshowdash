// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-management
// PURPOSE: Container Management - Gestão e Administração
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   VERSION as ADAPTER_VERSION, POLICY, DOCK_SLOTS, LAYOUT_MODE, BUDGET, ENTERPRI...
//   getSlotElement from ./dom-factory.js
//   getContainers, getContainerApis, getListeners, getPolicy, getActiveId, getSlo...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createManagement() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';
import { VERSION as ADAPTER_VERSION, POLICY, DOCK_SLOTS, LAYOUT_MODE, BUDGET, ENTERPRISE_DEFAULTS } from './constants.js';
import { getSlotElement } from './dom-factory.js';
import { getContainers, getContainerApis, getListeners, getPolicy, getActiveId, getSlotsCreated, getGenerationToken, getAdapterState, getMetrics, setPolicy, incrementRollbacks, incrementRecoveries } from './internal-state.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-management';

interface ManagementDeps {
  domAdapter: { selectMainContainer(): HTMLElement | null; [k: string]: unknown };
  eventsPort: { emit(event: string, data: Record<string, unknown>): void; [k: string]: unknown };
  stateMachine: { transition(id: string, state: string, reason: string): boolean; getHistory(limit: number): Record<string, unknown>[]; [k: string]: unknown };
  transactions: { begin(): string; commit(): boolean; rollback(reason: string): boolean; [k: string]: unknown };
  recovery: { autoRecover(): Record<string, unknown>[]; findOrphans(): Record<string, unknown>[]; findSlotInconsistencies(): Record<string, unknown>[]; validateInvariants(): Record<string, unknown>[]; [k: string]: unknown };
  stateActions: { activate(id: string): boolean; [k: string]: unknown };
}

export function createManagement(deps: Record<string, unknown> = {}) {
  const { domAdapter, eventsPort, stateMachine, transactions, recovery, stateActions } = deps as unknown as ManagementDeps;
  const _containers = getContainers();
  const _containerApis = getContainerApis();

  function _emit(event: string, data: Record<string, unknown> = {}) { eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }

  return {
    list() {
      const result: Record<string, unknown>[] = [];
      _containers.forEach((instance: Record<string, unknown>, id: string) => { const api = _containerApis.get(id); result.push({ id, state: instance.state, active: instance.active, variant: (instance.options as Record<string, unknown>)?.variant || 'default', title: (instance.options as Record<string, unknown>)?.title || '', createdAt: instance.createdAt, lastActivatedAt: instance.lastActivatedAt, lastTransition: instance.lastTransition, dockSpec: instance.dockSpec, layoutPolicy: instance.layoutPolicy, hasApi: !!api, apiHealthy: api?.healthCheck?.()?.status === 'HEALTHY' }); });
      return result;
    },

    bringToFront(id: string) {
      const instance = _containers.get(id);
      if (!instance) return false;
      const slotName = instance.dockSpec?.slot || DOCK_SLOTS.PRIMARY;
      const host = domAdapter?.selectMainContainer?.() as HTMLElement | null;
      const slotEl = getSlotElement(host as HTMLElement, slotName);
      if (slotEl && instance.wrapperEl?.parentNode === slotEl) slotEl.appendChild(instance.wrapperEl);
      stateActions?.activate(id);
      _emit(CONTAINER_EVENTS.READY, { id, action: 'bringToFront' });
      return true;
    },

    setPolicy(policy: string) { if (policy === POLICY.EPHEMERAL || policy === POLICY.PERSISTENT) { setPolicy(policy); return true; } return false; },
    getPolicy() { return getPolicy(); },

    setDock(id: string, dockSpec: Record<string, unknown>) {
      const instance = _containers.get(id);
      if (!instance) return false;
      transactions.begin();
      try {
        const oldSlot = instance.dockSpec?.slot;
        instance.dockSpec = { ...instance.dockSpec, ...dockSpec };
        if (dockSpec.slot && dockSpec.slot !== oldSlot) {
          const host = domAdapter?.selectMainContainer?.() as HTMLElement | null;
          const newSlotEl = getSlotElement(host as HTMLElement, dockSpec.slot as string);
          if (newSlotEl && instance.wrapperEl) newSlotEl.appendChild(instance.wrapperEl);
          instance.wrapperEl?.setAttribute?.('data-dock-slot', dockSpec.slot as string);
        }
        _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, dockSpec: instance.dockSpec, change: 'dockChanged' });
        transactions.commit();
        return true;
      } catch (error) { transactions.rollback((error as Error).message); incrementRollbacks(); return false; }
    },

    getDock(id: string) { return _containers.get(id)?.dockSpec || null; },

    setLayoutPolicy(id: string, layoutPolicy: Record<string, unknown>) {
      const instance = _containers.get(id);
      if (!instance) return false;
      instance.layoutPolicy = { ...instance.layoutPolicy, ...layoutPolicy };
      instance.wrapperEl?.setAttribute?.('data-layout-mode', layoutPolicy.mode || LAYOUT_MODE.INHERIT);
      if (layoutPolicy.layout) instance.wrapperEl?.setAttribute?.('data-layout', layoutPolicy.layout);
      _emit(CONTAINER_EVENTS.STATE_CHANGED, { id, layoutPolicy: instance.layoutPolicy, change: 'layoutPolicyChanged' });
      return true;
    },

    getLayoutPolicy(id: string) { return _containers.get(id)?.layoutPolicy || null; },
    getActiveId() { return getActiveId(); },

    recover() { const results = recovery.autoRecover(); const repairedCount = results.filter((r: Record<string, unknown>) => r.action === 'repaired').length; for (let i = 0; i < repairedCount; i++) incrementRecoveries(); return results; },

    snapshot() { return { version: ADAPTER_VERSION, timestamp: Date.now(), policy: getPolicy(), activeContainerId: getActiveId(), adapterState: getAdapterState(), metrics: getMetrics(), containers: Array.from(_containers.values()).map(inst => ({ id: inst.id, state: inst.state, options: inst.options, dockSpec: inst.dockSpec, layoutPolicy: inst.layoutPolicy, active: inst.active, createdAt: inst.createdAt, lastTransition: inst.lastTransition })) }; },

    restore(snapshotData: Record<string, unknown>) { if (!snapshotData?.containers) return false; transactions.begin(); try { setPolicy((snapshotData.policy as string) || POLICY.EPHEMERAL); transactions.commit(); return true; } catch (error) { transactions.rollback((error as Error).message); incrementRollbacks(); return false; } },

    info() { return { version: ADAPTER_VERSION, moduleId: 'container-adapter', policy: getPolicy(), adapterState: getAdapterState(), containerCount: _containers.size, activeContainerId: getActiveId(), containerIds: Array.from(_containers.keys()), containerStates: Array.from(_containers.values()).reduce((acc, inst) => { acc[inst.state] = (acc[inst.state] || 0) + 1; return acc; }, {}), slotsCreated: getSlotsCreated(), listenerCount: getListeners().size, generationToken: getGenerationToken(), metrics: getMetrics(), budget: { ...BUDGET }, recentTransitions: stateMachine.getHistory(10), enterpriseDefaults: ENTERPRISE_DEFAULTS, features: ['toast', 'progress', 'tabs', 'badge', 'toolbar', 'zoom', 'accessibility', 'debug', 'fullscreen'] }; },

    healthCheck() {
      const hasHost = !!domAdapter?.selectMainContainer?.();
      const orphans = recovery.findOrphans();
      const slotInconsistencies = recovery.findSlotInconsistencies();
      const invariantViolations = recovery.validateInvariants();
      let recoveryResults: Record<string, unknown>[] = [];
      if (orphans.length >= BUDGET.ORPHAN_THRESHOLD) { recoveryResults = recovery.autoRecover(); const repairedCount = recoveryResults.filter((r: Record<string, unknown>) => r.action === 'repaired').length; for (let i = 0; i < repairedCount; i++) incrementRecoveries(); }
      const apiHealthChecks: Record<string, unknown> = {};
      _containerApis.forEach((api, id) => { if (api?.healthCheck) apiHealthChecks[id] = api.healthCheck(); });
      const hasDegradation = orphans.length > 0 || slotInconsistencies.length > 0 || invariantViolations.length > 0;
      return { status: !hasHost ? 'UNHEALTHY' : hasDegradation ? 'DEGRADED' : 'HEALTHY', version: ADAPTER_VERSION, adapterState: getAdapterState(), policy: getPolicy(), containerCount: _containers.size, activeContainerId: getActiveId(), hasHost, slotsCreated: getSlotsCreated(), listenerCount: getListeners().size, orphans, slotInconsistencies, invariantViolations, recoveryResults, metrics: getMetrics(), generationToken: getGenerationToken(), apiHealthChecks };
    }
  };
}

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }
export default { createManagement, healthCheck, VERSION, MODULE_ID };
