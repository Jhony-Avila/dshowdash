// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: persistence-adapter
// PURPOSE: Persistence Adapter - Implementação localStorage P8 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   PersistencePort, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_TTL_MS, generateChecksu...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createPersistenceAdapter() — exported function
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
import { PersistencePort, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_TTL_MS, generateChecksum, validateChecksum, isExpired, isSchemaCompatible } from './persistence-port.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'persistence-adapter';

export class PersistenceAdapter extends PersistencePort {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    super();
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._defaultKey = STORAGE_KEY;
    this._ttlMs = context.ttlMs || DEFAULT_TTL_MS;
    this._metrics = { saves: 0, loads: 0, clears: 0, errors: 0, expired: 0, invalid: 0 };
  }


  // @ts-expect-error TS migration - TS2416
  async save(key = this._defaultKey, payload) {
    try {
      if (!payload) return { ok: false, error: 'No payload' };
      const checksum = generateChecksum(payload);
      const data = { schemaVersion: SCHEMA_VERSION, createdAt: Date.now(), checksum, payload };
      const serialized = JSON.stringify(data);
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, serialized);
      this._metrics.saves++;
      this._emit(PERSISTENCE_EVENTS.SAVED, { key, size: serialized.length, schemaVersion: SCHEMA_VERSION, checksum });
      this._track('persistence:saved', { key, size: serialized.length, schemaVersion: SCHEMA_VERSION });
      return { ok: true, key, size: serialized.length, checksum };
    } catch (error: any) {
      this._metrics.errors++;
      this._track('persistence:save:error', { key, error: error.message });
      return { ok: false, error: error.message };
    }
  }


  // @ts-expect-error TS migration - TS2416
  async load(key = this._defaultKey) {
    try {
      let raw = null;
      if (typeof localStorage !== 'undefined') raw = localStorage.getItem(key);
      if (!raw) { this._metrics.loads++; return { ok: true, data: null as string | null, exists: false }; }
      const data = JSON.parse(raw);
      if (isExpired(data.createdAt, this._ttlMs)) {
        this._metrics.expired++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_EXPIRED, { key, createdAt: data.createdAt, schemaVersion: data.schemaVersion });
        this._track('snapshot:expired', { key, age: Date.now() - data.createdAt });
        await this.clear(key);
        return { ok: true, data: null as unknown, exists: false, expired: true };
      }
      if (!isSchemaCompatible(data.schemaVersion)) {
        this._metrics.invalid++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_INVALID, { key, reason: 'schema-incompatible', snapshotVersion: data.schemaVersion, currentVersion: SCHEMA_VERSION });
        this._track('snapshot:invalid', { key, reason: 'schema-incompatible' });
        return { ok: false, error: 'Schema incompatible', schemaVersion: data.schemaVersion };
      }
      if (data.checksum && !validateChecksum(data.payload, data.checksum)) {
        this._metrics.invalid++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_INTEGRITY_FAILED, { key, schemaVersion: data.schemaVersion });
        this._track('snapshot:integrity:failed', { key });
        return { ok: false, error: 'Checksum mismatch', corrupted: true };
      }
      this._metrics.loads++;
      this._emit(PERSISTENCE_EVENTS.LOADED, { key, schemaVersion: data.schemaVersion });
      this._track('persistence:loaded', { key, schemaVersion: data.schemaVersion });
      return { ok: true, data: data.payload, exists: true, schemaVersion: data.schemaVersion, createdAt: data.createdAt };
    } catch (error: any) {
      this._metrics.errors++;
      this._track('persistence:load:error', { key, error: error.message });
      return { ok: false, error: error.message, data: null as unknown };
    }
  }


  // @ts-expect-error TS migration - TS2416
  async clear(key = this._defaultKey) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      this._metrics.clears++;
      this._emit(PERSISTENCE_EVENTS.CLEARED, { key });
      this._track('persistence:cleared', { key });
      return { ok: true, key };
    } catch (error: any) {
      this._metrics.errors++;
      return { ok: false, error: error.message };
    }
  }

  _emit(event: string, data: Record<string, unknown> = {}) { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now(), schemaVersion: SCHEMA_VERSION }); }
  _track(event: string, data: Record<string, unknown> = {}) { this._telemetry?.track?.(event, data); }


  // @ts-expect-error TS migration - TS2416
  healthCheck() {
    let storageAvailable = false;
    try { if (typeof localStorage !== 'undefined') { const testKey = '__p8_test__'; localStorage.setItem(testKey, '1'); localStorage.removeItem(testKey); storageAvailable = true; } } catch (e) { storageAvailable = false; }
    return { status: storageAvailable ? 'healthy' : 'degraded', storageAvailable, schemaVersion: SCHEMA_VERSION, ttlMs: this._ttlMs, version: VERSION, moduleId: MODULE_ID, metrics: { ...this._metrics } };
  }
  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, defaultKey: this._defaultKey, ttlMs: this._ttlMs, metrics: { ...this._metrics } }; }
}

export function createPersistenceAdapter(context: Record<string, unknown>) { return new PersistenceAdapter(context); }
export default { PersistenceAdapter, createPersistenceAdapter, VERSION, MODULE_ID };
