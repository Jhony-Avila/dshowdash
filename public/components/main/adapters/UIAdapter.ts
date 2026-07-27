// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.ui
// PURPOSE: Main - UI Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createUIAdapter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   showToast() — exported function
//   showModal() — exported function
//   showConfirm() — exported function
//   showLoading() — exported function
//   hideLoading() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_EVENTS.MODAL
//   UI_EVENTS.TOAST
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'components.main.adapters.ui';
const VERSION = '2.3.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { toasts: 0, modals: 0, confirms: 0 };

function showToast(message: string, options: Record<string, unknown> = {}) { _metrics.toasts++; options = options || {}; const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showToast) return overlay.showToast(message, options); const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_EVENTS.TOAST, { message, options }); return { ok: true, via: 'eventBus' }; } return { ok: false, reason: 'No UI handler' }; }

function showModal(config: Record<string, unknown>) { _metrics.modals++; const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showModal) return overlay.showModal(config); const eb = _getPort('eventBus'); if (eb && eb.emit) { eb.emit(UI_EVENTS.MODAL, config); return { ok: true, via: 'eventBus' }; } return { ok: false, reason: 'No modal handler' }; }

function showConfirm(message: string, options: Record<string, unknown> = {}) { _metrics.confirms++; const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showConfirm) return overlay.showConfirm(message, options); return Promise.resolve(confirm(message)); }

function showLoading(message: string) { const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showLoading) return overlay.showLoading(message); return { ok: false, reason: 'No loading handler' }; }

function hideLoading() { const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.close) return overlay.close('loading'); return { ok: false }; }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { const hasOverlay = !!(_getPort('overlayKernel') || _getPort('overlayBridge')); return { status: hasOverlay ? 'HEALTHY' : 'DEGRADED', score: hasOverlay ? 100 : 70, moduleId: MODULE_ID, version: VERSION, checks: { hasOverlay: { ok: hasOverlay, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createUIAdapter(options: Record<string, unknown>) { options = options || {}; init(options); return { showToast, showModal, showConfirm, showLoading, hideLoading, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, showToast, showModal, showConfirm, showLoading, hideLoading, healthCheck, info };
export default { MODULE_ID, VERSION, createUIAdapter, init, showToast, showModal, showConfirm, showLoading, hideLoading, healthCheck, info, injectPorts, getPorts };
