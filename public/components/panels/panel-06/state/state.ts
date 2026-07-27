// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-06.state
// PURPOSE: Panel-06 Settings - State Module
// ───────────────────────────────────────────────────────────────
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   CATEGORIES — exported value
//   createInitialState() — exported function
//   createMetrics() — exported function
//   logger — exported value
//   isAuthenticated() — exported function
//   ensureAuth() — exported function
//   getUser() — exported function
//   getRoles() — exported function
//   hasRole() — exported function
//   hasPermission() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   Ports.get('toast') - único canal autorizado
//   window.Toast fallback removido em modo strict
// @changelog v8.6.0-STRICT-MODE: Migração completa para strict mode (NR-FULL)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-06.state';
export const PANEL_ID = 'panel-06';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _debug() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; }
function _log(level: string, ...rest: any[]) { const args = rest; const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; } if (_debug() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args)); }
function _emit(eventName: string, data?: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({}, data || {}, { source: MODULE_ID, timestamp: Date.now() })); }
function _showToast(message: string, type?: string) {
  type = type || 'info';
  // Primary: Ports
  let toast = _getPort('toast');
  if (toast && toast.show) { toast.show(message, type); return; }
  // Secondary: Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    toast = window.Core.windowAdapter.get('Toast');
    if (toast && toast.show) { toast.show(message, type); return; }
  }
  // Em modo strict, não usa fallback
  const strictMode = isStrict();
  if (strictMode) { _log(type === 'error' ? 'error' : 'info', `[Toast ${type}]`, message); return; }
  // Fallback: window.Toast (legacy, apenas em non-strict)
  if (typeof window !== 'undefined' && window.Toast) {
    recordViolation('WINDOW_TOAST_FALLBACK', { module: MODULE_ID, method: '_showToast' });
    if (window.Toast.show) { window.Toast.show(message, type); return; }
  }
  _log(type === 'error' ? 'error' : 'info', `[Toast ${type}]`, message);
}
function _trackTelemetry(action: string, data?: Record<string, unknown>) { data = data || {}; const tt = _getPort('telemetry'); if (tt && tt.track) tt.track(`${MODULE_ID}:${action}`, Object.assign({ moduleId: MODULE_ID, action, timestamp: Date.now() }, data)); }

export const CATEGORIES = [
  { key: 'general', label: 'Geral', icon: 'settings' },
  { key: 'ui', label: 'Interface', icon: 'palette' },
  { key: 'navigation', label: 'Navegação', icon: 'compass' },
  { key: 'panels', label: 'Painéis', icon: 'layout-dashboard' },
  { key: 'security', label: 'Segurança', icon: 'lock' },
  { key: 'notifications', label: 'Notificações', icon: 'bell' },
  { key: 'accessibility', label: 'Acessibilidade', icon: 'accessibility' },
  { key: 'shortcuts', label: 'Atalhos', icon: 'keyboard' },
  { key: 'integrations', label: 'Integrações', icon: 'link' },
  { key: 'telemetry', label: 'Telemetria', icon: 'trending-up' },
  { key: 'logs', label: 'Logs', icon: 'file-text' },
  { key: 'health', label: 'Health Check', icon: 'heart-pulse' },
  { key: 'privacy', label: 'Privacidade', icon: 'shield' },
  { key: 'realtime', label: 'Tempo Real', icon: 'zap' },
  { key: 'footer', label: 'Footer', icon: 'pin' },
  { key: 'performance', label: 'Performance', icon: 'rocket' }
];

export function createInitialState() { return { settings: [] as Record<string, unknown>[], categories: [] as Record<string, unknown>[], activeCategory: 'general', loading: false, saving: false, error: null as string | null, changes: {} as Record<string, unknown>, searchTerm: '' }; }
export function createMetrics() { return { mountCount: 0, unmountCount: 0, loadCount: 0, saveCount: 0, errorCount: 0, authFailCount: 0, lastActivity: null as number | null }; }

// @ts-expect-error TS migration - TS2556
export const logger = { info(...args) { _log(...['info'].concat(Array.prototype.slice.call(args))); }, warn(...args) { _log(...['warn'].concat(Array.prototype.slice.call(args))); }, error(...args) { _log(...['error'].concat(Array.prototype.slice.call(args))); } };

export function isAuthenticated() { const auth = _getPort('auth'); return auth && auth.isAuthenticated ? auth.isAuthenticated() : false; }

export function ensureAuth(metrics: ReturnType<typeof createMetrics>, action: string) {
  _initPorts();
  action = action || 'operation';
  if (isAuthenticated()) return true;
  metrics.authFailCount++;
  metrics.lastActivity = Date.now();
  _trackTelemetry('auth:failed', { action, count: metrics.authFailCount });
  _log('warn', 'Auth required for:', action);
  return false;
}

export function getUser() { const auth = _getPort('auth'); return auth && auth.getUser ? auth.getUser() : null; }
export function getRoles() { const auth = _getPort('auth'); return auth && auth.getRoles ? auth.getRoles() : []; }
export function hasRole(role: string) { const auth = _getPort('auth'); return auth && auth.hasRole ? auth.hasRole(role) : false; }
export function hasPermission(permission: string) { const auth = _getPort('auth'); return auth && auth.hasPermission ? auth.hasPermission(permission) : false; }

export { _emit as emit, _showToast as showToast, _trackTelemetry as trackTelemetry };
