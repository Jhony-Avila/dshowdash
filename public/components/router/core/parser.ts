// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.core.parser
// PURPOSE: Router Core - URL Parser
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   URLParser — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   parseHash() — exported function
//   parseRoute() — exported function
//   buildPath() — exported function
//   buildQuery() — exported function
//   buildHash() — exported function
//   normalize() — exported function
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

const MODULE_ID = 'components.router.core.parser';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { parses: 0, builds: 0, errors: 0 };

function parseHash(hash: string) { _metrics.parses++; if (!hash) return { path: '', params: {}, query: {}, fragment: '' }; let cleanHash = hash.charAt(0) === '#' ? hash.substring(1) : hash; const fragmentIndex = cleanHash.indexOf('#'); let fragment = ''; if (fragmentIndex >= 0) { fragment = cleanHash.substring(fragmentIndex + 1); cleanHash = cleanHash.substring(0, fragmentIndex); } const queryIndex = cleanHash.indexOf('?'); const query: Record<string, string> = {}; if (queryIndex >= 0) { const queryStr = cleanHash.substring(queryIndex + 1); cleanHash = cleanHash.substring(0, queryIndex); const pairs = queryStr.split('&'); for (let i = 0; i < pairs.length; i++) { const pair = pairs[i].split('='); if (pair[0]) query[decodeURIComponent(pair[0])] = pair[1] ? decodeURIComponent(pair[1]) : ''; } } return { path: cleanHash || '/', params: {}, query, fragment }; }

function parseRoute(pattern: string, path: string) { const patternParts = pattern.split('/').filter(Boolean); const pathParts = path.split('/').filter(Boolean); if (patternParts.length !== pathParts.length) { const lastPattern = patternParts[patternParts.length - 1]; if (!(lastPattern && lastPattern.charAt(0) === ':' && lastPattern.charAt(lastPattern.length - 1) === '*')) return null; } const params: Record<string, string> = {}; for (let i = 0; i < patternParts.length; i++) { const pp = patternParts[i]; if (pp.charAt(0) === ':') { let paramName = pp.substring(1); if (paramName.charAt(paramName.length - 1) === '*') { paramName = paramName.slice(0, -1); params[paramName] = pathParts.slice(i).join('/'); break; } else if (paramName.charAt(paramName.length - 1) === '?') { paramName = paramName.slice(0, -1); params[paramName] = pathParts[i] || ''; } else params[paramName] = pathParts[i]; } else if (pp !== pathParts[i]) return null; } return params; }

function buildPath(pattern: string, params: Record<string, string>) { _metrics.builds++; params = params || {}; const path = pattern.replace(/:([^/]+)/g, (match, paramName) => { const isOptional = paramName.charAt(paramName.length - 1) === '?'; const isCatchAll = paramName.charAt(paramName.length - 1) === '*'; if (isOptional || isCatchAll) paramName = paramName.slice(0, -1); return params[paramName] != null ? encodeURIComponent(params[paramName]) : ''; }); return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'; }

function buildQuery(params: Record<string, string>) { const pairs = []; for (const key in params) { if (params.hasOwnProperty(key) && params[key] != null && params[key] !== '') pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`); } return pairs.length > 0 ? `?${pairs.join('&')}` : ''; }

function buildHash(path: string, query: Record<string, string> | string, fragment: string) { let hash = `#${path.charAt(0) === '/' ? path : `/${path}`}`; if (query && typeof query === 'object') hash += buildQuery(query); else if (query && typeof query === 'string') hash += (query.charAt(0) === '?' ? '' : '?') + query; if (fragment) hash += `#${fragment}`; return hash; }

function normalize(path: string) { if (!path) return '/'; let normalized = path.replace(/\/+/g, '/'); if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === '/') normalized = normalized.slice(0, -1); if (normalized.charAt(0) !== '/') normalized = `/${normalized}`; return normalized; }

function init(ctx: Record<string, unknown>) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export const URLParser = {
  MODULE_ID, VERSION,
  init, parseHash, parseRoute, buildPath,
  buildQuery, buildHash, normalize,
  healthCheck, info, injectPorts, getPorts
};

export { MODULE_ID, VERSION, init, parseHash, parseRoute, buildPath, buildQuery, buildHash, normalize, healthCheck, info };
export default URLParser;
