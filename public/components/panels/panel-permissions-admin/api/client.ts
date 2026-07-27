// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin.api.client
// PURPOSE: UARPS Admin - API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   Api — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Permissions
//   (window as any).PermissionsInventory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-permissions-admin.api.client';

const BASE_URL = '/api/permissions/uarps.php';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getBaseUrl() {
  _initPorts();
  const config = _getPort('config');
  if (config && config.app && config.app.baseUrl) return config.app.baseUrl;
  if (config && config.baseUrl) return config.baseUrl;
  const routeState = _getPort('routeState');
  if (routeState && routeState.getBaseUrl) return routeState.getBaseUrl();
  return '';
}

async function _request(action: string, params: Record<string, unknown> = {}, { signal }: { signal?: AbortSignal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || undefined);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin',
      signal
    });
    const data = await response.json();
    return { success: data.ok === true, data, error: data.error || null };
  } catch (error: any) {
    return { success: false, error: error.message, data: null };
  }
}

async function _post(action: string, data: Record<string, unknown> = {}, { signal }: { signal?: AbortSignal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || undefined);
    url.searchParams.set('action', action);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      signal,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { success: result.ok === true, data: result, error: result.error || null };
  } catch (error: any) {
    return { success: false, error: error.message, data: null };
  }
}

export async function getUsers() {
  const res = await _request('all-users');
  if (res.success && res.data?.users) {
    return {
      success: true,
      data: res.data.users.map((u: Record<string, unknown>) => ({
        id: u.id, nome: u.nome_completo || u.username, name: u.nome_completo || u.username,
        email: u.email, nivel: u.level, level: u.level, ativo: true
      }))
    };
  }
  return res;
}

export async function getInventory() {
  try {

    // @ts-expect-error TS migration - TS2339
    const inventory = window.Permissions?.getInventory?.() || (window as any).PermissionsInventory?.getAll?.();
    if (inventory) {
      const triggers: Record<string, unknown>[] = [];
      const regions: Record<string, unknown>[] = [];
      if (inventory.triggers) {
        Object.entries(inventory.triggers).forEach(([id, data]) => {

          // @ts-expect-error TS migration - TS2339, TS2698
          triggers.push({ id, label: data.label || _formatLabel(id), area: _extractArea(id), ...data });
        });
      }
      if (inventory.regions) {
        Object.entries(inventory.regions).forEach(([id, data]) => {

          // @ts-expect-error TS migration - TS2339, TS2698
          regions.push({ id, label: data.label || _formatLabel(id), ...data });
        });
      }
      return { success: true, data: { triggers, regions } };
    }
    return _scanDOMForInventory();
  } catch (error: any) {
    return { success: false, error: (error as Error).message, data: { triggers: [] as Record<string, unknown>[], regions: [] as Record<string, unknown>[] } };
  }
}

function _scanDOMForInventory() {
  const triggers: Record<string, unknown>[] = [];
  const regions: Record<string, unknown>[] = [];
  document.querySelectorAll('[data-uarps-trigger]').forEach(el => {
    const id = el.getAttribute('data-uarps-trigger');
    if (id && !triggers.find((t: Record<string, unknown>) => t.id === id)) {
      triggers.push({ id, label: el.textContent?.trim() || _formatLabel(id), area: _extractArea(id) });
    }
  });
  document.querySelectorAll('[data-uarps-region]').forEach(el => {
    const id = el.getAttribute('data-uarps-region');
    if (id && !regions.find((r: Record<string, unknown>) => r.id === id)) {
      regions.push({ id, label: el.getAttribute('data-region-label') || _formatLabel(id) });
    }
  });
  return { success: true, data: { triggers, regions } };
}

function _extractArea(triggerId: string) {
  const parts = triggerId.split(':');
  return parts.length >= 2 ? parts[1] : 'other';
}

function _formatLabel(id: string) {
  const parts = id.split(':');
  const last = parts[parts.length - 1] || id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

export async function getUserPermissions(userId: string | number) {
  const res = await _request('user-permissions', { user_id: userId });
  if (res.success && res.data) {
    return {
      success: true,
      data: {
        triggers: (res.data.triggers || []).filter((t: Record<string, unknown>) => t.state === 'allow').map((t: Record<string, unknown>) => t.trigger_id),
        regions: (res.data.regions || []).filter((r: Record<string, unknown>) => r.state === 'allow').map((r: Record<string, unknown>) => r.region_id)
      }
    };
  }
  return res;
}

export async function setTriggerPermission(userId: string | number, triggerId: string, granted: boolean) {
  return _post('set-trigger', { user_id: userId, trigger_id: triggerId, state: granted ? 'allow' : 'deny' });
}

export async function setRegionPermission(userId: string | number, regionId: string, granted: boolean) {
  return _post('set-region', { user_id: userId, region_id: regionId, state: granted ? 'allow' : 'deny' });
}

export async function bulkSetTriggers(userId: string | number, triggerIds: string[], granted: boolean) {
  const permissions: Record<string, string> = {};
  triggerIds.forEach(id => { permissions[id] = granted ? 'allow' : 'deny'; });
  return _post('bulk-set-triggers', { user_id: userId, permissions });
}

export async function bulkSetRegions(userId: string | number, regionIds: string[], granted: boolean) {
  const permissions: Record<string, string> = {};
  regionIds.forEach(id => { permissions[id] = granted ? 'allow' : 'deny'; });
  return _post('bulk-set-regions', { user_id: userId, permissions });
}

export async function syncInventory() { return getInventory(); }

export async function copyPermissions(fromUserId: string | number, toUserId: string | number) {
  const fromPerms = await _request('user-permissions', { user_id: fromUserId });
  if (!fromPerms.success) return fromPerms;
  const triggerPerms: Record<string, unknown> = {};
  const regionPerms: Record<string, unknown> = {};
  (fromPerms.data.triggers || []).forEach((t: Record<string, unknown>) => { triggerPerms[String(t.trigger_id)] = t.state; });
  (fromPerms.data.regions || []).forEach((r: Record<string, unknown>) => { regionPerms[String(r.region_id)] = r.state; });
  await _post('bulk-set-triggers', { user_id: toUserId, permissions: triggerPerms });
  await _post('bulk-set-regions', { user_id: toUserId, permissions: regionPerms });
  return { success: true, data: { copied: true } };
}

export async function getStats() {
  const users = await getUsers();
  const inventory = await getInventory();
  return { success: true, data: { users: users.data?.length || 0, triggers: inventory.data?.triggers?.length || 0, regions: inventory.data?.regions?.length || 0 } };
}

export async function healthCheck() { return { success: true, status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export const Api = {
  getUsers, getInventory, getUserPermissions, setTriggerPermission, setRegionPermission,
  bulkSetTriggers, bulkSetRegions, syncInventory, copyPermissions, getStats, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
};

export default Api;
