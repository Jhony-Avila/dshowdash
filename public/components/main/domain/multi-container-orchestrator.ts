

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: multi-container-orchestrator
// PURPOSE: MultiContainerOrchestrator - Orquestração Multi-Container Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   createContainerOrchestrationPolicy, DOCK_MODES, OPEN_STRATEGIES from ./contai...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createMultiContainerOrchestrator() — exported function
//   NAVIGATION_SYNC_EVENT — exported value
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
import { createContainerOrchestrationPolicy, DOCK_MODES, OPEN_STRATEGIES } from './container-orchestration-policy.js';

export const VERSION = '9.0.0-P1-HEX';
export const MODULE_ID = 'multi-container-orchestrator';

const SNAPSHOT_KEY = 'dshowdash:container-snapshot';
const SNAPSHOT_DEBOUNCE_MS = 500;
const NAVIGATION_SYNC_EVENT = 'main.navigation.sync';

export class MultiContainerOrchestrator {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._statePort = context.ports?.state || null;
    this._containerPort = context.ports?.container || null;
    this._timerPort = context.ports?.timer || null;
    this._policy = createContainerOrchestrationPolicy({ ports: context.ports });
    
    this._activeContainers = new Map();
    this._primaryContainerId = null;
    this._containerStack = [];
    this._currentLayout = 'single';
    
    this._snapshotTimeoutId = null;
    this._lastSnapshotTime = 0;
    
    this._metrics = {
      containersOpened: 0, containersClosed: 0, containersReused: 0,
      activations: 0, focusChanges: 0, snapshotsSaved: 0,
      snapshotsRestored: 0, layoutChanges: 0, navigationSyncs: 0, errors: 0
    };
    
