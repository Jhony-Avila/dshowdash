// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:state-snapshots
// PURPOSE: State Snapshots - Sistema de salvamento e restauração de estado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//   SNAPSHOT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SNAPSHOT_TYPES — exported value
//   createStateSnapshots() — exported function
//   getStateSnapshots() — exported function
//   resetStateSnapshots() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SNAPSHOT_EVENT_NAMES.CLEARED
//   SNAPSHOT_EVENT_NAMES.CREATED
//   SNAPSHOT_EVENT_NAMES.DELETED
//   SNAPSHOT_EVENT_NAMES.RESTORE_REQUESTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';
import { SNAPSHOT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '1.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'container-main:state-snapshots';

export const SNAPSHOT_TYPES = Object.freeze({
  FULL: 'full',
  PARTIAL: 'partial',
  DIFF: 'diff',
  AUTO: 'auto'
});

export function createStateSnapshots(options: Record<string, unknown> = {}) {
  const {
    maxSnapshots = 50,
    autoSaveInterval = 0,
    persistToStorage = false,
    storageKey = 'container-main-snapshots',
    compressionEnabled = false
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _snapshots = new Map();
  let _autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  interface BootstrapLike {
    getKernel: () => Record<string, (...args: unknown[]) => unknown> | null;
    getGlobalState: () => Record<string, unknown> | null;
    getState: () => Record<string, unknown>;
    getErrors: () => unknown[] | null;
    getPerformanceMonitor: () => Record<string, unknown> | null;
    getPluginSystem: () => Record<string, unknown> | null;
    [key: string]: unknown;
  }
  let _bootstrap: BootstrapLike | null = null;
  let _eventBus: { emit: (event: string, data: Record<string, unknown>) => void; [key: string]: unknown } | null = null;
  let _snapshotCounter = 0;

  function _serialize(data: Record<string, unknown>) {
    try {
      const json = JSON.stringify(data);
      if (compressionEnabled && json.length > 10000) {
        return { compressed: true, data: btoa(json) };
      }
      return { compressed: false, data: json };
    } catch (e) {
      _logger.error('Serialize error:', e);
      return null;
    }
  }

  function _deserialize(stored: { compressed: boolean; data: string } | null) {
    try {
      if (!stored) return null;
      if (stored.compressed) return JSON.parse(atob(stored.data));
      return JSON.parse(stored.data);
    } catch (e) {
      _logger.error('Deserialize error:', e);
      return null;
    }
  }

  function _collectState() {
    if (!_bootstrap) return null;
    try {
      const kernel = _bootstrap.getKernel();
      const globalState = _bootstrap.getGlobalState();
      return {
        bootstrap: { state: _bootstrap.getState(), errors: _bootstrap.getErrors()?.length || 0 },
        kernel: kernel ? { state: kernel.getState(), activeSlot: kernel.getActiveSlot(), managers: kernel.listManagers() } : null,
        globalState: (globalState as Record<string, (...args: unknown[]) => unknown> | null)?.isAvailable?.() ? { user: ((globalState as Record<string, Record<string, (...args: unknown[]) => unknown>>)?.selectors)?.getUser?.() || null, theme: ((globalState as Record<string, Record<string, (...args: unknown[]) => unknown>>)?.selectors)?.getTheme?.() || null } : null,
        performance: (_bootstrap.getPerformanceMonitor() as Record<string, (...args: unknown[]) => unknown> | null)?.collect?.() || null,
        plugins: (_bootstrap.getPluginSystem() as Record<string, (...args: unknown[]) => unknown> | null)?.list?.() || [],
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : null
      };
    } catch (e) {
      _logger.error('Collect state error:', e);
      return null;
    }
  }

  function _persistToStorage() {
    if (!persistToStorage) return;
    try {
      const data = Array.from(_snapshots.entries()).slice(-10);
      localStorage.setItem(String(storageKey), JSON.stringify(data));
    // @ts-expect-error strict migration — TS2345
    } catch (e) { _logger.warn('Persist to storage failed:', e); }
  }

  function _loadFromStorage() {
    if (!persistToStorage) return;
    try {
      const stored = localStorage.getItem(String(storageKey));
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach(([id, snapshot]: [string, unknown]) => _snapshots.set(id, snapshot));
        _logger.debug(`Loaded ${data.length} snapshots from storage`, {});
      }
    // @ts-expect-error strict migration — TS2345
    } catch (e) { _logger.warn('Load from storage failed:', e); }
  }

  const snapshots = {
    inject({ bootstrap, eventBus }: { bootstrap: BootstrapLike; eventBus: { emit: (event: string, data: Record<string, unknown>) => void; [key: string]: unknown } }) {
      _bootstrap = bootstrap;
      _eventBus = eventBus;
      _loadFromStorage();
    },

    create(name: string | null = null, type = SNAPSHOT_TYPES.FULL, metadata: Record<string, unknown> = {}) {
      const state = _collectState();
      if (!state) return null;

      const id = `snap-${++_snapshotCounter}-${Date.now()}`;
      const snapshotName = name || `Snapshot ${_snapshotCounter}`;

      const snapshot = {
        id, name: snapshotName, type,
        state: _serialize(state),
        metadata: { ...metadata, createdAt: Date.now() },
        size: 0
      };
      snapshot.size = JSON.stringify(snapshot).length;

      _snapshots.set(id, snapshot);

      if (_snapshots.size > Number(maxSnapshots)) {
        const oldest = _snapshots.keys().next().value;
        _snapshots.delete(oldest);
      }

      _persistToStorage();
      _eventBus?.emit(SNAPSHOT_EVENT_NAMES.CREATED, { id, name: snapshotName });
      _logger.debug(`Snapshot created: ${snapshotName} (${id})`, {});
      return id;
    },

    // @ts-expect-error strict migration — TS2345
    quick(name: string | null = null) { return this.create(name, SNAPSHOT_TYPES.AUTO, { quick: true }); },

    get(id: string) {
      const snapshot = _snapshots.get(id);
      if (!snapshot) return null;
      return { ...snapshot, state: _deserialize(snapshot.state) };
    },

    list() {
      return Array.from(_snapshots.values()).map(s => ({
        id: s.id, name: s.name, type: s.type, createdAt: s.metadata.createdAt, size: s.size
      }));
    },

    getLatest() {
      const entries = Array.from(_snapshots.entries());
      if (entries.length === 0) return null;
      const [id] = entries[entries.length - 1];
      return this.get(id);
    },

    compare(id1: string, id2: string) {
      const snap1 = this.get(id1);
      const snap2 = this.get(id2);
      if (!snap1 || !snap2) return null;

      const differences: unknown[] = [];
      function _compare(obj1: unknown, obj2: unknown, path = '') {
        if (obj1 === obj2) return;
        if (typeof obj1 !== typeof obj2) { differences.push({ path, type: 'type_change', from: typeof obj1, to: typeof obj2 }); return; }
        if (typeof obj1 !== 'object' || obj1 === null) { if (obj1 !== obj2) differences.push({ path, type: 'value_change', from: obj1, to: obj2 }); return; }
        const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
        for (const key of keys) { _compare((obj1 as Record<string, unknown>)?.[key], (obj2 as Record<string, unknown>)?.[key], path ? `${path}.${key}` : key); }
      }
      _compare(snap1.state, snap2.state);
      return {
        snapshot1: { id: id1, name: snap1.name, createdAt: snap1.metadata.createdAt },
        snapshot2: { id: id2, name: snap2.name, createdAt: snap2.metadata.createdAt },
        differences, totalChanges: differences.length
      };
    },

    compareWithCurrent(id: string) {
      const snapshot = this.get(id);
      if (!snapshot) return null;
      const currentState = _collectState();
      if (!currentState) return null;
      // @ts-expect-error strict migration — TS2345
      const tempId = this.create('__temp__', SNAPSHOT_TYPES.PARTIAL);
      // @ts-expect-error strict migration — TS2345
      const comparison = this.compare(id, tempId);
      // @ts-expect-error strict migration — TS2345
      this.delete(tempId);
      return comparison;
    },

    restore(id: string) {
      const snapshot = this.get(id);
      if (!snapshot) return { success: false, error: 'Snapshot not found' };
      _eventBus?.emit(SNAPSHOT_EVENT_NAMES.RESTORE_REQUESTED, { id, snapshot: snapshot.state });
      _logger.info(`Restore requested for: ${snapshot.name}`, {});
      return { success: true, message: 'Restore event emitted. Components should handle restoration.', snapshot: snapshot.state };
    },

    delete(id: string) {
      const deleted = _snapshots.delete(id);
      if (deleted) { _persistToStorage(); _eventBus?.emit(SNAPSHOT_EVENT_NAMES.DELETED, { id }); }
      return deleted;
    },

    clear() {
      _snapshots.clear();
      _persistToStorage();
      _eventBus?.emit(SNAPSHOT_EVENT_NAMES.CLEARED, {});
      _logger.info('All snapshots cleared', {});
    },

    startAutoSave(interval = autoSaveInterval) {
      if (Number(interval) <= 0) return;
      this.stopAutoSave();
      // @ts-expect-error strict migration — TS2345
      _autoSaveTimer = setInterval(() => { this.create(null, SNAPSHOT_TYPES.AUTO, { auto: true }); }, Number(interval));
      _logger.info(`Auto-save started: every ${interval}ms`, {});
    },

    stopAutoSave() {
      if (_autoSaveTimer !== null) { clearInterval(_autoSaveTimer); _autoSaveTimer = null; _logger.info('Auto-save stopped', {}); }
    },

    export(ids: string[] | null = null) {
      const toExport = ids ? ids.map((id: string) => _snapshots.get(id)).filter(Boolean) : Array.from(_snapshots.values());
      return JSON.stringify(toExport, null, 2);
    },

    import(jsonData: string) {
      try {
        const data = JSON.parse(jsonData);
        let imported = 0;
        for (const snapshot of data) { if (snapshot.id && snapshot.state) { _snapshots.set(snapshot.id, snapshot); imported++; } }
        _persistToStorage();
        _logger.info(`Imported ${imported} snapshots`, {});
        return { success: true, imported };
      } catch (e) { _logger.error('Import failed:', e); return { success: false, error: (e as Error).message }; }
    },

    count() { return _snapshots.size; },
    has(id: string) { return _snapshots.has(id); },

    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, snapshotCount: _snapshots.size, maxSnapshots, autoSaveActive: !!_autoSaveTimer, persistEnabled: persistToStorage };
    },

    info() {
      return { moduleId: MODULE_ID, version: VERSION, snapshotCount: _snapshots.size, maxSnapshots, types: Object.keys(SNAPSHOT_TYPES), persistEnabled: persistToStorage };
    },

    destroy() { this.stopAutoSave(); _snapshots.clear(); _logger.info('State snapshots destroyed', {}); }
  };

  return snapshots;
}

interface StateSnapshotsInstance {
  destroy: () => void;
  healthCheck: () => Record<string, unknown>;
  [key: string]: unknown;
}

let _instance: StateSnapshotsInstance | null = null;

export function getStateSnapshots(options: Record<string, unknown> = {}) {
  if (!_instance) { _instance = createStateSnapshots(options) as StateSnapshotsInstance; }
  return _instance;
}

export function resetStateSnapshots() {
  if (_instance) { _instance.destroy(); _instance = null; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(SNAPSHOT_TYPES) }; }

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID, SNAPSHOT_TYPES,
  createStateSnapshots, getStateSnapshots, resetStateSnapshots, info, healthCheck
};
