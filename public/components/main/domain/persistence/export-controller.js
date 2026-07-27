import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
import { SCHEMA_VERSION, generateChecksum } from "./persistence-port.js";
const VERSION = "2.1.0-P18EC";
const MODULE_ID = "export-controller";
class ExportController {
  constructor(context = {}) {
    this._snapshotManager = context.snapshotManager || null;
    this._persistence = context.persistence || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { exports: 0, errors: 0 };
  }
  async exportSnapshot(options = {}) {
    const { format = "json", includeAudit = false } = options;
    this._emit(PERSISTENCE_EVENTS.EXPORT_STARTED, { format, includeAudit });
    this._track("export:started", { format });
    try {
      let snapshot;
      if (this._snapshotManager?.createSnapshot) {
        snapshot = this._snapshotManager.createSnapshot();
      } else if (this._persistence?.load) {
        const result = await this._persistence.load();
        snapshot = result.ok ? result.data : null;
      }
      if (!snapshot) throw new Error("No snapshot available to export");
      const exportData = {
        exportVersion: VERSION,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: Date.now(),
        format,
        checksum: generateChecksum(snapshot),
        snapshot,
        meta: { source: MODULE_ID, includeAudit }
      };
      this._metrics.exports++;
      this._emit(PERSISTENCE_EVENTS.EXPORT_COMPLETED, { checksum: exportData.checksum, size: JSON.stringify(exportData).length });
      this._track("export:completed", { format });
      return { ok: true, data: exportData, json: JSON.stringify(exportData, null, 2) };
    } catch (error) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.EXPORT_ERROR, { error: error.message });
      this._track("export:error", { error: error.message });
      return { ok: false, error: error.message };
    }
  }
  async exportToDownload(options = {}) {
    const result = await this.exportSnapshot(options);
    if (!result.ok) return result;
    const filename = `dshowdash-snapshot-${Date.now()}.json`;
    return { ok: true, filename, content: result.json, mimeType: "application/json", data: result.data };
  }
  _emit(event, data = {}) {
    try {
      this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    } catch (e) {
    }
  }
  _track(event, data = {}) {
    try {
      this._telemetry?.track?.(event, data);
    } catch (e) {
    }
  }
  healthCheck() {
    return { status: this._snapshotManager || this._persistence ? "healthy" : "degraded", hasSnapshotManager: !!this._snapshotManager, hasPersistence: !!this._persistence, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, metrics: { ...this._metrics } };
  }
}
function createExportController(context) {
  return new ExportController(context);
}
var export_controller_default = { ExportController, createExportController, VERSION, MODULE_ID };
export {
  ExportController,
  MODULE_ID,
  VERSION,
  createExportController,
  export_controller_default as default
};
