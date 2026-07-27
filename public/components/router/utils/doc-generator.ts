// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.1-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.utils.doc-generator
// PURPOSE: Router Utils - Documentation Generator
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
//   generateRouteDoc() — exported function
//   generateRoutesDoc() — exported function
//   generateMarkdown() — exported function
//   generateJSON() — exported function
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

const MODULE_ID = 'components.router.utils.doc-generator';
const VERSION = '2.1.1-P17WI';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false };
const _metrics = { generated: 0 };

function generateRouteDoc(route: Record<string, unknown>) { const doc = { pattern: route.pattern || route.path, name: route.name || 'unnamed', method: route.method || 'GET', params: [] as Record<string, unknown>[], query: [] as Record<string, unknown>[], description: route.description || '', meta: route.meta || {} }; const paramMatches = ((route.pattern || '') as string).match(/:\w+/g) || []; for (let i = 0; i < paramMatches.length; i++) { const param = paramMatches[i].substring(1); const isOptional = param.endsWith('?'); const isCatchAll = param.endsWith('*'); doc.params.push({ name: isOptional || isCatchAll ? param.slice(0, -1) : param, required: !isOptional, catchAll: isCatchAll }); } return doc; }

function generateRoutesDoc(routes: Record<string, unknown>[]) { _metrics.generated++; return routes.map(generateRouteDoc); }

function generateMarkdown(routes: Record<string, unknown>[]) { const docs = generateRoutesDoc(routes); let md = '# Router Documentation\n\n'; md += `Generated: ${new Date().toISOString()}\n\n`; md += '## Routes\n\n'; for (let i = 0; i < docs.length; i++) { const d = docs[i]; md += `### ${d.name}\n\n`; md += `**Pattern:** \`${d.pattern}\`\n\n`; if (d.description) md += `${d.description}\n\n`; if (d.params.length > 0) { md += '**Parameters:**\n'; for (let j = 0; j < d.params.length; j++) { const p = d.params[j]; md += `- \`${p.name}\`${p.required ? ' (required)' : ' (optional)'}${p.catchAll ? ' (catch-all)' : ''}\n`; } md += '\n'; } md += '---\n\n'; } return md; }

function generateJSON(routes: Record<string, unknown>[]) { return JSON.stringify(generateRoutesDoc(routes), null, 2); }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, generateRouteDoc, generateRoutesDoc, generateMarkdown, generateJSON, healthCheck, info };
export default { MODULE_ID, VERSION, init, generateRouteDoc, generateRoutesDoc, generateMarkdown, generateJSON, healthCheck, info, injectPorts, getPorts };
