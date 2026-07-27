// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: snapshot-manager
// PURPOSE: Snapshot Manager - Gerenciador de Snapshots P1-HEX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   STORAGE_KEY, SCHEMA_VERSION, generateChecksum from ./persistence-port.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSnapshotManager() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CONTAINER_MAIN_EVENTS.STATE_RESTORE
// LISTENS (eventos):
//   CONTAINER_MAIN_EVENTS.READY
//   CONTAINER_MAIN_EVENTS.STATE_CHANGED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { STORAGE_KEY, SCHEMA_VERSION, generateChecksum } from './persistence-port.js';

export const VERSION = '3.0.0-P1-HEX';
export const MODULE_ID = 'snapshot-manager';

const CONTAINER_MAIN_EVENTS = {
  STATE_CHANGED: 'container-main.state.changed',
  STATE_RESTORE: 'container-main.state.restore',
  READY: 'container-main.ready'
};

export class SnapshotManager {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._persistence = context.persistence || null;
    this._containerAdapter = context.containerAdapter || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._timerPort = context.ports?.timer || null;
    this._autoSave = context.autoSave !== false;
    this._unsubs = [];
    this._saveTimeoutId = null;
    this._metrics = { snapshots: 0, saves: 0, restores: 0, errors: 0 };
    this._containerMainState = null;
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

  get schemaVersion() { return SCHEMA_VERSION; }

  init() {
    if (this._autoSave) this._setupListeners();
    this._setupContainerMainListener();
    return this;
  }

  _setupListeners() {
    const events = ['container:created', 'container:destroyed', 'container:layoutPolicyChanged', 'container:dockChanged', 'container:activated'];
    events.forEach(evt => {
      const unsub = this._events?.on?.(evt, () => this._onContainerChange(evt));
      if (typeof unsub === 'function') this._unsubs.push(unsub);
    });
  }

  _setupContainerMainListener() {
    if (!this._events || typeof this._events.on !== 'function') return;
    const unsub = this._events.on(CONTAINER_MAIN_EVENTS.STATE_CHANGED, (data: Record<string, unknown>) => {
      if (data && data.state) {
        this._containerMainState = { containerId: data.containerId || 'container-main', ...data.state, timestamp: Date.now() };
        this._track('snapshot:container-main:state-received', { containerId: data.containerId });
        if (this._autoSave) this._debouncedSave();
      }
    });
    if (typeof unsub === 'function') this._unsubs.push(unsub);
    const readyUnsub = this._events.on(CONTAINER_MAIN_EVENTS.READY, (data: Record<string, unknown>) => {
      this._track('snapshot:container-main:ready', { containerId: data?.containerId, mode: data?.mode });
    });
    if (typeof readyUnsub === 'function') this._unsubs.push(readyUnsub);
  }

  // P1-HEX: Use TimerPort for debounced save
  _debouncedSave() {
    this._clearTimeout(this._saveTimeoutId);
    this._saveTimeoutId = this._setTimeout(() => { this.save(); }, 500);
  }

  async _onContainerChange(eventName: string) {
    this._track('snapshot:trigger', { event: eventName });
    await this.save();
  }

  createSnapshot() {
    const containers = this._containerAdapter?.listAll?.() || [];
    const policy = this._containerAdapter?.getPolicy?.() || 'ephemeral';
    const payload = {
      version: 'P8-AAA-P1-HEX',
      timestamp: Date.now(),
      policy,
// @ts-expect-error TS migration - TS2578
      containers: containers.map((c: unknown) => ({ id: c.id, dock: c.dock || { region: 'main', slot: 'primary' }, layoutPolicy: c.layoutPolicy || { mode: 'inherit' }, active: c.active || false, panelId: c.panelId || null })),
      containerMainUI: this._containerMainState || null
    };
    const checksum = generateChecksum(payload);
    const snapshotId = `snap_${Date.now()}_${checksum.substring(0, 8)}`;
    this._metrics.snapshots++;
    this._emit(PERSISTENCE_EVENTS.SNAPSHOT_CREATED, { snapshotId, schemaVersion: SCHEMA_VERSION, containers: payload.containers.length, hasContainerMainUI: !!payload.containerMainUI, checksum });
    this._track('snapshot:created', { snapshotId, containers: payload.containers.length, hasContainerMainUI: !!payload.containerMainUI });
    return { ...payload, snapshotId, checksum };
  }

