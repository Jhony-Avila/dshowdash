// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-recovery
// PURPOSE: Container Recovery - Recuperação de Erros
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   STATE, DOCK_SLOTS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createRecoveryManager() — exported function
//   attemptRecovery() — exported function
//   getAttempts() — exported function
//   clearAttempts() — exported function
//   getMetrics() — exported function
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
import { STATE, DOCK_SLOTS } from './constants.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-recovery';

interface RecoveryDeps {
  containers: Map<string, Record<string, unknown>>;
  listeners: Map<string, Record<string, unknown>>;
  eventsPort: { emit(event: string, data: Record<string, unknown>): void; [k: string]: unknown };
  domAdapter: { selectMainContainer(): HTMLElement | null; [k: string]: unknown };
  stateMachine: { transition(id: string, state: string, reason: string): boolean; [k: string]: unknown };
  getSlotElement: (host: HTMLElement | null, slot: string) => HTMLElement;
}

export function createRecoveryManager(deps: Record<string, unknown> = {}) {
  const { containers, listeners, eventsPort, domAdapter, stateMachine, getSlotElement } = deps as unknown as RecoveryDeps;
  let _recoveryHistory: Record<string, unknown>[] = [];
  let _maxHistory = 50;
  let _metrics = { orphansFound: 0, repaired: 0, invariantViolations: 0, errors: 0 };

  function _emit(event: string, data: Record<string, unknown> = {}) { eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  
  return {
    findOrphans() {
      const orphans: Array<{ id: string; state: string; reason: string }> = [];
      if (!containers) return orphans;
      (containers as Map<string, Record<string, unknown>>).forEach((instance: Record<string, unknown>, id: string) => { if (!(instance.rootEl as HTMLElement)?.parentNode) { orphans.push({ id, state: instance.state as string, reason: 'detached-from-dom' }); _metrics.orphansFound++; } });
      return orphans;
    },

    findSlotInconsistencies() {
      const inconsistencies: Array<{ id: string; expected: unknown; actual: string | null; reason: string }> = [];
      if (!containers) return inconsistencies;
      (containers as Map<string, Record<string, unknown>>).forEach((instance: Record<string, unknown>, id: string) => {
        const expectedSlot = (instance.dockSpec as Record<string, unknown>)?.slot || DOCK_SLOTS.PRIMARY;
        const actualSlot = (instance.rootEl as HTMLElement)?.getAttribute?.('data-dock-slot');
        if (actualSlot && actualSlot !== expectedSlot) { inconsistencies.push({ id, expected: expectedSlot, actual: actualSlot, reason: 'slot-mismatch' }); }
      });
      return inconsistencies;
    },
    
    validateInvariants() {
      const violations: Array<Record<string, unknown>> = [];
      if (!containers) return violations;
      let activeCount = 0;
      (containers as Map<string, Record<string, unknown>>).forEach((instance: Record<string, unknown>, id: string) => {
        if (instance.active) activeCount++;
        if (!(Object.values(STATE) as string[]).includes(instance.state as string)) { violations.push({ id, type: 'invalid-state', state: instance.state as string }); _metrics.invariantViolations++; }
        if (instance.state === STATE.DESTROYED) { violations.push({ id, type: 'destroyed-in-map' }); _metrics.invariantViolations++; }
      });
      if (activeCount > 1) { violations.push({ type: 'multiple-active', count: activeCount }); _metrics.invariantViolations++; }
      return violations;
    },
    
    repair(containerId: string) {
      const instance = (containers as Map<string, Record<string, unknown>>)?.get?.(containerId);
      if (!instance) return { success: false, reason: 'not-found' };
      try {
        if (!(instance.rootEl as HTMLElement)?.parentNode) {
          const host = domAdapter?.selectMainContainer?.();
          if (host && getSlotElement) {
            const slot = (getSlotElement as (host: unknown, slot: string) => HTMLElement)(host, (instance.dockSpec as Record<string, unknown>)?.slot as string || DOCK_SLOTS.PRIMARY);
            if (slot) { slot.appendChild(instance.rootEl as HTMLElement); _metrics.repaired++; _emit(CONTAINER_EVENTS.REPAIRED, { id: containerId, action: 're-attached' }); return { success: true, action: 're-attached' }; }
          }
          return { success: false, reason: 'cannot-reattach' };
        }
        const expectedSlot = (instance.dockSpec as Record<string, unknown>)?.slot as string || DOCK_SLOTS.PRIMARY;
        const actualSlot = (instance.rootEl as HTMLElement)?.getAttribute?.('data-dock-slot');
        if (actualSlot !== expectedSlot) { (instance.rootEl as HTMLElement).setAttribute('data-dock-slot', expectedSlot); _metrics.repaired++; _emit(CONTAINER_EVENTS.REPAIRED, { id: containerId, action: 'slot-fixed' }); return { success: true, action: 'slot-fixed' }; }
        return { success: true, action: 'no-repair-needed' };
      } catch (error) { _metrics.errors++; return { success: false, reason: (error as Error).message }; }
    },
    
    autoRecover() {
      const results: Array<Record<string, unknown>> = [];
      const orphans = this.findOrphans();
      orphans.forEach((orphan: Record<string, unknown>) => { const result = this.repair(orphan.id as string); results.push({ id: orphan.id as string, ...result, type: 'orphan' }); });
      const inconsistencies = this.findSlotInconsistencies();
      inconsistencies.forEach((inc: Record<string, unknown>) => { const result = this.repair(inc.id as string); results.push({ id: inc.id as string, ...result, type: 'slot-inconsistency' }); });
      const violations = this.validateInvariants();
      violations.forEach((v: Record<string, unknown>) => { if (v.type === 'destroyed-in-map' && v.id) { (containers as Map<string, unknown>)?.delete?.(v.id as string); results.push({ id: v.id, success: true, action: 'removed-destroyed', type: 'invariant' }); } });
      if (results.length > 0) {
        _recoveryHistory.push({ timestamp: Date.now(), results, orphansFound: orphans.length, inconsistencies: inconsistencies.length, violations: violations.length });
        if (_recoveryHistory.length > _maxHistory) _recoveryHistory.shift();
        _emit(CONTAINER_EVENTS.RECOVERY_COMPLETE, { resultsCount: results.length });
      }
      return results;
    },
    
    getHistory(limit: number = 20) { return _recoveryHistory.slice(-limit); },
    getMetrics() { return { ..._metrics, historySize: _recoveryHistory.length }; },
    healthCheck() {
      const orphans = this.findOrphans();
      const inconsistencies = this.findSlotInconsistencies();
      const violations = this.validateInvariants();
      const totalIssues = orphans.length + inconsistencies.length + violations.length;
      return { status: totalIssues === 0 ? 'HEALTHY' : totalIssues < 3 ? 'DEGRADED' : 'UNHEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { orphans: orphans.length, inconsistencies: inconsistencies.length, violations: violations.length, totalIssues }, metrics: this.getMetrics() };
    },
    info() { return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics() }; }
  };
}

let _recoveryAttempts: Record<string, unknown>[] = [];
let _maxAttempts = 50;
let _legacyMetrics = { attempts: 0, successes: 0, failures: 0 };

export function attemptRecovery(error: Error | string, context: Record<string, unknown> = {}) { _legacyMetrics.attempts++; const record = { error: error instanceof Error ? error.message : String(error), context, timestamp: Date.now(), success: true }; _legacyMetrics.successes++; _recoveryAttempts.push(record); if (_recoveryAttempts.length > _maxAttempts) _recoveryAttempts.shift(); return record; }
export function getAttempts() { return [..._recoveryAttempts]; }
export function clearAttempts() { _recoveryAttempts = []; }
export function getMetrics() { return { ..._legacyMetrics }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() }; }

export default { createRecoveryManager, attemptRecovery, getAttempts, clearAttempts, getMetrics, healthCheck, VERSION, MODULE_ID };
