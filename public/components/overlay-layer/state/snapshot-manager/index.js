import { VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION } from "./constants.js";
import { inject } from "./state.js";
import { snapshot } from "./core/snapshot.js";
import { restore } from "./core/restore.js";
import { compare } from "./operations/compare.js";
import { exportSnapshot, importSnapshot } from "./operations/import-export.js";
import { getSnapshotById, getLastSnapshot, listSnapshots } from "./queries/snapshot-queries.js";
import { removeSnapshot, clearSnapshots } from "./management/snapshot-management.js";
import { configure, getConfig, getMetrics, healthCheck, info } from "./diagnostics/health.js";
var snapshot_manager_default = {
  inject,
  snapshot,
  restore,
  compare,
  exportSnapshot,
  importSnapshot,
  getSnapshotById,
  getLastSnapshot,
  listSnapshots,
  removeSnapshot,
  clearSnapshots,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION
};
export {
  MODULE_ID,
  SNAPSHOT_FORMAT_VERSION,
  VERSION,
  clearSnapshots,
  compare,
  configure,
  snapshot_manager_default as default,
  exportSnapshot,
  getConfig,
  getLastSnapshot,
  getMetrics,
  getSnapshotById,
  healthCheck,
  importSnapshot,
  info,
  inject,
  listSnapshots,
  removeSnapshot,
  restore,
  snapshot
};
