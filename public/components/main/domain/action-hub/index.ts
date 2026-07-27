// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.domain.action-hub
// PURPOSE: Main - Action Hub
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createActionHub() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   registerAction() — exported function
//   unregisterAction() — exported function
//   execute() — exported function
//   getAction() — exported function
//   listActions() — exported function
//   getHistory() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.domain.action-hub';
const VERSION = '2.4.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, actions: {} as Record<string, { handler: (...args: unknown[]) => unknown; description: string; permissions: unknown[]; registeredAt: number }>, history: [] as Record<string, unknown>[], maxHistory: 50 };
const _metrics = { registered: 0, executed: 0, errors: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

// @ts-expect-error TS migration - TS2740
function registerAction(actionId: string, handler: (...args: unknown[]) => void, options: Record<string, unknown>) { _metrics.registered++; options = options || {}; _state.actions[actionId] = { handler, description: options.description || '', permissions: options.permissions || [], registeredAt: Date.now() }; _track('action-hub:registered', { actionId }); return { ok: true, actionId }; }
function unregisterAction(actionId: string) { if (_state.actions[actionId]) { delete _state.actions[actionId]; return { ok: true }; } return { ok: false, reason: 'Not found' }; }

function execute(actionId: string, payload: Record<string, unknown>) { const action = _state.actions[actionId]; if (!action) { _metrics.errors++; return Promise.reject(new Error(`Action not found: ${actionId}`)); } const startTime = Date.now(); _emit(PERSISTENCE_EVENTS.ACTION_HUB_EXECUTING, { actionId, payload }); return Promise.resolve().then(() => action.handler(payload)).then(result => { const latency = Date.now() - startTime; _metrics.executed++; _state.history.unshift({ actionId, payload, result, latency, timestamp: startTime }); if (_state.history.length > _state.maxHistory) _state.history.pop(); _emit(PERSISTENCE_EVENTS.ACTION_HUB_EXECUTED, { actionId, latency }); _track('action-hub:executed', { actionId, latency }); return { ok: true, result, latency }; }).catch(error => { _metrics.errors++; _emit(PERSISTENCE_EVENTS.ACTION_HUB_ERROR, { actionId, error: error.message }); _track('action-hub:error', { actionId, error: error.message }); throw error; }); }

function getAction(actionId: string) { return _state.actions[actionId] || null; }
function listActions() { return Object.keys(_state.actions).map(id => ({
  id,
  description: _state.actions[id].description
})); }
function getHistory(limit: number) { return _state.history.slice(0, limit || 20); }

// @ts-expect-error TS migration - TS2345
function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); _state.initialized = true; _track('action-hub:init', { version: VERSION }); return { ok: true, version: VERSION }; }
function cleanup() { _state.actions = {}; _state.history = []; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, actionsCount: Object.keys(_state.actions).length, historySize: _state.history.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// Factory function for initializer.js compatibility
// Does NOT call init() automatically - let caller do it
export function createActionHub(options: Record<string, unknown>) {
  options = options || {};
  // Store options for later init
  const _options = options;
  return {
    init() { return init(_options); },
    registerAction,
    unregisterAction,
    execute,
    getAction,
    listActions,
    getHistory,
    cleanup,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}

export { MODULE_ID, VERSION, init, cleanup, registerAction, unregisterAction, execute, getAction, listActions, getHistory, healthCheck, info };
export default { MODULE_ID, VERSION, createActionHub, init, cleanup, registerAction, unregisterAction, execute, getAction, listActions, getHistory, healthCheck, info, injectPorts, getPorts };
