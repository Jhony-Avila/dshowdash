import { SnapshotManager } from "./snapshot-manager.js";
import { EventReplay as _EventReplay } from "./event-replay.js";
import { HeadlessPanel } from "./headless.js";
import { FeatureFlags } from "./feature-flags.js";
const EventReplay = _EventReplay;
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:advanced";
function initAll() {
  SnapshotManager.init();
  EventReplay.init();
  FeatureFlags.init();
  return { SnapshotManager, EventReplay, HeadlessPanel, FeatureFlags };
}
function healthCheck() {
  const checks = {
    snapshotManager: SnapshotManager.healthCheck(),
    eventReplay: EventReplay.healthCheck(),
    headlessPanel: HeadlessPanel.healthCheck(),
    featureFlags: FeatureFlags.healthCheck()
  };
  const statuses = Object.values(checks).map((c) => c.status);
  const healthy = statuses.filter((s) => s === "HEALTHY").length;
  return {
    status: healthy === 4 ? "HEALTHY" : healthy >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${healthy}/4`,
    moduleId: MODULE_ID,
    version: VERSION,
    modules: checks
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modules: {
      snapshotManager: SnapshotManager.info(),
      eventReplay: EventReplay.info(),
      headlessPanel: HeadlessPanel.info(),
      featureFlags: FeatureFlags.info()
    }
  };
}
var advanced_default = { VERSION, MODULE_ID, initAll, healthCheck, info, SnapshotManager, EventReplay, HeadlessPanel, FeatureFlags };
export {
  EventReplay,
  FeatureFlags,
  HeadlessPanel,
  MODULE_ID,
  SnapshotManager,
  VERSION,
  advanced_default as default,
  healthCheck,
  info,
  initAll
};
