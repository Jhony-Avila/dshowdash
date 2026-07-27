import {
  isInitialized,
  getCurrentMode,
  getRuntimeContext as _getRuntimeContext,
  getApplicationKernel,
  getMetrics as _getMetrics
} from "../state.js";
import * as DegradationPolicy from "../../degradation-policy.js";
import * as PermissionGate from "../../overlay-permission-gate.js";
const VERSION = "1.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.runtime-integration.core.queries";
function getMode() {
  return getCurrentMode();
}
function getRuntimeContext() {
  return _getRuntimeContext();
}
function isIntegrated() {
  return isInitialized() && !!getApplicationKernel();
}
function canOpenOverlay(typeId, options) {
  const currentMode = getCurrentMode();
  const policyResult = DegradationPolicy.evaluatePolicy(currentMode, typeId);
  if (policyResult.action === DegradationPolicy.POLICY_ACTIONS.BLOCK) {
    return {
      allowed: false,
      reason: "blocked-by-degradation-policy",
      mode: currentMode,
      policy: policyResult
    };
  }
  const permissionResult = PermissionGate.check(Object.assign({ typeId }, options || {}));
  if (!permissionResult.allowed) {
    return {
      allowed: false,
      reason: permissionResult.reason,
      mode: currentMode,
      permission: permissionResult
    };
  }
  return {
    allowed: true,
    mode: currentMode,
    policy: policyResult,
    permission: permissionResult
  };
}
function getMetrics() {
  return _getMetrics();
}
var queries_default = {
  getMode,
  getRuntimeContext,
  isIntegrated,
  canOpenOverlay,
  getMetrics
};
export {
  MODULE_ID,
  VERSION,
  canOpenOverlay,
  queries_default as default,
  getMetrics,
  getMode,
  getRuntimeContext,
  isIntegrated
};
