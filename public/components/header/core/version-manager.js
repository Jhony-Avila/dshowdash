import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/version-manager";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _modules = /* @__PURE__ */ new Map();
const _compatibilityRules = /* @__PURE__ */ new Map();
const _changelog = [];
function init() {
  _initPorts();
  _log("info", "VersionManager inicializado");
}
function parseVersion(versionStr) {
  if (!versionStr || typeof versionStr !== "string") return null;
  const clean = versionStr.replace(/^v/, "");
  const parts = clean.split("-");
  const numbers = parts[0].split(".");
  return {
    major: parseInt(numbers[0], 10) || 0,
    minor: parseInt(numbers[1], 10) || 0,
    patch: parseInt(numbers[2], 10) || 0,
    prerelease: parts[1] || null,
    original: versionStr
  };
}
function compareVersions(v1, v2) {
  const a = typeof v1 === "string" ? parseVersion(v1) : v1;
  const b = typeof v2 === "string" ? parseVersion(v2) : v2;
  if (!a || !b) return 0;
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  return 0;
}
function satisfies(version, range) {
  const v = typeof version === "string" ? parseVersion(version) : version;
  if (!v) return false;
  if (range.startsWith("^")) {
    const min = parseVersion(range.substring(1));
    if (!min) return false;
    return v.major === min.major && (v.minor > min.minor || v.minor === min.minor && v.patch >= min.patch);
  }
  if (range.startsWith("~")) {
    const min = parseVersion(range.substring(1));
    if (!min) return false;
    return v.major === min.major && v.minor === min.minor && v.patch >= min.patch;
  }
  if (range.startsWith(">=")) {
    const min = parseVersion(range.substring(2));
    return compareVersions(v, min) >= 0;
  }
  if (range.startsWith(">")) {
    const min = parseVersion(range.substring(1));
    return compareVersions(v, min) > 0;
  }
  if (range.startsWith("<=")) {
    const max = parseVersion(range.substring(2));
    return compareVersions(v, max) <= 0;
  }
  if (range.startsWith("<")) {
    const max = parseVersion(range.substring(1));
    return compareVersions(v, max) < 0;
  }
  const exact = parseVersion(range);
  return compareVersions(v, exact) === 0;
}
function registerModule(moduleId, version, metadata) {
  metadata = metadata || {};
  const parsed = parseVersion(version);
  _modules.set(moduleId, {
    moduleId,
    version,
    parsed,
    registeredAt: Date.now(),
    // @ts-expect-error TS migration - TS2339
    dependencies: metadata.dependencies || {},
    // @ts-expect-error TS migration - TS2339
    changelog: metadata.changelog || [],
    // @ts-expect-error TS migration - TS2339
    deprecated: metadata.deprecated || false,
    // @ts-expect-error TS migration - TS2339
    deprecationMessage: metadata.deprecationMessage || null
  });
  _log("debug", "Modulo registrado:", moduleId, version);
  return true;
}
function getModule(moduleId) {
  return _modules.get(moduleId) || null;
}
function getModuleVersion(moduleId) {
  const mod = _modules.get(moduleId);
  return mod ? mod.version : null;
}
function getAllModules() {
  const result = {};
  _modules.forEach((mod, id) => {
    result[id] = { version: mod.version, deprecated: mod.deprecated, registeredAt: mod.registeredAt };
  });
  return result;
}
function addCompatibilityRule(sourceModule, targetModule, versionRange) {
  const key = `${sourceModule}:${targetModule}`;
  _compatibilityRules.set(key, { source: sourceModule, target: targetModule, range: versionRange, addedAt: Date.now() });
  _log("debug", "Regra adicionada:", key, versionRange);
}
function checkCompatibility(sourceModule, targetModule) {
  const source = _modules.get(sourceModule);
  const target = _modules.get(targetModule);
  if (!source || !target) {
    return { compatible: false, reason: "Modulo nao encontrado" };
  }
  const key = `${sourceModule}:${targetModule}`;
  const rule = _compatibilityRules.get(key);
  if (!rule) {
    return { compatible: true, reason: "Sem regra de compatibilidade definida" };
  }
  const isCompatible = satisfies(target.version, rule.range);
  return {
    compatible: isCompatible,
    sourceVersion: source.version,
    targetVersion: target.version,
    requiredRange: rule.range,
    reason: isCompatible ? "Versao compativel" : "Versao incompativel"
  };
}
function checkAllDependencies(moduleId) {
  const mod = _modules.get(moduleId);
  if (!mod) return { valid: false, errors: ["Modulo nao encontrado"] };
  const errors = [];
  const warnings = [];
  Object.keys(mod.dependencies).forEach((depId) => {
    const requiredRange = mod.dependencies[depId];
    const dep = _modules.get(depId);
    if (!dep) {
      errors.push(`Dependencia nao encontrada: ${depId}`);
    } else if (!satisfies(dep.version, requiredRange)) {
      errors.push(`Versao incompativel: ${depId} requer ${requiredRange}, encontrado ${dep.version}`);
    }
  });
  return { valid: errors.length === 0, errors, warnings };
}
function addChangelogEntry(moduleId, version, changes) {
  const entry = { moduleId, version, changes, timestamp: Date.now(), date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] };
  _changelog.push(entry);
  _log("debug", "Changelog adicionado:", moduleId, version);
}
function getChangelog(moduleId, limit) {
  limit = limit || 10;
  const filtered = moduleId ? _changelog.filter((e) => e.moduleId === moduleId) : _changelog;
  return filtered.slice(-limit).reverse();
}
function incrementVersion(version, type) {
  const v = parseVersion(version);
  if (!v) return null;
  switch (type) {
    case "major":
      return `${v.major + 1}.0.0`;
    case "minor":
      return `${v.major}.${v.minor + 1}.0`;
    case "patch":
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    default:
      return null;
  }
}
function deprecateModule(moduleId, message) {
  const mod = _modules.get(moduleId);
  if (mod) {
    mod.deprecated = true;
    mod.deprecationMessage = message || "Este modulo esta deprecado";
    _log("warn", "Modulo deprecado:", moduleId);
    return true;
  }
  return false;
}
function getDeprecatedModules() {
  const result = [];
  _modules.forEach((mod) => {
    if (mod.deprecated) {
      result.push({ moduleId: mod.moduleId, version: mod.version, message: mod.deprecationMessage });
    }
  });
  return result;
}
function healthCheck() {
  const deprecated = getDeprecatedModules();
  const checks = { hasModules: _modules.size > 0, noDeprecated: deprecated.length === 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, modulesCount: _modules.size, deprecatedCount: deprecated.length, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, modulesRegistered: _modules.size, compatibilityRules: _compatibilityRules.size, changelogEntries: _changelog.length, deprecated: getDeprecatedModules(), modules: getAllModules(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var version_manager_default = { VERSION, MODULE_ID, init, parseVersion, compareVersions, satisfies, registerModule, getModule, getAllModules, checkCompatibility, incrementVersion, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  addChangelogEntry,
  addCompatibilityRule,
  checkAllDependencies,
  checkCompatibility,
  compareVersions,
  version_manager_default as default,
  deprecateModule,
  getAllModules,
  getChangelog,
  getDeprecatedModules,
  getModule,
  getModuleVersion,
  getPorts,
  healthCheck,
  incrementVersion,
  info,
  init,
  injectPorts,
  parseVersion,
  registerModule,
  satisfies
};
