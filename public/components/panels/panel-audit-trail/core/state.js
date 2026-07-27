import { TABS } from "./contracts.js";
import * as Template from "../ui/template.js";
import { AUTO_REFRESH_SECONDS } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-local-state";
const INITIAL_LOCAL_STATE = Object.freeze({
  container: null,
  initialized: false,
  countdownInterval: null,
  autoRefreshEnabled: true,
  countdown: AUTO_REFRESH_SECONDS,
  density: "normal",
  sortKey: "created_at",
  sortDirection: "desc",
  inlineFiltersActive: false,
  inlineFilterValues: {},
  isFullscreen: false,
  groupBy: ""
});
let _localState = {
  ...INITIAL_LOCAL_STATE,
  selectedIds: /* @__PURE__ */ new Set(),
  expandedIds: /* @__PURE__ */ new Set(),
  visibleColumns: {},
  collapsedGroups: /* @__PURE__ */ new Set()
};
const _metrics = {
  gets: 0,
  sets: 0,
  resets: 0,
  lastUpdateAt: null
};
function initVisibleColumns() {
  const tabs = Object.values(TABS);
  tabs.forEach((tab) => {
    _localState.visibleColumns[tab] = Template.COLUMNS?.[tab]?.map((c) => c.key) || [];
  });
}
function getLocalState() {
  _metrics.gets++;
  return {
    ..._localState,
    selectedIds: new Set(_localState.selectedIds),
    expandedIds: new Set(_localState.expandedIds),
    visibleColumns: { ..._localState.visibleColumns },
    collapsedGroups: new Set(_localState.collapsedGroups),
    inlineFilterValues: { ..._localState.inlineFilterValues }
  };
}
function getContainer() {
  _metrics.gets++;
  return _localState.container;
}
function isInitialized() {
  _metrics.gets++;
  return _localState.initialized;
}
function isAutoRefreshEnabled() {
  _metrics.gets++;
  return _localState.autoRefreshEnabled;
}
function getCountdown() {
  _metrics.gets++;
  return _localState.countdown;
}
function getDensity() {
  _metrics.gets++;
  return _localState.density;
}
function getSortKey() {
  _metrics.gets++;
  return _localState.sortKey;
}
function getSortDirection() {
  _metrics.gets++;
  return _localState.sortDirection;
}
function getSelectedIds() {
  _metrics.gets++;
  return new Set(_localState.selectedIds);
}
function getExpandedIds() {
  _metrics.gets++;
  return new Set(_localState.expandedIds);
}
function getVisibleColumns(tab) {
  _metrics.gets++;
  if (tab) return [..._localState.visibleColumns[tab] || []];
  return { ..._localState.visibleColumns };
}
function isInlineFiltersActive() {
  _metrics.gets++;
  return _localState.inlineFiltersActive;
}
function getInlineFilterValues() {
  _metrics.gets++;
  return { ..._localState.inlineFilterValues };
}
function isFullscreen() {
  _metrics.gets++;
  return _localState.isFullscreen;
}
function getGroupBy() {
  _metrics.gets++;
  return _localState.groupBy;
}
function getCollapsedGroups() {
  _metrics.gets++;
  return new Set(_localState.collapsedGroups);
}
function setContainer(container) {
  _metrics.sets++;
  _localState.container = container;
  _metrics.lastUpdateAt = Date.now();
}
function setInitialized(value) {
  _metrics.sets++;
  _localState.initialized = Boolean(value);
  _metrics.lastUpdateAt = Date.now();
}
function setAutoRefreshEnabled(enabled) {
  _metrics.sets++;
  _localState.autoRefreshEnabled = Boolean(enabled);
  _metrics.lastUpdateAt = Date.now();
}
function setCountdown(value) {
  _metrics.sets++;
  _localState.countdown = Number(value) || AUTO_REFRESH_SECONDS;
  _metrics.lastUpdateAt = Date.now();
}
function setCountdownInterval(intervalId) {
  _metrics.sets++;
  _localState.countdownInterval = intervalId;
  _metrics.lastUpdateAt = Date.now();
}
function clearCountdownInterval() {
  if (_localState.countdownInterval) {
    clearInterval(_localState.countdownInterval);
    _localState.countdownInterval = null;
  }
}
function setDensity(density) {
  _metrics.sets++;
  _localState.density = density || "normal";
  _metrics.lastUpdateAt = Date.now();
}
function setSortKey(key) {
  _metrics.sets++;
  _localState.sortKey = key || "created_at";
  _metrics.lastUpdateAt = Date.now();
}
function setSortDirection(direction) {
  _metrics.sets++;
  _localState.sortDirection = direction === "asc" ? "asc" : "desc";
  _metrics.lastUpdateAt = Date.now();
}
function setInlineFiltersActive(active) {
  _metrics.sets++;
  _localState.inlineFiltersActive = Boolean(active);
  _metrics.lastUpdateAt = Date.now();
}
function setInlineFilterValue(key, value) {
  _metrics.sets++;
  _localState.inlineFilterValues[key] = value;
  _metrics.lastUpdateAt = Date.now();
}
function clearInlineFilterValues() {
  _metrics.sets++;
  _localState.inlineFilterValues = {};
  _metrics.lastUpdateAt = Date.now();
}
function setFullscreen(active) {
  _metrics.sets++;
  _localState.isFullscreen = Boolean(active);
  _metrics.lastUpdateAt = Date.now();
}
function setGroupBy(key) {
  _metrics.sets++;
  _localState.groupBy = key || "";
  _metrics.lastUpdateAt = Date.now();
}
function addSelectedId(id) {
  _metrics.sets++;
  _localState.selectedIds.add(String(id));
  _metrics.lastUpdateAt = Date.now();
}
function removeSelectedId(id) {
  _metrics.sets++;
  _localState.selectedIds.delete(String(id));
  _metrics.lastUpdateAt = Date.now();
}
function clearSelectedIds() {
  _metrics.sets++;
  _localState.selectedIds.clear();
  _metrics.lastUpdateAt = Date.now();
}
function setSelectedIds(ids) {
  _metrics.sets++;
  _localState.selectedIds = new Set(Array.from(ids).map(String));
  _metrics.lastUpdateAt = Date.now();
}
function addExpandedId(id) {
  _metrics.sets++;
  _localState.expandedIds.add(String(id));
  _metrics.lastUpdateAt = Date.now();
}
function removeExpandedId(id) {
  _metrics.sets++;
  _localState.expandedIds.delete(String(id));
  _metrics.lastUpdateAt = Date.now();
}
function toggleExpandedId(id) {
  _metrics.sets++;
  const strId = String(id);
  if (_localState.expandedIds.has(strId)) {
    _localState.expandedIds.delete(strId);
  } else {
    _localState.expandedIds.add(strId);
  }
  _metrics.lastUpdateAt = Date.now();
}
function clearExpandedIds() {
  _metrics.sets++;
  _localState.expandedIds.clear();
  _metrics.lastUpdateAt = Date.now();
}
function setVisibleColumns(tab, columns) {
  _metrics.sets++;
  _localState.visibleColumns[tab] = [...columns];
  _metrics.lastUpdateAt = Date.now();
}
function addCollapsedGroup(groupId) {
  _metrics.sets++;
  _localState.collapsedGroups.add(groupId);
  _metrics.lastUpdateAt = Date.now();
}
function removeCollapsedGroup(groupId) {
  _metrics.sets++;
  _localState.collapsedGroups.delete(groupId);
  _metrics.lastUpdateAt = Date.now();
}
function toggleCollapsedGroup(groupId) {
  _metrics.sets++;
  if (_localState.collapsedGroups.has(groupId)) {
    _localState.collapsedGroups.delete(groupId);
  } else {
    _localState.collapsedGroups.add(groupId);
  }
  _metrics.lastUpdateAt = Date.now();
}
function clearCollapsedGroups() {
  _metrics.sets++;
  _localState.collapsedGroups.clear();
  _metrics.lastUpdateAt = Date.now();
}
function resetLocalState() {
  _metrics.resets++;
  clearCountdownInterval();
  _localState = {
    ...INITIAL_LOCAL_STATE,
    selectedIds: /* @__PURE__ */ new Set(),
    expandedIds: /* @__PURE__ */ new Set(),
    visibleColumns: {},
    collapsedGroups: /* @__PURE__ */ new Set()
  };
  initVisibleColumns();
  _metrics.lastUpdateAt = Date.now();
}
const localState = new Proxy({}, {
  get(target, prop) {
    _metrics.gets++;
    if (prop === "selectedIds") return _localState.selectedIds;
    if (prop === "expandedIds") return _localState.expandedIds;
    if (prop === "visibleColumns") return _localState.visibleColumns;
    if (prop === "collapsedGroups") return _localState.collapsedGroups;
    if (prop === "inlineFilterValues") return _localState.inlineFilterValues;
    return _localState[prop];
  },
  set(target, prop, value) {
    _metrics.sets++;
    _localState[prop] = value;
    _metrics.lastUpdateAt = Date.now();
    return true;
  }
});
function info() {
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
function healthCheck() {
  const checks = {
    stateExists: _localState !== null,
    setsAvailable: typeof _localState.selectedIds?.add === "function",
    visibleColumnsInit: Object.keys(_localState.visibleColumns).length > 0,
    metricsTracked: _metrics.gets >= 0 && _metrics.sets >= 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
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
function getVersion() {
  return VERSION;
}
var state_default = {
  VERSION,
  MODULE_ID,
  // Init
  initVisibleColumns,
  resetLocalState,
  // Getters
  getLocalState,
  getContainer,
  isInitialized,
  isAutoRefreshEnabled,
  getCountdown,
  getDensity,
  getSortKey,
  getSortDirection,
  getSelectedIds,
  getExpandedIds,
  getVisibleColumns,
  isInlineFiltersActive,
  getInlineFilterValues,
  isFullscreen,
  getGroupBy,
  getCollapsedGroups,
  // Setters
  setContainer,
  setInitialized,
  setAutoRefreshEnabled,
  setCountdown,
  setCountdownInterval,
  clearCountdownInterval,
  setDensity,
  setSortKey,
  setSortDirection,
  setInlineFiltersActive,
  setInlineFilterValue,
  clearInlineFilterValues,
  setFullscreen,
  setGroupBy,
  // Set operations
  addSelectedId,
  removeSelectedId,
  clearSelectedIds,
  setSelectedIds,
  addExpandedId,
  removeExpandedId,
  toggleExpandedId,
  clearExpandedIds,
  setVisibleColumns,
  addCollapsedGroup,
  removeCollapsedGroup,
  toggleCollapsedGroup,
  clearCollapsedGroups,
  // Legacy
  localState,
  // Info
  info,
  healthCheck,
  getVersion
};
export {
  MODULE_ID,
  VERSION,
  addCollapsedGroup,
  addExpandedId,
  addSelectedId,
  clearCollapsedGroups,
  clearCountdownInterval,
  clearExpandedIds,
  clearInlineFilterValues,
  clearSelectedIds,
  state_default as default,
  getCollapsedGroups,
  getContainer,
  getCountdown,
  getDensity,
  getExpandedIds,
  getGroupBy,
  getInlineFilterValues,
  getLocalState,
  getSelectedIds,
  getSortDirection,
  getSortKey,
  getVersion,
  getVisibleColumns,
  healthCheck,
  info,
  initVisibleColumns,
  isAutoRefreshEnabled,
  isFullscreen,
  isInitialized,
  isInlineFiltersActive,
  localState,
  removeCollapsedGroup,
  removeExpandedId,
  removeSelectedId,
  resetLocalState,
  setAutoRefreshEnabled,
  setContainer,
  setCountdown,
  setCountdownInterval,
  setDensity,
  setFullscreen,
  setGroupBy,
  setInitialized,
  setInlineFilterValue,
  setInlineFiltersActive,
  setSelectedIds,
  setSortDirection,
  setSortKey,
  setVisibleColumns,
  toggleCollapsedGroup,
  toggleExpandedId
};
