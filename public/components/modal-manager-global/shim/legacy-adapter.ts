// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.shim.legacy-adapter
// PURPOSE: Modal Manager Global - Legacy Adapter Shim
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   MODAL_EVENTS — exported value
//   init() — exported function
//   adaptLegacyConfig() — exported function
//   showLegacy() — exported function
//   hideLegacy() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   MODAL_EVENTS.SHOW
//   MODAL_EVENTS.HIDE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.shim
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.modal-manager-global.shim.legacy-adapter';
const VERSION = '2.2.0-P18EC';

const MODAL_EVENTS = { SHOW: 'modal:show', HIDE: 'modal:hide' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { legacyCalls: 0, adaptations: 0 };

function adaptLegacyConfig(legacyConfig: Record<string, unknown>) { _metrics.adaptations++; return { id: legacyConfig.id || `modal-${Date.now()}`, title: legacyConfig.title || legacyConfig.header, content: legacyConfig.content || legacyConfig.body, type: legacyConfig.type || 'default', closable: legacyConfig.closable !== false, backdrop: legacyConfig.backdrop !== false, onClose: legacyConfig.onClose || legacyConfig.callback }; }

function showLegacy(config: Record<string, unknown>) { _metrics.legacyCalls++; const adapted = adaptLegacyConfig(config); const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showModal) return overlay.showModal(adapted); const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(MODAL_EVENTS.SHOW, adapted); return { ok: true, via: 'eventBus' }; } return { ok: false, reason: 'No modal handler' }; }

function hideLegacy(id: string) { _metrics.legacyCalls++; const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.close) return overlay.close(id); const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(MODAL_EVENTS.HIDE, { id }); return { ok: true }; } return { ok: false }; }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, MODAL_EVENTS, init, adaptLegacyConfig, showLegacy, hideLegacy, healthCheck, info };
export default { MODULE_ID, VERSION, MODAL_EVENTS, init, adaptLegacyConfig, showLegacy, hideLegacy, healthCheck, info, injectPorts, getPorts };
