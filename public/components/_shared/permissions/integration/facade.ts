// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.integration.facade
// PURPOSE: Facade API for permission checking with caching
// ───────────────────────────────────────────────────────────────
// @contract CAN_TRIGGER - canTrigger(triggerId, userId, state, Permissions, log) checks trigger
// @contract CAN_ACCESS_REGION - canAccessRegion(regionId, userId, state, Permissions, log) checks region
// @contract CAN - can(entityId, userId, state, Permissions, canTriggerFn, canAccessRegionFn) generic check
// @contract CHECK_MULTIPLE - checkMultiple(entityIds, userId, state, canFn) batch check
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: canTrigger, canAccessRegion, can, checkMultiple, VERSION, MODULE_ID
// @changelog v1.0.1-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.1-P20: MODULE_ID + VERSION exports
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'components._shared.permissions.integration.facade';
export const VERSION = '1.0.1-P2-ENTERPRISE';

export function canTrigger(triggerId: string, userId: string, state: Record<string, any>, Permissions: Record<string, any>, log: ((event: string, data?: unknown) => void) | null) {
  const uid = userId || state.currentUserId || 'anonymous';
  state.stats.triggerChecks++;
  state.stats.totalChecks++;

  const cachedState = state.userPermissions.triggers[triggerId];
  if (cachedState) {
    const result = cachedState !== 'deny';
    if (Permissions.getConfig().debug && log) {
      log('trigger-check-cached', { triggerId, userId: uid, state: cachedState, result });
    }
    return result;
  }

  const result2 = Permissions.canTrigger(uid, triggerId);
  if (Permissions.getConfig().debug && log) {
    log('trigger-check', { triggerId, userId: uid, result: result2 });
  }
  return result2;
}

export function canAccessRegion(regionId: string, userId: string, state: Record<string, any>, Permissions: Record<string, any>, log: ((event: string, data?: unknown) => void) | null) {
  const uid = userId || state.currentUserId || 'anonymous';
  state.stats.regionChecks++;
  state.stats.totalChecks++;

  const cachedState = state.userPermissions.regions[regionId];
  if (cachedState) {
    const result = cachedState !== 'deny';
    if (Permissions.getConfig().debug && log) {
      log('region-check-cached', { regionId, userId: uid, state: cachedState, result });
    }
    return result;
  }

  const result2 = Permissions.canAccessRegion(uid, regionId);
  if (Permissions.getConfig().debug && log) {
    log('region-check', { regionId, userId: uid, result: result2 });
  }
  return result2;
}

export function can(entityId: string, userId: string, state: Record<string, any>, Permissions: Record<string, any>, canTriggerFn: (entityId: string, userId: string) => boolean, canAccessRegionFn: (entityId: string, userId: string) => boolean) {
  const uid = userId || state.currentUserId || 'anonymous';
  state.stats.totalChecks++;

  if (entityId.indexOf('trigger:') === 0) {
    return canTriggerFn(entityId, uid);
  } else if (entityId.indexOf('region:') === 0) {
    return canAccessRegionFn(entityId, uid);
  }

  return Permissions.can(uid, entityId);
}

export function checkMultiple(entityIds: string[], userId: string, state: Record<string, any>, canFn: (entityId: string, userId: string) => boolean) {
  const uid = userId || state.currentUserId || 'anonymous';
  state.stats.totalChecks += entityIds.length;

  const results: Record<string, boolean> = {};
  for (let i = 0; i < entityIds.length; i++) {
    results[entityIds[i]] = canFn(entityIds[i], uid);
  }
  return results;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export default { MODULE_ID, VERSION, canTrigger, canAccessRegion, can, checkMultiple, info, healthCheck };
