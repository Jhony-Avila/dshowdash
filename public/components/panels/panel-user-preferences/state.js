import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import tracker from "./telemetry/tracker.js";
const MODULE_ID = "panel-user-preferences.state";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const initialState = {
  isAuthenticated: false,
  authFailCount: 0,
  userProfile: null,
  preferences: {},
  originalPreferences: {},
  panelSettings: {},
  layouts: { items: [], defaultKey: null },
  savedViews: [],
  mounted: false,
  loading: false,
  error: null,
  refreshInProgress: false,
  lastRefreshAt: null,
  mountedAt: null,
  refreshCount: 0,
  isDirty: false,
  isSaving: false,
  saveError: null,
  pendingChanges: {},
  history: [],
  historyVisible: false,
  historyFilter: "all",
  isCompact: false
};
let state = Object.assign({}, initialState);
function _emitTelemetry(event, data = {}) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, Object.assign({ event, module: MODULE_ID, timestamp: Date.now() }, data));
}
function getAuthContext() {
  const auth = _getPort("auth");
  const isReady = auth?.isReady?.() ?? false;
  if (!isReady) {
    _emitTelemetry("auth:adapter-not-ready", { severity: "warn" });
    return { source: { coreAdapter: false }, isAuthenticated: false, user: null, roles: [], level: null, health: { status: "NOT_READY" } };
  }
  const health = auth?.healthCheck?.() ?? { status: "UNKNOWN" };
  if (health.status !== "HEALTHY") _emitTelemetry("auth:health-degraded", { status: health.status });
  return { source: { coreAdapter: true }, isAuthenticated: auth?.isAuthenticated?.() ?? false, user: auth?.getUser?.() ?? null, roles: auth?.getRoles?.() ?? [], level: auth?.getLevel?.() ?? null, health };
}
function isAuthenticated() {
  return getAuthContext().isAuthenticated;
}
function ensureAuth() {
  const ctx = getAuthContext();
  if (!ctx.isAuthenticated) {
    state.authFailCount++;
    if (tracker.authRequired) tracker.authRequired("core-adapter");
    return false;
  }
  state.isAuthenticated = true;
  state.authFailCount = 0;
  return true;
}
function getState() {
  return Object.assign({}, state);
}
function getUserProfile() {
  return state.userProfile ? Object.assign({}, state.userProfile) : null;
}
function getPreferences() {
  return Object.assign({}, state.preferences);
}
function getPanelSettings() {
  return Object.assign({}, state.panelSettings);
}
function getLayouts() {
  return { items: state.layouts.items.slice(), defaultKey: state.layouts.defaultKey };
}
function getSavedViews() {
  return state.savedViews.slice();
}
function getHistory() {
  return state.history.slice();
}
function isHistoryVisible() {
  return state.historyVisible;
}
function getHistoryFilter() {
  return state.historyFilter;
}
function isCompact() {
  return state.isCompact;
}
function setUserProfile(profile) {
  state.userProfile = profile ? Object.assign({}, profile) : null;
}
function setPreferences(prefs) {
  state.preferences = Object.assign({}, prefs);
  state.originalPreferences = Object.assign({}, prefs);
  state.pendingChanges = {};
  state.isDirty = false;
}
function setPanelSettings(settings) {
  state.panelSettings = Array.isArray(settings) ? settings.reduce((acc, v, i) => {
    acc[i] = v;
    return acc;
  }, {}) : Object.assign({}, settings);
}
function setLayouts(layouts) {
  if (Array.isArray(layouts)) {
    state.layouts.items = layouts.slice();
  } else if (layouts && layouts.items) {
    state.layouts.items = layouts.items.slice();
    state.layouts.defaultKey = layouts.defaultKey || null;
  }
}
function setSavedViews(views) {
  state.savedViews = Array.isArray(views) ? views.slice() : [];
}
function setLoading(loading) {
  state.loading = loading;
}
function setError(error) {
  state.error = error;
}
function setMounted(mounted) {
  state.mounted = mounted;
  if (mounted) state.mountedAt = Date.now();
}
function isRefreshInProgress() {
  return state.refreshInProgress;
}
function setRefreshInProgress(inProgress) {
  state.refreshInProgress = inProgress;
  if (!inProgress) {
    state.lastRefreshAt = Date.now();
    state.refreshCount++;
  }
}
function getLastRefreshAt() {
  return state.lastRefreshAt;
}
function isDirty() {
  return state.isDirty;
}
function isSaving() {
  return state.isSaving;
}
function getSaveError() {
  return state.saveError;
}
function getPendingChanges() {
  return Object.assign({}, state.pendingChanges);
}
function markDirty(key, value) {
  state.pendingChanges[key] = value;
  state.isDirty = true;
  state.saveError = null;
  _emitTelemetry("preferences:dirty", { key, hasPending: Object.keys(state.pendingChanges).length });
}
function setSaving(saving) {
  state.isSaving = saving;
  if (saving) state.saveError = null;
}
function setSaveError(error) {
  state.saveError = error;
  state.isSaving = false;
}
function clearDirty() {
  state.preferences = Object.assign({}, state.preferences, state.pendingChanges);
  state.originalPreferences = Object.assign({}, state.preferences);
  state.pendingChanges = {};
  state.isDirty = false;
  state.saveError = null;
  _emitTelemetry("preferences:saved", { prefsCount: Object.keys(state.preferences).length });
}
function discardChanges() {
  state.preferences = Object.assign({}, state.originalPreferences);
  state.pendingChanges = {};
  state.isDirty = false;
  state.saveError = null;
  _emitTelemetry("preferences:discarded");
}
function toggleCompact() {
  state.isCompact = !state.isCompact;
  _emitTelemetry("preferences:compact-toggled", { isCompact: state.isCompact });
}
function setCompact(compact) {
  state.isCompact = !!compact;
}
function reorderLayouts(newOrder) {
  if (!Array.isArray(newOrder) || newOrder.length === 0) return;
  const ordered = [];
  for (let i = 0; i < newOrder.length; i++) {
    const key = newOrder[i];
    for (let j = 0; j < state.layouts.items.length; j++) {
      const layout = state.layouts.items[j];
      if ((layout.key || layout.layout_key) === key) {
        ordered.push(layout);
        break;
      }
    }
  }
  for (let k = 0; k < state.layouts.items.length; k++) {
    const lay = state.layouts.items[k];
    const layKey = lay.key || lay.layout_key;
    if (newOrder.indexOf(layKey) === -1) ordered.push(lay);
  }
  state.layouts.items = ordered;
  _emitTelemetry("preferences:layouts-reordered", { count: ordered.length });
}
function setHistory(history) {
  state.history = Array.isArray(history) ? history.slice() : [];
}
function addHistoryEntry(action, key, value) {
  const entry = { id: Date.now(), action, key, value, timestamp: (/* @__PURE__ */ new Date()).toISOString(), timeAgo: "agora" };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history.pop();
  _emitTelemetry("preferences:history-added", { action, key });
}
function setHistoryVisible(visible) {
  state.historyVisible = visible;
}
function setHistoryFilter(filter) {
  state.historyFilter = filter || "all";
}
function clearHistory() {
  state.history = [];
}
function reset() {
  state = Object.assign({}, initialState);
  if (tracker.reset) tracker.reset();
}
function getHealthData() {
  const ctx = getAuthContext();
  const auth = _getPort("auth");
  return { mounted: state.mounted, loading: state.loading, hasError: !!state.error, isAuthenticated: ctx.isAuthenticated, authSource: "ports-pattern", authHealth: ctx.health ? ctx.health.status : "UNKNOWN", authPortAvailable: !!auth, hasPreferences: Object.keys(state.preferences).length > 0, layoutsCount: state.layouts.items.length, savedViewsCount: state.savedViews.length, panelSettingsCount: Object.keys(state.panelSettings).length, refreshInProgress: state.refreshInProgress, lastRefreshAt: state.lastRefreshAt, refreshCount: state.refreshCount, authFailCount: state.authFailCount, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, isDirty: state.isDirty, isSaving: state.isSaving, pendingChangesCount: Object.keys(state.pendingChanges).length, historyCount: state.history.length, hasUserProfile: !!state.userProfile, isCompact: state.isCompact, portsInitialized: Ports.isInitialized(), usingP18Intents: true };
}
var state_default = { getAuthContext, isAuthenticated, ensureAuth, getState, getUserProfile, getPreferences, getPanelSettings, getLayouts, getSavedViews, getHistory, isHistoryVisible, getHistoryFilter, isCompact, setUserProfile, setPreferences, setPanelSettings, setLayouts, setSavedViews, setLoading, setError, setMounted, isRefreshInProgress, setRefreshInProgress, getLastRefreshAt, isDirty, isSaving, getSaveError, getPendingChanges, markDirty, setSaving, setSaveError, clearDirty, discardChanges, toggleCompact, setCompact, reorderLayouts, setHistory, addHistoryEntry, setHistoryVisible, setHistoryFilter, clearHistory, reset, getHealthData, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addHistoryEntry,
  clearDirty,
  clearHistory,
  state_default as default,
  discardChanges,
  ensureAuth,
  getAuthContext,
  getHealthData,
  getHistory,
  getHistoryFilter,
  getLastRefreshAt,
  getLayouts,
  getPanelSettings,
  getPendingChanges,
  getPorts,
  getPreferences,
  getSaveError,
  getSavedViews,
  getState,
  getUserProfile,
  injectPorts,
  isAuthenticated,
  isCompact,
  isDirty,
  isHistoryVisible,
  isRefreshInProgress,
  isSaving,
  markDirty,
  reorderLayouts,
  reset,
  setCompact,
  setError,
  setHistory,
  setHistoryFilter,
  setHistoryVisible,
  setLayouts,
  setLoading,
  setMounted,
  setPanelSettings,
  setPreferences,
  setRefreshInProgress,
  setSaveError,
  setSavedViews,
  setSaving,
  setUserProfile,
  toggleCompact
};
