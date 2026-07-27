// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.api
// PURPOSE: Panel User Preferences - API Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   getAuthContext from ./state.js
//   tracker from ./telemetry/tracker.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   loadUserProfile() — exported function
//   loadPreferences() — exported function
//   savePreference() — exported function
//   loadPanelSettings() — exported function
//   savePanelSetting() — exported function
//   loadLayouts() — exported function
//   saveLayout() — exported function
//   deleteLayout() — exported function
//   loadSavedViews() — exported function
//   deleteSavedView() — exported function
//   loadHistory() — exported function
//   ... and 5 more exports
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
import tracker from './telemetry/tracker.js';
import { getAuthContext } from './state.js';

const MODULE_ID = 'panel-user-preferences.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_BASE = '/api/user';
const DEFAULT_TIMEOUT = 10000;

function fetchWithAuth(url: string, options: Record<string, unknown> = {}) {
  const context = getAuthContext();
  if (!context.isAuthenticated) { tracker.authRequired('api-fetch'); return Promise.reject(new Error('AUTH_REQUIRED')); }
  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, Number(options.timeout || DEFAULT_TIMEOUT));
  const fetchOptions: RequestInit = Object.assign({}, options, { signal: controller.signal, credentials: 'include' as RequestCredentials, headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers) });
  return fetch(url, fetchOptions).then(response => {
    clearTimeout(timeout);
    if (response.status === 401) { tracker.authExpired(); throw new Error('AUTH_EXPIRED'); }
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return response.json();
  }).catch(error => {
    clearTimeout(timeout);
    if (error.name === 'AbortError') throw new Error('TIMEOUT');
    throw error;
  });
}

function loadUserProfile({ signal }: { signal?: AbortSignal } = {}) {
  return fetch('/api/users/profile.php', { credentials: 'include', signal }).then(response => {
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return response.json();
  }).then((data: Record<string, unknown> | null): unknown => data && data.data ? data.data : null).catch((error: Error): null => {
    const logger = _getPort('logger');
    if (logger && logger.warn) logger.warn('[pref-api] Profile load error:', error.message);
    return null;
  });
}

function loadPreferences() {
  return fetchWithAuth(`${API_BASE}/preferences`).then(data => data && data.preferences ? data.preferences : (data || {})).catch(error => { tracker.preferenceError('load', error); throw error; });
}

function savePreference(key: string, value: unknown) {
  return fetchWithAuth(`${API_BASE}/preferences`, { method: 'POST', body: JSON.stringify({ key, value }) }).then(result => {
    tracker.preferenceSaved(key, value);
    addHistoryEntry('update', key, value).catch(() => {});
    return result;
  }).catch(error => { tracker.preferenceError('save', error); throw error; });
}

function loadPanelSettings() {
  return fetchWithAuth(`${API_BASE}/panel-settings`).then(data => data && data.settings ? data.settings : (data || {})).catch(error => { tracker.preferenceError('load-panels', error); throw error; });
}

function savePanelSetting(panelId: string, settings: Record<string, unknown>) {
  return fetchWithAuth(`${API_BASE}/panel-settings/${panelId}`, { method: 'POST', body: JSON.stringify(settings) }).then(result => {
    tracker.panelToggled(panelId, settings.is_visible as boolean);
    return result;
  }).catch(error => { tracker.preferenceError('save-panel', error); throw error; });
}

function loadLayouts() {
  return fetchWithAuth(`${API_BASE}/layouts`).then(data => ({
    items: (data && data.layouts) || (data && data.items) || [],
    defaultKey: (data && data.defaultKey) || null
  })).catch(error => { tracker.layoutError('load', error); throw error; });
}

function saveLayout(key: string, config: Record<string, unknown>, isDefault = false) {
  return fetchWithAuth(`${API_BASE}/layouts`, { method: 'POST', body: JSON.stringify({ key, config, isDefault }) }).then(result => {
    tracker.layoutSaved(key, isDefault);
    addHistoryEntry('create', `layout:${key}`, key).catch(() => {});
    return result;
  }).catch(error => { tracker.layoutError('save', error); throw error; });
}

function deleteLayout(key: string) {
  return fetchWithAuth(`${API_BASE}/layouts/${encodeURIComponent(key)}`, { method: 'DELETE' }).then(result => {
    tracker.layoutDeleted(key);
    addHistoryEntry('delete', `layout:${key}`, null).catch(() => {});
    return result;
  }).catch(error => { tracker.layoutError('delete', error); throw error; });
}

