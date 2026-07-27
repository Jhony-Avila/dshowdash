// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:capability-manager:constants
// PURPOSE: Capability Manager - Constantes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CAPABILITY_STATUS — exported value
//   DENIAL_REASONS — exported value
//   CAPABILITY_POLICIES — exported value
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:capability-manager:constants';

// Estados de capacidade
export const CAPABILITY_STATUS = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  PENDING: 'pending',
  REVOKED: 'revoked',
  NOT_REQUESTED: 'not-requested'
});

// Razões para negação
export const DENIAL_REASONS = Object.freeze({
  NOT_AVAILABLE: 'not-available',
  RESOURCE_LIMIT: 'resource-limit',
  SECURITY: 'security',
  CONFLICT: 'conflict',
  POLICY: 'policy',
  MANUAL: 'manual'
});

// Políticas de capacidade
export const CAPABILITY_POLICIES = Object.freeze({
  ALLOW_ALL: 'allow-all',
  DENY_ALL: 'deny-all',
  WHITELIST: 'whitelist',
  BLACKLIST: 'blacklist',
  ON_DEMAND: 'on-demand'
});

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    statuses: Object.keys(CAPABILITY_STATUS),
    reasons: Object.keys(DENIAL_REASONS),
    policies: Object.keys(CAPABILITY_POLICIES)
  };
}

export default {
  VERSION,
  MODULE_ID,
  CAPABILITY_STATUS,
  DENIAL_REASONS,
  CAPABILITY_POLICIES,
  info
};
