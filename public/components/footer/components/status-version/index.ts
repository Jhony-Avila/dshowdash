// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-version
// PURPOSE: Footer - Status Version
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
//   setVersion() — exported function
//   getVersion() — exported function
//   setBuildDate() — exported function
//   getBuildDate() — exported function
//   setEnvironment() — exported function
//   getEnvironment() — exported function
//   getVersionInfo() — exported function
//   render() — exported function
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

const MODULE_ID = 'components.footer.status-version';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, appVersion: '3.0.0', buildDate: (null as unknown|null), environment: 'production' };
const _metrics = { checks: 0 };

// @ts-expect-error TS migration - TS2322
function setVersion(version: unknown) { _state.appVersion = version; return { ok: true }; }
function getVersion() { return _state.appVersion; }
function setBuildDate(date: unknown) { _state.buildDate = date; return { ok: true }; }
function getBuildDate() { return _state.buildDate; }
// @ts-expect-error TS migration - TS2322
function setEnvironment(env: unknown) { _state.environment = env; return { ok: true }; }
function getEnvironment() { return _state.environment; }

function getVersionInfo() { _metrics.checks++; return { version: _state.appVersion, buildDate: _state.buildDate, environment: _state.environment }; }
function render() { return `<span class="footer-version">v${_state.appVersion}</span>`; }

// @ts-expect-error TS migration - TS2345, TS2322
function init(ctx: Record<string,unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); if (ctx && ctx.version) _state.appVersion = ctx.version; _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, appVersion: _state.appVersion, environment: _state.environment, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, setVersion, getVersion, setBuildDate, getBuildDate, setEnvironment, getEnvironment, getVersionInfo, render, healthCheck, info };
export default { MODULE_ID, VERSION, init, setVersion, getVersion, setBuildDate, getBuildDate, setEnvironment, getEnvironment, getVersionInfo, render, healthCheck, info, injectPorts, getPorts };
