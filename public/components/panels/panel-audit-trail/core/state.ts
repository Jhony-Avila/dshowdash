// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail-local-state
// PURPOSE: Panel Audit Trail - Local State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABS from ./contracts.js
//   AUTO_REFRESH_SECONDS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initVisibleColumns() — exported function
//   getLocalState() — exported function
//   getContainer() — exported function
//   isInitialized() — exported function
//   isAutoRefreshEnabled() — exported function
//   getCountdown() — exported function
//   getDensity() — exported function
//   getSortKey() — exported function
//   getSortDirection() — exported function
//   getSelectedIds() — exported function
//   getExpandedIds() — exported function
//   getVisibleColumns() — exported function
//   isInlineFiltersActive() — exported function
//   ... and 36 more exports
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

import { TABS } from './contracts.js';
import * as Template from '../ui/template.js';
import { AUTO_REFRESH_SECONDS } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-audit-trail-local-state';

// Estado inicial frozen
const INITIAL_LOCAL_STATE = Object.freeze({
  container: null,
  initialized: false,
  countdownInterval: null,
  autoRefreshEnabled: true,
  countdown: AUTO_REFRESH_SECONDS,
  density: 'normal',
  sortKey: 'created_at',
  sortDirection: 'desc',
  inlineFiltersActive: false,
  inlineFilterValues: {},
  isFullscreen: false,
  groupBy: '',
});

// Estado interno
let _localState: Record<string, unknown> & { selectedIds: Set<string>; expandedIds: Set<string>; visibleColumns: Record<string, string[]>; collapsedGroups: Set<string> } = {
  ...INITIAL_LOCAL_STATE,
  selectedIds: new Set(),
  expandedIds: new Set(),
  visibleColumns: {},
  collapsedGroups: new Set()
};

// Métricas
const _metrics: { gets: number; sets: number; resets: number; lastUpdateAt: number | null } = {
  gets: 0,
  sets: 0,
  resets: 0,
  lastUpdateAt: null
};

// ========== INIT ==========

export function initVisibleColumns() {
  const tabs = Object.values(TABS);
  tabs.forEach(tab => {
    _localState.visibleColumns[tab] = Template.COLUMNS?.[tab]?.map(c => c.key) || [];
  });
}

// ========== GETTERS (seguros, retornam cópias) ==========

export function getLocalState() {
  _metrics.gets++;
  return {
    ..._localState,
    selectedIds: new Set(_localState.selectedIds),
    expandedIds: new Set(_localState.expandedIds),
    visibleColumns: { ...(_localState.visibleColumns as Record<string, unknown>) },
    collapsedGroups: new Set(_localState.collapsedGroups),
    inlineFilterValues: { ...(_localState.inlineFilterValues as Record<string, unknown>) }
  };
}

export function getContainer() { 
  _metrics.gets++;
  return _localState.container; 
}

export function isInitialized() { 
  _metrics.gets++;
  return _localState.initialized; 
}

export function isAutoRefreshEnabled() {
  _metrics.gets++;
  return _localState.autoRefreshEnabled;
}

export function getCountdown() {
  _metrics.gets++;
  return _localState.countdown;
}

export function getDensity() {
  _metrics.gets++;
  return _localState.density;
}

export function getSortKey() {
  _metrics.gets++;
  return _localState.sortKey;
}

export function getSortDirection() {
  _metrics.gets++;
  return _localState.sortDirection;
}

export function getSelectedIds() {
  _metrics.gets++;
  return new Set(_localState.selectedIds);
}

export function getExpandedIds() {
  _metrics.gets++;
  return new Set(_localState.expandedIds);
}

export function getVisibleColumns(tab: string | null | undefined) {
  _metrics.gets++;
  if (tab) return [...(_localState.visibleColumns[tab] || [])];
  return { ...(_localState.visibleColumns as Record<string, unknown>) };
}

export function isInlineFiltersActive() {
  _metrics.gets++;
  return _localState.inlineFiltersActive;
}

export function getInlineFilterValues() {
  _metrics.gets++;
  return { ...(_localState.inlineFilterValues as Record<string, unknown>) };
}

export function isFullscreen() {
  _metrics.gets++;
  return _localState.isFullscreen;
}

export function getGroupBy() {
  _metrics.gets++;
  return _localState.groupBy;
}