function loadSavedViews() {
  return fetchWithAuth(`${API_BASE}/saved-views`).then(data => (data && data.views) || data || []).catch(error => { tracker.viewError('load', error); throw error; });
}

function deleteSavedView(viewId: string) {
  return fetchWithAuth(`${API_BASE}/saved-views/${encodeURIComponent(viewId)}`, { method: 'DELETE' }).then(result => {
    tracker.viewDeleted(viewId);
    addHistoryEntry('delete', `view:${viewId}`, null).catch(() => {});
    return result;
  }).catch(error => { tracker.viewError('delete', error); throw error; });
}

function loadHistory(limit = 50) {
  return fetchWithAuth(`${API_BASE}/preferences-history?limit=${limit}`).then((data: Record<string, unknown> | null): unknown[] => (data && data.history as unknown[]) || []).catch((error: Error): unknown[] => {
    const logger = _getPort('logger');
    if (logger && logger.warn) logger.warn('[pref-api] History load error:', error.message);
    return [];
  });
}

function addHistoryEntry(action: string, key: string, newValue: unknown, oldValue: unknown = null): Promise<unknown> {
  return fetchWithAuth(`${API_BASE}/preferences-history`, { method: 'POST', body: JSON.stringify({ action, key, newValue, oldValue }) }).catch((error: Error): null => {
    const logger = _getPort('logger');
    if (logger && logger.warn) logger.warn('[pref-api] History add error:', error.message);
    return null;
  });
}

function exportPreferences(state: Record<string, unknown>) {
  const exportData = {
    version: '3.2.0',
    exportedAt: new Date().toISOString(),
    preferences: (state.preferences as Record<string, unknown>) || {},
    panelSettings: (state.panelSettings as Record<string, unknown>) || {},
    layouts: (state.layouts as { items: unknown[]; defaultKey: string | null }) || { items: [], defaultKey: null }
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dshowdash-preferences-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  const layoutItems = exportData.layouts.items as unknown[];
  const itemCount = Object.keys(exportData.preferences).length + Object.keys(exportData.panelSettings).length + (layoutItems ? layoutItems.length : 0);
  tracker.exportDone(itemCount);
  addHistoryEntry('export', 'all', `${itemCount} items`).catch(() => {});
  return exportData;
}

function importPreferences(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {

        const data = JSON.parse((e.target as FileReader).result as string);
        if (!data.version || !data.preferences) throw new Error('INVALID_FORMAT');
        let chain = Promise.resolve();
        const prefKeys = Object.keys(data.preferences);
        prefKeys.forEach(key => { chain = chain.then(() => savePreference(key, data.preferences[key])); });
        if (data.panelSettings) {
          const panelKeys = Object.keys(data.panelSettings);
          panelKeys.forEach(panelId => { chain = chain.then(() => savePanelSetting(panelId, data.panelSettings[panelId])); });
        }
        if (data.layouts && data.layouts.items) {
          (data.layouts.items as Array<Record<string, unknown>>).forEach((layout: Record<string, unknown>) => { chain = chain.then(() => saveLayout(layout.key as string, layout.config as Record<string, unknown>, layout.key === (data.layouts as Record<string, unknown>).defaultKey)); });
        }
        chain.then(() => {
          const itemCount = prefKeys.length;
          tracker.importDone(itemCount);
          addHistoryEntry('import', 'all', `${itemCount} items`).catch(() => {});
          resolve(data);
        }).catch(error => { tracker.importError(error); reject(error); });
      } catch (error) { tracker.importError(error); reject(error); }
    };
    reader.onerror = () => { const error = new Error('FILE_READ_ERROR'); tracker.importError(error); reject(error); };
    reader.readAsText(file);
  });
}

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { apiReady: true }, timestamp: Date.now() }; }

export { MODULE_ID, VERSION, loadUserProfile, loadPreferences, savePreference, loadPanelSettings, savePanelSetting, loadLayouts, saveLayout, deleteLayout, loadSavedViews, deleteSavedView, loadHistory, addHistoryEntry, exportPreferences, importPreferences, info, healthCheck };
export default { loadUserProfile, loadPreferences, savePreference, loadPanelSettings, savePanelSetting, loadLayouts, saveLayout, deleteLayout, loadSavedViews, deleteSavedView, loadHistory, addHistoryEntry, exportPreferences, importPreferences, info, healthCheck, injectPorts, getPorts };
