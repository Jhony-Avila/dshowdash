import { getSnapshots, getLastSnapshot as _getLastSnapshot } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.state.snapshot-manager.queries.snapshot-queries";
function getSnapshotById(id) {
  const snapshots = getSnapshots();
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].id === id) {
      return snapshots[i].data;
    }
  }
  return null;
}
function getLastSnapshot() {
  return _getLastSnapshot();
}
function listSnapshots() {
  const snapshots = getSnapshots();
  return snapshots.map((s) => ({
    id: s.id,
    timestamp: s.timestamp,
    name: s.name,
    overlayCount: s.overlayCount,
    imported: s.imported || false
  }));
}
var snapshot_queries_default = {
  getSnapshotById,
  getLastSnapshot,
  listSnapshots
};
export {
  MODULE_ID,
  VERSION,
  snapshot_queries_default as default,
  getLastSnapshot,
  getSnapshotById,
  listSnapshots
};
