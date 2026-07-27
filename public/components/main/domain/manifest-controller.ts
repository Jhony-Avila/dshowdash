// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.domain.manifest-controller
// PURPOSE: Main - Manifest Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createManifestController() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   MANIFEST_TELEMETRY — exported value
//   init() — exported function
//   cleanup() — exported function
//   registerManifest() — exported function
//   getManifest() — exported function
//   getAllManifests() — exported function
//   listManifests() — exported function
//   loadManifest() — exported function
//   isLoaded() — exported function
//   getLoadedManifests() — exported function
//   unregisterManifest() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.domain.manifest-controller';
const VERSION = '8.0.0-UNIFIED';

const MANIFEST_TELEMETRY = {
  REGISTERED: 'manifest:registered',
  LOADED: 'manifest:loaded'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, manifests: {} as Record<string, Record<string, unknown>>, loaded: [] as unknown[] };
const _metrics = { registered: 0, loaded: 0, errors: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function registerManifest(id: string, manifest: unknown) { _metrics.registered++; _state.manifests[id] = Object.assign({ id, registeredAt: Date.now() }, manifest); _track(MANIFEST_TELEMETRY.REGISTERED, { id }); return { ok: true, id }; }

function getManifest(id: string) { return _state.manifests[id] || null; }
function getAllManifests() { return Object.assign({}, _state.manifests); }
function listManifests() { return Object.keys(_state.manifests); }

function loadManifest(id: string) {
  // If no id provided, return success (initialization pattern - no specific manifest required)
  if (id === undefined || id === null) {
    _metrics.loaded++;
    _track(MANIFEST_TELEMETRY.LOADED, { id: 'default-init' });
    return Promise.resolve({ ok: true, manifest: null, noManifestRequired: true });
  }
  const manifest = _state.manifests[id];
  if (!manifest) {
    _metrics.errors++;
    return Promise.reject(new Error(`Manifest not found: ${id}`));
  }
  _metrics.loaded++;
  if (_state.loaded.indexOf(id) < 0) _state.loaded.push(id);
  _track(MANIFEST_TELEMETRY.LOADED, { id });
  return Promise.resolve({ ok: true, manifest });
}

function isLoaded(id: string) { return _state.loaded.indexOf(id) >= 0; }
function getLoadedManifests() { return _state.loaded.slice(); }

function unregisterManifest(id: string) { if (_state.manifests[id]) { delete _state.manifests[id]; const idx = _state.loaded.indexOf(id); if (idx >= 0) _state.loaded.splice(idx, 1); return { ok: true }; } return { ok: false, reason: 'Not found' }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.manifests = {}; _state.loaded = []; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, manifestsCount: Object.keys(_state.manifests).length, loadedCount: _state.loaded.length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// Factory function for initialization.js compatibility
export function createManifestController(options: Record<string, unknown>) {
  options = options || {};
  init(options);
  return {
    registerManifest,
    getManifest,
    getAllManifests,
    listManifests,
    loadManifest,
    isLoaded,
    getLoadedManifests,
    unregisterManifest,
    cleanup,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}

export { MODULE_ID, VERSION, MANIFEST_TELEMETRY, init, cleanup, registerManifest, getManifest, getAllManifests, listManifests, loadManifest, isLoaded, getLoadedManifests, unregisterManifest, healthCheck, info };
export default { MODULE_ID, VERSION, MANIFEST_TELEMETRY, createManifestController, init, cleanup, registerManifest, getManifest, getAllManifests, listManifests, loadManifest, isLoaded, getLoadedManifests, unregisterManifest, healthCheck, info, injectPorts, getPorts };