export function getCollapsedGroups() {
  _metrics.gets++;
  return new Set(_localState.collapsedGroups);
}

// ========== SETTERS (controlados) ==========

export function setContainer(container: HTMLElement | null) {
  _metrics.sets++;
  _localState.container = container;
  _metrics.lastUpdateAt = Date.now();
}

export function setInitialized(value: unknown) {
  _metrics.sets++;
  _localState.initialized = Boolean(value);
  _metrics.lastUpdateAt = Date.now();
}

export function setAutoRefreshEnabled(enabled: unknown) {
  _metrics.sets++;
  _localState.autoRefreshEnabled = Boolean(enabled);
  _metrics.lastUpdateAt = Date.now();
}

export function setCountdown(value: number) {
  _metrics.sets++;
  _localState.countdown = Number(value) || AUTO_REFRESH_SECONDS;
  _metrics.lastUpdateAt = Date.now();
}

export function setCountdownInterval(intervalId: ReturnType<typeof setInterval> | null) {
  _metrics.sets++;
  _localState.countdownInterval = intervalId;
  _metrics.lastUpdateAt = Date.now();
}

export function clearCountdownInterval() {
  if (_localState.countdownInterval) {
    clearInterval(_localState.countdownInterval as ReturnType<typeof setInterval>);
    _localState.countdownInterval = null;
  }
}

export function setDensity(density: string) {
  _metrics.sets++;
  _localState.density = density || 'normal';
  _metrics.lastUpdateAt = Date.now();
}

export function setSortKey(key: string) {
  _metrics.sets++;
  _localState.sortKey = key || 'created_at';
  _metrics.lastUpdateAt = Date.now();
}

export function setSortDirection(direction: string) {
  _metrics.sets++;
  _localState.sortDirection = direction === 'asc' ? 'asc' : 'desc';
  _metrics.lastUpdateAt = Date.now();
}

export function setInlineFiltersActive(active: unknown) {
  _metrics.sets++;
  _localState.inlineFiltersActive = Boolean(active);
  _metrics.lastUpdateAt = Date.now();
}

export function setInlineFilterValue(key: string, value: unknown) {
  _metrics.sets++;
  (_localState.inlineFilterValues as Record<string, unknown>)[key] = value;
  _metrics.lastUpdateAt = Date.now();
}

export function clearInlineFilterValues() {
  _metrics.sets++;
  _localState.inlineFilterValues = {};
  _metrics.lastUpdateAt = Date.now();
}

export function setFullscreen(active: unknown) {
  _metrics.sets++;
  _localState.isFullscreen = Boolean(active);
  _metrics.lastUpdateAt = Date.now();
}

export function setGroupBy(key: string) {
  _metrics.sets++;
  _localState.groupBy = key || '';
  _metrics.lastUpdateAt = Date.now();
}

// ========== SET OPERATIONS ==========

export function addSelectedId(id: string | number) {
  _metrics.sets++;
  _localState.selectedIds.add(String(id));
  _metrics.lastUpdateAt = Date.now();
}

export function removeSelectedId(id: string | number) {
  _metrics.sets++;
  _localState.selectedIds.delete(String(id));
  _metrics.lastUpdateAt = Date.now();
}

export function clearSelectedIds() {
  _metrics.sets++;
  _localState.selectedIds.clear();
  _metrics.lastUpdateAt = Date.now();
}

export function setSelectedIds(ids: Iterable<string | number>) {
  _metrics.sets++;
  _localState.selectedIds = new Set(Array.from(ids).map(String));
  _metrics.lastUpdateAt = Date.now();
}

export function addExpandedId(id: string | number) {
  _metrics.sets++;
  _localState.expandedIds.add(String(id));
  _metrics.lastUpdateAt = Date.now();
}

export function removeExpandedId(id: string | number) {
  _metrics.sets++;
  _localState.expandedIds.delete(String(id));
  _metrics.lastUpdateAt = Date.now();
}

export function toggleExpandedId(id: string | number) {
  _metrics.sets++;
  const strId = String(id);
  if (_localState.expandedIds.has(strId)) {
    _localState.expandedIds.delete(strId);
  } else {
    _localState.expandedIds.add(strId);
  }
  _metrics.lastUpdateAt = Date.now();
}

export function clearExpandedIds() {
  _metrics.sets++;
  _localState.expandedIds.clear();
  _metrics.lastUpdateAt = Date.now();
}