  async save() {
    try {
      if (!this._persistence) return { ok: false, error: 'No persistence' };
      const snapshot = this.createSnapshot();
      const result = await this._persistence.save(STORAGE_KEY, snapshot);
      if (result.ok) {
        this._metrics.saves++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_SAVED, { snapshotId: snapshot.snapshotId, containers: snapshot.containers.length, schemaVersion: SCHEMA_VERSION });
      }
      return result;
    } catch (error: any) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.SNAPSHOT_ERROR, { error: error.message, schemaVersion: SCHEMA_VERSION });
      this._track('snapshot:save:error', { error: error.message });
      return { ok: false, error: error.message };
    }
  }

  async restore(snapshotData: Record<string, unknown>) {
    try {
      if (!snapshotData) {
        const loaded = await this._persistence?.load?.(STORAGE_KEY);
        if (!loaded || !loaded.ok) return { ok: false, error: 'No snapshot to restore' };
        snapshotData = loaded.data;
      }
      this._metrics.restores++;
      if (snapshotData.containerMainUI) this._emitContainerMainRestore(snapshotData.containerMainUI);
// @ts-expect-error TS migration - TS2339
      this._emit(PERSISTENCE_EVENTS.SNAPSHOT_RESTORED, { snapshotId: snapshotData.snapshotId, containers: snapshotData.containers?.length || 0, hasContainerMainUI: !!snapshotData.containerMainUI });
      this._track('snapshot:restored', { snapshotId: snapshotData.snapshotId, hasContainerMainUI: !!snapshotData.containerMainUI });
      return { ok: true, snapshot: snapshotData };
    } catch (error: any) {
      this._metrics.errors++;
      this._track('snapshot:restore:error', { error: error.message });
      return { ok: false, error: error.message };
    }
  }

  _emitContainerMainRestore(containerMainState: unknown) {
    if (!this._events || typeof this._events.emit !== 'function') return;
    this._events.emit(CONTAINER_MAIN_EVENTS.STATE_RESTORE, {
// @ts-expect-error TS migration - TS2339
      containerId: containerMainState.containerId || 'container-main',
// @ts-expect-error TS migration - TS2339
      state: { collapsed: containerMainState.collapsed || false, fullscreen: containerMainState.fullscreen || false, minimized: containerMainState.minimized || false },
      source: MODULE_ID, timestamp: Date.now()
    });
// @ts-expect-error TS migration - TS2339
    this._track('snapshot:container-main:restore-emitted', { containerId: containerMainState.containerId });
  }

  getContainerMainState() { return this._containerMainState; }
  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now(), schemaVersion: SCHEMA_VERSION }); }
  _track(event: string, data: Record<string, unknown> = {}) { this._telemetry?.track?.(event, data); }

  destroy() {
    this._clearTimeout(this._saveTimeoutId);
    this._saveTimeoutId = null;
    this._unsubs.forEach((u: unknown) => { try { if (typeof u === 'function') u(); } catch(e) {} });
    this._unsubs = [];
    this._containerMainState = null;
  }

  healthCheck() {
    const checks = { hasPersistence: !!this._persistence, hasContainerAdapter: !!this._containerAdapter, hasEvents: !!this._events, hasContainerMainState: !!this._containerMainState };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 3 ? 'healthy' : passed >= 2 ? 'degraded' : 'unhealthy', score: `${passed}/4`, checks, schemaVersion: SCHEMA_VERSION, version: VERSION, p1HexCompliant: true };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, autoSave: this._autoSave, hasContainerMainState: !!this._containerMainState, metrics: { ...this._metrics }, p1HexCompliant: true }; }
}

export function createSnapshotManager(context: Record<string, unknown>) { return new SnapshotManager(context); }
export default { SnapshotManager, createSnapshotManager, SCHEMA_VERSION, VERSION, MODULE_ID, CONTAINER_MAIN_EVENTS };
