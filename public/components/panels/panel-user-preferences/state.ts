// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.state
// PURPOSE: Panel User Preferences - State Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//   tracker from ./telemetry/tracker.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getAuthContext() — exported function
//   isAuthenticated() — exported function
//   ensureAuth() — exported function
//   getState() — exported function
//   getUserProfile() — exported function
//   getPreferences() — exported function
//   getPanelSettings() — exported function
//   getLayouts() — exported function
//   getSavedViews() — exported function
//   getHistory() — exported function
//   isHistoryVisible() — exported function
//   ... and 32 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TELEMETRY_INTENTS.TRACK
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import tracker from './telemetry/tracker.js';

interface LayoutItem { key?: string; layout_key?: string; [k: string]: unknown; }

export const MODULE_ID = 'panel-user-preferences.state';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const initialState: {
  isAuthenticated: boolean; authFailCount: number;
  userProfile: Record<string, unknown> | null;
  preferences: Record<string, unknown>; originalPreferences: Record<string, unknown>;
  panelSettings: Record<string, unknown>;
  layouts: { items: unknown[]; defaultKey: string | null };
  savedViews: unknown[];
  mounted: boolean; loading: boolean; error: string | null;
  refreshInProgress: boolean; lastRefreshAt: number | null; mountedAt: number | null; refreshCount: number;
  isDirty: boolean; isSaving: boolean; saveError: string | null; pendingChanges: Record<string, unknown>;
  history: unknown[]; historyVisible: boolean; historyFilter: string;
  isCompact: boolean;
} = {
  isAuthenticated: false, authFailCount: 0,
  userProfile: null,
  preferences: {}, originalPreferences: {},
  panelSettings: {},
  layouts: { items: [], defaultKey: null },
  savedViews: [],
  mounted: false, loading: false, error: null,
  refreshInProgress: false, lastRefreshAt: null, mountedAt: null, refreshCount: 0,
  isDirty: false, isSaving: false, saveError: null, pendingChanges: {},
  history: [], historyVisible: false, historyFilter: 'all',
  isCompact: false
};
let state = Object.assign({}, initialState);

function _emitTelemetry(event: string, data: Record<string, unknown> = {}) {
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, Object.assign({ event, module: MODULE_ID, timestamp: Date.now() }, data));
}

function getAuthContext() {
  const auth = _getPort('auth');
  const isReady = auth?.isReady?.() ?? false;
  if (!isReady) { _emitTelemetry('auth:adapter-not-ready', { severity: 'warn' }); return { source: { coreAdapter: false }, isAuthenticated: false, user: null, roles: [], level: null, health: { status: 'NOT_READY' } }; }
  const health = auth?.healthCheck?.() ?? { status: 'UNKNOWN' };
  if (health.status !== 'HEALTHY') _emitTelemetry('auth:health-degraded', { status: health.status });
  return { source: { coreAdapter: true }, isAuthenticated: auth?.isAuthenticated?.() ?? false, user: auth?.getUser?.() ?? null, roles: auth?.getRoles?.() ?? [], level: auth?.getLevel?.() ?? null, health };
}

function isAuthenticated() { return getAuthContext().isAuthenticated; }
function ensureAuth() { const ctx = getAuthContext(); if (!ctx.isAuthenticated) { state.authFailCount++; if (tracker.authRequired) tracker.authRequired('core-adapter'); return false; } state.isAuthenticated = true; state.authFailCount = 0; return true; }

function getState() { return Object.assign({}, state); }
function getUserProfile() { return state.userProfile ? Object.assign({}, state.userProfile) : null; }
function getPreferences() { return Object.assign({}, state.preferences); }
function getPanelSettings() { return Object.assign({}, state.panelSettings); }
function getLayouts() { return { items: state.layouts.items.slice(), defaultKey: state.layouts.defaultKey }; }
function getSavedViews() { return state.savedViews.slice(); }
function getHistory() { return state.history.slice(); }
function isHistoryVisible() { return state.historyVisible; }
function getHistoryFilter() { return state.historyFilter; }
function isCompact() { return state.isCompact; }

function setUserProfile(profile: Record<string, unknown> | null) { state.userProfile = profile ? Object.assign({}, profile) : null; }
function setPreferences(prefs: Record<string, unknown>) { state.preferences = Object.assign({}, prefs); state.originalPreferences = Object.assign({}, prefs); state.pendingChanges = {}; state.isDirty = false; }
function setPanelSettings(settings: Record<string, unknown> | unknown[]) { state.panelSettings = Array.isArray(settings) ? (settings as unknown[]).reduce<Record<string, unknown>>((acc, v, i) => { acc[i] = v; return acc; }, {}) : Object.assign({}, settings as Record<string, unknown>); }
function setLayouts(layouts: unknown[] | { items: unknown[]; defaultKey?: string | null }) { if (Array.isArray(layouts)) { state.layouts.items = (layouts as unknown[]).slice(); } else if (layouts && (layouts as { items: unknown[] }).items) { state.layouts.items = (layouts as { items: unknown[] }).items.slice(); state.layouts.defaultKey = (layouts as { defaultKey?: string | null }).defaultKey || null; } }
function setSavedViews(views: unknown[]) { state.savedViews = Array.isArray(views) ? views.slice() : []; }
function setLoading(loading: boolean) { state.loading = loading; }
function setError(error: string | null) { state.error = error; }
function setMounted(mounted: boolean) { state.mounted = mounted; if (mounted) state.mountedAt = Date.now(); }
function isRefreshInProgress() { return state.refreshInProgress; }
function setRefreshInProgress(inProgress: boolean) { state.refreshInProgress = inProgress; if (!inProgress) { state.lastRefreshAt = Date.now(); state.refreshCount++; } }
function getLastRefreshAt() { return state.lastRefreshAt; }

