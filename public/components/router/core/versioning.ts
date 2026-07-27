// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.core.versioning
// PURPOSE: Router Core - Route Versioning
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   VERSIONING_TELEMETRY — exported value
//   init() — exported function
//   registerVersion() — exported function
//   setCurrentVersion() — exported function
//   getCurrentVersion() — exported function
//   getVersionConfig() — exported function
//   isDeprecated() — exported function
//   listVersions() — exported function
//   resolveVersionedPath() — exported function
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

const MODULE_ID = 'components.router.core.versioning';
const VERSION = '2.2.0-P18EC';

const VERSIONING_TELEMETRY = {
  INIT: 'router:versioning:init',
  CHANGE: 'router:version:change'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; versions: Record<string, Record<string, unknown>>; currentVersion: string; defaultVersion: string } = { initialized: false, versions: {}, currentVersion: 'v1', defaultVersion: 'v1' };
const _metrics = { versionChecks: 0, upgrades: 0, downgrades: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function registerVersion(version: string, config: Record<string, unknown>) { _state.versions[version] = Object.assign({ routes: [], deprecated: false, sunset: null }, config || {}); return { ok: true, version }; }
function setCurrentVersion(version: string) { if (!_state.versions[version]) return { ok: false, error: 'Version not registered' }; const prev = _state.currentVersion; _state.currentVersion = version; if (prev < version) _metrics.upgrades++; else if (prev > version) _metrics.downgrades++; _track(VERSIONING_TELEMETRY.CHANGE, { from: prev, to: version }); return { ok: true, previous: prev, current: version }; }
function getCurrentVersion() { return _state.currentVersion; }
function getVersionConfig(version: string) { return _state.versions[version || _state.currentVersion] || null; }
function isDeprecated(version: string) { const config = _state.versions[version]; return config ? config.deprecated : false; }
function listVersions() { return Object.keys(_state.versions).map(v => ({
  version: v,
  deprecated: _state.versions[v].deprecated,
  sunset: _state.versions[v].sunset,
  isCurrent: v === _state.currentVersion
})); }

function resolveVersionedPath(path: string, version: string) { _metrics.versionChecks++; version = version || _state.currentVersion; const config = _state.versions[version]; if (!config) return path; if (config.pathPrefix) return config.pathPrefix + path; return path; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.defaultVersion) { _state.defaultVersion = ctx.defaultVersion as string; _state.currentVersion = ctx.defaultVersion as string; } registerVersion(_state.defaultVersion, { deprecated: false }); _state.initialized = true; _track(VERSIONING_TELEMETRY.INIT, { version: VERSION }); return { ok: true, version: VERSION }; }
function healthCheck() { let score = _state.initialized ? 100 : 50; const currentConfig = _state.versions[_state.currentVersion]; if (currentConfig && currentConfig.deprecated) score -= 20; return { status: score >= 80 ? 'HEALTHY' : 'DEGRADED', score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'warn' }, currentNotDeprecated: { ok: !currentConfig || !currentConfig.deprecated, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, currentVersion: _state.currentVersion, versionsCount: Object.keys(_state.versions).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, VERSIONING_TELEMETRY, init, registerVersion, setCurrentVersion, getCurrentVersion, getVersionConfig, isDeprecated, listVersions, resolveVersionedPath, healthCheck, info };
export default { MODULE_ID, VERSION, VERSIONING_TELEMETRY, init, registerVersion, setCurrentVersion, getCurrentVersion, getVersionConfig, isDeprecated, listVersions, resolveVersionedPath, healthCheck, info, injectPorts, getPorts };
