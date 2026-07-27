
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: permissions-guard:checker
// PURPOSE: Permissions Guard - Checker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as PolicyManager from ./policies.js
//   * as permissionsStore from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setUserTriggers() — exported function
//   hasUARPSTrigger() — exported function
//   can() — exported function
//   canAll() — exported function
//   canAny() — exported function
//   checkWithReason() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.TelemetryTracker
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'permissions-guard:checker';

import * as PolicyManager from './policies.js';
import * as _permissionsStoreRaw from '../state/store.js';
const permissionsStore: { getRoles: () => string[]; getUserLevel: () => number } = _permissionsStoreRaw.permissionsStore as unknown as { getRoles: () => string[]; getUserLevel: () => number };

// Constantes de eventos
const PERMISSIONS_EVENTS = {
  PERMISSION_CHECK: 'permissions:check',
  PERMISSION_DENIED: 'permissions:denied',
  PERMISSION_GRANTED: 'permissions:granted'
};

// Razões de negação
const DENY_REASONS = {
  NO_POLICY: 'NO_POLICY',
  NO_POLICY_STRICT: 'NO_POLICY_STRICT',
  MISSING_ROLE: 'MISSING_ROLE',
  INSUFFICIENT_LEVEL: 'INSUFFICIENT_LEVEL',
  UARPS_DENIED: 'UARPS_DENIED'
};

// Métricas internas
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

// P3.2: Cache de triggers UARPS do usuário
let _userTriggers: string[] = [];
let _uarpsEnabled = false;

function _getTracker() {
  // Tenta obter telemetry tracker
  if (typeof window !== 'undefined' && (window as any).TelemetryTracker) {
    return (window as any).TelemetryTracker;
  }
  return { track: () => {} };
}

// Expande roles com herança
function expandRolesWithInheritance(roles: string[]) {
  const roleHierarchy: Record<string, string[]> = {
    super_admin: ['admin', 'moderator', 'user'],
    admin: ['moderator', 'user'],
    moderator: ['user'],
    user: []
  };

  const expanded = new Set(roles);

  roles.forEach((role: string) => {
    const inherited = roleHierarchy[role] || [];
    inherited.forEach((r: string) => expanded.add(r));
  });
  
  return Array.from(expanded);
}

// Match com wildcard
function matchWildcard(pattern: string, value: string) {
  if (pattern === '*') return true;
  if (pattern === value) return true;
  
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    return regex.test(value);
  }
  
  return false;
}

// P3.2: Define triggers UARPS do usuário
export function setUserTriggers(triggers: string[]) {
  _userTriggers = triggers || [];
  _uarpsEnabled = _userTriggers.length > 0;
}

// P3.2: Verifica se usuário tem trigger UARPS
export function hasUARPSTrigger(trigger: string) {
  if (!_uarpsEnabled || !trigger) return null; // null = usar fallback
  return _userTriggers.includes(trigger);
}

// P3.2: can com UARPS + fallback
export function can(action: string) {
  _metrics.checks++;
  
  const policy = PolicyManager.get(action);
  const tracker = _getTracker();
  
  // Sem policy = permitido (modo permissivo)
  if (!policy) {
    _metrics.allowed++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_CHECK, { action, allowed: true, reason: 'no_policy' });
    return true;
  }
  
  // Policy com _deny = bloqueado
  if (policy._deny) {
    _metrics.denied++;
    _metrics.deniedByReason[DENY_REASONS.NO_POLICY_STRICT]++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason: DENY_REASONS.NO_POLICY_STRICT });
    return false;
  }
  
  // P3.2: Se policy tem uarps_trigger, verifica via UARPS primeiro
  if (policy.uarps_trigger) {
    const uarpsResult = hasUARPSTrigger(policy.uarps_trigger);
    if (uarpsResult !== null) {
      if (uarpsResult) {
        _metrics.allowed++;
        tracker.track(PERMISSIONS_EVENTS.PERMISSION_GRANTED, { action, method: 'uarps' });
        return true;
      } else {
        _metrics.denied++;
        _metrics.deniedByReason[DENY_REASONS.UARPS_DENIED]++;
        tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason: DENY_REASONS.UARPS_DENIED });
        return false;
      }
    }
    // Se UARPS não disponível, continua com fallback
  }
  
  // Fallback: verifica roles e level
  const userRoles = permissionsStore.getRoles();
  const expandedRoles = expandRolesWithInheritance(userRoles);
  const userLevel = permissionsStore.getUserLevel();
  
  // Verifica roles
  const hasRole = policy.roles.some((role: string) => expandedRoles.some((userRole: string) => matchWildcard(role, userRole)));

  // P3.2: Verifica level (DEPRECATED - fallback)
  const hasLevel = userLevel >= (policy.minLevel || 0);

  const allowed = hasRole && hasLevel;

  if (allowed) {
    _metrics.allowed++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_GRANTED, { action, method: 'role_level' });
  } else {
    _metrics.denied++;
    const reason = !hasRole ? DENY_REASONS.MISSING_ROLE : DENY_REASONS.INSUFFICIENT_LEVEL;
    _metrics.deniedByReason[reason]++;
    tracker.track(PERMISSIONS_EVENTS.PERMISSION_DENIED, { action, reason, userLevel, requiredLevel: policy.minLevel });
  }

  return allowed;
}

// Verifica múltiplas ações (todas devem ser permitidas)
export function canAll(actions: string[]) {
  if (!Array.isArray(actions)) return false;
  return actions.every((action: string) => can(action));
}

// Verifica múltiplas ações (pelo menos uma deve ser permitida)
export function canAny(actions: string[]) {
  if (!Array.isArray(actions)) return false;
  return actions.some((action: string) => can(action));
}

// P3.2: Verifica com razão detalhada
export function checkWithReason(action: string) {
  const policy = PolicyManager.get(action);
  
  if (!policy) {
    return { allowed: true, reason: 'NO_POLICY', method: 'permissive' };
  }
  
  if (policy._deny) {
    return { allowed: false, reason: DENY_REASONS.NO_POLICY_STRICT };
  }
  
  // P3.2: UARPS check
  if (policy.uarps_trigger) {
    const uarpsResult = hasUARPSTrigger(policy.uarps_trigger);
    if (uarpsResult !== null) {
      return {
        allowed: uarpsResult,
        reason: uarpsResult ? 'UARPS_ALLOWED' : DENY_REASONS.UARPS_DENIED,
        method: 'uarps',
        trigger: policy.uarps_trigger
      };
    }
  }
  
  // Fallback
  const userRoles = permissionsStore.getRoles();
  const expandedRoles = expandRolesWithInheritance(userRoles);
  const userLevel = permissionsStore.getUserLevel();
  
  const hasRole = policy.roles.some((role: string) => expandedRoles.some((userRole: string) => matchWildcard(role, userRole)));

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
    reason: 'ROLE_AND_LEVEL',
    method: 'fallback'
  };
}

// ============================================
// METRICS / INFO
// ============================================

export function getMetrics() {
  return { ..._metrics };
}

export function resetMetrics() {
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

export function healthCheck() {
  return {
    status: 'healthy',
    metrics: getMetrics(),
    uarpsEnabled: _uarpsEnabled,
    userTriggersCount: _userTriggers.length,
    version: VERSION
  };
}

export function getVersion() {
  return VERSION;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    uarpsEnabled: _uarpsEnabled,
    uarps_mode: 'hybrid'
  };
}

export default {
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