    this._initTimestamp = Date.now();
  }

  // P1-HEX: Timer helpers using TimerPort
  _setTimeout(fn: (...args: unknown[]) => unknown, ms: number) {
    if (this._timerPort?.setTimeout) return this._timerPort.setTimeout(fn, ms);
    return setTimeout(fn, ms);
  }
  
  _clearTimeout(id: string) {
    if (id === null || id === undefined) return;
    if (this._timerPort?.clearTimeout) return this._timerPort.clearTimeout(id);
    return clearTimeout(id);
  }

  _emitNavigationSync(containerId: string, panelId: string) {
    if (!panelId) return;
    this._metrics.navigationSyncs++;
    this._emit(NAVIGATION_SYNC_EVENT, { panelId, containerId, route: `#/${panelId}`, source: 'orchestrator' });
    this._telemetry?.track?.('orchestrator:navigation-sync', { containerId, panelId });
  }

  async openContainer(panelId: string, options = {}) {
    const containerId = this._policy.generateContainerId(panelId);
    const rule = this._policy.resolveOpenRule(panelId, options);
    const existingContainer = this._containerPort?.get?.(containerId);
    
    this._telemetry?.track?.('orchestrator:open-start', { panelId, containerId, rule, hasExisting: !!existingContainer });
    this._emit(CONTAINER_EVENTS.OPENING, { panelId, containerId, rule });
    
    try {
      if (rule.reuse && existingContainer) return this._reuseContainer(containerId, panelId, rule);
      
      const currentPrimarySlot = this._primaryContainerId ? this._containerPort?.getDock?.(this._primaryContainerId)?.slot : null;
      const targetSlot = this._policy.resolveDockSlot(panelId, currentPrimarySlot);
      
      if (rule.strategy === OPEN_STRATEGIES.REPLACE) await this._applyReplaceStrategy(containerId, panelId, targetSlot, rule);
      else if (rule.strategy === OPEN_STRATEGIES.SIDE_BY_SIDE) await this._applySideBySideStrategy(containerId, panelId, targetSlot, rule);
      else if (rule.strategy === OPEN_STRATEGIES.STACK) await this._applyStackStrategy(containerId, panelId, targetSlot, rule);
      
      if (rule.activate) {
        this.activateContainer(containerId);
        this._emitNavigationSync(containerId, panelId);
      }
      
      this._metrics.containersOpened++;
      this._scheduleSnapshot();
      this._telemetry?.track?.('orchestrator:open-complete', { panelId, containerId, strategy: rule.strategy });
      this._emit(CONTAINER_EVENTS.OPENED, { panelId, containerId, rule });
      return { containerId, panelId, rule };
    } catch (error) {
      this._metrics.errors++;
      this._telemetry?.error?.(error, { panelId, containerId, phase: 'openContainer' });
      throw error;
    }
  }

  async _reuseContainer(containerId: string, panelId: string, rule: Record<string, unknown>) {
    this._containerPort?.bringToFront?.(containerId);
    if (rule.activate) {
      this.activateContainer(containerId);
      this._emitNavigationSync(containerId, panelId);
    }
    this._metrics.containersReused++;
    this._telemetry?.track?.('orchestrator:reused', { panelId, containerId });
    this._emit(CONTAINER_EVENTS.REUSED, { panelId, containerId });
    return { containerId, panelId, reused: true };
  }

  async _applyReplaceStrategy(containerId: string, panelId: string, targetSlot: unknown, rule: Record<string, unknown>) {
    const policy = this._containerPort?.getPolicy?.() || 'ephemeral';
    const containers = this._containerPort?.list?.() || [];
    for (const c of containers) {
      if (c.dockSpec?.slot === targetSlot && c.id !== containerId) {
        if (policy === 'ephemeral') { this._containerPort?.destroy?.(c.id); this._activeContainers.delete(c.id); }
        else this._containerPort?.deactivate?.(c.id);
      }
    }
    this._activeContainers.set(containerId, { panelId, slot: targetSlot, createdAt: Date.now() });
    this._updateLayout();
  }

  async _applySideBySideStrategy(containerId: string, panelId: string, targetSlot: unknown, rule: Record<string, unknown>) {
    this._activeContainers.set(containerId, { panelId, slot: targetSlot, createdAt: Date.now() });
    const prevLayout = this._currentLayout;
    this._currentLayout = 'side-by-side';
    this._updateLayout();
    if (prevLayout !== this._currentLayout) this._metrics.layoutChanges++;
    this._emit(CONTAINER_EVENTS.LAYOUT_CHANGED, { layout: 'side-by-side', containers: this.getActiveContainerIds() });
  }

  async _applyStackStrategy(containerId: string, panelId: string, targetSlot: unknown, rule: Record<string, unknown>) {
    this._containerStack.push(containerId);
    this._activeContainers.set(containerId, { panelId, slot: targetSlot, createdAt: Date.now() });
    this._emit(CONTAINER_EVENTS.STACKED, { containerId, stackSize: this._containerStack.length });
  }

  activateContainer(containerId: string) {
    const container = this._activeContainers.get(containerId);
    if (!container) return false;
    if (container.slot === DOCK_MODES.PRIMARY) {
      this._activeContainers.forEach((c: Record<string, unknown>, id: string) => {
        if (c.slot === DOCK_MODES.PRIMARY && id !== containerId) this._containerPort?.deactivate?.(id);
      });
      this._primaryContainerId = containerId;
    }
    this._containerPort?.activate?.(containerId);
    this._metrics.activations++;
    this._telemetry?.track?.('orchestrator:activated', { containerId });
    this._emit(CONTAINER_EVENTS.ACTIVATED, { containerId, panelId: container.panelId });
    return true;
  }

  closeContainer(containerId: string) {
    const container = this._activeContainers.get(containerId);
    if (!container) return false;
    const policy = this._containerPort?.getPolicy?.() || 'ephemeral';
    if (policy === 'ephemeral') this._containerPort?.destroy?.(containerId);
    else this._containerPort?.deactivate?.(containerId);
    this._activeContainers.delete(containerId);
    this._containerStack = this._containerStack.filter((id: string) => id !== containerId);
    if (this._primaryContainerId === containerId) {
      this._primaryContainerId = null;
      if (this._containerStack.length > 0) {
        const newPrimary = this._containerStack[this._containerStack.length - 1];
        this.activateContainer(newPrimary);
        const newContainer = this._activeContainers.get(newPrimary);
        if (newContainer?.panelId) this._emitNavigationSync(newPrimary, newContainer.panelId);
      }
    }
    this._updateLayout();
    this._metrics.containersClosed++;
    this._scheduleSnapshot();
    this._emit(CONTAINER_EVENTS.CLOSED, { containerId });
    return true;
  }

  toggleFocus(containerId: string) {
    if (!this._activeContainers.has(containerId)) return false;
    if (this._primaryContainerId === containerId) return true;
    const oldPrimary = this._primaryContainerId;
    this.activateContainer(containerId);
    this._metrics.focusChanges++;
    const container = this._activeContainers.get(containerId);
    if (container?.panelId) this._emitNavigationSync(containerId, container.panelId);
    this._emit(CONTAINER_EVENTS.FOCUS_CHANGED, { from: oldPrimary, to: containerId });
    return true;
  }

  _updateLayout() {
    const slots = new Set();
    this._activeContainers.forEach((c: Record<string, unknown>) => slots.add(c.slot));
    const prevLayout = this._currentLayout;
    if (slots.has(DOCK_MODES.PRIMARY) && slots.has(DOCK_MODES.SECONDARY)) this._currentLayout = 'side-by-side';
    else if (slots.size > 1) this._currentLayout = 'multi';
    else this._currentLayout = 'single';
    if (prevLayout !== this._currentLayout) {
      this._metrics.layoutChanges++;
      this._emit(CONTAINER_EVENTS.LAYOUT_UPDATED, { from: prevLayout, to: this._currentLayout });
    }
  }

  // P1-HEX: Use TimerPort for debounced snapshot
  _scheduleSnapshot() {
    this._clearTimeout(this._snapshotTimeoutId);
    this._snapshotTimeoutId = this._setTimeout(() => {
      this._autoSnapshot();
      this._snapshotTimeoutId = null;
    }, SNAPSHOT_DEBOUNCE_MS);
  }

  _autoSnapshot() {
    if (!this._statePort) return;
    const now = Date.now();
    if (now - this._lastSnapshotTime < 100) return;
    const snapshot = this.snapshot();
    this._statePort.set?.(SNAPSHOT_KEY, snapshot);
    this._lastSnapshotTime = now;
    this._metrics.snapshotsSaved++;
    this._emit(CONTAINER_EVENTS.SNAPSHOT_SAVED, { containersCount: snapshot.containers.length });
  }

  snapshot() {
    const containers: Array<unknown> = [];
    this._activeContainers.forEach((data: Record<string, unknown>, id: string) => {
      containers.push({ containerId: id, panelId: data.panelId, slot: data.slot, createdAt: data.createdAt });
    });
    return { version: VERSION, timestamp: Date.now(), primaryContainerId: this._primaryContainerId, currentLayout: this._currentLayout, containers, stack: [...this._containerStack], policy: this._policy.snapshot() };
  }

  // @ts-expect-error strict migration — TS2322
  async restore(snapshotData: Record<string, unknown> = null) {
    const data = snapshotData || this._statePort?.get?.(SNAPSHOT_KEY);
    if (!data || !data.containers) return false;
    // @ts-expect-error strict migration — TS2339
    this._telemetry?.track?.('orchestrator:restore-start', { containersCount: data.containers.length });
    try {
      if (data.policy) this._policy.restore(data.policy);
      this._activeContainers.clear();
      this._containerStack = data.stack || [];
      this._primaryContainerId = data.primaryContainerId || null;
      this._currentLayout = data.currentLayout || 'single';
      // @ts-expect-error strict migration — TS2488
      for (const c of data.containers) this._activeContainers.set(c.containerId, { panelId: c.panelId, slot: c.slot, createdAt: c.createdAt });
      if (this._primaryContainerId) {
        const primaryContainer = this._activeContainers.get(this._primaryContainerId);
        if (primaryContainer?.panelId) this._emitNavigationSync(this._primaryContainerId, primaryContainer.panelId);
      }
      this._metrics.snapshotsRestored++;
      // @ts-expect-error strict migration — TS2339
      this._telemetry?.track?.('orchestrator:restore-complete', { containersCount: data.containers.length });
      // @ts-expect-error strict migration — TS2339
      this._emit(CONTAINER_EVENTS.SNAPSHOT_RESTORED, { containersCount: data.containers.length, layout: this._currentLayout });
      return true;
    } catch (error) {
      this._metrics.errors++;
      this._telemetry?.error?.(error, { phase: 'restore' });
      return false;
    }
  }

  clearSnapshot() { this._statePort?.set?.(SNAPSHOT_KEY, null); this._emit(CONTAINER_EVENTS.SNAPSHOT_CLEARED, {}); return true; }
  getPrimaryContainerId() { return this._primaryContainerId; }
  getCurrentLayout() { return this._currentLayout; }
  getActiveContainerIds() { return Array.from(this._activeContainers.keys()); }
  getContainerStack() { return [...this._containerStack]; }
  getPolicy() { return this._policy; }
  hasContainer(containerId: string) { return this._activeContainers.has(containerId); }
  getContainerInfo(containerId: string) { return this._activeContainers.get(containerId) || null; }
  _emit(event: string, data = {}) { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }

  getMetrics() {
    const uptime = Date.now() - this._initTimestamp;
    const reuseRate = this._metrics.containersOpened > 0 ? Math.round((this._metrics.containersReused / this._metrics.containersOpened) * 100) : 0;
    return { ...this._metrics, uptime, activeContainers: this._activeContainers.size, stackSize: this._containerStack.length, reuseRate: `${reuseRate}%`, avgContainersPerMinute: uptime > 60000 ? Math.round((this._metrics.containersOpened / (uptime / 60000)) * 10) / 10 : this._metrics.containersOpened };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, primaryContainerId: this._primaryContainerId, currentLayout: this._currentLayout, activeContainersCount: this._activeContainers.size, stackSize: this._containerStack.length, policy: this._policy.info(), metrics: this.getMetrics(), p1HexCompliant: true, navigationSyncEvent: NAVIGATION_SYNC_EVENT }; }

  healthCheck() {
    const hasStatePort = !!this._statePort;
    const hasContainerPort = !!this._containerPort;
    const hasPrimary = !!this._primaryContainerId;
    const errorRate = this._metrics.containersOpened > 0 ? (this._metrics.errors / this._metrics.containersOpened) * 100 : 0;
    let status = 'HEALTHY';
    if (!hasContainerPort) status = 'UNHEALTHY';
    else if (errorRate > 20 || !hasStatePort) status = 'DEGRADED';
    return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasStatePort, hasContainerPort, hasPrimary, activeContainersCount: this._activeContainers.size, errorRate: `${Math.round(errorRate)}%` }, metrics: this.getMetrics(), p1HexCompliant: true };
  }

  destroy() {
    this._clearTimeout(this._snapshotTimeoutId);
    this._snapshotTimeoutId = null;
    this._activeContainers.clear();
    this._containerStack = [];
    this._primaryContainerId = null;
  }
}

export function createMultiContainerOrchestrator(context: Record<string, unknown>) { return new MultiContainerOrchestrator(context); }
export { NAVIGATION_SYNC_EVENT };
export default { MultiContainerOrchestrator, createMultiContainerOrchestrator, VERSION, MODULE_ID, NAVIGATION_SYNC_EVENT };
