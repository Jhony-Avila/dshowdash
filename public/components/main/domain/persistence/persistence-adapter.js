import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
import { PersistencePort, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_TTL_MS, generateChecksum, validateChecksum, isExpired, isSchemaCompatible } from "./persistence-port.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "persistence-adapter";
class PersistenceAdapter extends PersistencePort {
  constructor(context = {}) {
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
      if (!payload) return { ok: false, error: "No payload" };
      const checksum = generateChecksum(payload);
      const data = { schemaVersion: SCHEMA_VERSION, createdAt: Date.now(), checksum, payload };
      const serialized = JSON.stringify(data);
      if (typeof localStorage !== "undefined") localStorage.setItem(key, serialized);
      this._metrics.saves++;
      this._emit(PERSISTENCE_EVENTS.SAVED, { key, size: serialized.length, schemaVersion: SCHEMA_VERSION, checksum });
      this._track("persistence:saved", { key, size: serialized.length, schemaVersion: SCHEMA_VERSION });
      return { ok: true, key, size: serialized.length, checksum };
    } catch (error) {
      this._metrics.errors++;
      this._track("persistence:save:error", { key, error: error.message });
      return { ok: false, error: error.message };
    }
  }
  // @ts-expect-error TS migration - TS2416
  async load(key = this._defaultKey) {
    try {
      let raw = null;
      if (typeof localStorage !== "undefined") raw = localStorage.getItem(key);
      if (!raw) {
        this._metrics.loads++;
        return { ok: true, data: null, exists: false };
      }
      const data = JSON.parse(raw);
      if (isExpired(data.createdAt, this._ttlMs)) {
        this._metrics.expired++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_EXPIRED, { key, createdAt: data.createdAt, schemaVersion: data.schemaVersion });
        this._track("snapshot:expired", { key, age: Date.now() - data.createdAt });
        await this.clear(key);
        return { ok: true, data: null, exists: false, expired: true };
      }
      if (!isSchemaCompatible(data.schemaVersion)) {
        this._metrics.invalid++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_INVALID, { key, reason: "schema-incompatible", snapshotVersion: data.schemaVersion, currentVersion: SCHEMA_VERSION });
        this._track("snapshot:invalid", { key, reason: "schema-incompatible" });
        return { ok: false, error: "Schema incompatible", schemaVersion: data.schemaVersion };
      }
      if (data.checksum && !validateChecksum(data.payload, data.checksum)) {
        this._metrics.invalid++;
        this._emit(PERSISTENCE_EVENTS.SNAPSHOT_INTEGRITY_FAILED, { key, schemaVersion: data.schemaVersion });
        this._track("snapshot:integrity:failed", { key });
        return { ok: false, error: "Checksum mismatch", corrupted: true };
      }
      this._metrics.loads++;
      this._emit(PERSISTENCE_EVENTS.LOADED, { key, schemaVersion: data.schemaVersion });
      this._track("persistence:loaded", { key, schemaVersion: data.schemaVersion });
      return { ok: true, data: data.payload, exists: true, schemaVersion: data.schemaVersion, createdAt: data.createdAt };
    } catch (error) {
      this._metrics.errors++;
      this._track("persistence:load:error", { key, error: error.message });
      return { ok: false, error: error.message, data: null };
    }
  }
  // @ts-expect-error TS migration - TS2416
  async clear(key = this._defaultKey) {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      this._metrics.clears++;
      this._emit(PERSISTENCE_EVENTS.CLEARED, { key });
      this._track("persistence:cleared", { key });
      return { ok: true, key };
    } catch (error) {
      this._metrics.errors++;
      return { ok: false, error: error.message };
    }
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now(), schemaVersion: SCHEMA_VERSION });
  }
  _track(event, data = {}) {
    this._telemetry?.track?.(event, data);
  }
  // @ts-expect-error TS migration - TS2416
  healthCheck() {
    let storageAvailable = false;
    try {
      if (typeof localStorage !== "undefined") {
        const testKey = "__p8_test__";
        localStorage.setItem(testKey, "1");
        localStorage.removeItem(testKey);
        storageAvailable = true;
      }
    } catch (e) {
      storageAvailable = false;
    }
    return { status: storageAvailable ? "healthy" : "degraded", storageAvailable, schemaVersion: SCHEMA_VERSION, ttlMs: this._ttlMs, version: VERSION, moduleId: MODULE_ID, metrics: { ...this._metrics } };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, defaultKey: this._defaultKey, ttlMs: this._ttlMs, metrics: { ...this._metrics } };
  }
}
function createPersistenceAdapter(context) {
  return new PersistenceAdapter(context);
}
var persistence_adapter_default = { PersistenceAdapter, createPersistenceAdapter, VERSION, MODULE_ID };
export {
  MODULE_ID,
  PersistenceAdapter,
  VERSION,
  createPersistenceAdapter,
  persistence_adapter_default as default
};
