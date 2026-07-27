// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.telemetry.tracker
// PURPOSE: Panel-05 Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   track() — exported function
//   trackAction() — exported function
//   trackError() — exported function
//   trackApi() — exported function
//   trackRender() — exported function
//   startTimer() — exported function
//   endTimer() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   getErrors() — exported function
//   clearErrors() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   ... and 4 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PANEL_EVENTS.PANEL_05_TELEMETRY
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

const MODULE_ID = 'panel-05.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _metrics: { mounts: number; unmounts: number; refreshes: number; apiCalls: number; apiErrors: number; renderCycles: number; userActions: number; avgRefreshTime: number; avgApiTime: number; lastActivity: number | null; errors: Array<Record<string, unknown>> } = { mounts: 0, unmounts: 0, refreshes: 0, apiCalls: 0, apiErrors: 0, renderCycles: 0, userActions: 0, avgRefreshTime: 0, avgApiTime: 0, lastActivity: null, errors: [] };
const _timers = new Map();
const _config = { enabled: true, maxErrors: 50, emitToEventBus: true, logLevel: 'info' };

function startTimer(name: string) { _timers.set(name, performance.now()); return name; }
function endTimer(name: string) { const start = _timers.get(name); if (!start) return 0; const duration = performance.now() - start; _timers.delete(name); return duration; }

function track(event: string, data: Record<string, unknown> = {}) {
    if (!_config.enabled) return;
    _initPorts();
    _metrics.lastActivity = Date.now();
    const payload = Object.assign({ event, moduleId: MODULE_ID, timestamp: Date.now() }, data);
    switch (event) {
        case 'mount': _metrics.mounts++; break;
        case 'unmount': _metrics.unmounts++; break;
        case 'refresh': case 'refresh:done': _metrics.refreshes++; if (data.duration) { _metrics.avgRefreshTime = (_metrics.avgRefreshTime * (_metrics.refreshes - 1) + Number(data.duration)) / _metrics.refreshes; } break;
        case 'api:call': _metrics.apiCalls++; break;
        case 'api:success': if (data.duration) { const apiSuccessCount = _metrics.apiCalls - _metrics.apiErrors; _metrics.avgApiTime = (_metrics.avgApiTime * (apiSuccessCount - 1) + Number(data.duration)) / apiSuccessCount; } break;
        case 'api:error': _metrics.apiErrors++; break;
        case 'render': _metrics.renderCycles++; break;
        case 'action': case 'user:action': _metrics.userActions++; break;
        case 'error': _addError(data); break;
    }
    if (_config.emitToEventBus) { const eventBus = _getPort('eventBus'); if (eventBus?.emit) eventBus.emit(PANEL_EVENTS.PANEL_05_TELEMETRY, payload); }
    const logger = _getPort('logger');
    if (_config.logLevel === 'debug' && logger?.debug) logger.debug('[panel-05:telemetry]', event, data);
    return payload;
}

function _addError(data: Record<string, unknown>) { _metrics.errors.push({ timestamp: Date.now(), message: data.message || data.error || 'Unknown error', stack: data.stack, context: data.context }); if (_metrics.errors.length > _config.maxErrors) _metrics.errors = _metrics.errors.slice(-_config.maxErrors); }

function trackAction(action: string, data: Record<string, unknown> = {}) { return track('user:action', Object.assign({ action }, data)); }
function trackError(error: any, context: Record<string, unknown> = {}) { return track('error', { message: error?.message || String(error), stack: error?.stack || null, context }); }
function trackApi(endpoint: string, success: boolean, duration: number, data: Record<string, unknown> = {}) { const event = success ? 'api:success' : 'api:error'; return track(event, Object.assign({ endpoint, duration }, data)); }
function trackRender(component: string, duration: number) { return track('render', { component, duration }); }

function getMetrics() { return Object.assign({}, _metrics, { uptime: _metrics.lastActivity ? Date.now() - _metrics.lastActivity : 0, errorRate: _metrics.apiCalls > 0 ? (_metrics.apiErrors / _metrics.apiCalls) : 0 }); }
function resetMetrics() { _metrics = { mounts: 0, unmounts: 0, refreshes: 0, apiCalls: 0, apiErrors: 0, renderCycles: 0, userActions: 0, avgRefreshTime: 0, avgApiTime: 0, lastActivity: null as number | null, errors: [] }; return { ok: true }; }
function getErrors(limit = 10) { return _metrics.errors.slice(-limit); }
function clearErrors() { const count = _metrics.errors.length; _metrics.errors = []; return { ok: true, cleared: count }; }
function getConfig() { return Object.assign({}, _config); }
function setConfig(newConfig: Record<string, unknown>) { Object.assign(_config, newConfig); return { ok: true, config: Object.assign({}, _config) }; }

function healthCheck() {
    const checks = { enabled: _config.enabled, lowErrorRate: _metrics.apiCalls === 0 || (_metrics.apiErrors / _metrics.apiCalls) < 0.2, recentActivity: !_metrics.lastActivity || (Date.now() - _metrics.lastActivity) < 300000, errorLogNotFull: _metrics.errors.length < _config.maxErrors * 0.8 };
    const values = Object.values(checks);
    const passed = values.filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), metrics: getMetrics(), recentErrors: getErrors(5), timestamp: Date.now() }; }

export { track, trackAction, trackError, trackApi, trackRender, startTimer, endTimer, getMetrics, resetMetrics, getErrors, clearErrors, getConfig, setConfig, healthCheck, info, VERSION, MODULE_ID };
export default { track, trackAction, trackError, trackApi, trackRender, startTimer, endTimer, getMetrics, resetMetrics, getErrors, clearErrors, getConfig, setConfig, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
