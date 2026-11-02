// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.7.1-GOVERNANCE-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: smoke-test
// PURPOSE: Smoke Test - Automated System Health Validation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   createCorePorts from /core/runtime/ports-profiles.js
//   NAV_INTENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   runSmokeTest() — exported function
//   getLastResults() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   NAV_INTENTS.NAVIGATE
// LISTENS (eventos):
//   NAV_INTENTS.NAVIGATE
// WINDOW ACCESS:
//   (window as any).ContextProvider
//   window.EventBus
//   window.GlobalState
//   (window as any).LayoutManager
//   (window as any).Logger
//   (window as any).LoggerGlobal
//   window.Main
//   window.RouterGlobal
//   (window as any).Sidebar
//   (window as any).SmokeTest
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';

export var VERSION = '2.7.1-GOVERNANCE-STRICT-MODE';
export var MODULE_ID = 'smoke-test';

var Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getCurrentRoute() {
  var router = _getPort('router');
  if (router && router.getCurrentRoute) { try { var route = router.getCurrentRoute(); if (route) return route.hash || route.path || '#/'; } catch (e: any) {} }
  return '#/';
}

var STYLES = { pass: 'color: #22c55e; font-weight: bold', fail: 'color: #ef4444; font-weight: bold', warn: 'color: #f59e0b; font-weight: bold', info: 'color: #3b82f6; font-weight: bold', title: 'color: #8b5cf6; font-weight: bold; font-size: 14px', subtitle: 'color: #6b7280; font-style: italic' };

interface SmokeTestResult { test: unknown; status: string; detail: unknown; error?: string | null; }
var _results: SmokeTestResult[] = [];
var _startTime = 0;

var log = {
  title: function(msg: string) { console.log('%c🔬 ' + msg, STYLES.title); },
  pass: function(test: unknown, detail?: unknown) { detail = detail || ''; _results.push({ test: test, status: 'PASS', detail: detail }); console.log('%c  ✅ PASS%c ' + test, STYLES.pass, '', detail ? '(' + detail + ')' : ''); },
  fail: function(test: unknown, detail?: unknown, error?: Error) { detail = detail || ''; _results.push({ test: test, status: 'FAIL', detail: detail, error: error ? error.message : null }); console.log('%c  ❌ FAIL%c ' + test, STYLES.fail, '', detail ? '- ' + detail : ''); if (error) console.error('    Error:', error); },
  warn: function(test: unknown, detail?: unknown) { detail = detail || ''; _results.push({ test: test, status: 'WARN', detail: detail }); console.log('%c  ⚠️ WARN%c ' + test, STYLES.warn, '', detail ? '- ' + detail : ''); },
  info: function(msg: string) { console.log('%c  ℹ️ ' + msg, STYLES.info); },
  section: function(name: string) { console.log('\n%c── ' + name + ' ──', STYLES.subtitle); }
};

function testGlobalModules() {
  log.section('T1: Global Modules');
  var modules = [
    { name: 'Main', ref: function() { return window.Main; } },
    { name: 'Sidebar', ref: function() { return (window as any).Sidebar; } },
    { name: 'RouterGlobal', ref: function() { return window.RouterGlobal; } },
    { name: 'EventBus', ref: function() { return window.EventBus; } },
    { name: 'LayoutManager', ref: function() { return (window as any).LayoutManager; } },
    { name: 'Logger', ref: function() { return (window as any).LoggerGlobal || (window as any).Logger; } },
    { name: 'GlobalState', ref: function() { return window.GlobalState; } },
    { name: 'ContextProvider', ref: function() { return (window as any).ContextProvider; } }
  ];
  modules.forEach(function(m) { try { var mod = m.ref(); if (mod) log.pass(m.name + ' exists', typeof mod); else log.warn(m.name + ' not found'); } catch (e: any) { log.fail(m.name + ' check', e.message, e); } });
}

