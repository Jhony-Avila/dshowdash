// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.core.keyboard
// PURPOSE: Modal Manager Global - Keyboard Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   enable() — exported function
//   disable() — exported function
//   setEscapeToClose() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   document.addEventListener
//   global.core
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'components.modal-manager-global.core.keyboard';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, enabled: true, escapeToClose: true };
let _cleanup: (() => void) | null = null;
const _metrics = { escapes: 0, trapped: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function _handleKeydown(event: KeyboardEvent) { if (!_state.enabled) return; if (event.key === 'Escape' && _state.escapeToClose) { _metrics.escapes++; _emit(UI_EVENTS.MODAL_ESCAPE, {}); event.preventDefault(); } if (event.key === 'Tab') { _metrics.trapped++; } }

function enable() { _state.enabled = true; return { ok: true }; }
function disable() { _state.enabled = false; return { ok: true }; }
function setEscapeToClose(value: boolean) { _state.escapeToClose = value; return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.escapeToClose !== undefined) _state.escapeToClose = ctx.escapeToClose as boolean; if (typeof document !== 'undefined') { document.addEventListener('keydown', _handleKeydown); _cleanup = () => { document.removeEventListener('keydown', _handleKeydown); }; } _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { if (_cleanup) { _cleanup(); _cleanup = null; } _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, enabled: { ok: _state.enabled, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, enabled: _state.enabled, escapeToClose: _state.escapeToClose, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, enable, disable, setEscapeToClose, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, enable, disable, setEscapeToClose, healthCheck, info, injectPorts, getPorts };
