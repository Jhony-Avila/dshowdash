import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.3.1-ENTERPRISE";
const MODULE_ID = "context-registry";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
function getVersion() {
  return VERSION;
}
const CORE_CONTEXTS = Object.freeze({ GLOBAL_STATE: "globalState", SESSION: "session", ENVIRONMENT: "environment", VERSION: "version", CONNECTIVITY: "connectivity", ORCHESTRATOR_INITIALIZED: "orchestrator.initialized", ORCHESTRATOR_TIMESTAMP: "orchestrator.timestamp", ORCHESTRATOR_PRESET: "orchestrator.preset", APP_SHELL: "appShell", ROUTER: "router", THEME: "theme", LAYOUT: "layout", LOCALE: "locale", ACCESSIBILITY: "accessibility", PERMISSIONS: "permissions", UI_MODAL: "ui.modal", UI_OVERLAY: "ui.overlay" });
function _getCoreContextNames() {
  const result = [];
  const keys = Object.keys(CORE_CONTEXTS);
  for (let i = 0; i < keys.length; i++) {
    result.push(CORE_CONTEXTS[keys[i]]);
  }
  return Object.freeze(result);
}
const CORE_CONTEXT_NAMES = _getCoreContextNames();
const RESERVED_PREFIXES = Object.freeze(["__internal", "core.", "system."]);
const UI_PREFIXES = Object.freeze(["ui."]);
const registeredContexts = /* @__PURE__ */ new Map();
const contextSchemas = /* @__PURE__ */ new Map();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(...[prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[prefix].concat(args));
    return;
  }
  if (_debug() && logger.debug) logger.debug(...[prefix].concat(args));
};
let _metrics = { registerCount: 0, unregisterCount: 0, registerBlockedCount: 0, unregisterBlockedCount: 0, schemaCount: 0, uiAutoRegisters: 0, lastRegisterAt: null, lastUnregisterAt: null };
const ContextRegistry = {
  setDebug(debug) {
  },
  register(name, schema, options) {
    if (!options) options = {};
    try {
      if (!name || typeof name !== "string") {
        _log("warn", "Invalid context name");
        _metrics.registerBlockedCount++;
        return false;
      }
      if (registeredContexts.has(name)) {
        _log("info", "Context already registered:", name);
        return false;
      }
      const metadata = { name, registeredAt: Date.now(), schema: schema || null, active: true, owner: options.owner || "unknown", type: options.type || (this.isCoreContext(name) ? "core" : "custom"), lifetime: options.lifetime || "app", description: options.description || "" };
      registeredContexts.set(name, metadata);
      if (schema) {
        contextSchemas.set(name, schema);
        _metrics.schemaCount++;
      }
      _metrics.registerCount++;
      _metrics.lastRegisterAt = Date.now();
      _log("info", "Context registered:", name, "(type:", `${metadata.type})`);
      return true;
    } catch (error) {
      _log("error", "register error:", error.message);
      return false;
    }
  },
  unregister(name) {
    try {
      if (!registeredContexts.has(name)) return false;
      if (this.isCoreContext(name)) {
        _log("warn", "Cannot unregister core context:", name);
        _metrics.unregisterBlockedCount++;
        return false;
      }
      const hadSchema = contextSchemas.has(name);
      registeredContexts.delete(name);
      contextSchemas.delete(name);
      if (hadSchema) _metrics.schemaCount--;
      _metrics.unregisterCount++;
      _metrics.lastUnregisterAt = Date.now();
      _log("info", "Context unregistered:", name);
      return true;
    } catch (error) {
      _log("error", "unregister error:", error.message);
      return false;
    }
  },
  has(name) {
    return registeredContexts.has(name);
  },
  get(name) {
    return registeredContexts.get(name) || null;
  },
  getSchema(name) {
    return contextSchemas.get(name) || null;
  },
  isCoreContext(name) {
    if (!name) return false;
    if (CORE_CONTEXT_NAMES.indexOf(name) !== -1) return true;
    for (let i = 0; i < RESERVED_PREFIXES.length; i++) {
      if (name.indexOf(RESERVED_PREFIXES[i]) === 0) return true;
    }
    if (name.indexOf("orchestrator.") === 0) return true;
    if (name.indexOf("ui.modal.") === 0 || name.indexOf("ui.overlay.") === 0) return true;
    return false;
  },
  isUIContext(name) {
    if (!name) return false;
    for (let i = 0; i < UI_PREFIXES.length; i++) {
      if (name.indexOf(UI_PREFIXES[i]) === 0) return true;
    }
    return false;
  },
  isReservedPrefix(name) {
    if (!name) return false;
    for (let i = 0; i < RESERVED_PREFIXES.length; i++) {
      if (name.indexOf(RESERVED_PREFIXES[i]) === 0) return true;
    }
    return false;
  },
  getContextMeta(name) {
    return registeredContexts.get(name) || null;
  },
  listCoreContexts() {
    return CORE_CONTEXT_NAMES;
  },
  list() {
    return Array.from(registeredContexts.keys());
  },
  listAll() {
    const result = [];
    registeredContexts.forEach((value, key) => {
      result.push(Object.assign({ name: key }, value));
    });
    return result;
  },
  listByType(type) {
    const result = [];
    registeredContexts.forEach((value, key) => {
      if (value.type === type) result.push(Object.assign({ name: key }, value));
    });
    return result;
  },
  listUIContexts() {
    const self = this;
    const result = [];
    registeredContexts.forEach((value, key) => {
      if (self.isUIContext(key)) result.push(Object.assign({ name: key }, value));
    });
    return result;
  },
  clear() {
    registeredContexts.clear();
    contextSchemas.clear();
    _log("info", "All contexts cleared");
  },
  clearCustomOnly() {
    const self = this;
    const toDelete = [];
    registeredContexts.forEach((value, key) => {
      if (value.type !== "core" && !self.isCoreContext(key)) toDelete.push(key);
    });
    toDelete.forEach((key) => {
      registeredContexts.delete(key);
      contextSchemas.delete(key);
    });
    _log("info", "Custom contexts cleared:", toDelete.length);
    return toDelete.length;
  },
  count() {
    return registeredContexts.size;
  },
  _hasReservedPrefixCustom() {
    const self = this;
    let found = false;
    registeredContexts.forEach((value, key) => {
      if (value.type === "custom" && self.isReservedPrefix(key)) found = true;
    });
    return found;
  },
  trackUIAutoRegister() {
    _metrics.uiAutoRegisters++;
  },
  healthCheck() {
    const portsSnapshot = Ports.snapshot();
    const checks = { hasContexts: registeredContexts.size > 0, hasCoreContexts: this.listByType("core").length > 0, hasUIContexts: this.listUIContexts().length > 0, schemasValid: _metrics.schemaCount >= 0, lowBlockedRegisters: _metrics.registerBlockedCount < 5, noReservedPrefixCustom: !this._hasReservedPrefixCustom(), loggerAvailable: !!_getPort("logger"), portsInitialized: portsSnapshot._initialized };
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
      if (checks[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    let status = "HEALTHY";
    if (passed < total * 0.5) status = "UNHEALTHY";
    else if (passed < total) status = "DEGRADED";
    const issues = [];
    if (!checks.hasContexts) issues.push("No contexts registered");
    if (!checks.hasCoreContexts) issues.push("No core contexts registered");
    if (!checks.hasUIContexts) issues.push("No UI contexts registered");
    if (!checks.lowBlockedRegisters) issues.push(`${_metrics.registerBlockedCount} blocked register attempts`);
    if (!checks.noReservedPrefixCustom) issues.push("Custom context using reserved prefix");
    return { status, score: `${passed}/${total}`, healthy: passed >= 5, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
  },
  getStats() {
    let coreCount = 0;
    let customCount = 0;
    let uiCount = 0;
    const self = this;
    registeredContexts.forEach((value, key) => {
      if (value.type === "core" || self.isCoreContext(key)) coreCount++;
      else customCount++;
      if (self.isUIContext(key)) uiCount++;
    });
    return { version: VERSION, moduleId: MODULE_ID, total: registeredContexts.size, core: coreCount, custom: customCount, ui: uiCount, withSchema: contextSchemas.size, contexts: this.list() };
  },
  info() {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, counts: { total: registeredContexts.size, core: this.listByType("core").length, custom: this.listByType("custom").length, ui: this.listUIContexts().length, withSchema: contextSchemas.size }, metrics: Object.assign({}, _metrics), portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck(), coreContextsAvailable: CORE_CONTEXT_NAMES.length, reservedPrefixes: RESERVED_PREFIXES, uiPrefixes: UI_PREFIXES, timestamp: Date.now() };
  },
  resetMetrics() {
    _metrics = { registerCount: 0, unregisterCount: 0, registerBlockedCount: 0, unregisterBlockedCount: 0, schemaCount: contextSchemas.size, uiAutoRegisters: 0, lastRegisterAt: null, lastUnregisterAt: null };
  },
  getVersion() {
    return VERSION;
  }
};
var registry_default = ContextRegistry;
export {
  CORE_CONTEXTS,
  ContextRegistry,
  MODULE_ID,
  VERSION,
  registry_default as default,
  getPorts,
  getVersion,
  injectPorts
};
