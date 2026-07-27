// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-16-ui-persistence
// PURPOSE: Panel-16 UI Persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEYS, COLUMN_TYPES from ./constants.js
//   COLUMNS, DEFAULT_VIEWS from ../core/constants.js
//   StoragePort from ../ports/index.js
//
// PROVIDES:
//   loadFilters() — exported function
//   saveFilters() — exported function
//   loadViewMode() — exported function
//   saveViewMode() — exported function
//   loadColumns() — exported function
//   saveColumns() — exported function
//   loadSavedViews() — exported function
//   saveSavedViews() — exported function
//   loadFavorites() — exported function
//   saveFavorites() — exported function
//   loadSort() — exported function
//   saveSort() — exported function
//   loadPinnedCols() — exported function
//   savePinnedCols() — exported function
//   MODULE_ID — module constant
//   ... and 3 more exports
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

import { STORAGE_KEYS, COLUMN_TYPES } from './constants.js';
import { COLUMNS, DEFAULT_VIEWS } from '../core/constants.js';
import { StoragePort } from '../ports/index.js';

export function loadFilters() { return StoragePort.session.get(STORAGE_KEYS.FILTERS) || {}; }
export function saveFilters(filters: Record<string, unknown>) { StoragePort.session.set(STORAGE_KEYS.FILTERS, filters); }
export function loadViewMode() { return StoragePort.session.get(STORAGE_KEYS.VIEW) || 'normal'; }
export function saveViewMode(mode: string) { StoragePort.session.set(STORAGE_KEYS.VIEW, mode); }
export function loadColumns() { const saved = StoragePort.local.get(STORAGE_KEYS.COLUMNS); if (saved) return saved; return COLUMNS.map((c: Record<string, unknown>) => ({ ...c, ...((COLUMN_TYPES as Record<string, unknown>)[c.id as string] as Record<string, unknown> || {}) })); }
export function saveColumns(columns: unknown[]) { StoragePort.local.set(STORAGE_KEYS.COLUMNS, columns); }
export function loadSavedViews() { const saved = StoragePort.local.get(STORAGE_KEYS.VIEWS); return saved || [...DEFAULT_VIEWS]; }
export function saveSavedViews(views: unknown[]) { StoragePort.local.set(STORAGE_KEYS.VIEWS, views); }
export function loadFavorites() { const saved = StoragePort.local.get(STORAGE_KEYS.FAVORITES); return saved ? new Set(saved) : new Set(); }
export function saveFavorites(favorites: Set<unknown>) { StoragePort.local.set(STORAGE_KEYS.FAVORITES, [...favorites]); }
export function loadSort() { return StoragePort.local.get(STORAGE_KEYS.SORT) || [{ column: 'nome', direction: 'asc' }]; }
export function saveSort(sortColumns: unknown[]) { StoragePort.local.set(STORAGE_KEYS.SORT, sortColumns); }
export function loadPinnedCols(side: string) { const saved = StoragePort.local.get(`${STORAGE_KEYS.PINNED}_${side}`); if (saved) return new Set(saved); return new Set(side === 'left' ? ['checkbox', 'nome'] : ['action']); }
export function savePinnedCols(pinnedLeft: Set<unknown>, pinnedRight: Set<unknown>) { StoragePort.local.set(`${STORAGE_KEYS.PINNED}_left`, [...pinnedLeft]); StoragePort.local.set(`${STORAGE_KEYS.PINNED}_right`, [...pinnedRight]); }

export default { loadFilters, saveFilters, loadViewMode, saveViewMode, loadColumns, saveColumns, loadSavedViews, saveSavedViews, loadFavorites, saveFavorites, loadSort, saveSort, loadPinnedCols, savePinnedCols };

export const MODULE_ID = 'panels-panel-16-ui-persistence';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, storagePortAvailable: StoragePort.isAvailable() } }; }
