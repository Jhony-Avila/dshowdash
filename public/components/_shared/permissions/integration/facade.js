const MODULE_ID = "components._shared.permissions.integration.facade";
const VERSION = "1.0.1-P2-ENTERPRISE";
function canTrigger(triggerId, userId, state, Permissions, log) {
  const uid = userId || state.currentUserId || "anonymous";
  state.stats.triggerChecks++;
  state.stats.totalChecks++;
  const cachedState = state.userPermissions.triggers[triggerId];
  if (cachedState) {
    const result = cachedState !== "deny";
    if (Permissions.getConfig().debug && log) {
      log("trigger-check-cached", { triggerId, userId: uid, state: cachedState, result });
    }
    return result;
  }
  const result2 = Permissions.canTrigger(uid, triggerId);
  if (Permissions.getConfig().debug && log) {
    log("trigger-check", { triggerId, userId: uid, result: result2 });
  }
  return result2;
}
function canAccessRegion(regionId, userId, state, Permissions, log) {
  const uid = userId || state.currentUserId || "anonymous";
  state.stats.regionChecks++;
  state.stats.totalChecks++;
  const cachedState = state.userPermissions.regions[regionId];
  if (cachedState) {
    const result = cachedState !== "deny";
    if (Permissions.getConfig().debug && log) {
      log("region-check-cached", { regionId, userId: uid, state: cachedState, result });
    }
    return result;
  }
  const result2 = Permissions.canAccessRegion(uid, regionId);
  if (Permissions.getConfig().debug && log) {
    log("region-check", { regionId, userId: uid, result: result2 });
  }
  return result2;
}
function can(entityId, userId, state, Permissions, canTriggerFn, canAccessRegionFn) {
  const uid = userId || state.currentUserId || "anonymous";
  state.stats.totalChecks++;
  if (entityId.indexOf("trigger:") === 0) {
    return canTriggerFn(entityId, uid);
  } else if (entityId.indexOf("region:") === 0) {
    return canAccessRegionFn(entityId, uid);
  }
  return Permissions.can(uid, entityId);
}
function checkMultiple(entityIds, userId, state, canFn) {
  const uid = userId || state.currentUserId || "anonymous";
  state.stats.totalChecks += entityIds.length;
  const results = {};
  for (let i = 0; i < entityIds.length; i++) {
    results[entityIds[i]] = canFn(entityIds[i], uid);
  }
  return results;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var facade_default = { MODULE_ID, VERSION, canTrigger, canAccessRegion, can, checkMultiple, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  can,
  canAccessRegion,
  canTrigger,
  checkMultiple,
  facade_default as default,
  healthCheck,
  info
};