function testHealthChecks() {
  log.section('T2: Health Checks');
  var checks = [
    { name: 'Main', fn: function() { return window.Main && window.Main.healthCheck ? window.Main.healthCheck() : null; } },
    { name: 'Sidebar', fn: function() { return (window as any).Sidebar && (window as any).Sidebar.getInstance && (window as any).Sidebar.getInstance() && (window as any).Sidebar.getInstance().healthCheck ? (window as any).Sidebar.getInstance().healthCheck() : null; } },
    { name: 'LayoutManager', fn: function() { return (window as any).LayoutManager && (window as any).LayoutManager.healthCheck ? (window as any).LayoutManager.healthCheck() : null; } },
    { name: 'Router', fn: function() { return (window as any).RouterGlobal && (window as any).RouterGlobal.healthCheck ? (window as any).RouterGlobal.healthCheck() : null; } },
    { name: 'EventBus', fn: function() { return (window as any).EventBus && (window as any).EventBus.healthCheck ? (window as any).EventBus.healthCheck() : null; } }
  ];
  checks.forEach(function(c) { try { var result = c.fn(); if (!result) { log.warn(c.name + '.healthCheck()', 'returned null/undefined'); return; } var status = result.status || 'UNKNOWN'; var score = result.score || result.scoreDisplay || 'N/A'; if (status === 'HEALTHY') log.pass(c.name + ' health', status + ' (' + score + ')'); else if (status === 'DEGRADED') log.warn(c.name + ' health', status + ' (' + score + ')'); else log.fail(c.name + ' health', status + ' (' + score + ')'); } catch (e: any) { log.fail(c.name + '.healthCheck()', e.message, e); } });
}

function testNavigation() {
  log.section('T3: Navigation (P18-INTENTS)');
  if (typeof window.Main !== 'undefined' && typeof window.Main.navigate === 'function') log.pass('Main.navigate() exists', 'navigation owner');
  else { log.fail('Main.navigate() exists', 'function not found'); return Promise.resolve(); }
  var eb = _getPort('eventBus');
  if (eb && typeof eb.emit === 'function') log.pass('EventBus.emit() available', 'NAV_INTENTS.NAVIGATE ready');
  else log.warn('EventBus.emit() available', 'EventBus not found');
  var broker = _getPort('navigationBroker');
  if (broker && typeof broker.dispatch === 'function') log.pass('NavigationBroker.dispatch() exists', 'facade available');
  else if (window.Main && window.Main.navigate) log.pass('Main as NavigationBroker', 'Main.navigate is owner/facade');
  else log.warn('NavigationBroker', 'no navigation facade found');
  var router = _getPort('router');
  if (router && router.getCurrentRoute) log.pass('RouterGlobal.getCurrentRoute()', 'read-only available');
  else log.warn('RouterGlobal.getCurrentRoute()', 'not available');
  return Promise.resolve().then(function() {
    var beforeRoute = _getCurrentRoute();
    return Promise.resolve(window.Main.navigate('panel-01')).then(function(result) {
      var afterRoute = _getCurrentRoute();
      if (result === true) log.pass('Main.navigate("panel-01")', 'returned true, route: ' + beforeRoute + ' → ' + afterRoute);
      else if (result === false) log.fail('Main.navigate("panel-01")', 'returned false');
      else log.warn('Main.navigate("panel-01")', 'returned ' + result);
    });
  }).catch(function(e) { log.fail('Main.navigate()', e.message, e); }).then(function() {
    try {
      if (eb && eb.emit) {
        var intentReceived = false;
        var cleanup = eb.on ? eb.on(NAV_INTENTS.NAVIGATE, function(data: { meta?: { source?: string } }) { if (data && data.meta && data.meta.source === 'smoke-test') intentReceived = true; }) : null;
        eb.emit(NAV_INTENTS.NAVIGATE, { intentId: 'NAVIGATE', target: { type: 'route', value: '#/test' }, meta: { source: 'smoke-test', reason: 'smoke-test-validation', timestamp: Date.now() }, options: { replace: false, preferRouter: true } });
        if (intentReceived) log.pass('EventBus NAV_INTENTS.NAVIGATE', 'intent emitted and received');
        else log.warn('EventBus NAV_INTENTS.NAVIGATE', 'intent emitted but no listener confirmed');
        if (typeof cleanup === 'function') cleanup();
      } else log.warn('EventBus NAV_INTENTS.NAVIGATE', 'EventBus not available');
    } catch (e: any) { log.fail('EventBus NAV_INTENTS.NAVIGATE', e.message, e); }
  });
}

