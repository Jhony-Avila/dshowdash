// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: rehydration-controller
// PURPOSE: Rehydration Controller - Controlador de Reidratação P8 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   STORAGE_KEY, SCHEMA_VERSION from ./persistence-port.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createRehydrationController() — exported function
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

import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { STORAGE_KEY, SCHEMA_VERSION } from './persistence-port.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'rehydration-controller';

export class RehydrationController {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._persistence = context.persistence || null;
    this._containerAdapter = context.containerAdapter || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { restores: 0, errors: 0, skipped: 0, lastRestoreAt: null };
  }

  async restore() {
    this._emit(PERSISTENCE_EVENTS.REHYDRATION_STARTED, { schemaVersion: SCHEMA_VERSION });
    this._track('rehydration:started', {});
    try {
      if (!this._persistence) throw new Error('No persistence adapter');
      const result = await this._persistence.load(STORAGE_KEY);
      if (!result.ok) {
        if (result.expired) {
          this._metrics.skipped++;
          this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: false, reason: 'expired', schemaVersion: SCHEMA_VERSION });
          return { ok: true, restored: false, reason: 'expired' };
        }
        if (result.corrupted) {
          this._metrics.errors++;
          this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { reason: 'corrupted', schemaVersion: SCHEMA_VERSION });
          return { ok: false, error: 'Snapshot corrupted' };
        }
        throw new Error(result.error || 'Load failed');
      }
      if (!result.exists || !result.data) {
        this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: false, reason: 'no-snapshot', schemaVersion: SCHEMA_VERSION });
        return { ok: true, restored: false, reason: 'no-snapshot' };
      }
      const snapshot = result.data;
      if (!this._validateSnapshot(snapshot)) {
        this._metrics.errors++;
        this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { reason: 'invalid-snapshot', schemaVersion: SCHEMA_VERSION });
        return { ok: false, error: 'Invalid snapshot schema' };
      }
      if (this._containerAdapter?.restore) await this._containerAdapter.restore(snapshot);
      this._metrics.restores++;
      this._metrics.lastRestoreAt = Date.now();
      this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: true, containers: snapshot.containers?.length || 0, schemaVersion: SCHEMA_VERSION, snapshotId: snapshot.snapshotId });
      this._track('rehydration:completed', { containers: snapshot.containers?.length || 0 });
      return { ok: true, restored: true, snapshot };
    } catch (error: any) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { error: error.message, schemaVersion: SCHEMA_VERSION });
      this._track('rehydration:error', { error: error.message });
      return { ok: false, error: error.message };
    }
  }

  _validateSnapshot(snapshot: unknown) {
    if (!snapshot) return false;
    if (typeof snapshot !== 'object') return false;
// @ts-expect-error TS migration - TS2339
    if (!snapshot.version) return false;
// @ts-expect-error TS migration - TS2339
    if (!Array.isArray(snapshot.containers)) return false;
    return true;
  }

  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  _track(event: string, data: Record<string, unknown> = {}) { this._telemetry?.track?.(event, data); }

  healthCheck() {
    const checks = { hasPersistence: !!this._persistence, hasContainerAdapter: !!this._containerAdapter };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? 'healthy' : passed >= 1 ? 'degraded' : 'unhealthy', score: `${passed}/2`, checks, schemaVersion: SCHEMA_VERSION, version: VERSION };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, metrics: { ...this._metrics } }; }
}

export function createRehydrationController(context: Record<string, unknown>) { return new RehydrationController(context); }
export default { RehydrationController, createRehydrationController, VERSION, MODULE_ID };
