import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.state.snapshot-manager.state";
let _config = Object.assign({}, DEFAULT_CONFIG);
const _state = {
  snapshots: [],
  lastSnapshot: null,
  snapshotsCreated: 0,
  restoresPerformed: 0
};
const _dependencies = {
  store: null,
  openOverlay: null,
  closeOverlay: null
};
function inject(dependencies) {
  if (dependencies.store) _dependencies.store = dependencies.store;
  if (dependencies.openOverlay) _dependencies.openOverlay = dependencies.openOverlay;
  if (dependencies.closeOverlay) _dependencies.closeOverlay = dependencies.closeOverlay;
}
function getStore() {
  return _dependencies.store;
}
function getOpenOverlay() {
  return _dependencies.openOverlay;
}
function getCloseOverlay() {
  return _dependencies.closeOverlay;
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  _config = Object.assign({}, _config, newConfig);
  if (_config.maxSnapshots < 1) _config.maxSnapshots = 1;
}
function getMaxSnapshots() {
  return _config.maxSnapshots;
}
function shouldIncludeMetrics() {
  return _config.includeMetrics;
}
function getSnapshots() {
  return _state.snapshots;
}
function addSnapshot(snapshot) {
  _state.snapshots.push(snapshot);
}
function removeSnapshotAtIndex(index) {
  _state.snapshots.splice(index, 1);
}
function clearAllSnapshots() {
  const count = _state.snapshots.length;
  _state.snapshots = [];
  return count;
}
function getSnapshotsCount() {
  return _state.snapshots.length;
}
function getLastSnapshot() {
  return _state.lastSnapshot;
}
function setLastSnapshot(snapshot) {
  _state.lastSnapshot = snapshot;
}
function getSnapshotsCreated() {
  return _state.snapshotsCreated;
}
function incrementSnapshotsCreated() {
  _state.snapshotsCreated++;
}
function getRestoresPerformed() {
  return _state.restoresPerformed;
}
function incrementRestoresPerformed() {
  _state.restoresPerformed++;
}
var state_default = {
  inject,
  getStore,
  getOpenOverlay,
  getCloseOverlay,
  getConfig,
  setConfig,
  getMaxSnapshots,
  shouldIncludeMetrics,
  getSnapshots,
  addSnapshot,
  removeSnapshotAtIndex,
  clearAllSnapshots,
  getSnapshotsCount,
  getLastSnapshot,
  setLastSnapshot,
  getSnapshotsCreated,
  incrementSnapshotsCreated,
  getRestoresPerformed,
  incrementRestoresPerformed
};
export {
  MODULE_ID,
  VERSION,
  addSnapshot,
  clearAllSnapshots,
  state_default as default,
  getCloseOverlay,
  getConfig,
  getLastSnapshot,
  getMaxSnapshots,
  getOpenOverlay,
  getRestoresPerformed,
  getSnapshots,
  getSnapshotsCount,
  getSnapshotsCreated,
  getStore,
  incrementRestoresPerformed,
  incrementSnapshotsCreated,
  inject,
  removeSnapshotAtIndex,
  setConfig,
  setLastSnapshot,
  shouldIncludeMetrics
};
