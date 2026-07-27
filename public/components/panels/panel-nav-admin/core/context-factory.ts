// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE1)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.core.context-factory
// PURPOSE: Context Factory — DI Container expandido para panel-nav-admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createContext() — exported function (builds full DI context)
//   extendContext() — exported function (adds refs to existing context)
//   createHandlerContext() — exported function (subset for handlers)
//   createRendererContext() — exported function (subset for renderers)
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): container, refs, store, managers, etc.
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
//
// @origin Adapted from panel-01/index.js _getContext() pattern + managers-factory.js
// @changelog
//   10.1.0-MIGRATION-PHASE1: Initial creation — FASE 1 A.4
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE1';
export const MODULE_ID = 'panel-nav-admin.core.context-factory';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

/**
 * @private
 * @param {'error'|'warn'|'debug'|'info'} level
 * @param {...any} args
 */
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[ContextFactory]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'warn') logger.warn?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Create the full DI context object for panel-nav-admin.
 * Centralizes all references that sub-systems need, eliminating
 * scattered dependency passing.
 *
 * @param {Object} deps — Dependencies to inject
 * @param {HTMLElement} deps.container — Panel root DOM element
 * @param {Object} deps.refs — DOM references (from _rebuildRefsFromContainer)
 * @param {Object} deps.store — State store instance
 * @param {Object} [deps.navAdapter] — Nav adapter (CRUD operations)
 * @param {Object} [deps.scheduler] — Refresh scheduler
 * @param {Object} [deps.tracker] — Telemetry tracker
 * @param {Object} [deps.stateMachine] — FSM instance
 * @param {Object} [deps.featureFlags] — Feature flags module
 * @param {Object} [deps.featureRegistry] — Feature registry module
 * @param {Object} [deps.errorBoundary] — Error boundary instance
 * @param {Object} [deps.managers] — Additional manager instances
 * @returns {Object} Frozen context object
 */
export function createContext(deps: Record<string, unknown> = {}) {
  const {
    container = null,
    refs = null,
    store = null,
    navAdapter = null,
    scheduler = null,
    tracker = null,
    stateMachine = null,
    featureFlags = null,
    featureRegistry = null,
    errorBoundary = null,
    managers = {}
  } = deps;

  const ctx = {
    // ─── Core references ───
    container,
    refs,
    store,
    navAdapter,
    scheduler,
    tracker,

    // ─── FASE 1 modules ───
    stateMachine,
    featureFlags,
    featureRegistry,
    errorBoundary,

    // ─── Ports (ecosystem services) ───
    getPort: _getPort,
    get eventBus() { return _getPort('eventBus'); },
    get logger() { return _getPort('logger'); },
    get auth() { return _getPort('auth'); },
    get config() { return _getPort('config'); },
    get assetLoader() { return _getPort('assetLoader'); },

    // ─── Dynamic managers (populated in later phases) ───
    ...(managers as Record<string, unknown>),

    // ─── Metadata ───
    _version: VERSION,
    _moduleId: MODULE_ID,
    _createdAt: Date.now()
  };

  _log('debug', 'Context created with', Object.keys(ctx).length, 'keys');
  return ctx;
}

/**
 * Extend an existing context with additional references.
 * Returns a new object (does not mutate the original).
 *
 * @param {Object} ctx — Existing context
 * @param {Object} extensions — Additional key-value pairs to merge
 * @returns {Object} New extended context
 */
export function extendContext(ctx: Record<string, unknown>, extensions: Record<string, unknown> = {}) {
  const extended = { ...ctx, ...extensions, _extendedAt: Date.now() };
  _log('debug', 'Context extended with', Object.keys(extensions).length, 'keys');
  return extended;
}

/**
 * Create a lightweight context subset for handler factories.
 * Includes only what handlers typically need: container, refs, store,
 * navAdapter, and a showToast callback.
 *
 * @param {Object} deps
 * @param {HTMLElement} deps.container
 * @param {Object} deps.refs
 * @param {Object} deps.store
 * @param {Object} deps.navAdapter
 * @param {Function} deps.showToast
 * @param {Function} deps.loadData
 * @returns {Object}
 */
export function createHandlerContext(deps: Record<string, unknown> = {}) {
  return {
    container: deps.container || null,
    refs: deps.refs || null,
    store: deps.store || null,
    navAdapter: deps.navAdapter || null,
    showToast: deps.showToast || (() => {}),
    loadData: deps.loadData || (() => Promise.resolve())
  };
}

/**
 * Create a lightweight context subset for renderers.
 * Includes refs, store, and container.
 *
 * @param {Object} deps
 * @param {HTMLElement} deps.container
 * @param {Object} deps.refs
 * @param {Object} deps.store
 * @returns {Object}
 */
export function createRendererContext(deps: Record<string, unknown> = {}) {
  return {
    container: deps.container || null,
    refs: deps.refs || null,
    store: deps.store || null
  };
}

/** @returns {Object} Module info */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}

/** @returns {Object} Health check result */
export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  createContext, extendContext, createHandlerContext, createRendererContext,
  info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
};
