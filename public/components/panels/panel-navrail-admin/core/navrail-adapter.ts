// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-navrail-admin:navrail-adapter
// PURPOSE: Panel NavRail Admin - NavRail Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   clearCache() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger — via strict-mode compliant fallback
// ───────────────────────────────────────────────────────────────
// @changelog v4.1.0-STRICT-MODE - NR-FULL: Migração para strict mode
//            - Adicionado import de isStrict, recordViolation
//            - _getLogger() resolve via Ports > windowAdapter > fallback com recordViolation
//            - Em strict mode, não usa window.* fallback
// @changelog v4.0.0-PORTSFACTORY-ES6 - Versão anterior
// ═══════════════════════════════════════════════════════════════

'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'panel-navrail-admin:navrail-adapter';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _apiBase = '/api/ui/navrail';
let _cachedItems: Record<string, unknown>[] | null = null;
let _cachedGroups: Record<string, unknown>[] | null = null;
let _cacheTimestamp = 0;
const _cacheTTL = 30000;

function _getLogger() {
  const logger = _getPort('logger');
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
}

function log(level: string, msg: string, data?: unknown) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}

function isCacheValid() { return _cachedItems && (Date.now() - _cacheTimestamp) < _cacheTTL; }
function clearCache() { _cachedItems = null; _cachedGroups = null; _cacheTimestamp = 0; log('debug', 'Cache cleared'); }

export async function fetchItems(forceRefresh: boolean) {
  if (!forceRefresh && isCacheValid()) { return { success: true, data: _cachedItems, groups: _cachedGroups }; }
  try {
    const response = await fetch(`${_apiBase}/items`, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
    const result = await response.json();
    if (result.success && result.data) {
      _cachedItems = result.data.map((item: Record<string, unknown>, index: number) => ({
        id: item.item_key,
        label: item.label,
        tooltip: item.tooltip,
        icon: item.icon_name,
        groupId: item.group_id,
        actionType: item.action_type || 'openPanel',
        actionPanelId: item.action_panel_id,
        order: item.order_index || index,
        badgeType: item.badge_type || 'none',
        showOnDesktop: !!item.show_on_desktop,
        showOnTablet: !!item.show_on_tablet,
        showOnMobile: !!item.show_on_mobile,
        isActive: !!item.is_active,
        dbId: item.id,
        uarpsTrigger: item.uarps_trigger_id || null,
        minLevel: item.min_access_level || 0
      }));
      _cachedGroups = result.groups || [];
      _cacheTimestamp = Date.now();
      log('info', 'Items fetched', { count: _cachedItems!.length });
    }
    return { success: true, data: _cachedItems, groups: _cachedGroups };
  } catch (err: any) { log('error', 'Failed to fetch items', { error: err.message }); return { success: false, error: err.message }; }
}

export async function fetchGroups() {
  try {
    const response = await fetch(`${_apiBase}/groups`, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
    const result = await response.json();
    if (result.success) { _cachedGroups = result.data || []; }
    return result;
  } catch (err: any) { log('error', 'Failed to fetch groups', { error: err.message }); return { success: false, error: err.message }; }
}

export async function createItem(item: Record<string, unknown>) {
  try {
    const payload = { item_key: item.id, label: item.label, tooltip: item.tooltip || null, icon_name: item.icon || 'circle', group_id: item.groupId || null, action_type: item.actionType || 'openPanel', action_panel_id: item.actionPanelId || null, order_index: item.order || 99, badge_type: item.badgeType || 'none', show_on_desktop: item.showOnDesktop ? 1 : 0, show_on_tablet: item.showOnTablet ? 1 : 0, show_on_mobile: item.showOnMobile ? 1 : 0, is_active: item.isActive ? 1 : 0, uarps_trigger_id: item.uarpsTrigger || null };
    const response = await fetch(`${_apiBase}/items`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err: any) { log('error', 'Failed to create item', { error: err.message }); return { success: false, error: err.message }; }
}

export async function updateItem(itemId: string | number, updates: Record<string, unknown>) {
  try {
    const payload: Record<string, unknown> = { id: itemId };
    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.tooltip !== undefined) payload.tooltip = updates.tooltip;
    if (updates.icon !== undefined) payload.icon_name = updates.icon;
    if (updates.groupId !== undefined) payload.group_id = updates.groupId;
    if (updates.actionType !== undefined) payload.action_type = updates.actionType;
    if (updates.actionPanelId !== undefined) payload.action_panel_id = updates.actionPanelId;
    if (updates.order !== undefined) payload.order_index = updates.order;
    if (updates.badgeType !== undefined) payload.badge_type = updates.badgeType;
    if (updates.showOnDesktop !== undefined) payload.show_on_desktop = updates.showOnDesktop ? 1 : 0;
    if (updates.showOnTablet !== undefined) payload.show_on_tablet = updates.showOnTablet ? 1 : 0;
    if (updates.showOnMobile !== undefined) payload.show_on_mobile = updates.showOnMobile ? 1 : 0;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive ? 1 : 0;
    if (updates.uarpsTrigger !== undefined) payload.uarps_trigger_id = updates.uarpsTrigger;
    const response = await fetch(`${_apiBase}/items`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err: any) { log('error', 'Failed to update item', { error: err.message }); return { success: false, error: err.message }; }
}

export async function deleteItem(itemId: string | number) {
  try {
    const response = await fetch(`${_apiBase}/items?id=${itemId}`, { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
    const result = await response.json();
    if (result.success) clearCache();
    return result;
  } catch (err: any) { log('error', 'Failed to delete item', { error: err.message }); return { success: false, error: err.message }; }
}

export async function reorderItems(itemIds: (string | number)[]) {
    var items = itemIds.map(function(id, index) {
        return { id: id, order_index: index + 1 };
    });
    var response = await fetch(_apiBase + '/items?action=reorder', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
    });
    var result = await response.json();
    if (result.success) clearCache();
    return result;
}

export const NavRailAdapter = { getItems: fetchItems, getGroups: fetchGroups, createItem, updateItem, deleteItem, reorderItems, clearCache, injectPorts, getPorts };
export { clearCache, VERSION, MODULE_ID };
