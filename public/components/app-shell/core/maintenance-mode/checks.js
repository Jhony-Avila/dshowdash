import { MAINTENANCE_TYPES } from "./constants.js";
import { state, metrics } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.checks";
function isRegionAffected(regionName) {
  if (!state.active) return false;
  if (state.type === MAINTENANCE_TYPES.FULL) return true;
  return state.affectedRegions.indexOf(regionName) >= 0;
}
function isFeatureAffected(featureName) {
  if (!state.active) return false;
  if (state.type === MAINTENANCE_TYPES.FULL) return true;
  return state.affectedFeatures.indexOf(featureName) >= 0;
}
function canBypass(role, token) {
  if (!state.active) return true;
  if (token && state.bypassToken && token === state.bypassToken) {
    metrics.bypasses++;
    return true;
  }
  if (role && state.allowedRoles.indexOf(role) >= 0) {
    metrics.bypasses++;
    return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  canBypass,
  isFeatureAffected,
  isRegionAffected
};
