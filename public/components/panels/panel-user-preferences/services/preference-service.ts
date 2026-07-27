// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.services.preference-service
// PURPOSE: Panel User Preferences - Preference Service
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PREFERENCES_EVENTS from /core/runtime/events/catalog/preferences.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   clearCache() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PREFERENCES_EVENTS } from '/core/runtime/events/catalog/preferences.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences.services.preference-service';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _cache: { preferences: unknown; lastFetch: number; ttl: number } = { preferences: null, lastFetch: 0, ttl: 60000 };

function _isCacheValid() { return _cache.preferences && (Date.now() - _cache.lastFetch) < _cache.ttl; }
function _updateCache(prefs: unknown) { _cache.preferences = prefs; _cache.lastFetch = Date.now(); }
export function clearCache() { _cache.preferences = null; _cache.lastFetch = 0; }

function _emit(event: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data)); }

export async function getPreferences(forceRefresh = false) {
  _initPorts();
  if (!forceRefresh && _isCacheValid()) return { ok: true, data: _cache.preferences, fromCache: true };
  try {
    const api = _getPort('apiClient');
    if (api && api.get) {
      const response = await api.get('/api/user/preferences');
      if (response.ok) { _updateCache(response.data); return { ok: true, data: response.data, fromCache: false }; }
      return { ok: false, error: response.error || 'Erro ao buscar preferências' };
    }
    return { ok: false, error: 'ApiClient não disponível' };
  } catch (e: any) { return { ok: false, error: e.message || 'Erro desconhecido' }; }
}

export async function savePreferences(preferences: Record<string, unknown>) {
  _initPorts();
  try {
    const api = _getPort('apiClient');
    if (api && api.post) {
      const response = await api.post('/api/user/preferences', preferences);
      if (response.ok) { _updateCache(preferences); _emit(PREFERENCES_EVENTS.SAVED, { preferences }); return { ok: true, data: response.data }; }
      return { ok: false, error: response.error || 'Erro ao salvar preferências' };
    }
    return { ok: false, error: 'ApiClient não disponível' };
  } catch (e: any) { return { ok: false, error: e.message || 'Erro desconhecido' }; }
}

export async function resetPreferences() {
  _initPorts();
  try {
    const api = _getPort('apiClient');
    if (api && api.post) {
      const response = await api.post('/api/user/preferences/reset');
      if (response.ok) { clearCache(); _emit(PREFERENCES_EVENTS.RESET, {}); return { ok: true, data: response.data }; }
      return { ok: false, error: response.error || 'Erro ao resetar preferências' };
    }
    return { ok: false, error: 'ApiClient não disponível' };
  } catch (e: any) { return { ok: false, error: e.message || 'Erro desconhecido' }; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, cacheValid: _isCacheValid(), portsInitialized: Ports.isInitialized() }; }

export default { getPreferences, savePreferences, resetPreferences, clearCache, injectPorts, getPorts };
