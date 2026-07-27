// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-permissions
// PURPOSE: UARPS Admin - Permissions Mutations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _getState, getUserPermissions, setUserPermissions from ./core.js
//   saveCurrentToHistory from ./history.js
//   saveToCache from ./cache.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   addTriggerPermission() — exported function
//   removeTriggerPermission() — exported function
//   toggleTriggerPermission() — exported function
//   addRegionPermission() — exported function
//   removeRegionPermission() — exported function
//   toggleRegionPermission() — exported function
//   grantAllTriggers() — exported function
//   revokeAllTriggers() — exported function
//   clonePermissions() — exported function
//   isSensitiveTrigger() — exported function
//   getSensitiveTriggers() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { _getState, getUserPermissions, setUserPermissions } from './core.js';
import { saveCurrentToHistory } from './history.js';
import { saveToCache } from './cache.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-permissions';

export function addTriggerPermission(userId: string | number, triggerId: string) { saveCurrentToHistory('add-trigger', userId); const perms = getUserPermissions(userId); if (perms.triggers.indexOf(triggerId) === -1) { perms.triggers.push(triggerId); setUserPermissions(userId, perms); saveToCache(); } }

export function removeTriggerPermission(userId: string | number, triggerId: string) { saveCurrentToHistory('remove-trigger', userId); const perms = getUserPermissions(userId); perms.triggers = perms.triggers.filter(t => t !== triggerId); setUserPermissions(userId, perms); saveToCache(); }

export function toggleTriggerPermission(userId: string | number, triggerId: string) { const perms = getUserPermissions(userId); if (perms.triggers.indexOf(triggerId) !== -1) { removeTriggerPermission(userId, triggerId); return false; } else { addTriggerPermission(userId, triggerId); return true; } }

export function addRegionPermission(userId: string | number, regionId: string) { saveCurrentToHistory('add-region', userId); const perms = getUserPermissions(userId); if (perms.regions.indexOf(regionId) === -1) { perms.regions.push(regionId); setUserPermissions(userId, perms); saveToCache(); } }

export function removeRegionPermission(userId: string | number, regionId: string) { saveCurrentToHistory('remove-region', userId); const perms = getUserPermissions(userId); perms.regions = perms.regions.filter(r => r !== regionId); setUserPermissions(userId, perms); saveToCache(); }

export function toggleRegionPermission(userId: string | number, regionId: string) { const perms = getUserPermissions(userId); if (perms.regions.indexOf(regionId) !== -1) { removeRegionPermission(userId, regionId); return false; } else { addRegionPermission(userId, regionId); return true; } }

export function grantAllTriggers(userId: string | number) {
  if (!userId) return 0;
  saveCurrentToHistory('grant-all', userId);
  const state = _getState();
  const perms = getUserPermissions(userId);
  const allTriggerIds = state.triggers.map(t => t.id);
  const before = perms.triggers.length;
  const merged: Record<string, boolean> = {}; perms.triggers.forEach((t: string) => { merged[t] = true; }); allTriggerIds.forEach((t: unknown) => { merged[t as string] = true; });
  perms.triggers = Object.keys(merged);
  setUserPermissions(userId, perms);
  saveToCache();
  return perms.triggers.length - before;
}

export function revokeAllTriggers(userId: string | number) { if (!userId) return 0; saveCurrentToHistory('revoke-all', userId); const perms = getUserPermissions(userId); const count = perms.triggers.length; perms.triggers = []; setUserPermissions(userId, perms); saveToCache(); return count; }

export function clonePermissions(fromUserId: string | number, toUserId: string | number) { if (!fromUserId || !toUserId || fromUserId === toUserId) return false; const perms = getUserPermissions(fromUserId); setUserPermissions(toUserId, { triggers: perms.triggers.slice(), regions: perms.regions.slice() }); saveToCache(); return true; }

const SENSITIVE_TRIGGERS = ['admin-panel', 'system-config', 'user-delete', 'role-admin', 'database-access', 'api-keys', 'security-settings', 'audit-logs'];
export function isSensitiveTrigger(triggerId: string) { for (let i = 0; i < SENSITIVE_TRIGGERS.length; i++) { if (triggerId.toLowerCase().indexOf(SENSITIVE_TRIGGERS[i].toLowerCase()) !== -1) return true; } return false; }
export function getSensitiveTriggers() { return _getState().triggers.filter(t => isSensitiveTrigger(t.id as string)); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { permissionsReady: typeof addTriggerPermission === 'function' } }; }
