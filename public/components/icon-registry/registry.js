import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.0.0-P23";
const MODULE_ID = "icon-registry:core";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
const _icons = /* @__PURE__ */ new Map();
const _namespaces = /* @__PURE__ */ new Set();
let _loadedAt = null;
let _errors = [];
function register(namespace, icons) {
  _initPorts();
  if (!namespace || typeof namespace !== "string") {
    _errors.push({ type: "INVALID_NAMESPACE", timestamp: Date.now() });
    throw new Error("IconRegistry: namespace must be a non-empty string");
  }
  if (!icons || typeof icons !== "object") {
    _errors.push({ type: "INVALID_ICONS", timestamp: Date.now() });
    throw new Error("IconRegistry: icons must be an object");
  }
  _namespaces.add(namespace);
  let count2 = 0;
  for (const [name, svg] of Object.entries(icons)) {
    if (typeof svg !== "string") continue;
    const key = `${namespace}:${name}`;
    _icons.set(key, svg);
    count2++;
  }
  if (!_loadedAt) _loadedAt = Date.now();
  return count2;
}
function get(fullName) {
  if (!fullName || typeof fullName !== "string") return null;
  if (!fullName.includes(":")) {
    _log("warn", `Invalid icon name "${fullName}". Use format "namespace:name"`);
    return null;
  }
  return _icons.get(fullName) || null;
}
function has(fullName) {
  if (!fullName || typeof fullName !== "string") return false;
  return _icons.has(fullName);
}
function list(namespace = null) {
  if (namespace) {
    const prefix = `${namespace}:`;
    return Array.from(_icons.keys()).filter((k) => k.startsWith(prefix));
  }
  return Array.from(_icons.keys());
}
function listNamespaces() {
  return Array.from(_namespaces);
}
function count(namespace = null) {
  if (namespace) {
    const prefix = `${namespace}:`;
    return Array.from(_icons.keys()).filter((k) => k.startsWith(prefix)).length;
  }
  return _icons.size;
}
function clear() {
  _icons.clear();
  _namespaces.clear();
  _loadedAt = null;
  _errors = [];
}
function getManifest() {
  const byNamespace = {};
  for (const ns of _namespaces) {
    byNamespace[ns] = count(ns);
  }
  return {
    registryId: MODULE_ID,
    version: VERSION,
    loadedAt: _loadedAt,
    itemCount: _icons.size,
    items: Array.from(_icons.keys()),
    namespaces: Array.from(_namespaces),
    iconsByNamespace: byNamespace,
    errors: _errors.slice(-10),
    p23Governance: true,
    timestamp: Date.now()
  };
}
function info() {
  const portsSnapshot = Ports.snapshot();
  const byNamespace = {};
  for (const ns of _namespaces) {
    byNamespace[ns] = count(ns);
  }
  return { moduleId: MODULE_ID, version: VERSION, totalIcons: _icons.size, namespaces: Array.from(_namespaces), iconsByNamespace: byNamespace, portsInitialized: portsSnapshot._initialized, p23Governance: true };
}
function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const logger = _getPort("logger");
  return { status: _icons.size > 0 ? "HEALTHY" : "DEGRADED", totalIcons: _icons.size, namespaces: Array.from(_namespaces), version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, loggerReady: !!logger, p23Governance: true };
}
var registry_default = { register, get, has, list, listNamespaces, count, clear, info, healthCheck, getManifest, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clear,
  count,
  registry_default as default,
  get,
  getManifest,
  getPorts,
  has,
  healthCheck,
  info,
  injectPorts,
  list,
  listNamespaces,
  register
};
