import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.security.permissions-matrix";
const VERSION = "2.2.0-P18EC";
const PERMISSIONS_TELEMETRY = {
  DENIED: "router:permissions:denied"
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
const _state = { initialized: false, matrix: {}, roles: {} };
const _metrics = { checks: 0, allowed: 0, denied: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function setRoutePermissions(routePattern, permissions) {
  _state.matrix[routePattern] = Array.isArray(permissions) ? permissions : [permissions];
  return { ok: true, pattern: routePattern };
}
function getRoutePermissions(routePattern) {
  return _state.matrix[routePattern] || [];
}
function clearRoutePermissions(routePattern) {
  if (_state.matrix[routePattern]) {
    delete _state.matrix[routePattern];
    return { ok: true };
  }
  return { ok: false, reason: "Not found" };
}
function setRolePermissions(role, permissions) {
  _state.roles[role] = Array.isArray(permissions) ? permissions : [permissions];
  return { ok: true, role };
}
function getRolePermissions(role) {
  return _state.roles[role] || [];
}
function checkAccess(routePattern, userPermissions, userRoles) {
  _metrics.checks++;
  const required = _state.matrix[routePattern];
  if (!required || required.length === 0) {
    _metrics.allowed++;
    return { allowed: true, reason: "No permissions required" };
  }
  userPermissions = userPermissions || [];
  userRoles = userRoles || [];
  const allUserPerms = userPermissions.slice();
  for (let i = 0; i < userRoles.length; i++) {
    const rolePerms = _state.roles[userRoles[i]] || [];
    for (let j = 0; j < rolePerms.length; j++) {
      if (allUserPerms.indexOf(rolePerms[j]) < 0) allUserPerms.push(rolePerms[j]);
    }
  }
  for (let k = 0; k < required.length; k++) {
    if (allUserPerms.indexOf(required[k]) < 0) {
      _metrics.denied++;
      _track(PERMISSIONS_TELEMETRY.DENIED, { route: routePattern, missing: required[k] });
      return { allowed: false, reason: `Missing permission: ${required[k]}`, missing: required[k] };
    }
  }
  _metrics.allowed++;
  return { allowed: true };
}
function getMatrix() {
  return Object.assign({}, _state.matrix);
}
function getRoles() {
  return Object.assign({}, _state.roles);
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.matrix) Object.assign(_state.matrix, ctx.matrix);
  if (ctx && ctx.roles) Object.assign(_state.roles, ctx.roles);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _state.matrix = {};
  _state.roles = {};
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, routesCount: Object.keys(_state.matrix).length, rolesCount: Object.keys(_state.roles).length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
var permissions_matrix_default = { MODULE_ID, VERSION, PERMISSIONS_TELEMETRY, init, cleanup, setRoutePermissions, getRoutePermissions, clearRoutePermissions, setRolePermissions, getRolePermissions, checkAccess, getMatrix, getRoles, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  PERMISSIONS_TELEMETRY,
  VERSION,
  checkAccess,
  cleanup,
  clearRoutePermissions,
  permissions_matrix_default as default,
  getMatrix,
  getPorts,
  getRolePermissions,
  getRoles,
  getRoutePermissions,
  healthCheck,
  info,
  init,
  injectPorts,
  setRolePermissions,
  setRoutePermissions
};
