// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.icons.search
// PURPOSE: Footer - Icon Search
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
//   render() — exported function
//   setConfig() — exported function
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

const MODULE_ID = 'components.footer.icons.search';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _config = { size: 16, color: 'currentColor', strokeWidth: 2 };

function render(options: Record<string,unknown>) { options = Object.assign({}, _config, options || {}); return `<svg width="${options.size}" height="${options.size}" viewBox="0 0 24 24" fill="none" stroke="${options.color}" stroke-width="${options.strokeWidth}"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`; }

function setConfig(config: Record<string,unknown>) { Object.assign(_config, config); return { ok: true }; }

// @ts-expect-error TS migration - TS2345
function init(ctx: Record<string,unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } } }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, config: _config, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, render, setConfig, healthCheck, info };
export default { MODULE_ID, VERSION, init, render, setConfig, healthCheck, info, injectPorts, getPorts };
