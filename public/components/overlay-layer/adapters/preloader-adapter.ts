// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P21)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.preloader-adapter
// PURPOSE: Overlay Layer - Preloader Adapter v1.5.0-P21
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   PRELOADER_EVENTS, UI_INTENTS from /core/runtime/events/index.js
//   * as Manager from ../core/manager.js
//
// PROVIDES:
//   activate() — exported function
//   deactivate() — exported function
//   isActive() — exported function
//   updatePhase() — exported function
//   connectToPreloader() — exported function
//   disconnect() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   PRELOADER_EVENTS.SHOW
//   PRELOADER_EVENTS.HIDE
//   PRELOADER_EVENTS.PHASE
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { PRELOADER_EVENTS } from '/core/runtime/events/catalog/preloader.events.js';
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import * as Manager from '../core/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '1.5.0-P21';
const MODULE_ID = 'overlay-layer.adapters.preloader-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const PRELOADER_ID = 'system-preloader';
const PRELOADER_PRIORITY = 9500;
let _metrics = { activations: 0, deactivations: 0, currentState: 'inactive' };
let _cleanups: DynObj[] = [];

function _setScrollLock(locked: boolean) { const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } return false; }

function activate(options?: DynObj) {
  if (!options) options = {};
  _metrics.activations++;
  _metrics.currentState = 'active';
  const result = Manager.open({ id: PRELOADER_ID, type: 'preloader', priority: PRELOADER_PRIORITY, blocking: true, content: options.message || 'Carregando...', config: { closable: false, escapable: false, phase: options.phase || 'boot' } });
  _setScrollLock(true);
  return result;
}

function deactivate(reason?: DynObj) {
  if (!reason) reason = 'complete';
  _metrics.deactivations++;
  _metrics.currentState = 'inactive';
  const result = Manager.close(PRELOADER_ID, reason);
  _setScrollLock(false);
  return result;
}

function isActive() { const managerInfo = Manager.info ? Manager.info() : null; return managerInfo && managerInfo.currentStack && managerInfo.currentStack.includes(PRELOADER_ID) ? true : false; }
function updatePhase(phase: DynObj, message: string) { return Manager.open({ id: PRELOADER_ID, type: 'preloader', priority: PRELOADER_PRIORITY, blocking: true, content: message, config: { phase } }); }

function _showHandler() { activate(); }
function _hideHandler() { deactivate(); }
function _phaseHandler(data: DynObj) { updatePhase(data.phase, data.message); }

function connectToPreloader() {
  const eb = _getPort('eventBus');
  if (!eb || !eb.on) return { ok: false, reason: 'EventBus not available' };
  const c1 = eb.on(PRELOADER_EVENTS.SHOW, _showHandler);
  if (typeof c1 === 'function') _cleanups.push(c1);
  else _cleanups.push(() => { if (eb.off) eb.off(PRELOADER_EVENTS.SHOW, _showHandler); });
  const c2 = eb.on(PRELOADER_EVENTS.HIDE, _hideHandler);
  if (typeof c2 === 'function') _cleanups.push(c2);
  else _cleanups.push(() => { if (eb.off) eb.off(PRELOADER_EVENTS.HIDE, _hideHandler); });
  const c3 = eb.on(PRELOADER_EVENTS.PHASE, _phaseHandler);
  if (typeof c3 === 'function') _cleanups.push(c3);
  else _cleanups.push(() => { if (eb.off) eb.off(PRELOADER_EVENTS.PHASE, _phaseHandler); });
  return { ok: true, connected: true };
}

function disconnect() {
  _cleanups.forEach(fn => { try { fn(); } catch (e) {} });
  _cleanups = [];
  return { ok: true };
}

function destroy() {
  disconnect();
  deactivate('destroy');
  _metrics = { activations: 0, deactivations: 0, currentState: 'inactive' };
}

function getMetrics() { return Object.assign({}, _metrics, { preloaderId: PRELOADER_ID, priority: PRELOADER_PRIORITY }); }

function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { managerAvailable: !!Manager, eventBusAvailable: !!(eb && eb.on), portsInitialized: Ports.isInitialized() };
  let passed = 0; for (const k in checks) { if (checks.hasOwnProperty(k) && (checks as DynObj)[k]) passed++; }
  const total = Object.keys(checks).length;
  return { status: passed >= 2 ? (passed === total ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, preloaderId: PRELOADER_ID, priority: PRELOADER_PRIORITY, isActive: isActive(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() }; }

export { activate, deactivate, isActive, updatePhase, connectToPreloader, disconnect, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };

export default { activate, deactivate, isActive, updatePhase, connectToPreloader, disconnect, destroy, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
