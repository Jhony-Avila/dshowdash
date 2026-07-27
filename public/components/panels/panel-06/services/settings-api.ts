// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-06-services-settings-api
// PURPOSE: Panel-06 Settings - API Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   SETTINGS_EVENTS from /core/runtime/events/catalog/settings.events.js
//   MODULE_ID as PANEL_MODULE_ID, logger, emit, showToast, trackTelemetry from .....
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   request() — exported function
//   loadSettings() — exported function
//   loadCategories() — exported function
//   getSetting() — exported function
//   updateSetting() — exported function
//   createSetting() — exported function
//   deleteSetting() — exported function
//   bulkUpdate() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   AUTH_EVENTS.SESSION_EXPIRED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { SETTINGS_EVENTS } from '/core/runtime/events/catalog/settings.events.js';
import { MODULE_ID as PANEL_MODULE_ID, logger, emit, showToast, trackTelemetry } from '../state/state.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-06-services-settings-api';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_BASE = '/api/settings';

export function request(url: string, options: RequestInit, abortController?: AbortController) {
  options = options || {};
  const fetchOpts = Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, options);
  if (abortController && abortController.signal) fetchOpts.signal = abortController.signal;
  return fetch(url, fetchOpts).then(res => {
    if (res.status === 401) {
      trackTelemetry('auth_expired', { url });
      const eb = _getPort('eventBus');
      if (eb && eb.emit) eb.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: PANEL_MODULE_ID });
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (res.status === 403) throw new Error('Sem permissão para esta ação.');
    return res.json();
  }).then(data => {
    if (!data.ok) throw new Error(data.error || 'REQUEST_ERROR');
    return data;
  });
}

export function loadSettings(state: { settings: Record<string, unknown>[] }, abortController?: AbortController, category?: string) {
  let url = `${API_BASE}/?action=list`;
  if (category) url += `&category=${category}`;
  return request(url, {}, abortController).then(data => {
    state.settings = data.settings || [];
    logger.info('Settings loaded:', state.settings.length);
    return data;
  });
}

export function loadCategories(state: { categories: Record<string, unknown>[] }, abortController?: AbortController) {
  return request(`${API_BASE}/?action=categories`, {}, abortController).then(data => {
    state.categories = data.categories || [];
    return data;
  });
}

export function getSetting(key: string, abortController?: AbortController) {
  return request(`${API_BASE}/?action=get&key=${encodeURIComponent(key)}`, {}, abortController).then(data => data.setting);
}

export function updateSetting(key: string, value: unknown, abortController?: AbortController) {
  return request(`${API_BASE}/?action=update`, { method: 'PUT', body: JSON.stringify({ setting_key: key, setting_value: value }) }, abortController).then(data => {
    emit(SETTINGS_EVENTS.UPDATED, { key, value });
    showToast('Configuração salva', 'success');
    trackTelemetry('setting_updated', { key });
    return data;
  });
}

export function createSetting(settingData: Record<string, unknown>, abortController?: AbortController) {
  return request(`${API_BASE}/?action=create`, { method: 'POST', body: JSON.stringify(settingData) }, abortController).then(data => {
    emit(SETTINGS_EVENTS.CREATED, settingData);
    showToast('Configuração criada', 'success');
    return data;
  });
}

export function deleteSetting(key: string, abortController?: AbortController) {
  return request(`${API_BASE}/?action=delete&key=${encodeURIComponent(key)}`, { method: 'DELETE' }, abortController).then(data => {
    emit(SETTINGS_EVENTS.DELETED, { key });
    showToast('Configuração removida', 'success');
    return data;
  });
}

export function bulkUpdate(settings: Record<string, unknown>, abortController?: AbortController) {
  return request(`${API_BASE}/?action=bulk-update`, { method: 'POST', body: JSON.stringify({ settings }) }, abortController).then(data => {
    emit(SETTINGS_EVENTS.BULK_UPDATED, { count: data.updated });
    showToast(`${data.updated} configurações salvas`, 'success');
    return data;
  });
}

export function info() { const portsSnapshot = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized }; }
export function healthCheck() { const portsSnapshot = Ports.snapshot(); return { status: portsSnapshot._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, portsInitialized: portsSnapshot._initialized } }; }
