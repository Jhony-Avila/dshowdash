import { VERSION, MODULE_ID, MAINTENANCE_TYPES, SEVERITY } from "./constants.js";
import { activate, deactivate, isActive, getState } from "./core.js";
import { isRegionAffected, isFeatureAffected, canBypass } from "./checks.js";
import { schedule, cancelScheduled, getScheduled } from "./schedule.js";
import { configure, getConfig } from "./config.js";
import { subscribe } from "./subscription.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { state } from "./state.js";
import { loadState } from "./storage.js";
import { createBanner } from "./banner.js";
import { applyBlockingOverlay, blockRegion } from "./blocking.js";
import { MAINTENANCE_TYPES as MAINTENANCE_TYPES2 } from "./constants.js";
if (typeof window !== "undefined") {
  loadState();
  if (state.active) {
    createBanner();
    for (let i = 0; i < state.affectedRegions.length; i++) {
      blockRegion(state.affectedRegions[i]);
    }
    if (state.type === MAINTENANCE_TYPES2.FULL) {
      applyBlockingOverlay();
    }
  }
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, SEVERITY as SEVERITY2 } from "./constants.js";
import { activate as activate2, deactivate as deactivate2, isActive as isActive2, getState as getState2 } from "./core.js";
import { isRegionAffected as isRegionAffected2, isFeatureAffected as isFeatureAffected2, canBypass as canBypass2 } from "./checks.js";
import { schedule as schedule2, cancelScheduled as cancelScheduled2, getScheduled as getScheduled2 } from "./schedule.js";
import { configure as configure2, getConfig as getConfig2 } from "./config.js";
import { subscribe as subscribe2 } from "./subscription.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var maintenance_mode_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  MAINTENANCE_TYPES: MAINTENANCE_TYPES2,
  SEVERITY: SEVERITY2,
  activate: activate2,
  deactivate: deactivate2,
  isActive: isActive2,
  getState: getState2,
  isRegionAffected: isRegionAffected2,
  isFeatureAffected: isFeatureAffected2,
  canBypass: canBypass2,
  schedule: schedule2,
  cancelScheduled: cancelScheduled2,
  getScheduled: getScheduled2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MAINTENANCE_TYPES,
  MODULE_ID,
  SEVERITY,
  VERSION,
  activate,
  canBypass,
  cancelScheduled,
  configure,
  deactivate,
  maintenance_mode_default as default,
  getConfig,
  getMetrics,
  getScheduled,
  getState,
  healthCheck,
  info,
  isActive,
  isFeatureAffected,
  isRegionAffected,
  schedule,
  subscribe
};