function isDirty() { return state.isDirty; }
function isSaving() { return state.isSaving; }
function getSaveError() { return state.saveError; }
function getPendingChanges() { return Object.assign({}, state.pendingChanges); }
function markDirty(key: string, value: unknown) { state.pendingChanges[key] = value; state.isDirty = true; state.saveError = null; _emitTelemetry('preferences:dirty', { key, hasPending: Object.keys(state.pendingChanges).length }); }
function setSaving(saving: boolean) { state.isSaving = saving; if (saving) state.saveError = null; }
function setSaveError(error: string | null) { state.saveError = error; state.isSaving = false; }
function clearDirty() { state.preferences = Object.assign({}, state.preferences, state.pendingChanges); state.originalPreferences = Object.assign({}, state.preferences); state.pendingChanges = {}; state.isDirty = false; state.saveError = null; _emitTelemetry('preferences:saved', { prefsCount: Object.keys(state.preferences).length }); }
function discardChanges() { state.preferences = Object.assign({}, state.originalPreferences); state.pendingChanges = {}; state.isDirty = false; state.saveError = null; _emitTelemetry('preferences:discarded'); }

function toggleCompact() { state.isCompact = !state.isCompact; _emitTelemetry('preferences:compact-toggled', { isCompact: state.isCompact }); }
function setCompact(compact: boolean) { state.isCompact = !!compact; }

function reorderLayouts(newOrder: string[]) {
  if (!Array.isArray(newOrder) || newOrder.length === 0) return;
  const ordered = [];
  for (let i = 0; i < newOrder.length; i++) {
    const key = newOrder[i];
    for (let j = 0; j < state.layouts.items.length; j++) {
      const layout = state.layouts.items[j] as LayoutItem;
      if ((layout.key || layout.layout_key) === key) { ordered.push(layout); break; }
    }
  }
  for (let k = 0; k < state.layouts.items.length; k++) {
    const lay = state.layouts.items[k] as LayoutItem;
    const layKey = lay.key || lay.layout_key;
    if (newOrder.indexOf(layKey as string) === -1) ordered.push(lay);
  }
  state.layouts.items = ordered;
  _emitTelemetry('preferences:layouts-reordered', { count: ordered.length });
}

function setHistory(history: unknown[]) { state.history = Array.isArray(history) ? history.slice() : []; }
function addHistoryEntry(action: string, key: string, value: unknown) { const entry = { id: Date.now(), action, key, value, timestamp: new Date().toISOString(), timeAgo: 'agora' }; state.history.unshift(entry); if (state.history.length > 50) state.history.pop(); _emitTelemetry('preferences:history-added', { action, key }); }
function setHistoryVisible(visible: boolean) { state.historyVisible = visible; }
function setHistoryFilter(filter: string) { state.historyFilter = filter || 'all'; }
function clearHistory() { state.history = []; }

function reset() { state = Object.assign({}, initialState); if (tracker.reset) tracker.reset(); }
function getHealthData() { const ctx = getAuthContext(); const auth = _getPort('auth'); return { mounted: state.mounted, loading: state.loading, hasError: !!state.error, isAuthenticated: ctx.isAuthenticated, authSource: 'ports-pattern', authHealth: ctx.health ? ctx.health.status : 'UNKNOWN', authPortAvailable: !!auth, hasPreferences: Object.keys(state.preferences).length > 0, layoutsCount: state.layouts.items.length, savedViewsCount: state.savedViews.length, panelSettingsCount: Object.keys(state.panelSettings).length, refreshInProgress: state.refreshInProgress, lastRefreshAt: state.lastRefreshAt, refreshCount: state.refreshCount, authFailCount: state.authFailCount, uptime: state.mountedAt ? Date.now() - state.mountedAt : 0, isDirty: state.isDirty, isSaving: state.isSaving, pendingChangesCount: Object.keys(state.pendingChanges).length, historyCount: state.history.length, hasUserProfile: !!state.userProfile, isCompact: state.isCompact, portsInitialized: Ports.isInitialized(), usingP18Intents: true }; }

export { getAuthContext, isAuthenticated, ensureAuth, getState, getUserProfile, getPreferences, getPanelSettings, getLayouts, getSavedViews, getHistory, isHistoryVisible, getHistoryFilter, isCompact, setUserProfile, setPreferences, setPanelSettings, setLayouts, setSavedViews, setLoading, setError, setMounted, isRefreshInProgress, setRefreshInProgress, getLastRefreshAt, isDirty, isSaving, getSaveError, getPendingChanges, markDirty, setSaving, setSaveError, clearDirty, discardChanges, toggleCompact, setCompact, reorderLayouts, setHistory, addHistoryEntry, setHistoryVisible, setHistoryFilter, clearHistory, reset, getHealthData };
export default { getAuthContext, isAuthenticated, ensureAuth, getState, getUserProfile, getPreferences, getPanelSettings, getLayouts, getSavedViews, getHistory, isHistoryVisible, getHistoryFilter, isCompact, setUserProfile, setPreferences, setPanelSettings, setLayouts, setSavedViews, setLoading, setError, setMounted, isRefreshInProgress, setRefreshInProgress, getLastRefreshAt, isDirty, isSaving, getSaveError, getPendingChanges, markDirty, setSaving, setSaveError, clearDirty, discardChanges, toggleCompact, setCompact, reorderLayouts, setHistory, addHistoryEntry, setHistoryVisible, setHistoryFilter, clearHistory, reset, getHealthData, injectPorts, getPorts, VERSION, MODULE_ID };
