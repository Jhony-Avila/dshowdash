// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: feature-base-contract
// PURPOSE: Feature Base Contract - Enterprise Standard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createFeature() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.EventBus
//   window.Logger
//   window.createFeature
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '1.3.0-P0-ENTERPRISE';
export var MODULE_ID = 'feature-base-contract';

var _FactoryPorts = createCorePorts({ moduleId: MODULE_ID });
function _getFactoryPort(name) { return _FactoryPorts.get(name); }
export function injectPorts(ports) { return _FactoryPorts.inject(ports); }
export function getPorts() { return _FactoryPorts.snapshot(); }

function createFeature(config) {
  if (!config || !config.id) throw new Error('Feature must have id');
  var MODULE_ID = config.id;
  var VERSION = config.version || '1.0.0';
  var _state = { initialized: false, enabled: false, initCount: 0, errorCount: 0, lastError: null, initTime: null, cleanups: [] };
  var _ports = { eventBus: null, telemetry: null, _initialized: false };
  function _initPorts(ctx) {
    if (_ports._initialized) return;
    // P0 ENTERPRISE: Context-provided ports have highest priority
    if (ctx && ctx.ports) { Object.keys(ctx.ports).forEach(function(k) { if (ctx.ports[k]) _ports[k] = ctx.ports[k]; }); }
    // P0 ENTERPRISE: Use factory ports as fallback (no window.* access)
    if (!_ports.eventBus) _ports.eventBus = _getFactoryPort('eventBus');
    if (!_ports.telemetry) _ports.telemetry = _getFactoryPort('telemetry');
    _ports._initialized = true;
  }
  function _envelope(ok, data, errors) { return { ok: ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: new Date().toISOString() }, errors: errors || [] }; }
  function _track(eventName, payload) { try { if (_ports.telemetry && _ports.telemetry.track) { _ports.telemetry.track(eventName, Object.assign({ featureId: MODULE_ID }, payload || {})); } } catch (e) { } }
  function _addCleanup(fn) { if (typeof fn === 'function') _state.cleanups.push(fn); }
  function init(ctx) {
    if (_state.initialized && _state.enabled) { return _envelope(true, { alreadyInitialized: true }); }
    try {
      _initPorts(ctx);
      if (config.onInit && typeof config.onInit === 'function') { var customResult = config.onInit(ctx, { addCleanup: _addCleanup, track: _track, envelope: _envelope }); if (customResult && !customResult.ok) { _state.lastError = customResult.errors[0]; _state.errorCount++; return customResult; } }
      _state.initialized = true; _state.enabled = true; _state.initCount++; _state.initTime = Date.now();
      _track('feature:init', { version: VERSION });
      return _envelope(true, { initialized: true, version: VERSION });
    } catch (e) { _state.lastError = { code: 'INIT_ERROR', message: e.message }; _state.errorCount++; return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message }]); }
  }
  function cleanup() {
    if (!_state.initialized) { return _envelope(true, { alreadyCleanedUp: true }); }
    try {
      for (var i = 0; i < _state.cleanups.length; i++) { try { _state.cleanups[i](); } catch (e) { } }
      _state.cleanups = [];
      if (config.onCleanup && typeof config.onCleanup === 'function') { config.onCleanup(); }
      _state.initialized = false; _state.enabled = false;
      _track('feature:cleanup', {});
      return _envelope(true, { cleanedUp: true });
    } catch (e) { return _envelope(false, null, [{ code: 'CLEANUP_ERROR', message: e.message }]); }
  }
  function enable() { if (_state.enabled) return _envelope(true, { alreadyEnabled: true }); _state.enabled = true; _track('feature:enable', {}); return _envelope(true, { enabled: true }); }
  function disable() { if (!_state.enabled) return _envelope(true, { alreadyDisabled: true }); _state.enabled = false; _track('feature:disable', {}); return _envelope(true, { disabled: true }); }
  function healthCheck() {
    var issues = []; var score = 100;
    if (!_state.initialized) { issues.push({ code: 'NOT_INIT', severity: 'crit', message: 'Not initialized' }); score -= 50; }
    if (!_state.enabled) { issues.push({ code: 'DISABLED', severity: 'warn', message: 'Feature disabled' }); score -= 20; }
    if (_state.errorCount > 0) { issues.push({ code: 'HAS_ERRORS', severity: 'warn', message: _state.errorCount + ' errors' }); score -= 10; }
    if (config.onHealthCheck && typeof config.onHealthCheck === 'function') { try { var customHealth = config.onHealthCheck(_state); if (customHealth && customHealth.issues) { issues = issues.concat(customHealth.issues); } if (customHealth && typeof customHealth.scoreAdjust === 'number') { score += customHealth.scoreAdjust; } } catch (e) { } }
    var status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY';
    return { status: status, score: Math.max(0, Math.min(100, score)), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'crit' }, enabled: { ok: _state.enabled, severity: 'warn' } }, issues: issues, metrics: { initCount: _state.initCount, errorCount: _state.errorCount, uptime: _state.initTime ? Date.now() - _state.initTime : 0 }, timestamp: new Date().toISOString() };
  }
  function info() { return _envelope(true, { moduleId: MODULE_ID, version: VERSION, category: config.category || 'general', priority: config.priority || 'normal', capabilities: config.capabilities || {}, initialized: _state.initialized, enabled: _state.enabled, initCount: _state.initCount, errorCount: _state.errorCount, uptime: _state.initTime ? Date.now() - _state.initTime : 0 }); }
  var feature = { id: MODULE_ID, MODULE_ID: MODULE_ID, VERSION: VERSION, version: VERSION, category: config.category || 'general', priority: config.priority || 'normal', dependencies: config.dependencies || [], capabilities: config.capabilities || { singleton: true }, init: init, cleanup: cleanup, enable: enable, disable: disable, healthCheck: healthCheck, info: info, injectPorts: function(ports) { if (ports) { for (var k in ports) { if (k !== '_initialized' && ports.hasOwnProperty(k)) _ports[k] = ports[k]; } } _ports._initialized = true; }, getPorts: function() { return Object.assign({}, _ports); } };
  if (config.methods) { Object.keys(config.methods).forEach(function(k) { if (typeof config.methods[k] === 'function') { feature[k] = config.methods[k]; } }); }
  return feature;
}

// Legacy compatibility: expose createFeature globally (to be removed in v2.0)
if (typeof window !== 'undefined') { window.createFeature = createFeature; }
export { createFeature };
export default createFeature;
