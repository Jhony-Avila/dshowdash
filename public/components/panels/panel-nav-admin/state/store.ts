// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.state.store
// PURPOSE: Panel Nav Admin Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PHASES, STATE_SHAPE from ../core/contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   state — exported value
//   store — exported value
//   init() — exported function
//   getState() — exported function
//   get() — exported function
//   setState() — exported function
//   set() — exported function
//   setPhase() — exported function
//   setItems() — exported function
//   setSections() — exported function
//   setIcons() — exported function
//   setSelectedItem() — exported function
//   setSelectedSection() — exported function
//   ... and 17 more exports
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PHASES, STATE_SHAPE } from '../core/contracts.js';

const VERSION = '10.0.0-GROUP-FILTER';
const MODULE_ID = 'panel-nav-admin.state.store';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _debug() { const cfg = _getPort('config'); return cfg?.app?.debug === true; }
function _log(level: string, ...args: unknown[]) {
    const logger = _getPort('logger');
    if (!logger) return;
    if (!_debug() && level === 'debug') return;
    const fn = logger[level] || logger.info;
    if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args);
}

const initialState = Object.assign({}, STATE_SHAPE, { status: PHASES.IDLE, activeTab: 'items', countdown: null, diagnosticData: null, diagnosticLoading: false, kpis: null, pagination: { page: 1, perPage: 9999, total: 0, totalPages: 0 }, sort: { field: 'order', order: 'asc' }, favoritos: [], selectedIds: new Set() });

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (a instanceof Set && b instanceof Set) { if (a.size !== b.size) return false; for (const v of a) { if (!b.has(v)) return false; } return true; }
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const arrA = a as unknown[]; const arrB = b as unknown[];
    if (Array.isArray(a)) { if (arrA.length !== arrB.length) return false; for (let i = 0; i < arrA.length; i++) { if (!deepEqual(arrA[i], arrB[i])) return false; } return true; }
    const objA = a as Record<string, unknown>; const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA), keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) { if (!keysB.includes(key) || !deepEqual(objA[key], objB[key])) return false; }
    return true;
}

function Store(this: any) { this._state = Object.assign({}, initialState, { selectedIds: new Set() }); this._sliceListeners = new Map(); this._globalListeners = new Set(); this._initialized = false; }

Store.prototype.init = function(partialState: Record<string, unknown> = {}) { if (this._initialized) return { success: true, alreadyInitialized: true }; _initPorts(); this._state = Object.assign({}, initialState, { selectedIds: new Set() }, partialState || {}); this._initialized = true; return { success: true }; };

Store.prototype.subscribe = function(sliceOrCallback: string | ((snapshot: unknown) => void), callback: (value: unknown) => void) {
    if (typeof sliceOrCallback === 'function') { this._globalListeners.add(sliceOrCallback); return () => this._globalListeners.delete(sliceOrCallback); }
    const slice = sliceOrCallback;
    if (!this._sliceListeners.has(slice)) this._sliceListeners.set(slice, new Set());
    this._sliceListeners.get(slice).add(callback);
    return () => { const s = this._sliceListeners.get(slice); if (s) s.delete(callback); };
};

Store.prototype._emit = function(slice: string, value: unknown) {
    const listeners = this._sliceListeners.get(slice);
    if (listeners?.size > 0) { listeners.forEach((cb: (v: unknown) => void) => { try { cb(value); } catch (e) { _log('error', 'Listener error:', slice, (e as Error).message); } }); }
    if (this._globalListeners.size > 0) { const snapshot = this.getState(); this._globalListeners.forEach((cb: (s: unknown) => void) => { try { cb(snapshot); } catch (e) { _log('error', 'Global listener error:', (e as Error).message); } }); }
};

