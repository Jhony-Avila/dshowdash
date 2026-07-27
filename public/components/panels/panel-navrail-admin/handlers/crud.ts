// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-navrail-admin:handlers:crud
// PURPOSE: Panel NavRail Admin - CRUD Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   subscribe() — exported function
//   getState() — exported function
//   openNewItemModal() — exported function
//   openEditItemModal() — exported function
//   closeModal() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 4.1.0-STRICT-MODE
// @changelog v4.1.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v4.0.0-PORTSFACTORY-ES6 - PortsFactory migration

'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import * as adapter from '../core/navrail-adapter.js';

const MODULE_ID = 'panel-navrail-admin:handlers:crud';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

const _state: { items: Record<string, unknown>[]; groups: Record<string, unknown>[]; editingItem: Record<string, unknown> | null; isModalOpen: boolean; isLoading: boolean } = { items: [], groups: [], editingItem: null, isModalOpen: false, isLoading: false };
let _listeners: ((s: typeof _state) => void)[] = [];

function log(level: string, msg: string, data?: unknown) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](`[${MODULE_ID}]`, msg, data);
}

function notifyListeners() { _listeners.forEach(fn => { fn(_state); }); }

export function subscribe(fn: (s: typeof _state) => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function getState() { return _state; }

export function openNewItemModal() {
  _state.editingItem = { id: '', label: '', tooltip: '', icon: 'circle', groupId: null, actionType: 'openPanel', actionPanelId: '', order: 0, badgeType: 'none', showOnDesktop: true, showOnTablet: true, showOnMobile: true, isActive: true, uarpsTrigger: null };
  _state.isModalOpen = true;
  notifyListeners();

  log('debug', 'New item modal opened');
}

export function openEditItemModal(itemId: string | number) {
  const item = _state.items.find(i => i.id === itemId || i.dbId == itemId);
  if (!item) { log('warn', 'Item not found', { itemId }); return; }
  _state.editingItem = Object.assign({}, item);
  _state.isModalOpen = true;
  notifyListeners();
  log('debug', 'Edit item modal opened', { itemId });
}

export function closeModal() { _state.editingItem = null; _state.isModalOpen = false; notifyListeners(); }

export async function saveItem(formData: FormData) {
  const isNew = !_state.editingItem || !_state.editingItem.dbId;
  const item = {
    id: formData.get('item_key'), label: formData.get('label'), tooltip: formData.get('tooltip') || null,
    icon: formData.get('icon_name') || 'circle', groupId: formData.get('group_id') || null,
    actionType: formData.get('action_type') || 'openPanel', actionPanelId: formData.get('action_panel_id') || null,
    order: parseInt(formData.get('order_index') as string) || 0, badgeType: formData.get('badge_type') || 'none',
    showOnDesktop: !!formData.get('show_on_desktop'), showOnTablet: !!formData.get('show_on_tablet'),
    showOnMobile: !!formData.get('show_on_mobile'), isActive: !!formData.get('is_active'),
    uarpsTrigger: formData.get('uarps_trigger_id') || null
  };
  _state.isLoading = true; notifyListeners();
  try {
    let result;
    if (isNew) { result = await adapter.createItem(item); log('info', 'Item created', { id: item.id }); }
    // @ts-expect-error strict migration — TS18047
    else { result = await adapter.updateItem(_state.editingItem.dbId as string | number, item); log('info', 'Item updated', { id: _state.editingItem.dbId }); }
    if (result.success) { closeModal(); await refreshItems(); }
    return result;
  } catch (err: any) { log('error', 'Failed to save item', { error: err.message }); return { success: false, error: err.message }; }
  finally { _state.isLoading = false; notifyListeners(); }
}

export async function deleteItem(itemId: string | number) {
  _state.isLoading = true; notifyListeners();
  try {
    const result = await adapter.deleteItem(itemId);
    if (result.success) { log('info', 'Item deleted', { itemId }); await refreshItems(); }
    return result;
  } catch (err: any) { log('error', 'Failed to delete item', { error: err.message }); return { success: false, error: err.message }; }
  finally { _state.isLoading = false; notifyListeners(); }
}

export async function refreshItems() {
  _state.isLoading = true; notifyListeners();
  try {
    const result = await adapter.fetchItems(true);
    if (result.success) { _state.items = result.data || []; _state.groups = result.groups || []; }
    return result;
  } catch (err: any) { log('error', 'Failed to refresh items', { error: err.message }); return { success: false, error: err.message }; }
  finally { _state.isLoading = false; notifyListeners(); }
}

export async function init() {

  log('info', 'Initializing CRUD handlers');
  await refreshItems();
  const groupsResult = await adapter.fetchGroups();
  if (groupsResult.success) { _state.groups = groupsResult.data || []; notifyListeners(); }
}

export { VERSION, MODULE_ID };
