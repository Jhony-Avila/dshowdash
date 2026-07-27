import * as Buffer from "./buffer.js";
const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.audit-trail.loggers";
const hasWindow = typeof window !== "undefined";
function getUserAgent() {
  return hasWindow && navigator ? navigator.userAgent : "server";
}
function getSessionId() {
  if (!hasWindow) return null;
  try {
    return sessionStorage.getItem("session_id") || null;
  } catch {
    return null;
  }
}
function createLogEntry(actionKey, options = {}) {
  return {
    action: actionKey,
    timestamp: Date.now(),
    user_agent: getUserAgent(),
    session_id: getSessionId(),
    resource_type: options.resource_type || null,
    resource_id: options.resource_id || null,
    old_value: options.old_value || null,
    new_value: options.new_value || null,
    metadata: options.metadata || {},
    ...options
  };
}
function logLogin(userId, meta = {}) {
  return {
    resource_type: "user",
    resource_id: userId,
    metadata: { ...meta, event: "login" }
  };
}
function logLogout(userId, meta = {}) {
  return {
    resource_type: "user",
    resource_id: userId,
    metadata: { ...meta, event: "logout" }
  };
}
function logPermissionChange(userId, oldPerms, newPerms) {
  return {
    resource_type: "permission",
    resource_id: userId,
    old_value: oldPerms,
    new_value: newPerms
  };
}
function logFeatureFlagChange(flagKey, oldValue, newValue) {
  return {
    resource_type: "feature_flag",
    resource_id: flagKey,
    old_value: oldValue,
    new_value: newValue
  };
}
function logPanelAction(panelId, action, meta = {}) {
  return {
    resource_type: "panel",
    resource_id: panelId,
    metadata: { action, ...meta }
  };
}
function logJobAction(jobId, action, meta = {}) {
  return {
    resource_type: "job",
    resource_id: jobId,
    metadata: { action, ...meta }
  };
}
function logExport(resourceType, resourceId, format, meta = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: { format, export: true, ...meta }
  };
}
function logCreate(resourceType, resourceId, newValue, meta = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    new_value: newValue,
    metadata: { operation: "create", ...meta }
  };
}
function logUpdate(resourceType, resourceId, oldValue, newValue, meta = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    old_value: oldValue,
    new_value: newValue,
    metadata: { operation: "update", ...meta }
  };
}
function logDelete(resourceType, resourceId, oldValue, meta = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    old_value: oldValue,
    metadata: { operation: "delete", ...meta }
  };
}
function logAction(action, data = {}) {
  Buffer.add({ type: "action", action, data });
}
function logNavigation(from, to) {
  Buffer.add({ type: "navigation", from, to });
}
function logError(error, context = {}) {
  Buffer.add({
    type: "error",
    message: error?.message || String(error),
    context
  });
}
function logAuth(event, userId) {
  Buffer.add({ type: "auth", event, userId });
}
function healthCheck() {
  const checks = {
    available: true,
    bufferAccessible: typeof Buffer.add === "function",
    createLogEntryAvailable: typeof createLogEntry === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    loggers: [
      "createLogEntry",
      "logLogin",
      "logLogout",
      "logPermissionChange",
      "logFeatureFlagChange",
      "logPanelAction",
      "logJobAction",
      "logExport",
      "logCreate",
      "logUpdate",
      "logDelete",
      "logAction",
      "logNavigation",
      "logError",
      "logAuth"
    ],
    timestamp: Date.now()
  };
}
var loggers_default = {
  createLogEntry,
  logLogin,
  logLogout,
  logPermissionChange,
  logFeatureFlagChange,
  logPanelAction,
  logJobAction,
  logExport,
  logCreate,
  logUpdate,
  logDelete,
  logAction,
  logNavigation,
  logError,
  logAuth,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createLogEntry,
  loggers_default as default,
  healthCheck,
  info,
  logAction,
  logAuth,
  logCreate,
  logDelete,
  logError,
  logExport,
  logFeatureFlagChange,
  logJobAction,
  logLogin,
  logLogout,
  logNavigation,
  logPanelAction,
  logPermissionChange,
  logUpdate
};