Store.prototype._set = function(slice: string, value: unknown) { var isEqual = deepEqual(this._state[slice], value); if (isEqual) return false; this._state[slice] = value; this._emit(slice, value); return true; };
Store.prototype.getState = function() { return Object.assign({}, this._state, { selectedIds: new Set(this._state.selectedIds) }); };
Store.prototype.get = function(slice: string) { return this._state[slice]; };
Store.prototype.setItems = function(items: unknown[]) { if (!this._set('items', items || [])) { return; } this._set('phase', PHASES.READY); this._set('loading', false); this._set('error', null); this._set('lastLoadAt', Date.now()); };
Store.prototype.setSections = function(sections: Record<string, unknown>) { this._set('sections', sections || {}); };
Store.prototype.setIcons = function(icons: unknown[]) { this._set('icons', icons || []); };
Store.prototype.setKPIs = function(kpis: unknown) { this._set('kpis', kpis); };
Store.prototype.setActiveTab = function(tab: string) { this._set('activeTab', tab); };
Store.prototype.setCountdown = function(seconds: number | null) { this._set('countdown', seconds); };
Store.prototype.setFilters = function(filters: Record<string, unknown>) { const newFilters = Object.assign({}, this._state.filters, filters); if (!this._set('filters', newFilters)) return; this._set('pagination', Object.assign({}, this._state.pagination, { page: 1 })); };
Store.prototype.setFilter = function(key: string, value: unknown) { this.setFilters({ [key]: value }); };
Store.prototype.clearFilters = function() { this._set('filters', { section: 'sidebar', search: '', group: '' }); this._set('pagination', Object.assign({}, this._state.pagination, { page: 1 })); };
Store.prototype.setSort = function(field: string) { const sort = this._state.sort; const order = sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'; this._set('sort', { field, order }); };
Store.prototype.setPage = function(page: number) { if (this._state.pagination.page === page) return; this._set('pagination', Object.assign({}, this._state.pagination, { page })); };
Store.prototype.setPagination = function(pagination: Record<string, unknown>) { this._set('pagination', Object.assign({}, this._state.pagination, pagination)); };
Store.prototype.setSelectedItem = function(item: unknown) { this._set('selectedItem', item); };
Store.prototype.setSelectedSection = function(section: unknown) { this._set('selectedSection', section); };
Store.prototype.toggleSelection = function(id: unknown) { const newSet = new Set(this._state.selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); this._set('selectedIds', newSet); };
Store.prototype.selectAll = function(ids: unknown[]) { this._set('selectedIds', new Set(ids)); };
Store.prototype.clearSelection = function() { this._set('selectedIds', new Set()); };
Store.prototype.setFavoritos = function(favoritos: unknown[]) { this._set('favoritos', favoritos || []); };
Store.prototype.toggleFavorito = function(id: unknown) { const favs = (this._state.favoritos as unknown[]).slice(); const idx = (favs as unknown[]).indexOf(id); if (idx >= 0) favs.splice(idx, 1); else favs.push(id); this._set('favoritos', favs); try { localStorage.setItem('pna-favoritos', JSON.stringify(favs)); } catch (e) {} };
Store.prototype.loadFavoritos = function() { try { const saved = localStorage.getItem('pna-favoritos'); if (saved) this._set('favoritos', JSON.parse(saved)); } catch (e) {} };
Store.prototype.setDiagnosticData = function(data: unknown) { this._set('diagnosticData', data); this._set('diagnosticLoading', false); };
Store.prototype.setDiagnosticLoading = function(loading: boolean) { this._set('diagnosticLoading', loading); };
Store.prototype.clearDiagnostic = function() { this._set('diagnosticData', null); this._set('diagnosticLoading', false); };
Store.prototype.setLoading = function(loading: boolean) { this._set('loading', loading); if (loading) this._set('phase', PHASES.LOADING); };
Store.prototype.setError = function(error: unknown) { this._set('error', error); this._set('phase', PHASES.ERROR); this._set('loading', false); };
Store.prototype.clearError = function() { this._set('error', null); };
Store.prototype.setPhase = function(phase: string) { this._set('phase', phase); };
Store.prototype.markLoading = function() { this._set('phase', PHASES.LOADING); this._set('loading', true); };
Store.prototype.markReady = function() { this._set('phase', PHASES.READY); this._set('loading', false); this._set('lastLoadAt', Date.now()); };
Store.prototype.markSaving = function() { this._set('phase', PHASES.SAVING); };
Store.prototype.markSaved = function() { this._set('phase', PHASES.READY); this._set('lastSaveAt', Date.now()); };
Store.prototype.getFilteredItems = function() { const items = this._state.items as Record<string, unknown>[], filters = this._state.filters; let filtered = (items || []).slice(); if (filters.section && filters.section !== 'all') { const sectionFilter = String(filters.section).toLowerCase(); filtered = filtered.filter((item: Record<string, unknown>) => String(item.section || '').toLowerCase() === sectionFilter); } if (filters.group && filters.group !== '') { const groupFilter = String(filters.group); filtered = filtered.filter((item: Record<string, unknown>) => String(item.parentKey || item.parent_key || '') === groupFilter); } if (filters.search?.trim().length >= 2) { const q = filters.search.toLowerCase(); filtered = filtered.filter((item: Record<string, unknown>) => (item.label as string)?.toLowerCase().includes(q) || (item.id as string)?.toLowerCase().includes(q) || (item.href as string)?.toLowerCase().includes(q) || (item.displayTitle as string)?.toLowerCase().includes(q)); } return filtered; };
Store.prototype.getItemsGroupedBySection = function() { const items = this._state.items as Record<string, unknown>[], sections = this._state.sections as Record<string, Record<string, unknown>>; const groups: Record<string, unknown[]> = {}; const sectionOrder = Object.keys(sections || {}).sort((a: string, b: string) => ((sections[a]?.order as number) || 99) - ((sections[b]?.order as number) || 99)); for (const sec of sectionOrder) { groups[sec] = []; } for (const item of (items || [])) { const section = (item.section as string) || 'main'; if (!groups[section]) groups[section] = []; groups[section].push(item); } return groups; };
Store.prototype.reset = function() { Object.keys(initialState).forEach((key: string) => { if (key === 'selectedIds') this._set(key, new Set()); else this._set(key, (initialState as Record<string, unknown>)[key]); }); };
Store.prototype.destroy = function() { this._sliceListeners.clear(); this._globalListeners.clear(); this.reset(); this._initialized = false; };
Store.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, phase: this._state.phase, itemCount: this._state.items?.length || 0, sectionCount: Object.keys(this._state.sections || {}).length, sliceListeners: this._sliceListeners.size, globalListeners: this._globalListeners.size, portsInitialized: Ports.isInitialized() }; };
Store.prototype.healthCheck = function() { const logger = _getPort('logger'); const checks = { initialized: this._initialized, hasValidState: !!this._state && typeof this._state === 'object', hasItems: Array.isArray(this._state.items), hasSections: !!this._state.sections && typeof this._state.sections === 'object', loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, phase: this._state.phase, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new (Store as any)() as InstanceType<typeof Object> & Record<string, (...args: unknown[]) => unknown>;

const init = (s: Record<string, unknown> = {}) => store.init(s);
const getState = () => store.getState();
const get = (k: string) => store.get(k);
const setState = (p: Record<string, unknown>) => { for (const k in p) { if (Object.hasOwn(p, k)) store._set(k, p[k]); } };
const set = (k: string, v: unknown) => store._set(k, v);
const setPhase = (p: string) => store.setPhase(p);
const setItems = (i: unknown[]) => store.setItems(i);
const setSections = (s: Record<string, unknown>) => store.setSections(s);
const setIcons = (i: unknown[]) => store.setIcons(i);
const setSelectedItem = (i: unknown) => store.setSelectedItem(i);
const setSelectedSection = (s: unknown) => store.setSelectedSection(s);
const setError = (e: unknown) => store.setError(e);
const clearError = () => store.clearError();
const setFilter = (k: string, v: unknown) => store.setFilter(k, v);
const clearFilters = () => store.clearFilters();
const markLoading = () => store.markLoading();
const markReady = () => store.markReady();
const markSaving = () => store.markSaving();
const markSaved = () => store.markSaved();
const getFilteredItems = () => store.getFilteredItems();
const getItemsGroupedBySection = () => store.getItemsGroupedBySection();
const subscribe = (a: string | ((snapshot: unknown) => void), b: (value: unknown) => void) => store.subscribe(a, b);
const reset = () => store.reset();
const destroy = () => store.destroy();
const healthCheck = () => store.healthCheck();
const info = () => store.info();

export { store, init, getState, get, setState, set, setPhase, setItems, setSections, setIcons, setSelectedItem, setSelectedSection, setError, clearError, setFilter, clearFilters, markLoading, markReady, markSaving, markSaved, getFilteredItems, getItemsGroupedBySection, subscribe, reset, destroy, healthCheck, info, VERSION, MODULE_ID };
export const state = store;
export default store;
