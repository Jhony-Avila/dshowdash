import {
  getSnapshots,
  removeSnapshotAtIndex,
  clearAllSnapshots,
  getLastSnapshot,
  setLastSnapshot
} from "../state.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.state.snapshot-manager.management.snapshot-management";
function removeSnapshot(id) {
  const snapshots = getSnapshots();
  let index = -1;
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].id === id) {
      index = i;
      break;
    }
  }
  if (index === -1) {
    return { ok: false, error: "snapshot-not-found" };
  }
  removeSnapshotAtIndex(index);
  const lastSnapshot = getLastSnapshot();
  if (lastSnapshot && lastSnapshot.id === id) {
    setLastSnapshot(null);
  }
  return { ok: true, removed: id };
}
function clearSnapshots() {
  const count = clearAllSnapshots();
  setLastSnapshot(null);
  return { ok: true, cleared: count };
}
var snapshot_management_default = {
  removeSnapshot,
  clearSnapshots
};
export {
  MODULE_ID,
  VERSION,
  clearSnapshots,
  snapshot_management_default as default,
  removeSnapshot
};
