// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P21)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.login-modal-adapter
// PURPOSE: Overlay Layer - Login Modal Adapter v1.5.0-P21
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, LOGIN_MODAL_EVENTS, UI_INTENTS from /core/runtime/events/index.js
//   * as Manager from ../core/manager.js
//
// PROVIDES:
//   open() — exported function
//   close() — exported function
//   isOpen() — exported function
//   connectToLoginModal() — exported function
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
//   LOGIN_MODAL_EVENTS.OPEN
//   LOGIN_MODAL_EVENTS.CLOSE
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.LOGOUT
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, LOGIN_MODAL_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import * as Manager from '../core/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '1.5.0-P21';
const MODULE_ID = 'overlay-layer.adapters.login-modal-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const LOGIN_MODAL_ID = 'login-modal';
const LOGIN_MODAL_PRIORITY = 9000;
let _metrics = { opens: 0, closes: 0, currentState: 'closed' };
let _cleanups: DynObj[] = [];

function _setScrollLock(locked: boolean) { const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode: locked ? 'scroll-lock' : 'scroll-unlock', source: MODULE_ID, timestamp: Date.now() }); return true; } return false; }

function open(options: DynObj) {
  if (!options) options = {};
  _metrics.opens++;
  _metrics.currentState = 'open';
  const result = Manager.open({ id: LOGIN_MODAL_ID, type: 'login-modal', priority: LOGIN_MODAL_PRIORITY, blocking: true, content: 'login-form', config: { closable: options.closable !== undefined ? options.closable : false, escapable: options.escapable !== undefined ? options.escapable : false, reason: options.reason || 'auth-required' } });
  _setScrollLock(true);
  return result;
}

function close(reason: DynObj) {
  if (!reason) reason = 'authenticated';
  _metrics.closes++;
  _metrics.currentState = 'closed';
  const result = Manager.close(LOGIN_MODAL_ID, reason);
  _setScrollLock(false);
  return result;
}

function isOpen() { const managerInfo = Manager.info ? Manager.info() : null; return managerInfo && managerInfo.currentStack && managerInfo.currentStack.includes(LOGIN_MODAL_ID) ? true : false; }

function _openHandler(data: DynObj) { open(data); }
function _closeHandler(data: DynObj) { close(data ? data.reason : undefined); }
function _loginSuccessHandler() { close('authenticated'); }
function _logoutHandler() { open({ reason: 'logout' }); }

function connectToLoginModal() {
  const eb = _getPort('eventBus');
  if (!eb || !eb.on) return { ok: false, reason: 'EventBus not available' };
  const c1 = eb.on(LOGIN_MODAL_EVENTS.OPEN, _openHandler);
  if (typeof c1 === 'function') _cleanups.push(c1);
  else _cleanups.push(() => { if (eb.off) eb.off(LOGIN_MODAL_EVENTS.OPEN, _openHandler); });
  const c2 = eb.on(LOGIN_MODAL_EVENTS.CLOSE, _closeHandler);
  if (typeof c2 === 'function') _cleanups.push(c2);
  else _cleanups.push(() => { if (eb.off) eb.off(LOGIN_MODAL_EVENTS.CLOSE, _closeHandler); });
  const c3 = eb.on(AUTH_EVENTS.LOGIN_SUCCESS, _loginSuccessHandler);
  if (typeof c3 === 'function') _cleanups.push(c3);
  else _cleanups.push(() => { if (eb.off) eb.off(AUTH_EVENTS.LOGIN_SUCCESS, _loginSuccessHandler); });
  const c4 = eb.on(AUTH_EVENTS.LOGOUT, _logoutHandler);
  if (typeof c4 === 'function') _cleanups.push(c4);
  else _cleanups.push(() => { if (eb.off) eb.off(AUTH_EVENTS.LOGOUT, _logoutHandler); });
  return { ok: true, connected: true };
}

function disconnect() {
  _cleanups.forEach(fn => { try { fn(); } catch (e) {} });
  _cleanups = [];
  return { ok: true };
}

function destroy() {
  disconnect();
  close('destroy');
  _metrics = { opens: 0, closes: 0, currentState: 'closed' };
}

function getMetrics() { return Object.assign({}, _metrics, { loginModalId: LOGIN_MODAL_ID, priority: LOGIN_MODAL_PRIORITY }); }

function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { managerAvailable: !!Manager, eventBusAvailable: !!(eb && eb.on), portsInitialized: Ports.isInitialized() };
  let passed = 0; for (const k in checks) { if (checks.hasOwnProperty(k) && (checks as DynObj)[k]) passed++; }
  const total = Object.keys(checks).length;
  return { status: passed >= 2 ? (passed === total ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, loginModalId: LOGIN_MODAL_ID, priority: LOGIN_MODAL_PRIORITY, isOpen: isOpen(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() }; }

export { open, close, isOpen, connectToLoginModal, disconnect, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };

export default { open, close, isOpen, connectToLoginModal, disconnect, destroy, getMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
