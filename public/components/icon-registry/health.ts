// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.icon-registry.health
// PURPOSE: Icon Registry - Health monitoring and metadata
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract VALIDATE - validate() validates registry integrity
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   info, healthCheck from ./registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
//   info() — exported function
//   validate() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { info as registryInfo, healthCheck as registryHealth } from './registry.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'icon-registry:health';

// Health check completo
export function healthCheck() {
  const registryStatus = registryHealth();

  return {
    status: registryStatus.status,
    totalIcons: registryStatus.totalIcons,
    namespaces: registryStatus.namespaces,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now(),
    checks: {
      registryLoaded: registryStatus.totalIcons > 0,
      namespacesValid: registryStatus.namespaces.length > 0
    }
  };
}

// Info completo
export function info() {
  const registryData = registryInfo();

  return {
    ...registryData,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}

// Validação de integridade
export function validate() {
  const status = healthCheck();
  const errors = [];

  if (status.totalIcons === 0) {
    errors.push('No icons registered');
  }

  if (status.namespaces.length === 0) {
    errors.push('No namespaces registered');
  }

  return {
    valid: errors.length === 0,
    errors,
    ...status
  };
}

export default { healthCheck, info, validate };
