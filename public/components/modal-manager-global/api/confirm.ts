// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.modal-manager-global.api.confirm
// PURPOSE: Modal Manager Global - Confirm API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   confirm() — exported function
//   confirmDanger() — exported function
//   confirmWarning() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.api
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.modal-manager-global.api.confirm';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { confirms: 0, accepted: 0, rejected: 0 };

function confirm(title: string | null, message: string, options: Record<string, unknown>) { _metrics.confirms++; options = options || {}; return new Promise(resolve => { const overlay = _getPort('overlayKernel') || _getPort('overlayBridge'); if (overlay && overlay.showConfirm) { overlay.showConfirm(message, options).then((result: boolean) => { if (result) _metrics.accepted++; else _metrics.rejected++; resolve(result); }); return; } const result = window.confirm(message); if (result) _metrics.accepted++; else _metrics.rejected++; resolve(result); }); }

function confirmDanger(message: string, options: Record<string, unknown>) { return confirm(null, message, Object.assign({ type: 'danger', confirmText: options && options.confirmText || 'Excluir', cancelText: options && options.cancelText || 'Cancelar' }, options)); }

function confirmWarning(message: string, options: Record<string, unknown>) { return confirm(null, message, Object.assign({ type: 'warning', confirmText: options && options.confirmText || 'Confirmar' }, options)); }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasOverlay: { ok: !!(_getPort('overlayKernel') || _getPort('overlayBridge')), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, confirm, confirmDanger, confirmWarning, healthCheck, info };
export default { MODULE_ID, VERSION, init, confirm, confirmDanger, confirmWarning, healthCheck, info, injectPorts, getPorts };
