// ═════════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═════════════════════════════════════════════════════════════════
// MODULE: header/core/orchestrator-adapter
// PURPOSE: Bridges the Header with the platform Orchestrator,
//          listening to orchestrator events and sending header
//          commands via eventBus or direct orchestrator reference.
// ─────────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init(orchestratorRef?) — initialize adapter
//   sendCommand(command, payload) — send command to orchestrator
//   requestLayout / requestRefresh / notifyReady / notifyError
//   notifyState / requestNavigation / requestModal
//   onOrchestratorEvent(type, callback) — subscribe to events
//   getOrchestratorState() / isOrchestratorAvailable()
//   cleanup() / getMetrics() / resetMetrics()
//   healthCheck() / info()
//   ORCHESTRATOR_EVENTS / HEADER_COMMANDS — constants
//   injectPorts(p) / getPorts()
// LISTENS (eventos):
//   orchestrator:layout:change — layout updates
//   orchestrator:theme:change — theme updates
//   orchestrator:route:change — route updates
//   orchestrator:user:change — user updates
//   orchestrator:permissions:change — permission updates
//   orchestrator:config:update — config updates
//   orchestrator:refresh:request — refresh requests
//   orchestrator:visibility:change — visibility updates
// EMITS (eventos):
//   header:request:layout — request layout change
//   header:request:refresh — request refresh
//   header:notify:ready — notify header is ready
//   header:notify:error — notify header error
//   header:notify:state — notify header state
//   header:request:navigation — request navigation
//   header:request:modal — request modal
// WINDOW ACCESS:
//   (window as any).Orchestrator — primary orchestrator lookup
//   (window as any).AppOrchestrator — fallback orchestrator lookup
//   (window as any).appShell.orchestrator — secondary fallback lookup
// ═════════════════════════════════════════════════════════════════
// Header - Orchestrator Adapter
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.1.0 - healthCheck ajustado para orchestrator indisponível
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/orchestrator-adapter';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const ORCHESTRATOR_EVENTS = { LAYOUT_CHANGE: 'orchestrator:layout:change', THEME_CHANGE: 'orchestrator:theme:change', ROUTE_CHANGE: 'orchestrator:route:change', USER_CHANGE: 'orchestrator:user:change', PERMISSIONS_CHANGE: 'orchestrator:permissions:change', CONFIG_UPDATE: 'orchestrator:config:update', REFRESH_REQUEST: 'orchestrator:refresh:request', VISIBILITY_CHANGE: 'orchestrator:visibility:change' };
const HEADER_COMMANDS = { REQUEST_LAYOUT: 'header:request:layout', REQUEST_REFRESH: 'header:request:refresh', NOTIFY_READY: 'header:notify:ready', NOTIFY_ERROR: 'header:notify:error', NOTIFY_STATE: 'header:notify:state', REQUEST_NAVIGATION: 'header:request:navigation', REQUEST_MODAL: 'header:request:modal' };

let _initialized = false;
let _orchestrator: unknown = null;
// @ts-expect-error strict migration — TS7034
let _listeners = [];
// @ts-expect-error strict migration — TS7034
let _cleanups = [];
// @ts-expect-error strict migration — TS7034
let _pendingCommands = [];
let _metrics = { eventsReceived: 0, commandsSent: 0, errors: 0, lastEventAt: (null as unknown|null), lastCommandAt: (null as unknown|null) };

function init(orchestratorRef: unknown) {
  _initPorts();
  _orchestrator = orchestratorRef || _findOrchestrator();
  _setupEventListeners();
  _initialized = true;
  _processPendingCommands();
  _log('info', 'OrchestratorAdapter inicializado');
  sendCommand(HEADER_COMMANDS.NOTIFY_READY, { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
}

function _findOrchestrator() { if ((window as any).Orchestrator) return (window as any).Orchestrator; if ((window as any).AppOrchestrator) return (window as any).AppOrchestrator; if ((window as any).appShell && (window as any).appShell.orchestrator) return (window as any).appShell.orchestrator; return null; }

function _setupEventListeners() {
  const eventBus = _getPort('eventBus');
  if (!eventBus) { _log('warn', 'EventBus nao disponivel'); return; }
  Object.keys(ORCHESTRATOR_EVENTS).forEach(key => {
    const eventName = (ORCHESTRATOR_EVENTS as Record<string,unknown>)[key];
    const handler = (data: Record<string,unknown>) => { _metrics.eventsReceived++; _metrics.lastEventAt = Date.now(); _handleOrchestratorEvent(key, data); };
    if (eventBus.on) { const cleanup = eventBus.on(eventName, handler); if (cleanup) _cleanups.push(cleanup); }
  });
  _log('debug', 'Listeners configurados para', Object.keys(ORCHESTRATOR_EVENTS).length, 'eventos');
}

function _handleOrchestratorEvent(eventType: string, data: Record<string,unknown>) {
  _log('debug', 'Evento recebido:', eventType, data);
  switch (eventType) {
    case 'LAYOUT_CHANGE': _notifyListeners('layout', data); break;
    case 'THEME_CHANGE': _notifyListeners('theme', data); break;
    case 'ROUTE_CHANGE': _notifyListeners('route', data); break;
    case 'USER_CHANGE': _notifyListeners('user', data); break;
    case 'PERMISSIONS_CHANGE': _notifyListeners('permissions', data); break;
    case 'CONFIG_UPDATE': _notifyListeners('config', data); break;
    case 'REFRESH_REQUEST': _notifyListeners('refresh', data); break;
    case 'VISIBILITY_CHANGE': _notifyListeners('visibility', data); break;
    default: _notifyListeners('unknown', { type: eventType, data });
  }
}

function sendCommand(command: string, payload: Record<string,unknown>) {
  if (!_initialized) { _pendingCommands.push({ command, payload }); _log('debug', 'Comando enfileirado (nao inicializado):', command); return false; }
  _metrics.commandsSent++;
  _metrics.lastCommandAt = Date.now();
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(command, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, payload)); _log('debug', 'Comando enviado:', command); return true; }
  // @ts-expect-error TS migration - TS2339
  if (_orchestrator && typeof _orchestrator.handleCommand === 'function') { try { _orchestrator.handleCommand(command, payload); _log('debug', 'Comando enviado via orchestrator:', command); return true; } catch (e: any) { _metrics.errors++; _log('error', 'Erro ao enviar comando:', e.message); return false; } }
  _log('warn', 'Nenhum canal disponivel para enviar comando:', command);
  return false;
}

