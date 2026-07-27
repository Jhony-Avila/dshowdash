import {
  getLastSnapshot,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  getMaxSnapshots
} from "../state.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.state.snapshot-manager.operations.import-export";
function exportSnapshot(snapshotData) {
  if (!snapshotData) {
    snapshotData = getLastSnapshot();
  }
  if (!snapshotData) {
    return { ok: false, error: "no-snapshot", json: null };
  }
  try {
    const json = JSON.stringify(snapshotData, null, 2);
    return { ok: true, json, size: json.length };
  } catch (e) {
    return { ok: false, error: e.message, json: null };
  }
}
function importSnapshot(json) {
  if (!json || typeof json !== "string") {
    return { ok: false, error: "invalid-json", snapshot: null };
  }
  try {
    const snapshotData = JSON.parse(json);
    if (!snapshotData.version || !snapshotData.stack || !snapshotData.overlays) {
      return { ok: false, error: "invalid-snapshot-structure", snapshot: null };
    }
    addSnapshot({
      id: snapshotData.id,
      timestamp: snapshotData.timestamp,
      name: snapshotData.name || "imported",
      overlayCount: snapshotData.stack.length,
      data: snapshotData,
      imported: true
    });
    const snapshots = getSnapshots();
    const maxSnapshots = getMaxSnapshots();
    while (snapshots.length > maxSnapshots) {
      removeSnapshotAtIndex(0);
    }
    return { ok: true, snapshot: snapshotData, id: snapshotData.id };
  } catch (e) {
    return { ok: false, error: `parse-error: ${e.message}`, snapshot: null };
  }
}
var import_export_default = {
  exportSnapshot,
  importSnapshot
};
export {
  MODULE_ID,
  VERSION,
  import_export_default as default,
  exportSnapshot,
  importSnapshot
};
