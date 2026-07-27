import { StateController as _StateController } from "../state/controller.js";
import { EventBusPort, StoragePort, TelemetryPort } from "../ports/index.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const StateController = _StateController;
const MODULE_ID = "panel-16:snapshot-manager";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MAX_SNAPSHOTS = 10;
const STORAGE_KEY = "p16_snapshots";
const SNAPSHOT_EVENTS = Object.freeze({
  CREATED: "panel-16:snapshot-manager:created",
  RESTORED: "panel-16:snapshot-manager:restored"
});
class SnapshotManagerClass {
  constructor() {
    this._snapshots = [];
    this._namedSnapshots = /* @__PURE__ */ new Map();
    this._autoSaveEnabled = false;
    this._autoSaveInterval = null;
    this._metrics = { created: 0, restored: 0, exported: 0, imported: 0 };
  }
  // Inicializa e carrega snapshots persistidos
  init() {
    try {
      const saved = StoragePort.local.get(STORAGE_KEY);
      if (saved?.snapshots) this._snapshots = saved.snapshots;
      if (saved?.named) this._namedSnapshots = new Map(Object.entries(saved.named));
      TelemetryPort.track(LIFECYCLE_EVENTS.INITIALIZED, { feature: "snapshot-manager", count: this._snapshots.length, named: this._namedSnapshots.size });
    } catch (e) {
    }
    return this;
  }
  // Cria snapshot com metadata
  create(name = null, tags = []) {
    const snapshot = {
      id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      name: name || `Snapshot ${this._snapshots.length + 1}`,
      timestamp: Date.now(),
      tags,
      data: StateController.snapshot()
    };
    this._snapshots.push(snapshot);
    if (this._snapshots.length > MAX_SNAPSHOTS) {
      this._snapshots = this._snapshots.slice(-MAX_SNAPSHOTS);
    }
    if (name) {
      this._namedSnapshots.set(name, snapshot);
    }
    this._persist();
    this._metrics.created++;
    TelemetryPort.track(LIFECYCLE_EVENTS.DATA_LOADED, { feature: "snapshot", id: snapshot.id, name: snapshot.name });
    EventBusPort.emit(SNAPSHOT_EVENTS.CREATED, { snapshotId: snapshot.id, snapshotName: snapshot.name, source: MODULE_ID, timestamp: Date.now() });
    return snapshot;
  }
  // Restaura snapshot por ID ou nome
  restore(idOrName, options = {}) {
    const snapshot = this.get(idOrName);
    if (!snapshot) {
      TelemetryPort.warn("snapshot:restore-failed", { idOrName, reason: "not-found" });
      return false;
    }
    StateController.restore(snapshot.data, options);
    this._metrics.restored++;
    TelemetryPort.track(LIFECYCLE_EVENTS.DATA_LOADED, { feature: "snapshot", action: "restored", id: snapshot.id, name: snapshot.name });
    EventBusPort.emit(SNAPSHOT_EVENTS.RESTORED, { snapshotId: snapshot.id, snapshotName: snapshot.name, source: MODULE_ID, timestamp: Date.now() });
    return true;
  }
  // Obtém snapshot por ID ou nome
  get(idOrName) {
    if (this._namedSnapshots.has(idOrName)) {
      return this._namedSnapshots.get(idOrName);
    }
    return this._snapshots.find((s) => s.id === idOrName || s.name === idOrName);
  }
  // Lista todos os snapshots
  list() {
    return this._snapshots.map((s) => ({
      id: s.id,
      name: s.name,
      timestamp: s.timestamp,
      tags: s.tags,
      age: Date.now() - Number(s.timestamp)
    }));
  }
  // Remove snapshot
  remove(idOrName) {
    const idx = this._snapshots.findIndex((s) => s.id === idOrName || s.name === idOrName);
    if (idx === -1) return false;
    const removed = this._snapshots.splice(idx, 1)[0];
    if (this._namedSnapshots.has(removed.name)) {
      this._namedSnapshots.delete(removed.name);
    }
    this._persist();
    TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: "snapshot", id: removed.id });
    return true;
  }
  // Limpa todos os snapshots
  clear() {
    const count = this._snapshots.length;
    this._snapshots = [];
    this._namedSnapshots.clear();
    this._persist();
    TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: "snapshot", action: "cleared", count });
    return count;
  }
  // Diff entre dois snapshots ou estado atual
  diff(idOrName1, idOrName2 = null) {
    const snap1 = this.get(idOrName1);
    if (!snap1) return null;
    const data1 = snap1.data;
    const data2 = idOrName2 ? this.get(idOrName2)?.data : StateController.snapshot();
    if (!data2) return null;
    const changes = [];
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(data1), ...Object.keys(data2)]);
    for (const key of allKeys) {
      const v1 = JSON.stringify(data1[key]);
      const v2 = JSON.stringify(data2[key]);
      if (v1 !== v2) {
        changes.push({
          key,
          before: data1[key],
          after: data2[key],
          type: !data1.hasOwnProperty(key) ? "added" : !data2.hasOwnProperty(key) ? "removed" : "changed"
        });
      }
    }
    return { snapshot1: snap1.id, snapshot2: idOrName2 || "current", changes, changedKeys: changes.length };
  }
  // Export para JSON
  export(idOrName = null) {
    const data = idOrName ? this.get(idOrName) : { snapshots: this._snapshots, named: Object.fromEntries(this._namedSnapshots) };
    if (!data) return null;
    this._metrics.exported++;
    TelemetryPort.track(LIFECYCLE_EVENTS.DATA_LOADED, { feature: "snapshot", action: "exported", single: !!idOrName });
    return JSON.stringify(data, null, 2);
  }
  // Import de JSON
  import(jsonStr, options = { merge: false }) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.snapshots) {
        if (options.merge) {
          this._snapshots = [...this._snapshots, ...data.snapshots].slice(-MAX_SNAPSHOTS);
        } else {
          this._snapshots = data.snapshots.slice(-MAX_SNAPSHOTS);
        }
      }
      if (data.named) {
        for (const [name, snap] of Object.entries(data.named)) {
          this._namedSnapshots.set(name, snap);
        }
      }
      if (data.id && data.data) {
        this._snapshots.push(data);
        if (data.name) this._namedSnapshots.set(data.name, data);
      }
      this._persist();
      this._metrics.imported++;
      TelemetryPort.track(LIFECYCLE_EVENTS.DATA_LOADED, { feature: "snapshot", action: "imported", count: this._snapshots.length });
      return true;
    } catch (e) {
      TelemetryPort.error("snapshot:import-failed", e);
      return false;
    }
  }
  // AutoSave periódico
  enableAutoSave(intervalMs = 6e4) {
    this.disableAutoSave();
    this._autoSaveEnabled = true;
    this._autoSaveInterval = setInterval(() => {
      this.create("autosave", ["auto"]);
    }, intervalMs);
    TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: "snapshot", action: "autosave-enabled", interval: intervalMs });
  }
  disableAutoSave() {
    if (this._autoSaveInterval) {
      clearInterval(this._autoSaveInterval);
      this._autoSaveInterval = null;
    }
    this._autoSaveEnabled = false;
  }
  // Persistência
  _persist() {
    try {
      StoragePort.local.set(STORAGE_KEY, {
        snapshots: this._snapshots,
        named: Object.fromEntries(this._namedSnapshots)
      });
    } catch (e) {
    }
  }
  // Último snapshot
  getLatest() {
    return this._snapshots[this._snapshots.length - 1] || null;
  }
  // Observability
  getMetrics() {
    return { ...this._metrics, count: this._snapshots.length, named: this._namedSnapshots.size };
  }
  healthCheck() {
    return {
      status: "HEALTHY",
      moduleId: MODULE_ID,
      version: VERSION,
      checks: { initialized: this._snapshots !== void 0, autoSaveActive: this._autoSaveEnabled },
      metrics: this.getMetrics(),
      p24Instrumented: true,
      timestamp: Date.now()
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      snapshots: this.list(),
      metrics: this.getMetrics(),
      autoSaveEnabled: this._autoSaveEnabled
    };
  }
}
const SnapshotManager = new SnapshotManagerClass();
var snapshot_manager_default = SnapshotManager;
export {
  MODULE_ID,
  SNAPSHOT_EVENTS,
  SnapshotManager,
  VERSION,
  snapshot_manager_default as default
};
