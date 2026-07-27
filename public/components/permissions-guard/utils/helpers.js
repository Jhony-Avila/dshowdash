const VERSION = "4.1.0-ENTERPRISE";
const MODULE_ID = "permissions-helpers";
import { LEVELS, ROLES } from "../core/contract.js";
const ROLE_LEVELS = { ...LEVELS };
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.ADMIN]: [ROLES.MANAGER, ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.MANAGER]: [ROLES.EDITOR, ROLES.VIEWER, ROLES.GUEST],
  [ROLES.EDITOR]: [ROLES.VIEWER, ROLES.GUEST],
  [ROLES.VIEWER]: [ROLES.GUEST],
  [ROLES.GUEST]: []
});
const _metrics = { normalizations: 0, levelCalculations: 0, roleExpansions: 0, wildcardMatches: 0, sessionNormalizations: 0, policyValidations: 0 };
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}
function normalizeRoles(roles) {
  _metrics.normalizations++;
  if (!Array.isArray(roles)) return [];
  const normalized = /* @__PURE__ */ new Set();
  roles.forEach((role) => {
    if (typeof role === "string" && role.trim()) {
      normalized.add(role.trim().toLowerCase());
    }
  });
  return Array.from(normalized);
}
function normalizeCapabilities(capabilities) {
  _metrics.normalizations++;
  if (!Array.isArray(capabilities)) return [];
  const normalized = /* @__PURE__ */ new Set();
  capabilities.forEach((cap) => {
    if (typeof cap === "string" && cap.trim()) {
      normalized.add(cap.trim().toLowerCase());
    }
  });
  return Array.from(normalized);
}
function calculateUserLevel(roles) {
  _metrics.levelCalculations++;
  if (!Array.isArray(roles) || roles.length === 0) return 0;
  let maxLevel = 0;
  roles.forEach((role) => {
    const normalizedRole = (role || "").toLowerCase().trim();
    const level = ROLE_LEVELS[normalizedRole] || 0;
    if (level > maxLevel) {
      maxLevel = level;
    }
  });
  return maxLevel;
}
function expandRolesWithInheritance(roles) {
  _metrics.roleExpansions++;
  if (!Array.isArray(roles)) return [];
  const expanded = new Set(roles);
  roles.forEach((role) => {
    const normalizedRole = (role || "").toLowerCase().trim();
    const inherited = ROLE_HIERARCHY[normalizedRole];
    if (inherited) {
      inherited.forEach((r) => expanded.add(r));
    }
  });
  return Array.from(expanded);
}
function matchWildcard(pattern, value) {
  _metrics.wildcardMatches++;
  if (!pattern || !value) return false;
  if (pattern === value) return true;
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return value.startsWith(prefix);
  }
  if (pattern.startsWith("*")) {
    const suffix = pattern.slice(1);
    return value.endsWith(suffix);
  }
  return false;
}
function normalizeUserFromSession(user) {
  _metrics.sessionNormalizations++;
  if (!user) return null;
  return { id: user.id || user.userId || null, roles: normalizeRoles(user.roles || (user.role ? [user.role] : [])), capabilities: normalizeCapabilities(user.capabilities || user.permissions || []), scopes: user.scopes || [], level: user.level || calculateUserLevel(user.roles || []) };
}
function validatePolicyShape(policy) {
  _metrics.policyValidations++;
  if (!policy || typeof policy !== "object") {
    return { valid: false, error: "Policy must be an object" };
  }
  if (!Array.isArray(policy.roles)) {
    return { valid: false, error: "Policy.roles must be an array" };
  }
  if (typeof policy.minLevel !== "number") {
    return { valid: false, error: "Policy.minLevel must be a number" };
  }
  return { valid: true };
}
function generateId(prefix = "perm") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, roleLevelsSource: "contract.js (LEVELS)", roleLevelsCount: Object.keys(ROLE_LEVELS).length, roleHierarchyCount: Object.keys(ROLE_HIERARCHY).length, metrics: { ..._metrics }, availableFunctions: ["deepClone", "normalizeRoles", "normalizeCapabilities", "calculateUserLevel", "expandRolesWithInheritance", "matchWildcard", "normalizeUserFromSession", "validatePolicyShape", "generateId"], timestamp: Date.now() };
}
function healthCheck() {
  const checks = { roleLevelsAvailable: Object.keys(ROLE_LEVELS).length > 0, roleHierarchyAvailable: Object.keys(ROLE_HIERARCHY).length > 0, levelsMatchContract: ROLE_LEVELS === LEVELS || JSON.stringify(ROLE_LEVELS) === JSON.stringify(LEVELS), functionsAvailable: typeof normalizeRoles === "function" && typeof calculateUserLevel === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed === total, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var helpers_default = { ROLE_LEVELS, ROLE_HIERARCHY, deepClone, normalizeRoles, normalizeCapabilities, calculateUserLevel, expandRolesWithInheritance, matchWildcard, normalizeUserFromSession, validatePolicyShape, generateId, getVersion, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ROLE_HIERARCHY,
  ROLE_LEVELS,
  VERSION,
  calculateUserLevel,
  deepClone,
  helpers_default as default,
  expandRolesWithInheritance,
  generateId,
  getVersion,
  healthCheck,
  info,
  matchWildcard,
  normalizeCapabilities,
  normalizeRoles,
  normalizeUserFromSession,
  validatePolicyShape
};
