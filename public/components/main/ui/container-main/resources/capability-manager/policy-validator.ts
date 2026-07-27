// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: policy-validator
// PURPOSE: Policy Validator - Validação de políticas de capacidades
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DENIAL_REASONS, CAPABILITY_POLICIES from ./constants.js
//
// PROVIDES:
//   createPolicyValidator() — exported function
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

import { DENIAL_REASONS, CAPABILITY_POLICIES } from './constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.capability-manager.policy-validator';

export function createPolicyValidator(options: Record<string, any> = {}) {
  const {
    policy = CAPABILITY_POLICIES.ON_DEMAND,
    whitelist = [],
    blacklist = [],
    platformConfig
  } = options;

  return {
    // Verifica se capacidade está disponível na plataforma
    isPlatformCapabilityAvailable(capability: string) {
      const config = platformConfig?.[capability];
      return config?.available === true;
    },

    // Verifica limite de concorrência
    checkConcurrencyLimit(capability: string, currentCount: unknown) {
      const config = platformConfig?.[capability];
      if (!config) return true;
      // @ts-expect-error strict migration — TS18046
      return currentCount < config.maxConcurrent;
    },

    // Aplica política
    applyPolicy(panelId: string, capability: string) {
      switch (policy) {
        case CAPABILITY_POLICIES.ALLOW_ALL:
          return { allowed: true };
        
        case CAPABILITY_POLICIES.DENY_ALL:
          return { allowed: false, reason: DENIAL_REASONS.POLICY };
        
        case CAPABILITY_POLICIES.WHITELIST:
          if (!whitelist.includes(capability)) {
            return { allowed: false, reason: DENIAL_REASONS.POLICY };
          }
          return { allowed: true };
        
        case CAPABILITY_POLICIES.BLACKLIST:
          if (blacklist.includes(capability)) {
            return { allowed: false, reason: DENIAL_REASONS.POLICY };
          }
          return { allowed: true };
        
        case CAPABILITY_POLICIES.ON_DEMAND:
        default:
          return { allowed: true };
      }
    },

    // Valida request completo
    validateRequest(panelId: string, capability: string, currentCount: unknown) {
      // Disponível na plataforma?
      if (!this.isPlatformCapabilityAvailable(capability)) {
        return { valid: false, reason: DENIAL_REASONS.NOT_AVAILABLE };
      }

      // Verifica política
      const policyResult = this.applyPolicy(panelId, capability);
      if (!policyResult.allowed) {
        return { valid: false, reason: policyResult.reason };
      }

      // Verifica limite de concorrência
      if (!this.checkConcurrencyLimit(capability, currentCount)) {
        return { valid: false, reason: DENIAL_REASONS.RESOURCE_LIMIT };
      }

      return { valid: true };
    },

    getPolicy() {
      return policy;
    }
  };
}

export default { createPolicyValidator };