// @ts-expect-error strict migration — TS7005
function _processPendingCommands() { if (_pendingCommands.length === 0) return; _pendingCommands.forEach(cmd => { sendCommand(cmd.command, cmd.payload); }); _pendingCommands = []; _log('debug', 'Comandos pendentes processados'); }
// @ts-expect-error strict migration — TS7005
function _notifyListeners(type: string, data: Record<string,unknown>) { _listeners.forEach(listener => { if (listener.type === type || listener.type === '*') { try { listener.callback(data); } catch (e: any) { _log('error', 'Listener error:', e.message); } } }); }

function requestLayout(layout: unknown) { return sendCommand(HEADER_COMMANDS.REQUEST_LAYOUT, { layout }); }
function requestRefresh(options: Record<string,unknown>) { return sendCommand(HEADER_COMMANDS.REQUEST_REFRESH, options || {}); }
// @ts-expect-error TS migration - TS2345
function notifyReady(info: unknown) { return sendCommand(HEADER_COMMANDS.NOTIFY_READY, info || {}); }
function notifyError(error: unknown) { return sendCommand(HEADER_COMMANDS.NOTIFY_ERROR, { error, timestamp: Date.now() }); }
function notifyState(state: Record<string,unknown>) { return sendCommand(HEADER_COMMANDS.NOTIFY_STATE, { state }); }
function requestNavigation(route: string, options: Record<string,unknown>) { return sendCommand(HEADER_COMMANDS.REQUEST_NAVIGATION, { route, options }); }
function requestModal(modalId: string, options: Record<string,unknown>) { return sendCommand(HEADER_COMMANDS.REQUEST_MODAL, { modalId, options }); }

// @ts-expect-error strict migration — TS7005
function onOrchestratorEvent(type: string, callback: Function) { if (typeof callback !== 'function') return () => {}; const listener = { type, callback }; _listeners.push(listener); return () => { const idx = _listeners.indexOf(listener); if (idx > -1) _listeners.splice(idx, 1); }; }
// @ts-expect-error TS migration - TS2339
function getOrchestratorState() { if (_orchestrator && typeof _orchestrator.getState === 'function') { return _orchestrator.getState(); } return null; }
function isOrchestratorAvailable() { return !!_orchestrator || !!_getPort('eventBus'); }

// @ts-expect-error strict migration — TS7005
function cleanup() { _cleanups.forEach(fn => { try { fn(); } catch (e: any) {} }); _cleanups = []; _listeners = []; _initialized = false; _orchestrator = null; _log('info', 'Cleanup concluido'); }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { eventsReceived: 0, commandsSent: 0, errors: 0, lastEventAt: null, lastCommandAt: null }; }

function healthCheck() {
  _initPorts();
  const checks = { initialized: _initialized, orchestratorAvailable: isOrchestratorAvailable(), hasListeners: _listeners.length > 0 || _metrics.commandsSent > 0, lowErrorRate: _metrics.commandsSent === 0 || (_metrics.errors / _metrics.commandsSent) < 0.1, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, orchestratorAvailable: isOrchestratorAvailable(), eventsListening: Object.keys(ORCHESTRATOR_EVENTS), commandsAvailable: Object.keys(HEADER_COMMANDS), listenersCount: _listeners.length, metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { init, sendCommand, requestLayout, requestRefresh, notifyReady, notifyError, notifyState, requestNavigation, requestModal, onOrchestratorEvent, getOrchestratorState, isOrchestratorAvailable, cleanup, getMetrics, resetMetrics, healthCheck, info, ORCHESTRATOR_EVENTS, HEADER_COMMANDS };
export default { VERSION, MODULE_ID, init, sendCommand, requestLayout, requestRefresh, notifyReady, notifyError, onOrchestratorEvent, isOrchestratorAvailable, cleanup, healthCheck, info };
