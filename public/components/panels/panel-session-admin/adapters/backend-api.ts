// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin.adapters.backend-api
// PURPOSE: Panel Session Admin - Backend API Adapter Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   SESSION_ADMIN_EVENTS from /core/runtime/events/catalog/session-admin.events.js
//   API_CONFIG from ../core/contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   initAbortController() — exported function
//   cleanupAbortController() — exported function
//   loadMySessions() — exported function
//   loadAllSessions() — exported function
//   terminateSession() — exported function
//   terminateAllOthers() — exported function
//   getCurrentSession() — exported function
//   updateActivity() — exported function
//   getMetrics() — exported function
//   getLastError() — exported function
//   getVersion() — exported function
//   ... and 1 more exports
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
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { SESSION_ADMIN_EVENTS } from '/core/runtime/events/catalog/session-admin.events.js';
import { API_CONFIG } from '../core/contracts.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-session-admin.adapters.backend-api';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_BASE = API_CONFIG && API_CONFIG.BASE_URL ? API_CONFIG.BASE_URL : '/api/sessions';

let _abortController: AbortController | null = null;
const _metrics: {
  requests: number;
  errors: number;
  lastRequestAt: number | null;
  lastError: { message: string; timestamp: number } | null;
  lastFetchDurationMs: number;
} = {
  requests: 0,
  errors: 0,
  lastRequestAt: null,
  lastError: null,
  lastFetchDurationMs: 0
};

function _emit(event: string, data: Record<string, unknown> = {}) {
  try {
    const eventBus = _getPort('eventBus');
    if (eventBus && eventBus.emit) {
      eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
    }
  } catch (e) { }
}

function _getCSRFToken() {
  const securityCSRF = _getPort('securityCSRF');
  if (securityCSRF && securityCSRF.getToken) {
    return securityCSRF.getToken();
  }
  const meta = document.querySelector('meta[name="csrf-token"]');

  // @ts-expect-error TS migration - TS2339
  return meta ? meta.content : '';
}

function _request(url: string, options: RequestInit = {}) {
  const startTime = Date.now();
  _metrics.requests++;
  _metrics.lastRequestAt = startTime;
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'X-CSRF-Token': _getCSRFToken()
  }, options.headers || {});
  const fetchOptions = Object.assign({
    credentials: 'include',
    headers,
    signal: _abortController ? _abortController.signal : undefined
  }, options);
  return fetch(url, fetchOptions).then(response => {
    _metrics.lastFetchDurationMs = Date.now() - startTime;
    if (response.status === 401) {
      _emit(AUTH_EVENTS.SESSION_EXPIRED);
      throw new Error('SESSION_EXPIRED');
    }
    if (response.status === 403) {
      throw new Error('ACCESS_DENIED');
    }
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    return response.json();
  }).then(data => {
    if (data.ok === false) {
      throw new Error(data.error || 'API_ERROR');
    }
    return data;
  }).catch(e => {
    _metrics.errors++;
    _metrics.lastError = { message: e.message, timestamp: Date.now() };
    throw e;
  });
}

function initAbortController() {
  if (_abortController) {
    _abortController.abort();
  }
  _abortController = new AbortController();
}

function cleanupAbortController() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}

// Normaliza a sessão da API (action=list) para o modelo do UI (2026-07-08). Backend só devolve token
// MASCARADO (token_preview) + is_current, não o token real. Usamos token_preview como id de linha.
function _normalizeSession(raw: any) {
  if (!raw || typeof raw !== 'object') return null;
  const preview = raw.token_preview || raw.session_token || '';
  let status = 'active';
  if (raw.expires_at) {
    const exp = new Date(String(raw.expires_at).replace(' ', 'T')).getTime();
    if (!isNaN(exp) && exp < Date.now()) status = 'expired';
  }
  if (status === 'active' && !(raw.is_active === 1 || raw.is_active === true || raw.is_active === '1')) status = 'expired';
  return {
    id: preview, session_token: preview, token_preview: preview, is_current: !!raw.is_current,
    user_name: raw.user_name || raw.userName || '',
    ip_address: raw.origin_ip || raw.ip_address || '',
    device: raw.device_type || raw.device || '', browser: raw.browser || '', os: raw.os || '',
    location: raw.location || '', user_agent: [raw.browser, raw.os].filter(Boolean).join(' · '),
    created_at: raw.created_at || '', last_activity: raw.last_activity_at || raw.last_activity || '',
    expires_at: raw.expires_at || '', status
  };
}
function _extractSessions(resp: any) {
  const arr = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp?.sessions) ? resp.sessions : Array.isArray(resp) ? resp : [];
  return arr.map(_normalizeSession).filter(Boolean);
}
function loadMySessions() {
  return _request(`${API_BASE}/?action=list&scope=mine`).then(_extractSessions);
}

function loadAllSessions() {
  return _request(`${API_BASE}/?action=list&scope=all`).then(_extractSessions);
}

function terminateSession(sessionToken: string) {
  if (!sessionToken) return Promise.reject(new Error('SESSION_TOKEN_REQUIRED'));
  return _request(`${API_BASE}/?action=revoke`, {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken })
  }).then(data => {
    _emit(SESSION_ADMIN_EVENTS.SESSION_TERMINATED, { sessionToken });
    return data;
  });
}

function terminateAllOthers() {
  return _request(`${API_BASE}/?action=revoke-all`, {
    method: 'POST'
  }).then(data => {
    _emit(SESSION_ADMIN_EVENTS.SESSION_TERMINATE_ALL);
    return data;
  });
}

function getCurrentSession() {
  return _request(`${API_BASE}/?action=current`).then(data => data.session || null);
}

function updateActivity() {
  return _request(`${API_BASE}/?action=activity`, {
    method: 'POST'
  });
}

function getMetrics() { return Object.assign({}, _metrics); }
function getLastError() { return _metrics.lastError; }
function getVersion() { return VERSION; }

function healthCheck() {
  const errorRate = _metrics.requests > 0 ? _metrics.errors / _metrics.requests : 0;
  return {
    status: errorRate > 0.5 ? 'DEGRADED' : 'HEALTHY',
    metrics: Object.assign({}, _metrics),
    errorRate: Math.round(errorRate * 100),
    available: true,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export { VERSION, MODULE_ID, initAbortController, cleanupAbortController, loadMySessions, loadAllSessions, terminateSession, terminateAllOthers, getCurrentSession, updateActivity, getMetrics, getLastError, getVersion, healthCheck };
export default {
  VERSION, MODULE_ID,
  initAbortController, cleanupAbortController,
  loadMySessions, loadAllSessions,
  terminateSession, terminateAllOthers,
  getCurrentSession, updateActivity,
  getMetrics, getLastError, getVersion, healthCheck,
  injectPorts, getPorts
};