function testSidebar() {
  log.section('T4: Sidebar');
  var sidebar = (window as any).Sidebar && (window as any).Sidebar.getInstance ? (window as any).Sidebar.getInstance() : null;
  if (!sidebar) { log.fail('Sidebar instance', 'getInstance() returned null'); return; }
  log.pass('Sidebar instance exists');
  try { var state = sidebar.getState ? sidebar.getState() : null; if (state) log.pass('Sidebar.getState()', 'collapsed: ' + state.collapsed + ', lifecycle: ' + state.lifecycle); else log.warn('Sidebar.getState()', 'returned null'); } catch (e: any) { log.fail('Sidebar.getState()', e.message, e); }
  try { var beforeState = sidebar.getState ? sidebar.getState().collapsed : null; if (sidebar.toggle) sidebar.toggle(); var afterState = sidebar.getState ? sidebar.getState().collapsed : null; if (beforeState !== afterState) { log.pass('Sidebar.toggle()', beforeState + ' → ' + afterState); if (sidebar.toggle) sidebar.toggle(); } else log.fail('Sidebar.toggle()', 'state did not change'); } catch (e: any) { log.fail('Sidebar.toggle()', e.message, e); }
  try { if (sidebar.collapse) sidebar.collapse(); var bodyHasClass = document.body.classList.contains('sidebar-collapsed'); var layoutState = (window as any).LayoutManager && (window as any).LayoutManager.isSidebarCollapsed ? (window as any).LayoutManager.isSidebarCollapsed() : null; if (bodyHasClass && layoutState) log.pass('Sidebar ↔ LayoutManager sync', 'body class + LayoutManager aligned'); else log.warn('Sidebar ↔ LayoutManager sync', 'body: ' + bodyHasClass + ', LayoutManager: ' + layoutState); if (sidebar.expand) sidebar.expand(); } catch (e: any) { log.fail('Sidebar ↔ LayoutManager sync', e.message, e); }
}

function testEventBus() {
  log.section('T5: EventBus');
  if (!(window as any).EventBus) { log.fail('EventBus exists', 'not found'); return; }
  log.pass('EventBus exists');
  try { var received = false; var testEvent = 'smoke-test:' + Date.now(); var cleanup = (window as any).EventBus.on(testEvent, function(data: Record<string, unknown>) { if (data && data.test === 'smoke') received = true; }); (window as any).EventBus.emit(testEvent, { test: 'smoke' }); if (received) log.pass('EventBus emit/on', 'event received'); else log.fail('EventBus emit/on', 'event not received'); if (typeof cleanup === 'function') cleanup(); else if ((window as any).EventBus.off) (window as any).EventBus.off(testEvent); } catch (e: any) { log.fail('EventBus emit/on', e.message, e); }
}

function testContainers() {
  log.section('T6: Container Management');
  var containerAdapter = window.Main && window.Main.getContainerAdapter ? window.Main.getContainerAdapter() : null;
  if (!containerAdapter) { log.warn('ContainerAdapter', 'not accessible'); return; }
  log.pass('ContainerAdapter exists');
  try { var containers = containerAdapter.list ? containerAdapter.list() : null; if (Array.isArray(containers)) { log.pass('Container list', containers.length + ' containers'); if (containers.length > 5) log.warn('Container count', containers.length + ' containers (possible leak)'); } else log.warn('Container list', 'not an array'); } catch (e: any) { log.fail('Container list', e.message, e); }
  try { var health = containerAdapter.healthCheck ? containerAdapter.healthCheck() : null; if (health && health.status === 'HEALTHY') log.pass('ContainerAdapter health', health.status); else log.warn('ContainerAdapter health', health ? health.status : 'unknown'); } catch (e: any) { log.fail('ContainerAdapter health', e.message, e); }
}

