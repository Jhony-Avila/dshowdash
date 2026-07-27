// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-controller:data-loader
// PURPOSE: UARPS Admin - Data Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Api from ../api/client.js
//   Telemetry from ../telemetry/tracker.js
//   emit, showToast from ./ports.js
//   UARPS_EVENTS from /core/runtime/events/catalog/uarps.events.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   loadInitialData() — exported function
//   selectUser() — exported function
//   loadUserPermissions() — exported function
//   refresh() — exported function
//   syncInventoryFromDOM() — exported function
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

import { Api } from '../api/client.js';
import { Telemetry } from '../telemetry/tracker.js';
import { emit, showToast } from './ports.js';
import { UARPS_EVENTS } from '/core/runtime/events/catalog/uarps.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-controller:data-loader';

interface DataLoaderStore {
  setLoading(v: boolean): void;
  setError(v: string | null): void;
  isCacheValid(): boolean;
  loadFromCache(): { users: Record<string, unknown>[]; triggers: Record<string, unknown>[]; regions: Record<string, unknown>[]; permissions: Array<[string, unknown]> } | null;
  setUsers(users: Record<string, unknown>[]): void;
  setTriggers(triggers: Record<string, unknown>[]): void;
  setRegions(regions: Record<string, unknown>[]): void;
  setUserPermissions(id: string | number, perms: unknown): void;
  getSelectedUserId(): string | number | null;
  setSelectedUser(id: string | number): void;
  clearBulk(): void;
  setLastSync(ts: number): void;
  saveToCache(): void;
  clearCache(): void;
  getUsers(): Record<string, unknown>[];
  getTriggers(): Record<string, unknown>[];
  getRegions(): Record<string, unknown>[];
}

export function loadInitialData(store: DataLoaderStore) {
  store.setLoading(true);
  store.setError(null);
  
  return Promise.resolve().then(() => {
    Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: 'start', moduleId: MODULE_ID });
    
    if (store.isCacheValid()) {
      Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: 'from-cache', moduleId: MODULE_ID });
      const cached = store.loadFromCache();
      if (cached) {
        store.setUsers(cached.users || []);
        store.setTriggers(cached.triggers || []);
        store.setRegions(cached.regions || []);
        if (cached.permissions) { cached.permissions.forEach((item: [string, unknown]) => { store.setUserPermissions(item[0], item[1]); }); }
        if (cached.users && cached.users.length > 0) { return selectUser(store, cached.users[0].id as string | number).then(() => { store.setLoading(false); }); }
        store.setLoading(false);
        return;
      }
    }
    
    return Promise.all([Api.getUsers(), Api.getInventory()]).then(results => {
      const usersRes = results[0];
      const inventoryRes = results[1];
      if (usersRes.success && usersRes.data) {
        store.setUsers(usersRes.data);
        if (usersRes.data.length > 0) { return selectUser(store, usersRes.data[0].id).then(() => inventoryRes); }
      }
      return inventoryRes;
    }).then(inventoryRes => {
      if (inventoryRes && inventoryRes.success && inventoryRes.data) {
        store.setTriggers(inventoryRes.data.triggers || []);
        store.setRegions(inventoryRes.data.regions || []);
      }
      store.setLastSync(Date.now());
      store.saveToCache();
      Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { moduleId: MODULE_ID, users: store.getUsers().length, triggers: store.getTriggers().length, regions: store.getRegions().length });
    });
  }).catch(error => {
    store.setError(error.message);
    Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { moduleId: MODULE_ID, error: error.message });
    showToast('error', 'Erro ao carregar dados', error.message);
  }).then(() => { store.setLoading(false); });
}

export function selectUser(store: DataLoaderStore, userId: string | number) {
  if (!userId) return Promise.resolve();
  const prevUserId = store.getSelectedUserId();
  if (String(prevUserId) === String(userId)) return Promise.resolve();
  store.setSelectedUser(userId);
  store.clearBulk();
  Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: 'user:select', userId });
  return loadUserPermissions(store, userId).then(() => { emit(UARPS_EVENTS.USER_SELECTED, { userId }, MODULE_ID); });
}

export function loadUserPermissions(store: DataLoaderStore, userId: string | number) {
  return Api.getUserPermissions(userId).then(res => {
    if (res.success && res.data) { store.setUserPermissions(userId, { triggers: res.data.triggers || [], regions: res.data.regions || [] }); }
  }).catch(error => { Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { phase: 'permissions:load', userId, error: error.message }); });
}

export function refresh(store: DataLoaderStore) { store.clearCache(); return loadInitialData(store).then(() => { const userId = store.getSelectedUserId(); if (userId) return loadUserPermissions(store, userId); }); }

export function syncInventoryFromDOM(store: DataLoaderStore) {
  Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: 'inventory:sync:start', moduleId: MODULE_ID });
  return Api.syncInventory().then(res => {
    if (res.success) {
      return Api.getInventory().then(inventoryRes => {
        if (inventoryRes.success && inventoryRes.data) { store.setTriggers(inventoryRes.data.triggers || []); store.setRegions(inventoryRes.data.regions || []); }

        // @ts-expect-error TS migration - TS2339
        showToast('success', 'Inventário sincronizado', `${res.data && res.data.added ? res.data.added : 0} novos itens`);
        Telemetry.track(LIFECYCLE_EVENTS.DATA_LOADED, { phase: 'inventory:sync:success', moduleId: MODULE_ID, data: res.data });
      });
    }
  }).catch(error => { showToast('error', 'Erro na sincronização', error.message); Telemetry.track(LIFECYCLE_EVENTS.DATA_ERROR, { phase: 'inventory:sync', moduleId: MODULE_ID, error: error.message }); });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { loadInitialDataReady: typeof loadInitialData === 'function' } }; }

export default { loadInitialData, selectUser, loadUserPermissions, refresh, syncInventoryFromDOM, info, healthCheck };