export function setVisibleColumns(tab: string, columns: string[]) {
  _metrics.sets++;
  _localState.visibleColumns[tab] = [...columns];
  _metrics.lastUpdateAt = Date.now();
}

export function addCollapsedGroup(groupId: string) {
  _metrics.sets++;
  _localState.collapsedGroups.add(groupId);
  _metrics.lastUpdateAt = Date.now();
}

export function removeCollapsedGroup(groupId: string) {
  _metrics.sets++;
  _localState.collapsedGroups.delete(groupId);
  _metrics.lastUpdateAt = Date.now();
}

export function toggleCollapsedGroup(groupId: string) {
  _metrics.sets++;
  if (_localState.collapsedGroups.has(groupId)) {
    _localState.collapsedGroups.delete(groupId);
  } else {
    _localState.collapsedGroups.add(groupId);
  }
  _metrics.lastUpdateAt = Date.now();
}

export function clearCollapsedGroups() {
  _metrics.sets++;
  _localState.collapsedGroups.clear();
  _metrics.lastUpdateAt = Date.now();
}

// ========== RESET ==========

export function resetLocalState() {
  _metrics.resets++;
  clearCountdownInterval();
  
  _localState = {
    ...INITIAL_LOCAL_STATE,
    selectedIds: new Set(),
    expandedIds: new Set(),
    visibleColumns: {},
    collapsedGroups: new Set()
  };
  
  initVisibleColumns();
  _metrics.lastUpdateAt = Date.now();
}

// ========== LEGACY COMPAT ==========
// Para compatibilidade com código existente que acessa localState diretamente
/** @type {any} */
export const localState = new Proxy({}, {
  get(target, prop) {
    _metrics.gets++;
    if (prop === 'selectedIds') return _localState.selectedIds;
    if (prop === 'expandedIds') return _localState.expandedIds;
    if (prop === 'visibleColumns') return _localState.visibleColumns;
    if (prop === 'collapsedGroups') return _localState.collapsedGroups;
    if (prop === 'inlineFilterValues') return _localState.inlineFilterValues;
    return _localState[prop as string];
  },
  set(target, prop, value) {
    _metrics.sets++;
    _localState[prop as string] = value;
    _metrics.lastUpdateAt = Date.now();
    return true;
  }
});

// ========== INFO & HEALTH ==========

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _localState.initialized,
    hasContainer: !!_localState.container,
    autoRefreshEnabled: _localState.autoRefreshEnabled,
    selectedCount: _localState.selectedIds.size,
    expandedCount: _localState.expandedIds.size,
    density: _localState.density,
    isFullscreen: _localState.isFullscreen,
    groupBy: _localState.groupBy,
    metrics: { ..._metrics },
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const checks = {
    stateExists: _localState !== null,
    setsAvailable: typeof _localState.selectedIds?.add === 'function',
    visibleColumnsInit: Object.keys(_localState.visibleColumns).length > 0,
    metricsTracked: _metrics.gets >= 0 && _metrics.sets >= 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    healthy: passed === total,
    checks,
    initialized: _localState.initialized,
    metrics: { ..._metrics },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function getVersion() { return VERSION; }

export default {
  VERSION, MODULE_ID,
  // Init
  initVisibleColumns, resetLocalState,
  // Getters
  getLocalState, getContainer, isInitialized,
  isAutoRefreshEnabled, getCountdown, getDensity,
  getSortKey, getSortDirection, getSelectedIds, getExpandedIds,
  getVisibleColumns, isInlineFiltersActive, getInlineFilterValues,
  isFullscreen, getGroupBy, getCollapsedGroups,
  // Setters
  setContainer, setInitialized, setAutoRefreshEnabled, setCountdown,
  setCountdownInterval, clearCountdownInterval, setDensity,
  setSortKey, setSortDirection, setInlineFiltersActive,
  setInlineFilterValue, clearInlineFilterValues, setFullscreen, setGroupBy,
  // Set operations
  addSelectedId, removeSelectedId, clearSelectedIds, setSelectedIds,
  addExpandedId, removeExpandedId, toggleExpandedId, clearExpandedIds,
  setVisibleColumns, addCollapsedGroup, removeCollapsedGroup,
  toggleCollapsedGroup, clearCollapsedGroups,
  // Legacy
  localState,
  // Info
  info, healthCheck, getVersion
};
