// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:index:state
// PURPOSE: Panel-05 Index - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _refs — exported value
//   _initialized — exported value
//   _unsubscribes — exported value
//   _favoritos — exported value
//   _selectedIds — exported value
//   _currentView — exported value
//   setRefs() — exported function
//   setInitialized() — exported function
//   setCurrentView() — exported function
//   loadFavoritos() — exported function
//   saveFavoritos() — exported function
//   toggleFavorito() — exported function
//   toggleSelection() — exported function
//   selectAll() — exported function
//   clearSelection() — exported function
//   ... and 7 more exports
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

export let _refs: Record<string, unknown> | null = null;
export let _initialized = false;
export let _unsubscribes: Array<() => void> = [];
export let _favoritos: string[] = [];
export let _selectedIds = new Set();
export let _currentView = 'list';

export function setRefs(r: Record<string, unknown>) { _refs = r; }
export function setInitialized(i: boolean) { _initialized = i; }
export function setCurrentView(v: string) { _currentView = v; }

export function loadFavoritos() { try { _favoritos = JSON.parse(localStorage.getItem('p05_favoritos') || '[]'); } catch { _favoritos = []; } }
export function saveFavoritos() { try { localStorage.setItem('p05_favoritos', JSON.stringify(_favoritos)); } catch {} }
export function toggleFavorito(id: string, updateFn: (...args: unknown[]) => void) { const idx = _favoritos.indexOf(id); if (idx > -1) _favoritos.splice(idx, 1); else _favoritos.push(id); saveFavoritos(); updateFn(_refs, id, _favoritos.includes(id)); }

export function toggleSelection(id: string, updateFn: (...args: unknown[]) => void) { if (_selectedIds.has(id)) _selectedIds.delete(id); else _selectedIds.add(id); updateFn(_refs, Array.from(_selectedIds)); }
export function selectAll(ids: string[], updateFn: (...args: unknown[]) => void) { ids.forEach((id: string) => _selectedIds.add(id)); updateFn(_refs, Array.from(_selectedIds)); }
export function clearSelection(updateFn: (...args: unknown[]) => void) { _selectedIds.clear(); updateFn([]); }

export function addUnsubscribe(fn: () => void) { _unsubscribes.push(fn); }
export function clearUnsubscribes() { _unsubscribes.forEach(unsub => unsub?.()); _unsubscribes = []; }

export function resetState() { _refs = null; _initialized = false; _unsubscribes = []; _selectedIds.clear(); _currentView = 'list'; }

export default { setRefs, setInitialized, setCurrentView, loadFavoritos, saveFavoritos, toggleFavorito, toggleSelection, selectAll, clearSelection, addUnsubscribe, clearUnsubscribes, resetState };

export const MODULE_ID = 'panel-05:index:state';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } }; }