function testDOMStructure() {
  log.section('T7: DOM Structure');
  var elements = [
    { name: 'App Shell', selector: '#app-shell, .dsd-app-shell' },
    { name: 'Sidebar', selector: '.dsd-sidebar, #sidebar' },
    { name: 'Header', selector: 'header, .site-header' },
    { name: 'Main Content', selector: '#main-content-region, .dsd-main' },
    { name: 'Primary Container', selector: '#primary, [data-container-id="primary"]' }
  ];
  elements.forEach(function(e) { var el = document.querySelector(e.selector); if (el) log.pass(e.name + ' exists', e.selector.split(',')[0]); else log.warn(e.name + ' not found', e.selector); });
}

export function runSmokeTest(options: { skipNavigation?: boolean } = {}) {
  if (!options) options = {};
  var skipNavigation = options.skipNavigation || false;
  _results = [];
  _startTime = performance.now();
  console.clear();
  log.title('SMOKE TEST - DshowDash System Health (P18EC)');
  console.log('%cVersion: ' + VERSION + ' | ' + new Date().toLocaleString(), STYLES.subtitle);
  testGlobalModules();
  testHealthChecks();
  var navPromise = skipNavigation ? Promise.resolve() : testNavigation();
  return navPromise.then(function() {
    testSidebar();
    testEventBus();
    testContainers();
    testDOMStructure();
    var duration = (performance.now() - _startTime).toFixed(0);
    var passed = _results.filter(function(r) { return r.status === 'PASS'; }).length;
    var failed = _results.filter(function(r) { return r.status === 'FAIL'; }).length;
    var warned = _results.filter(function(r) { return r.status === 'WARN'; }).length;
    var total = _results.length;
    console.log('\n' + '═'.repeat(50));
    log.title('SUMMARY');
    console.log('%c  Total: ' + total + ' | ✅ Pass: ' + passed + ' | ❌ Fail: ' + failed + ' | ⚠️ Warn: ' + warned, STYLES.info);
    console.log('%c  Duration: ' + duration + 'ms', STYLES.subtitle);
    var overallStatus = failed === 0 ? (warned === 0 ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY';
    var statusStyle = failed === 0 ? (warned === 0 ? STYLES.pass : STYLES.warn) : STYLES.fail;
    console.log('%c  Status: ' + overallStatus, statusStyle);
    console.log('═'.repeat(50));
    return { status: overallStatus, passed: passed, failed: failed, warned: warned, total: total, duration: parseInt(duration), results: _results, timestamp: Date.now() };
  });
}

export function getLastResults() { return { results: _results.slice(), summary: { passed: _results.filter(function(r) { return r.status === 'PASS'; }).length, failed: _results.filter(function(r) { return r.status === 'FAIL'; }).length, warned: _results.filter(function(r) { return r.status === 'WARN'; }).length, total: _results.length } }; }

export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, testsAvailable: 7, portsInitialized: Ports.isInitialized(), hasEventBus: !!_getPort('eventBus'), hasRouter: !!_getPort('router'), hasNavigationBroker: !!_getPort('navigationBroker'), timestamp: Date.now() }; }

export function info() { return { version: VERSION, moduleId: MODULE_ID, description: 'Automated smoke test for DshowDash system health validation (P18EC)', tests: ['T1: Global Modules', 'T2: Health Checks', 'T3: Navigation', 'T4: Sidebar', 'T5: EventBus', 'T6: Containers', 'T7: DOM Structure'], portsInitialized: Ports.isInitialized(), lastResults: getLastResults() }; }

if (typeof window !== 'undefined') {
  var _smokeTestAPI = { run: runSmokeTest, getResults: getLastResults, healthCheck: healthCheck, info: info, injectPorts: injectPorts, getPorts: getPorts, VERSION: VERSION, MODULE_ID: MODULE_ID };
  // DevTools always allowed
  window.__dev = window.__dev || {};
  window.__dev.smokeTest = _smokeTestAPI;
  // Legacy globals only in non-strict mode
  if (!isStrict()) {
    (window as any).SmokeTest = _smokeTestAPI;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, global: 'SmokeTest' });
  }
}

export default { run: runSmokeTest, getResults: getLastResults, healthCheck: healthCheck, info: info, injectPorts: injectPorts, getPorts: getPorts, VERSION: VERSION, MODULE_ID: MODULE_ID };
