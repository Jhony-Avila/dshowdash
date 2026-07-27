// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin.core.helpers
// PURPOSE: Panel Session Admin - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID as CONST_MODULE_ID from ./constants.js
//
// PROVIDES:
//   log() — exported function
//   emit() — exported function
//   showToast() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
//   intent
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { MODULE_ID as CONST_MODULE_ID } from './constants.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-session-admin.core.helpers';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _emitIntent(intent: string, data?: Record<string, unknown>) {
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}

function log(level: string) {
  _initPorts();
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${CONST_MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(...[prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[prefix].concat(args)); return; }
  if (logger.debug) logger.debug(...[prefix].concat(args));
}

function emit(event: string, data: Record<string, unknown> = {}) {
  _initPorts();
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(event, Object.assign({}, data, { source: CONST_MODULE_ID, timestamp: Date.now() })); }
}

function showToast(message: string, type: string = 'success') {
  _initPorts();
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
  const toast = _getPort('toast');
  if (toast && toast.show) { toast.show(message, type); }
}

function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), usingP18Intents: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true } }; }

export { log, emit, showToast, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export default { log, emit, showToast };
