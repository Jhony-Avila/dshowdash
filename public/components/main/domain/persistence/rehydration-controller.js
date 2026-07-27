import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
import { STORAGE_KEY, SCHEMA_VERSION } from "./persistence-port.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "rehydration-controller";
class RehydrationController {
  constructor(context = {}) {
    this._persistence = context.persistence || null;
    this._containerAdapter = context.containerAdapter || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { restores: 0, errors: 0, skipped: 0, lastRestoreAt: null };
  }
  async restore() {
    this._emit(PERSISTENCE_EVENTS.REHYDRATION_STARTED, { schemaVersion: SCHEMA_VERSION });
    this._track("rehydration:started", {});
    try {
      if (!this._persistence) throw new Error("No persistence adapter");
      const result = await this._persistence.load(STORAGE_KEY);
      if (!result.ok) {
        if (result.expired) {
          this._metrics.skipped++;
          this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: false, reason: "expired", schemaVersion: SCHEMA_VERSION });
          return { ok: true, restored: false, reason: "expired" };
        }
        if (result.corrupted) {
          this._metrics.errors++;
          this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { reason: "corrupted", schemaVersion: SCHEMA_VERSION });
          return { ok: false, error: "Snapshot corrupted" };
        }
        throw new Error(result.error || "Load failed");
      }
      if (!result.exists || !result.data) {
        this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: false, reason: "no-snapshot", schemaVersion: SCHEMA_VERSION });
        return { ok: true, restored: false, reason: "no-snapshot" };
      }
      const snapshot = result.data;
      if (!this._validateSnapshot(snapshot)) {
        this._metrics.errors++;
        this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { reason: "invalid-snapshot", schemaVersion: SCHEMA_VERSION });
        return { ok: false, error: "Invalid snapshot schema" };
      }
      if (this._containerAdapter?.restore) await this._containerAdapter.restore(snapshot);
      this._metrics.restores++;
      this._metrics.lastRestoreAt = Date.now();
      this._emit(PERSISTENCE_EVENTS.REHYDRATION_COMPLETED, { restored: true, containers: snapshot.containers?.length || 0, schemaVersion: SCHEMA_VERSION, snapshotId: snapshot.snapshotId });
      this._track("rehydration:completed", { containers: snapshot.containers?.length || 0 });
      return { ok: true, restored: true, snapshot };
    } catch (error) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.REHYDRATION_ERROR, { error: error.message, schemaVersion: SCHEMA_VERSION });
      this._track("rehydration:error", { error: error.message });
      return { ok: false, error: error.message };
    }
  }
  _validateSnapshot(snapshot) {
    if (!snapshot) return false;
    if (typeof snapshot !== "object") return false;
    if (!snapshot.version) return false;
    if (!Array.isArray(snapshot.containers)) return false;
    return true;
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  _track(event, data = {}) {
    this._telemetry?.track?.(event, data);
  }
  healthCheck() {
    const checks = { hasPersistence: !!this._persistence, hasContainerAdapter: !!this._containerAdapter };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "healthy" : passed >= 1 ? "degraded" : "unhealthy", score: `${passed}/2`, checks, schemaVersion: SCHEMA_VERSION, version: VERSION };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, metrics: { ...this._metrics } };
  }
}
function createRehydrationController(context) {
  return new RehydrationController(context);
}
var rehydration_controller_default = { RehydrationController, createRehydrationController, VERSION, MODULE_ID };
export {
  MODULE_ID,
  RehydrationController,
  VERSION,
  createRehydrationController,
  rehydration_controller_default as default
};
