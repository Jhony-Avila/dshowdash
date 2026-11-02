// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.6.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies
// PURPOSE: Barrel Export - Exportações centralizadas das policies
// ───────────────────────────────────────────────────────────────
// @contract BARREL_FILE - Consolidates all policy exports
// @contract P2_COMPLIANT - Policies atualizadas para ENTERPRISE
// ───────────────────────────────────────────────────────────────
// EXPORTS:
//   InputPolicyContract — contrato de input
//   InputPolicyManager — gerenciador de input
//   NavigationContract — contrato de navegação
//   EventBusContract — contrato do EventBus
//   GlobalStateAccessPolicy — política de acesso ao GlobalState
//   NavigationAccessPolicy — política de acesso à navegação
//   initAll(options) — inicializa todas as policies
//   healthCheck() — status agregado de saúde
//   info() — informações do módulo
//
// @changelog v8.6.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v8.5.0-P2-ENTERPRISE: Added initAll() for initialization
// @changelog v8.4.0-P2-ENTERPRISE: Added NavigationAccessPolicy
// @changelog v8.3.0-P1-ENTERPRISE: Added GlobalStateAccessPolicy
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'core.policies';
export const VERSION = '8.6.0-P2-ENTERPRISE';

export { default as InputPolicyContract } from './input-policy-contract.js';
export { default as InputPolicyManager } from './input-policy-manager.js';
export { default as NavigationContract } from './navigation-contract.js';
export { default as EventBusContract } from './eventbus-contract.js';
export { default as GlobalStateAccessPolicy } from './globalstate-access-policy.js';
export { default as NavigationAccessPolicy } from './navigation-access-policy.js';

import GlobalStateAccessPolicy from './globalstate-access-policy.js';
import NavigationAccessPolicy from './navigation-access-policy.js';

/**
 * Inicializa todas as policies
 * @param {Object} options - Opções de configuração
 * @param {Object} options.ports - Ports para injeção
 * @param {string} options.enforcementLevel - Nível de enforcement ('silent' | 'warn' | 'block')
 * @returns {Object}
 */
export function initAll(options: Record<string, unknown> = {}) {
  const results: {
    globalStateAccessPolicy: Record<string, unknown> | null;
    navigationAccessPolicy: Record<string, unknown> | null;
    errors: Record<string, unknown>[];
  } = {
    globalStateAccessPolicy: null,
    navigationAccessPolicy: null,
    errors: []
  };

  try {
    if (options.ports) {
      GlobalStateAccessPolicy.injectPorts(options.ports as Record<string, unknown>);
      NavigationAccessPolicy.injectPorts(options.ports as Record<string, unknown>);
    }

    results.globalStateAccessPolicy = GlobalStateAccessPolicy.init({
      enforcementLevel: options.enforcementLevel || 'warn'
    });

    results.navigationAccessPolicy = NavigationAccessPolicy.init({
      enforcementLevel: options.enforcementLevel || 'warn',
      featureFlags: options.featureFlags
    });
  } catch (e: any) {
    results.errors.push({ module: 'initAll', error: e.message });
  }

  return {
    ok: results.errors.length === 0,
    version: VERSION,
    results
  };
}

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, hasInitAll: true });

export const healthCheck = () => {
  const gsHealth = GlobalStateAccessPolicy.healthCheck();
  const navHealth = NavigationAccessPolicy.healthCheck();

  const status = (gsHealth.status === 'HEALTHY' && navHealth.status === 'HEALTHY')
    ? 'HEALTHY'
    : (gsHealth.status === 'UNHEALTHY' || navHealth.status === 'UNHEALTHY')
      ? 'UNHEALTHY'
      : 'DEGRADED';

  return {
    status,
    moduleId: MODULE_ID,
    version: VERSION,
    policies: {
      globalStateAccessPolicy: gsHealth,
      navigationAccessPolicy: navHealth
    }
  };
};
