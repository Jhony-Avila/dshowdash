import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE1";
const MODULE_ID = "panel-nav-admin.core.context-factory";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[ContextFactory]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "warn") logger.warn?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function createContext(deps = {}) {
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
    get eventBus() {
      return _getPort("eventBus");
    },
    get logger() {
      return _getPort("logger");
    },
    get auth() {
      return _getPort("auth");
    },
    get config() {
      return _getPort("config");
    },
    get assetLoader() {
      return _getPort("assetLoader");
    },
    // ─── Dynamic managers (populated in later phases) ───
    ...managers,
    // ─── Metadata ───
    _version: VERSION,
    _moduleId: MODULE_ID,
    _createdAt: Date.now()
  };
  _log("debug", "Context created with", Object.keys(ctx).length, "keys");
  return ctx;
}
function extendContext(ctx, extensions = {}) {
  const extended = { ...ctx, ...extensions, _extendedAt: Date.now() };
  _log("debug", "Context extended with", Object.keys(extensions).length, "keys");
  return extended;
}
function createHandlerContext(deps = {}) {
  return {
    container: deps.container || null,
    refs: deps.refs || null,
    store: deps.store || null,
    navAdapter: deps.navAdapter || null,
    showToast: deps.showToast || (() => {
    }),
    loadData: deps.loadData || (() => Promise.resolve())
  };
}
function createRendererContext(deps = {}) {
  return {
    container: deps.container || null,
    refs: deps.refs || null,
    store: deps.store || null
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized()
  };
}
var context_factory_default = {
  createContext,
  extendContext,
  createHandlerContext,
  createRendererContext,
  info,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createContext,
  createHandlerContext,
  createRendererContext,
  context_factory_default as default,
  extendContext,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
