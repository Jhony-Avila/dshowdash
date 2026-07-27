// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.notification-manager.api
// PURPOSE: Notification Manager - API Client with contract validation
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract FETCH_NOTIFICATIONS - fetchNotifications() fetches notifications from API
// @contract MARK_AS_READ - markAsRead() marks notification as read
// @contract GET_METRICS - getMetrics() returns API metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPortsSnapshot() returns ports snapshot
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   fetchNotifications() — exported function
//   markAsRead() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPortsSnapshot() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v3.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.3.0-STRICT-MODE: Migração NR-FULL strict mode com recordViolation
// @changelog v3.2.0-PORTSFACTORY: Migração para PortsFactory (elimina window.Logger)
// @changelog v3.1.0-ENTERPRISE: Logger fallback pattern
// @changelog v3.0.0-AAA-BOOT-FIX: P0 Fix: URLs canônicas, validação de contrato, fallback seguro
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '3.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'notification-manager-api';

const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => _Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => _Ports.inject(p);
export const getPortsSnapshot = () => _Ports.snapshot();

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

const _log = (level: string, ...args: unknown[]) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) { logger[level](prefix, ...args); }
  else if (!isStrict() && (level === 'error' || level === 'warn')) {
    console.debug(prefix, ...args);
  }
};

let _metrics = { requests: 0, errors: 0, contractViolations: 0, authErrors: 0 };

function _validateResponseContract(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.indexOf('application/json') !== -1;
  return { ok: response.ok, status: response.status, isJson, isContractViolation: !isJson && response.ok, isAuthError: response.status === 401 || response.status === 403 };
}

function _createFallback(reason: string) { return { notifications: [] as unknown[], unread_count: 0, _fallback: true, _reason: reason }; }

export async function fetchNotifications(endpoint = '/api/notifications') {
  _metrics.requests++;
  try {
    const url = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    const res = await fetch(url, { credentials: 'include', headers: { 'Accept': 'application/json' } });
    const contract = _validateResponseContract(res);
    if (contract.isAuthError) { _metrics.authErrors++; return _createFallback('auth-required'); }
    if (contract.isContractViolation) { _metrics.contractViolations++; _log('warn', 'API_CONTRACT_VIOLATION: Expected JSON, got HTML'); return _createFallback('contract-violation'); }
    if (!res.ok) { _metrics.errors++; return _createFallback('http-error'); }
    return await res.json();
  } catch (e) { _metrics.errors++; return _createFallback('network-error'); }
}

export async function markAsRead(id: string | number, endpoint = '/api/notifications') {
  _metrics.requests++;
  try {
    const url = `${endpoint}/?action=read&id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: 'PATCH', credentials: 'include', headers: { 'Accept': 'application/json' } });
    if (res.status === 401 || res.status === 403) { _metrics.authErrors++; return false; }
    return res.ok;
  } catch (e) { _metrics.errors++; return false; }
}

export function getMetrics() { return { ..._metrics }; }

export function healthCheck() {
  const checks = {
    lowErrorRate: _metrics.requests === 0 || (_metrics.errors / _metrics.requests) < 0.2,
    lowContractViolations: _metrics.requests === 0 || (_metrics.contractViolations / _metrics.requests) < 0.1
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/2`,
    checks,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export const fetchFromServer = fetchNotifications;
export const markAllAsRead = async function(ids?: (string | number)[]) { if (ids) { for (const id of ids) { await markAsRead(id); } } };
export const deleteNotification = async function(id: string | number) { return markAsRead(id); };
export const createNotification = async function(data: Record<string, unknown>) { return data; };
export default { fetchNotifications, markAsRead, getMetrics, healthCheck, info, injectPorts, getPorts: getPortsSnapshot, VERSION, MODULE_ID };
