import { VERSION, MODULE_ID, SNAPSHOT_FORMAT_VERSION } from "../constants.js";
import {
  getStore,
  getOpenOverlay,
  getCloseOverlay,
  getConfig as getStateConfig,
  setConfig,
  getSnapshotsCount,
  getMaxSnapshots,
  getLastSnapshot,
  getSnapshotsCreated,
  getRestoresPerformed
} from "../state.js";
import { listSnapshots } from "../queries/snapshot-queries.js";
function configure(config) {
  if (!config || typeof config !== "object") return false;
  setConfig(config);
  return true;
}
function getConfiguration() {
  return getStateConfig();
}
function getMetrics() {
  const lastSnapshot = getLastSnapshot();
  return {
    snapshotsStored: getSnapshotsCount(),
    maxSnapshots: getMaxSnapshots(),
    snapshotsCreated: getSnapshotsCreated(),
    restoresPerformed: getRestoresPerformed(),
    lastSnapshotAt: lastSnapshot ? lastSnapshot.timestamp : null
  };
}
function healthCheck() {
  const checks = {
    storeInjected: !!getStore(),
    openFunctionInjected: !!getOpenOverlay(),
    closeFunctionInjected: !!getCloseOverlay(),
    snapshotsWithinLimit: getSnapshotsCount() <= getMaxSnapshots()
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  const total = keys.length;
  let status = "HEALTHY";
  if (!checks.storeInjected) status = "UNHEALTHY";
  else if (passed < total) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formatVersion: SNAPSHOT_FORMAT_VERSION,
    config: getStateConfig(),
    metrics: getMetrics(),
    snapshots: listSnapshots(),
    timestamp: Date.now()
  };
}
var health_default = {
  configure,
  getConfig: getConfiguration,
  getMetrics,
  healthCheck,
  info
};
export {
  configure,
  health_default as default,
  getConfiguration as getConfig,
  getConfiguration,
  getMetrics,
  healthCheck,
  info
};
