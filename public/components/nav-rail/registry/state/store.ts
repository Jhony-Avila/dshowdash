// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-registry-state
// PURPOSE: NavRail Registry - State Store
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPortsSnapshot() — exported function
//   CACHE_TTL — exported value
//   OFFLINE_CACHE_TTL — exported value
//   setGroups() — exported function
//   setItems() — exported function
//   setMobileItems() — exported function
//   setConfig() — exported function
//   setUserLevel() — exported function
//   setLoaded() — exported function
//   setLoading() — exported function
//   setLastLoad() — exported function
//   setLoadedAt() — exported function
//   updateMetrics() — exported function
//   addError() — exported function
//   clearErrors() — exported function
//   getGroups() — exported function
//   getItems() — exported function
//   getItemsByGroup() — exported function
//   getItem() — exported function
//   getMobileItems() — exported function
//   getMobileItemIds() — exported function
//   getConfig() — exported function
//   getUserLevel() — exported function
//   isLoaded() — exported function
//   isLoading() — exported function
//   getLastLoad() — exported function
//   getLoadedAt() — exported function
//   getMetrics() — exported function
//   getErrors() — exported function
//   getRawGroups() — exported function
//   getRawItems() — exported function
//   getRawMobileItems() — exported function
//   getRawConfig() — exported function
//   subscribe() — exported function
//   unsubscribe() — exported function
//   notify() — exported function
//   registerItem() — exported function
//   registerGroup() — exported function
//   clear() — exported function
//   reset() — exported function
//   getSnapshot() — exported function
//   restoreSnapshot() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'navrail-registry-state';
export const VERSION = '4.4.0-ES6';

const _Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
export function getPortsSnapshot() { return _Ports.snapshot(); }

const _log = function(level: 'error' | 'warn' | 'info' | 'debug', ...args: unknown[]) {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort('logger') as Record<string, unknown> | null;
  if (logger && typeof logger[level] === 'function') { (logger[level] as (...a: unknown[]) => void).apply(logger, ([prefix] as unknown[]).concat(args)); }
  else if (level === 'error' || level === 'warn') {
    const fn = console.debug;
    fn.apply(console, ([prefix] as unknown[]).concat(args) as string[]);
  }
};

export interface NavItem {
  id: string;
  group?: string;
  hidden?: boolean;
  order?: number;
  [key: string]: unknown;
}

export interface NavGroup {
  id: string;
  order?: number;
  [key: string]: unknown;
}

interface NavError {
  type: string;
  message: string;
  timestamp: number;
}

type SubscriberFn = (data: { groups: NavGroup[]; items: NavItem[]; mobileItems: (string | NavItem)[] }) => void;

let _groups: NavGroup[] = [];
let _items: NavItem[] = [];
let _mobileItems: (string | NavItem)[] = [];
let _config: Record<string, unknown> = {};
let _userLevel: number = 0;
let _loaded: boolean = false;
let _loading: boolean = false;
let _lastLoad: number = 0;
let _loadedAt: number | null = null;
const _subscribers: Set<SubscriberFn> = new Set();
let _errors: NavError[] = [];

interface RegistryMetrics {
  source: string | null;
  apiCalls: number;
  apiFails: number;
  cacheHits: number;
  indexedDBHits: number;
  lastLoadTime: string | null;
  loadDuration: number;
  offlineMode: boolean;
}

let _metrics: RegistryMetrics = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: false };

export const CACHE_TTL = 5 * 60 * 1000;
export const OFFLINE_CACHE_TTL = 24 * 60 * 60 * 1000;

export function setGroups(groups: NavGroup[]) { _groups = groups; }
export function setItems(items: NavItem[]) { _items = items; }
export function setMobileItems(items: (string | NavItem)[]) { _mobileItems = items; }
export function setConfig(config: Record<string, unknown>) { _config = config; }
export function setUserLevel(level: number) { _userLevel = level; }
export function setLoaded(loaded: boolean) { _loaded = loaded; }
export function setLoading(loading: boolean) { _loading = loading; }
export function setLastLoad(time: number) { _lastLoad = time; }
export function setLoadedAt(time: number) { _loadedAt = time; }
export function updateMetrics(updates: Partial<RegistryMetrics>) { Object.assign(_metrics, updates); }
export function addError(error: NavError) { _errors.push(error); if (_errors.length > 10) _errors.shift(); }
export function clearErrors() { _errors = []; }

