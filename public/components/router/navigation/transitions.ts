// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.navigation.transitions
// PURPOSE: Router Navigation - Page Transitions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   TYPES — exported value
//   init() — exported function
//   setConfig() — exported function
//   getConfig() — exported function
//   beforeLeave() — exported function
//   afterEnter() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.navigation.transitions';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _config = { enabled: true, duration: 200, type: 'fade' };
const _metrics = { transitions: 0, skipped: 0 };

const TYPES = { FADE: 'fade', SLIDE: 'slide', NONE: 'none' };

function setConfig(config: Record<string, unknown>) { Object.assign(_config, config); return { ok: true }; }
function getConfig() { return Object.assign({}, _config); }

function beforeLeave(element: HTMLElement) { if (!_config.enabled || !element) { _metrics.skipped++; return Promise.resolve(); } _metrics.transitions++; return new Promise(resolve => { element.style.transition = `opacity ${_config.duration}ms ease-out`; element.style.opacity = '0'; setTimeout(resolve, _config.duration); }); }


// @ts-expect-error TS migration - TS2794
function afterEnter(element: HTMLElement) { if (!_config.enabled || !element) return Promise.resolve(); return new Promise(resolve => { element.style.opacity = '0'; element.style.transition = `opacity ${_config.duration}ms ease-in`; requestAnimationFrame(() => { element.style.opacity = '1'; setTimeout(() => { element.style.transition = ''; resolve(); }, _config.duration); }); }); }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.duration) _config.duration = ctx.duration as number; if (ctx && ctx.enabled !== undefined) _config.enabled = Boolean(ctx.enabled); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { enabled: { ok: _config.enabled, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, config: _config, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, TYPES, init, setConfig, getConfig, beforeLeave, afterEnter, healthCheck, info };
export default { MODULE_ID, VERSION, TYPES, init, setConfig, getConfig, beforeLeave, afterEnter, healthCheck, info, injectPorts, getPorts };
