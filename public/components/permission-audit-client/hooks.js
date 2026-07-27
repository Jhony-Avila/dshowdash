import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { logger } from "./config.js";
const VERSION = "2.2.0-P17WI";
const MODULE_ID = "permission-audit-client-hooks";
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
let _permissionsGuardHooked = false;
let _originalCan = null;
let _bufferFn = null;
function isHooked() {
  return _permissionsGuardHooked;
}
function canWithAudit(capability, options = {}) {
  if (options === void 0) options = {};
  const pg = _getPort("permissionsGuard");
  if (!pg || !_originalCan) {
    if (logger && logger.warn) logger.warn("PermissionsGuard not available");
    return false;
  }
  const result = _originalCan.call(pg, capability, options);
  if (_bufferFn) {
    _bufferFn(capability, result ? "allowed" : "denied", { resourceType: options["resourceType"], resourceId: options["resourceId"], context: { source: "PermissionsGuard.can" } });
  }
  return !!result;
}
function hookPermissionsGuard(bufferFn) {
  _initPorts();
  const pg = _getPort("permissionsGuard");
  if (!pg) {
    if (logger && logger.warn) logger.warn("PermissionsGuard not found");
    return false;
  }
  if (_permissionsGuardHooked) {
    if (logger && logger.warn) logger.warn("Already hooked");
    return true;
  }
  _originalCan = pg.can;
  _bufferFn = bufferFn;
  if (_originalCan) {
    _permissionsGuardHooked = true;
    if (logger && logger.info) logger.info("Hooked into PermissionsGuard (local wrapper)");
    return true;
  }
  return false;
}
function unhookPermissionsGuard() {
  if (!_permissionsGuardHooked || !_originalCan) return false;
  _permissionsGuardHooked = false;
  _originalCan = null;
  _bufferFn = null;
  if (logger && logger.info) logger.info("Unhooked from PermissionsGuard");
  return true;
}
function getAuditedCan() {
  if (!_permissionsGuardHooked) return null;
  return canWithAudit;
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, hooked: _permissionsGuardHooked, portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, hooked: _permissionsGuardHooked, portsInitialized: ps._initialized } };
}
var hooks_default = { isHooked, hookPermissionsGuard, unhookPermissionsGuard, canWithAudit, getAuditedCan, injectPorts, getPorts, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  canWithAudit,
  hooks_default as default,
  getAuditedCan,
  getPorts,
  healthCheck,
  hookPermissionsGuard,
  info,
  injectPorts,
  isHooked,
  unhookPermissionsGuard
};