export function getGroups() { return _groups.slice().sort((a, b) => (a.order || 0) - (b.order || 0)); }
export function getItems() { return _items.slice(); }
export function getItemsByGroup(groupId: string) { return _items.filter(item => item.group === groupId && !item.hidden).sort((a, b) => (a.order || 0) - (b.order || 0)); }
export function getItem(itemId: string) { return _items.find(item => item.id === itemId) || null; }
export function getMobileItems() { return _mobileItems.map(id => _items.find(item => item.id === id)).filter(Boolean); }
export function getMobileItemIds() { return _mobileItems.slice(); }
export function getConfig(key?: string): unknown { if (key) return _config[key]; return Object.assign({}, _config); }
export function getUserLevel() { return _userLevel; }
export function isLoaded() { return _loaded; }
export function isLoading() { return _loading; }
export function getLastLoad() { return _lastLoad; }
export function getLoadedAt() { return _loadedAt; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function getErrors() { return _errors.slice(-10); }
export function getRawGroups() { return _groups; }
export function getRawItems() { return _items; }
export function getRawMobileItems() { return _mobileItems; }
export function getRawConfig() { return _config; }

export function subscribe(callback: SubscriberFn) {
  if (typeof callback === 'function') { _subscribers.add(callback); }
  return () => { _subscribers.delete(callback); };
}

export function unsubscribe(callback: SubscriberFn) { _subscribers.delete(callback); }

export function notify() {
  _subscribers.forEach(fn => {
    try { fn({ groups: _groups, items: _items, mobileItems: _mobileItems }); }
    catch (e) { _log('error', 'Subscriber error', e); }
  });
}

export function registerItem(item: NavItem) {
  if (!item || !item.id) return false;
  const exists = _items.findIndex(i => i.id === item.id);
  if (exists >= 0) { _items[exists] = Object.assign({}, _items[exists], item); }
  else { _items.push(item); }
  notify();
  return true;
}

export function registerGroup(group: NavGroup) {
  if (!group || !group.id) return false;
  const exists = _groups.findIndex(g => g.id === group.id);
  if (exists >= 0) { _groups[exists] = Object.assign({}, _groups[exists], group); }
  else { _groups.push(group); }
  notify();
  return true;
}

export function clear() { _groups = []; _items = []; _mobileItems = []; _config = {}; _loaded = false; _lastLoad = 0; _loadedAt = null; }

export function reset() { clear(); _metrics = { source: null, apiCalls: 0, apiFails: 0, cacheHits: 0, indexedDBHits: 0, lastLoadTime: null, loadDuration: 0, offlineMode: false }; _errors = []; }

export function getSnapshot() { return { groups: _groups, items: _items, mobileItems: _mobileItems, config: _config, userLevel: _userLevel }; }

export function restoreSnapshot(snapshot: { groups?: NavGroup[]; items?: NavItem[]; mobileItems?: (string | NavItem)[]; config?: Record<string, unknown>; userLevel?: number }) {
  if (!snapshot) return;
  _groups = snapshot.groups || [];
  _items = snapshot.items || [];
  _mobileItems = snapshot.mobileItems || [];
  _config = snapshot.config || {};
  _userLevel = snapshot.userLevel || 0;
  _loaded = true;
  _lastLoad = Date.now();
  _loadedAt = Date.now();
}

export function healthCheck() {
  const checks = { loaded: _loaded, hasItems: _items.length > 0, noErrors: _errors.length === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: _Ports.isInitialized() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, portsInitialized: _Ports.isInitialized(), itemsCount: _items.length, groupsCount: _groups.length, metrics: getMetrics() }; }

export default { CACHE_TTL, OFFLINE_CACHE_TTL, setGroups, setItems, setMobileItems, setConfig, setUserLevel, setLoaded, setLoading, setLastLoad, setLoadedAt, updateMetrics, addError, clearErrors, getGroups, getItems, getItemsByGroup, getItem, getMobileItems, getMobileItemIds, getConfig, getUserLevel, isLoaded, isLoading, getLastLoad, getLoadedAt, getMetrics, getErrors, getRawGroups, getRawItems, getRawMobileItems, getRawConfig, subscribe, unsubscribe, notify, registerItem, registerGroup, clear, reset, getSnapshot, restoreSnapshot, healthCheck, info, injectPorts, getPorts: getPortsSnapshot };
