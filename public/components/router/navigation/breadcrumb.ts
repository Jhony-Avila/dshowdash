// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.navigation.breadcrumb
// PURPOSE: Router Navigation - Breadcrumb Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   registerLabel() — exported function
//   getLabel() — exported function
//   updateFromPath() — exported function
//   getCrumbs() — exported function
//   setCrumbs() — exported function
//   clear() — exported function
//   render() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

const MODULE_ID = 'components.router.navigation.breadcrumb';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; crumbs: Record<string, unknown>[]; maxCrumbs: number; labels: Record<string, string> } = { initialized: false, crumbs: [], maxCrumbs: 10, labels: {} };
const _metrics = { updates: 0, renders: 0 };

function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }
function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function registerLabel(path: string, label: string) { _state.labels[path] = label; return { ok: true }; }
function getLabel(path: string) { if (_state.labels[path]) return _state.labels[path]; const parts = path.split('/').filter(Boolean); if (parts.length === 0) return 'Home'; const last = parts[parts.length - 1]; return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' '); }


// @ts-expect-error TS migration - TS2353
function updateFromPath(path: string) { _metrics.updates++; if (!path) path = '/'; const parts = path.split('/').filter(Boolean); let crumbs = [{ path: '/', label: getLabel('/'), isHome: true }]; let currentPath = ''; for (let i = 0; i < parts.length; i++) { currentPath += `/${parts[i]}`; crumbs.push({ path: currentPath, label: getLabel(currentPath), isHome: false, isCurrent: i === parts.length - 1 }); } if (crumbs.length > _state.maxCrumbs) crumbs = [crumbs[0]].concat(crumbs.slice(crumbs.length - _state.maxCrumbs + 1)); _state.crumbs = crumbs; _emit(ROUTER_EVENTS.BREADCRUMB_UPDATED, { crumbs }); _track('router:breadcrumb:update', { depth: crumbs.length }); return { ok: true, crumbs }; }

function getCrumbs() { return _state.crumbs.slice(); }
function setCrumbs(crumbs: Record<string, unknown>[]) { _state.crumbs = crumbs; _emit(ROUTER_EVENTS.BREADCRUMB_UPDATED, { crumbs }); return { ok: true }; }
function clear() { _state.crumbs = []; return { ok: true }; }

function render(container: HTMLElement, options: Record<string, unknown>) { _metrics.renders++; options = options || {}; if (!container) return { ok: false, error: 'Container required' }; const separator = options.separator || ' / '; const html = _state.crumbs.map((crumb, index) => { if (crumb.isCurrent) return `<span class="breadcrumb-current">${crumb.label}</span>`; return `<a href="${crumb.path}" class="breadcrumb-link" data-path="${crumb.path}">${crumb.label}</a>`; }).join(`<span class="breadcrumb-separator">${separator}</span>`); container.innerHTML = html; return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.maxCrumbs) _state.maxCrumbs = ctx.maxCrumbs as number; if (ctx && ctx.labels) Object.assign(_state.labels, ctx.labels as Record<string, string>); _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, crumbsCount: _state.crumbs.length, labelsCount: Object.keys(_state.labels).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, registerLabel, getLabel, updateFromPath, getCrumbs, setCrumbs, clear, render, healthCheck, info };
export default { MODULE_ID, VERSION, init, registerLabel, getLabel, updateFromPath, getCrumbs, setCrumbs, clear, render, healthCheck, info, injectPorts, getPorts };
