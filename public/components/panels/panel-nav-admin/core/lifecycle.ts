// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.core.lifecycle
// PURPOSE: Panel Nav Admin - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   initLifecycle() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID — exported value
//   PANEL_NAME — exported value
//   metrics — exported value
//   loadCSS() — exported function
//   isAuthenticated() — exported function
//   ensureAuth() — exported function
//   checkPanelAccess() — exported function
//   getUserLevel() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// @changelog
//   9.4.0-P18EC - Add initLifecycle() consumed by mount.js
//   8.8.0-ENTERPRISE-AAA - Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { tracker } from '../telemetry/tracker.js';

const VERSION = '9.4.0-P18EC-ENTERPRISE';
const MODULE_ID = 'panel-nav-admin.core.lifecycle';
const PANEL_ID = 'panel-nav-admin';
const PANEL_NAME = 'Administração de Navegação';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

var _initPorts = function() { Ports.init(); };
var _getPort = function(name: string) { return Ports.get(name); };
export var injectPorts = function(p: unknown) { return Ports.inject(p); };
export var getPorts = function() { return Ports.snapshot(); };

var metrics: { mountCount: number; unmountCount: number; loadCount: number; errorCount: number; itemsCreated: number; itemsUpdated: number; itemsDeleted: number; sectionsCreated: number; lastActivity: number | null } = { mountCount: 0, unmountCount: 0, loadCount: 0, errorCount: 0, itemsCreated: 0, itemsUpdated: 0, itemsDeleted: 0, sectionsCreated: 0, lastActivity: null };

var _emit = function(event: string, data: Record<string, unknown> = {}) {
  data = data || {};
  var eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
};

var loadCSS = function() {
  var cssPath = '/components/panels/panel-nav-admin/styles.css';
  var al = _getPort('assetLoader');
  if (al && al.loadCSS) {
    al.loadCSS(cssPath);
  } else if (typeof document !== 'undefined' && !document.querySelector('link[href="' + cssPath + '"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
};

var isAuthenticated = function() {
  var auth = _getPort('auth');
  return auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
};

var ensureAuth = function(action: string) {
  action = action || 'operation';
  if (isAuthenticated()) return true;

  tracker.trackAuthRequired(action);
  _emit(AUTH_INTENTS.LOGIN, { reason: 'session-expired', action: action });
  return false;
};

var checkPanelAccess = function() {
  var auth = _getPort('auth');
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) return false;
  if (auth.canAccessPanel) return auth.canAccessPanel(PANEL_ID);
  if (auth.can) return auth.can('nav:admin') || auth.can('admin:full');
  return getUserLevel() >= 100;
};

var getUserLevel = function() {
  var auth = _getPort('auth');
  return auth && auth.getLevel ? auth.getLevel() : 0;
};

// v9.4.0-P18EC: initLifecycle - Initializes the panel lifecycle, consumed by mount.js
// @param {HTMLElement} container - The panel container element
// @param {Object} options - Mount options
export async function initLifecycle(container: HTMLElement, options: Record<string, unknown> = {}) {
  options = options || {};
  try {
    _initPorts();
    loadCSS();
    metrics.mountCount++;
    metrics.lastActivity = Date.now();
    if (options.ports) {
      injectPorts(options.ports);
    }
    _emit('panel:lifecycle:init', { panelId: PANEL_ID, container: !!container });
    return { ok: true, panelId: PANEL_ID, version: VERSION };
  } catch (err) {
    metrics.errorCount++;
    if (typeof console !== 'undefined') console.error('[' + MODULE_ID + '] initLifecycle failed:', err);
    throw err;
  }
}

var healthCheck = function(isInitialized: boolean, container: HTMLElement | null, stateHealth: Record<string, unknown> | null, adapterHealth: Record<string, unknown> | null) {
  var ps = Ports.snapshot();
  var checks: Record<string, boolean> = {
    initialized: isInitialized,
    mounted: !!container,
    authenticated: isAuthenticated(),
    stateHealthy: stateHealth ? stateHealth.status === 'HEALTHY' : false,
    adapterHealthy: adapterHealth ? adapterHealth.status === 'HEALTHY' : false,
    portsInitialized: ps._initialized
  };
  var passed = 0, total = 0;
  for (var k in checks) { total++; if (checks[k]) passed++; }
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed + '/' + total,
    checks: checks,
    state: stateHealth,
    adapter: adapterHealth,
    metrics: Object.assign({}, metrics),
    version: VERSION,
    p22Compliant: true,
    timestamp: Date.now()
  };
};

var info = function(isInitialized: boolean, container: HTMLElement | null, healthCheckResult: Record<string, unknown>) {
  var ps = Ports.snapshot();
  return {
    id: PANEL_ID,
    name: PANEL_NAME,
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: isInitialized,
    mounted: !!container,
    portsInitialized: ps._initialized,
    metrics: Object.assign({}, metrics),
    healthCheck: healthCheckResult,
    p22Compliant: true,
    timestamp: Date.now()
  };
};

export { VERSION, MODULE_ID, PANEL_ID, PANEL_NAME, metrics, loadCSS, isAuthenticated, ensureAuth, checkPanelAccess, getUserLevel, healthCheck, info };
