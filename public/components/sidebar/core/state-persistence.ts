// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-state-persistence
// PURPOSE: Sidebar Core - State Persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   saveCollapsedState() — exported function
//   restoreCollapsedState() — exported function
//   saveState() — exported function
//   loadState() — exported function
//   clearState() — exported function
//   checkSync() — exported function
//   forceSync() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-state-persistence';

const STORAGE_KEY_UNIFIED = 'dshowdash-layout-sidebarCollapsed';
const STORAGE_KEY_LEGACY = 'dsd-sidebar-collapsed';
const STORAGE_KEY = 'dsd-sidebar-state';

let _metrics = { saves: 0, loads: 0, errors: 0, migrations: 0 };

export function saveCollapsedState(collapsed: boolean) {
  try { const value = JSON.stringify(collapsed); localStorage.setItem(STORAGE_KEY_UNIFIED, value); localStorage.setItem(STORAGE_KEY_LEGACY, value); _metrics.saves++; return true; }
  catch (error: any) { _metrics.errors++; return false; }
}

export function restoreCollapsedState() {
  try {
    let data = localStorage.getItem(STORAGE_KEY_UNIFIED);
    if (data === null) { data = localStorage.getItem(STORAGE_KEY_LEGACY); if (data !== null) { localStorage.setItem(STORAGE_KEY_UNIFIED, data); _metrics.migrations++; } }
    _metrics.loads++;
    if (data === null) return false;
    return JSON.parse(data);
  } catch (error: any) { _metrics.errors++; return false; }
}

export function saveState(state: DynObj) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); _metrics.saves++; return true; } catch (error: any) { _metrics.errors++; return false; } }
export function loadState() { try { const data = localStorage.getItem(STORAGE_KEY); _metrics.loads++; return data ? JSON.parse(data) : null; } catch (error: any) { _metrics.errors++; return null; } }
export function clearState() { try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_KEY_UNIFIED); localStorage.removeItem(STORAGE_KEY_LEGACY); return true; } catch (error: any) { _metrics.errors++; return false; } }

export function checkSync() {
  try {
    const unified = localStorage.getItem(STORAGE_KEY_UNIFIED);
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
    const unifiedValue = unified !== null ? JSON.parse(unified) : null;
    const legacyValue = legacy !== null ? JSON.parse(legacy) : null;
    return { synced: unifiedValue === legacyValue, unified: unifiedValue, legacy: legacyValue };
  } catch (error: any) { _metrics.errors++; return { synced: false, error: error.message }; }
}

export function forceSync() {
  try {
    const unified = localStorage.getItem(STORAGE_KEY_UNIFIED);
    if (unified !== null) localStorage.setItem(STORAGE_KEY_LEGACY, unified);
    else { const legacy = localStorage.getItem(STORAGE_KEY_LEGACY); if (legacy !== null) { localStorage.setItem(STORAGE_KEY_UNIFIED, legacy); _metrics.migrations++; } }
    return { success: true };
  } catch (error: any) { _metrics.errors++; return { success: false, error: error.message }; }
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics = { saves: 0, loads: 0, errors: 0, migrations: 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, syncStatus: checkSync(), metrics: getMetrics() }; }

export function healthCheck() {
  let storageAvailable = false;
  try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); storageAvailable = true; } catch { /* storage unavailable */ }
  const syncStatus = checkSync();
  let status = 'HEALTHY';
  if (!storageAvailable) status = 'DEGRADED';
  if (_metrics.errors > 5) status = 'DEGRADED';
  if (!syncStatus.synced && syncStatus.unified !== null && syncStatus.legacy !== null) status = 'DEGRADED';
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { storageAvailable, noErrors: _metrics.errors === 0, keysSynced: syncStatus.synced }, keys: { unified: STORAGE_KEY_UNIFIED, legacy: STORAGE_KEY_LEGACY, general: STORAGE_KEY }, syncStatus, metrics: getMetrics() };
}

export default { saveState, loadState, clearState, saveCollapsedState, restoreCollapsedState, checkSync, forceSync, getMetrics, resetMetrics, info, healthCheck, VERSION, MODULE_ID };
