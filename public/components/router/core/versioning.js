import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.core.versioning";
const VERSION = "2.2.0-P18EC";
const VERSIONING_TELEMETRY = {
  INIT: "router:versioning:init",
  CHANGE: "router:version:change"
};
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
const _state = { initialized: false, versions: {}, currentVersion: "v1", defaultVersion: "v1" };
const _metrics = { versionChecks: 0, upgrades: 0, downgrades: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function registerVersion(version, config) {
  _state.versions[version] = Object.assign({ routes: [], deprecated: false, sunset: null }, config || {});
  return { ok: true, version };
}
function setCurrentVersion(version) {
  if (!_state.versions[version]) return { ok: false, error: "Version not registered" };
  const prev = _state.currentVersion;
  _state.currentVersion = version;
  if (prev < version) _metrics.upgrades++;
  else if (prev > version) _metrics.downgrades++;
  _track(VERSIONING_TELEMETRY.CHANGE, { from: prev, to: version });
  return { ok: true, previous: prev, current: version };
}
function getCurrentVersion() {
  return _state.currentVersion;
}
function getVersionConfig(version) {
  return _state.versions[version || _state.currentVersion] || null;
}
function isDeprecated(version) {
  const config = _state.versions[version];
  return config ? config.deprecated : false;
}
function listVersions() {
  return Object.keys(_state.versions).map((v) => ({
    version: v,
    deprecated: _state.versions[v].deprecated,
    sunset: _state.versions[v].sunset,
    isCurrent: v === _state.currentVersion
  }));
}
function resolveVersionedPath(path, version) {
  _metrics.versionChecks++;
  version = version || _state.currentVersion;
  const config = _state.versions[version];
  if (!config) return path;
  if (config.pathPrefix) return config.pathPrefix + path;
  return path;
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.defaultVersion) {
    _state.defaultVersion = ctx.defaultVersion;
    _state.currentVersion = ctx.defaultVersion;
  }
  registerVersion(_state.defaultVersion, { deprecated: false });
  _state.initialized = true;
  _track(VERSIONING_TELEMETRY.INIT, { version: VERSION });
  return { ok: true, version: VERSION };
}
function healthCheck() {
  let score = _state.initialized ? 100 : 50;
  const currentConfig = _state.versions[_state.currentVersion];
  if (currentConfig && currentConfig.deprecated) score -= 20;
  return { status: score >= 80 ? "HEALTHY" : "DEGRADED", score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "warn" }, currentNotDeprecated: { ok: !currentConfig || !currentConfig.deprecated, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, currentVersion: _state.currentVersion, versionsCount: Object.keys(_state.versions).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var versioning_default = { MODULE_ID, VERSION, VERSIONING_TELEMETRY, init, registerVersion, setCurrentVersion, getCurrentVersion, getVersionConfig, isDeprecated, listVersions, resolveVersionedPath, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  VERSIONING_TELEMETRY,
  versioning_default as default,
  getCurrentVersion,
  getPorts,
  getVersionConfig,
  healthCheck,
  info,
  init,
  injectPorts,
  isDeprecated,
  listVersions,
  registerVersion,
  resolveVersionedPath,
  setCurrentVersion
};
