// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-contracts-telemetry
// PURPOSE: Sidebar Feature Contracts Telemetry - Enterprise Observability
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FEATURE_CONTRACTS from ./contracts-data/index.js
//   CATEGORIES from ./categories.js
//   validateContracts, getAllLegacyMappings from ./queries.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   getStatsByCategory() — exported function
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

import { FEATURE_CONTRACTS } from './contracts-data/index.js';
import { CATEGORIES } from './categories.js';
import { validateContracts, getAllLegacyMappings } from './queries.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.1-FIX';
export const MODULE_ID = 'sidebar-feature-contracts-telemetry';

// Info - Module introspection
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: Object.keys(FEATURE_CONTRACTS).length,

    // @ts-expect-error TS migration - TS2339, TS2365
    totalMethods: Object.values(FEATURE_CONTRACTS).reduce((acc, c) => acc + Object.keys(c.methods).length, 0),
    totalLegacyMappings: Object.keys(getAllLegacyMappings()).length,
    categories: Object.values(CATEGORIES),
    validation: validateContracts()
  };
}

// Health Check - Module health status
export function healthCheck() {
  const validation = validateContracts();
  return {
    status: validation.valid ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    validation,
    timestamp: Date.now()
  };
}

// Get statistics by category
export function getStatsByCategory() {
  const stats = {};
  for (const category of Object.values(CATEGORIES)) {
    (stats as DynObj)[category] = {
      features: 0,
      methods: 0
    };
  }
  for (const contract of Object.values(FEATURE_CONTRACTS)) {

    // @ts-expect-error TS migration - TS2339
    if (stats[contract.category]) {
      (stats as DynObj)[(contract as any).category].features++;

      // @ts-expect-error TS migration - TS2339
      stats[contract.category].methods += Object.keys(contract.methods).length;
    }
  }
  return stats;
}

export default {
  info,
  healthCheck,
  getStatsByCategory
};
