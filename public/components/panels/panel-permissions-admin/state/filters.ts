// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-filters
// PURPOSE: UARPS Admin - Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _getState, notify, getUserPermissions as coreSetFilter from ./core.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getUserFilter() — exported function
//   setUserFilter() — exported function
//   getFilteredUsers() — exported function
//   getFilteredTriggers() — exported function
//   getFilteredRegions() — exported function
//   getTriggerAreas() — exported function
//   applySavedFilter() — exported function
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

import { _getState, notify, getUserPermissions as coreSetFilter } from './core.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-filters';

export function getUserFilter() { const state = _getState(); const uf = state.userFilter; return { status: uf.status, sort: uf.sort }; }

export function setUserFilter(filter: Record<string, string>) { const state = _getState(); for (const k in filter) { if (Object.prototype.hasOwnProperty.call(filter, k)) (state.userFilter as Record<string, string>)[k] = filter[k]; } notify('userFilter'); }

export function getFilteredUsers() {
  const state = _getState();
  let filtered = state.users.slice();
  const status = state.userFilter.status;
  const sort = state.userFilter.sort;
  
  if (status === 'active') { filtered = filtered.filter(u => u.ativo !== false); }
  else if (status === 'inactive') { filtered = filtered.filter(u => u.ativo === false); }

  // @ts-expect-error TS migration - TS2304
  else if (status === 'with-perms') { filtered = filtered.filter(u => { const perms = getUserPermissions(u.id); return perms.triggers.length > 0 || perms.regions.length > 0; }); }

  // @ts-expect-error TS migration - TS2304
  else if (status === 'without-perms') { filtered = filtered.filter(u => { const perms = getUserPermissions(u.id); return perms.triggers.length === 0 && perms.regions.length === 0; }); }
  
  filtered.sort((a, b) => {
    const nameA = (String(a.nome || a.name || '')).toLowerCase();
    const nameB = (String(b.nome || b.name || '')).toLowerCase();
    const levelA = Number(a.nivel || a.level || 0);
    const levelB = Number(b.nivel || b.level || 0);
    if (sort === 'name') return nameA.localeCompare(nameB);
    if (sort === 'name-desc') return nameB.localeCompare(nameA);
    if (sort === 'level-desc') return levelB - levelA;
    if (sort === 'level') return levelA - levelB;
    return 0;
  });
  return filtered;
}

export function getFilteredTriggers() {
  const state = _getState();
  const search = state.filter.search;
  const type = state.filter.type;
  let filtered = state.triggers.slice();
  if (search) { const s = search.toLowerCase(); filtered = filtered.filter(t => (t.id && String(t.id).toLowerCase().indexOf(s) !== -1) || (t.label && String(t.label).toLowerCase().indexOf(s) !== -1) || (t.area && String(t.area).toLowerCase().indexOf(s) !== -1)); }
  if (type && type !== 'all') { filtered = filtered.filter(t => t.area === type); }
  return filtered;
}

export function getFilteredRegions() {
  const state = _getState();
  const search = state.filter.search;
  let filtered = state.regions.slice();
  if (search) { const s = search.toLowerCase(); filtered = filtered.filter(r => (r.id && String(r.id).toLowerCase().indexOf(s) !== -1) || (r.label && String(r.label).toLowerCase().indexOf(s) !== -1)); }
  return filtered;
}

export function getTriggerAreas() { const areas: Record<string, boolean> = {}; const state = _getState(); state.triggers.forEach(t => { if (t.area) (areas as Record<string, boolean>)[t.area as string] = true; }); return Object.keys(areas).sort(); }

export function applySavedFilter(id: number | string, savedFilters: Array<{ id: number | string; filter: unknown }>) { let found = null; for (let i = 0; i < savedFilters.length; i++) { if (savedFilters[i].id === id) { found = savedFilters[i]; break; } } if (found) { coreSetFilter((found as { id: number | string; filter: unknown }).filter as string | number); return true; } return false; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: typeof getFilteredUsers === 'function' } }; }
