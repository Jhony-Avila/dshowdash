// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-persistence
// PURPOSE: Persistence - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createPersistenceAdapter() — exported function
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

export * from './snapshot-manager.js';
export * from './rehydration-controller.js';
export * from './export-controller.js';
export * from './import-controller.js';

export const VERSION = '2.1.0-AAA-P4';
export const MODULE_ID = 'main-persistence';

// Factory function para MainEngine
export function createPersistenceAdapter(options: Record<string, any> = {}) {
  const _ports = options.ports || {};
  const _events = _ports.events || null;
  const _telemetry = _ports.telemetry || null;
  
  let _snapshots = new Map();
  let _metrics = { saves: 0, loads: 0, errors: 0 };
  
  return {
    VERSION,
    MODULE_ID,
    
    async save(key: string, data: Record<string, unknown>) {
      try {
        _snapshots.set(key, { data, savedAt: Date.now() });
        _metrics.saves++;
        _events?.emit?.('persistence:saved', { key });
        return { success: true, key };
      } catch (error: any) {
        _metrics.errors++;
        _telemetry?.track?.('persistence:save-error', { key, error: error.message });
        return { success: false, error: error.message };
      }
    },
    
    async load(key: string) {
      try {
        const snapshot = _snapshots.get(key);
        _metrics.loads++;
        if (snapshot) {
          _events?.emit?.('persistence:loaded', { key });
          return { success: true, data: snapshot.data, savedAt: snapshot.savedAt };
        }
        return { success: false, error: 'not-found' };
      } catch (error: any) {
        _metrics.errors++;
        return { success: false, error: error.message };
      }
    },
    
    async delete(key: string) {
      const result = _snapshots.delete(key);
      _events?.emit?.('persistence:deleted', { key });
      return { success: result };
    },
    
    async clear() {
      _snapshots.clear();
      _events?.emit?.('persistence:cleared', {});
      return { success: true };
    },
    
    has(key: string) {
      return _snapshots.has(key);
    },
    
    keys() {
      return Array.from(_snapshots.keys());
    },
    
    getMetrics() {
      return { ..._metrics, count: _snapshots.size };
    },
    
    healthCheck() {
      return {
        status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        metrics: this.getMetrics()
      };
    },
    
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        snapshotCount: _snapshots.size,
        metrics: this.getMetrics()
      };
    },
    
    destroy() {
      _snapshots.clear();
      _metrics = { saves: 0, loads: 0, errors: 0 };
    }
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modules: ['snapshot-manager', 'rehydration-controller', 'export-controller', 'import-controller']
  };
}

export default { VERSION, MODULE_ID, healthCheck, createPersistenceAdapter };
