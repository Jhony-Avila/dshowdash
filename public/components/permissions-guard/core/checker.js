const VERSION = "2.1.0-ENTERPRISE";
const MODULE_ID = "permissions-guard:checker";
import * as PolicyManager from "./policies.js";
import * as _permissionsStoreRaw from "../state/store.js";
const permissionsStore = _permissionsStoreRaw.permissionsStore;
const PERMISSIONS_EVENTS = {
  PERMISSION_CHECK: "permissions:check",
  PERMISSION_DENIED: "permissions:denied",
  PERMISSION_GRANTED: "permissions:granted"
};
const DENY_REASONS = {
  NO_POLICY: "NO_POLICY",
  NO_POLICY_STRICT: "NO_POLICY_STRICT",
  MISSING_ROLE: "MISSING_ROLE",
  INSUFFICIENT_LEVEL: "INSUFFICIENT_LEVEL",
  UARPS_DENIED: "UARPS_DENIED"
};
let _metrics = {
  checks: 0,
  allowed: 0,
  denied: 0,
  deniedByReason: {
    [DENY_REASONS.NO_POLICY]: 0,
    [DENY_REASONS.NO_POLICY_STRICT]: 0,
    [DENY_REASONS.MISSING_ROLE]: 0,
    [DENY_REASONS.INSUFFICIENT_LEVEL]: 0,
    [DENY_REASONS.UARPS_DENIED]: 0
  }
};
let _userTriggers = [];
let _uarpsEnabled = false;
function _getTracker() {
  if (typeof window !== "undefined" && window.TelemetryTracker) {
    return window.TelemetryTracker;
  }
  return { track: () => {
  } };
}
function expandRolesWithInheritance(roles) {
  const roleHierarchy = {
    super_admin: ["admin", "moderator", "user"],
    admin: ["moderator", "user"],
    moderator: ["user"],
    user: []
  };
  const expanded = new Set(roles);
  roles.forEach((role) => {
    const inherited = roleHierarchy[role] || [];
    inherited.forEach((r) => expanded.add(r));
  });
  return Array.from(expanded);
}
function matchWildcard(pattern, value) {
  if (pattern === "*") return true;
  if (pattern === value) return true;
  if (pattern.includes("*")) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    return regex.test(value);
  }
  return false;
}
function setUserTriggers(triggers) {
  _userTriggers = triggers || [];
  _uarpsEnabled = _userTriggers.length > 0;
}
function hasUARPSTrigger(trigger) {
  if (!_uarpsEnabled || !trigger) return null;
  return _userTriggers.includes(trigger);
}
function can(action) {
  _metrics.checks++;
  const policy = PolicyManager.get(action);
  const tracker = _getTracker();
  if (!policy) {
    _metrics.allowed++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_CHECK, { action, allowed: true, reason: "no_policy" });
    return true;
  }
  if (policy._deny) {
    _metrics.denied++;
    _metrics.deniedByReason[DENY_REASONS.NO_POLICY_STRICT]++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason: DENY_REASONS.NO_POLICY_STRICT });
    return false;
  }
  if (policy.uarps_trigger) {
    const uarpsResult = hasUARPSTrigger(policy.uarps_trigger);
    if (uarpsResult !== null) {
      if (uarpsResult) {
        _metrics.allowed++;
        tracker.track(PERMISSIONS_EVENTS.PERMISSION_GRANTED, { action, method: "uarps" });
        return true;
      } else {
        _metrics.denied++;
        _metrics.deniedByReason[DENY_REASONS.UARPS_DENIED]++;
        tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason: DENY_REASONS.UARPS_DENIED });
        return false;
      }
    }
  }
  const userRoles = permissionsStore.getRoles();
  const expandedRoles = expandRolesWithInheritance(userRoles);
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = policy.roles.some((role) => expandedRoles.some((userRole) => matchWildcard(role, userRole)));
  const hasLevel = userLevel >= (policy.minLevel || 0);
  const allowed = hasRole && hasLevel;
  if (allowed) {
    _metrics.allowed++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_GRANTED, { action, method: "role_level" });
  } else {
    _metrics.denied++;
    const reason = !hasRole ? DENY_REASONS.MISSING_ROLE : DENY_REASONS.INSUFFICIENT_LEVEL;
    _metrics.deniedByReason[reason]++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason, userLevel, requiredLevel: policy.minLevel });
  }
  return allowed;
}
function canAll(actions) {
  if (!Array.isArray(actions)) return false;
  return actions.every((action) => can(action));
}
function canAny(actions) {
  if (!Array.isArray(actions)) return false;
  return actions.some((action) => can(action));
}
function checkWithReason(action) {
  const policy = PolicyManager.get(action);
  if (!policy) {
    return { allowed: true, reason: "NO_POLICY", method: "permissive" };
  }
  if (policy._deny) {
    return { allowed: false, reason: DENY_REASONS.NO_POLICY_STRICT };
  }
  if (policy.uarps_trigger) {
    const uarpsResult = hasUARPSTrigger(policy.uarps_trigger);
    if (uarpsResult !== null) {
      return {
        allowed: uarpsResult,
        reason: uarpsResult ? "UARPS_ALLOWED" : DENY_REASONS.UARPS_DENIED,
        method: "uarps",
        trigger: policy.uarps_trigger
      };
    }
  }
  const userRoles = permissionsStore.getRoles();
  const expandedRoles = expandRolesWithInheritance(userRoles);
  const userLevel = permissionsStore.getUserLevel();
  const hasRole = policy.roles.some((role) => expandedRoles.some((userRole) => matchWildcard(role, userRole)));
  const hasLevel = userLevel >= (policy.minLevel || 0);
  if (!hasRole) {
    return {
      allowed: false,
      reason: DENY_REASONS.MISSING_ROLE,
      requiredRoles: policy.roles,
      userRoles: expandedRoles
    };
  }
  if (!hasLevel) {
    return {
      allowed: false,
      reason: DENY_REASONS.INSUFFICIENT_LEVEL,
      requiredLevel: policy.minLevel,
      userLevel
    };
  }
  return {
    allowed: true,
    reason: "ROLE_AND_LEVEL",
    method: "fallback"
  };
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = {
    checks: 0,
    allowed: 0,
    denied: 0,
    deniedByReason: {
      [DENY_REASONS.NO_POLICY]: 0,
      [DENY_REASONS.NO_POLICY_STRICT]: 0,
      [DENY_REASONS.MISSING_ROLE]: 0,
      [DENY_REASONS.INSUFFICIENT_LEVEL]: 0,
      [DENY_REASONS.UARPS_DENIED]: 0
    }
  };
}
function healthCheck() {
  return {
    status: "healthy",
    metrics: getMetrics(),
    uarpsEnabled: _uarpsEnabled,
    userTriggersCount: _userTriggers.length,
    version: VERSION
  };
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    uarpsEnabled: _uarpsEnabled,
    uarps_mode: "hybrid"
  };
}
var checker_default = {
  VERSION,
  MODULE_ID,
  DENY_REASONS,
  setUserTriggers,
  hasUARPSTrigger,
  can,
  canAll,
  canAny,
  checkWithReason,
  expandRolesWithInheritance,
  matchWildcard,
  getMetrics,
  resetMetrics,
  healthCheck,
  getVersion,
  info
};
export {
  MODULE_ID,
  VERSION,
  can,
  canAll,
  canAny,
  checkWithReason,
  checker_default as default,
  getMetrics,
  getVersion,
  hasUARPSTrigger,
  healthCheck,
  info,
  resetMetrics,
  setUserTriggers
};
