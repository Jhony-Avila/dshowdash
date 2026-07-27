// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-lang.api.fetch
// PURPOSE: Footer - Status Lang API Fetch
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
//   fetchLanguageConfig() — exported function
//   saveLanguagePreference() — exported function
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

const MODULE_ID = 'components.footer.status-lang.api.fetch';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { fetches: 0 };

function fetchLanguageConfig() { _metrics.fetches++; return Promise.resolve({ ok: true, config: { defaultLang: 'pt-BR', available: ['pt-BR', 'en-US', 'es-ES'] } }); }

function saveLanguagePreference(lang: Record<string,unknown>) { return Promise.resolve({ ok: true, lang }); }

// @ts-expect-error TS migration - TS2345
function init(ctx: Record<string,unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, fetchLanguageConfig, saveLanguagePreference, healthCheck, info };
function destroy() { }

export default { MODULE_ID, VERSION, init, fetchLanguageConfig, saveLanguagePreference, healthCheck, info, injectPorts, getPorts , destroy };
