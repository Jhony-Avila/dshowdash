import { SNAPSHOT_FORMAT_VERSION } from "../constants.js";
import {
  getStore,
  getMaxSnapshots,
  shouldIncludeMetrics,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  setLastSnapshot,
  incrementSnapshotsCreated
} from "../state.js";
import { serializeOverlays } from "./serializer.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.state.snapshot-manager.core.snapshot";
function snapshot(options) {
  options = options || {};
  const store = getStore();
  if (!store) {
    return { ok: false, error: "store-not-injected", snapshot: null };
  }
  const stack = store.getStack ? store.getStack() : [];
  const overlays = store.getOverlays ? store.getOverlays() : {};
  const now = Date.now();
  const serializedOverlays = serializeOverlays(stack, overlays);
  const snapshotData = {
    version: SNAPSHOT_FORMAT_VERSION,
    timestamp: now,
    id: `snapshot-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: options.name || null,
    description: options.description || null,
    stack: stack.slice(),
    overlays: serializedOverlays,
    metadata: {
      source: options.source || "manual",
      overlayCount: stack.length,
      hasBlocking: stack.some((id) => {
        const o = overlays[id];
        return o && o.config && o.config.blocking || o && o.type === "modal";
      })
    }
  };
  if (shouldIncludeMetrics() && store.getMetrics) {
    snapshotData.storeMetrics = store.getMetrics();
  }
  addSnapshot({
    id: snapshotData.id,
    timestamp: now,
    name: snapshotData.name,
    overlayCount: stack.length,
    data: snapshotData
  });
  const snapshots = getSnapshots();
  const maxSnapshots = getMaxSnapshots();
  while (snapshots.length > maxSnapshots) {
    removeSnapshotAtIndex(0);
  }
  setLastSnapshot(snapshotData);
  incrementSnapshotsCreated();
  return {
    ok: true,
    snapshot: snapshotData,
    id: snapshotData.id
  };
}
var snapshot_default = {
  snapshot
};
export {
  MODULE_ID,
  VERSION,
  snapshot_default as default,
  snapshot
};
