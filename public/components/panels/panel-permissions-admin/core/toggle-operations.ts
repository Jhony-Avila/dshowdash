// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-controller:toggle-operations
// PURPOSE: UARPS Admin - Toggle Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERMISSIONS_EVENTS from /core/runtime/events/catalog/permissions.events.js
//   Api from ../api/client.js
//   Telemetry from ../telemetry/tracker.js
//   emit, showToast from ./ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   toggleTrigger() — exported function
//   toggleRegion() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { Api } from '../api/client.js';
import { Telemetry } from '../telemetry/tracker.js';
import { emit, showToast } from './ports.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-controller:toggle-operations';

interface ToggleStore {
  getSelectedUserId(): string | number | null;
  getUserPermissions(userId: string | number): { triggers: string[]; regions: string[] };
  toggleTriggerPermission(userId: string | number, triggerId: string): void;
  toggleRegionPermission(userId: string | number, regionId: string): void;
}

export function toggleTrigger(store: ToggleStore, triggerId: string) {
  const userId = store.getSelectedUserId();
  if (!userId || !triggerId) return Promise.resolve();

  const perms = store.getUserPermissions(userId);
  const hasPermission = perms.triggers.indexOf(triggerId) !== -1;
  const action = hasPermission ? 'revoke' : 'grant';
  
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'trigger:toggle:start', userId, triggerId, toggleAction: action });
  
  store.toggleTriggerPermission(userId, triggerId);
  
  return Api.setTriggerPermission(userId, triggerId, !hasPermission).then(res => {
    if (!res.success) {
      store.toggleTriggerPermission(userId, triggerId);
      throw new Error(res.error || 'Falha ao atualizar permissão');
    }
    
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'trigger:toggle:success', userId, triggerId, toggleAction: action });
    emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'trigger', triggerId, granted: !hasPermission }, MODULE_ID);
  }).catch(error => {
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'trigger:toggle:error', userId, triggerId, error: error.message });
    showToast('error', 'Erro', error.message);
  });
}

export function toggleRegion(store: ToggleStore, regionId: string) {
  const userId = store.getSelectedUserId();
  if (!userId || !regionId) return Promise.resolve();
  
  const perms = store.getUserPermissions(userId!);
  const hasPermission = perms.regions.indexOf(regionId) !== -1;
  const action = hasPermission ? 'revoke' : 'grant';
  
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'region:toggle:start', userId, regionId, toggleAction: action });
  
  store.toggleRegionPermission(userId, regionId);
  
  return Api.setRegionPermission(userId, regionId, !hasPermission).then(res => {
    if (!res.success) {
      store.toggleRegionPermission(userId, regionId);
      throw new Error(res.error || 'Falha ao atualizar permissão');
    }
    
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'region:toggle:success', userId, regionId, toggleAction: action });
    emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: 'region', regionId, granted: !hasPermission }, MODULE_ID);
  }).catch(error => {
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: 'region:toggle:error', userId, regionId, error: error.message });
    showToast('error', 'Erro', error.message);
  });
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { apiAvailable: typeof Api !== 'undefined', telemetryAvailable: typeof Telemetry !== 'undefined' }, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { toggleTrigger, toggleRegion, healthCheck, info };
