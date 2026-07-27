// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-contracts
// PURPOSE: Sidebar Feature Contracts - Enterprise Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CATEGORIES from ./categories.js
//   FEATURE_CONTRACTS from ./contracts-data/index.js
//   getFeatureNames, getContract, getFeatureMethods,
//     findFeatureByLegacyMethod, getAllLegacyMappings,
//     validateContracts, getFeaturesByCategory,
//     getMethodSignature from ./queries.js
//   info, healthCheck, getStatsByCategory from ./telemetry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CATEGORIES_VERSION — exported value
//   CATEGORIES_MODULE_ID — exported value
//   CATEGORIES — exported value
//   DATA_VERSION — exported value
//   DATA_MODULE_ID — exported value
//   FEATURE_CONTRACTS — exported value
//   QUERIES_VERSION — exported value
//   QUERIES_MODULE_ID — exported value
//   getFeatureNames — exported value
//   getContract — exported value
//   getFeatureMethods — exported value
//   findFeatureByLegacyMethod — exported value
//   getAllLegacyMappings — exported value
//   validateContracts — exported value
//   getFeaturesByCategory — exported value
//   getMethodSignature — exported value
//   TELEMETRY_VERSION — exported value
//   TELEMETRY_MODULE_ID — exported value
//   info — exported value
//   healthCheck — exported value
//   getStatsByCategory — exported value
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

// Re-export all from submodules
export { VERSION as CATEGORIES_VERSION, MODULE_ID as CATEGORIES_MODULE_ID, CATEGORIES } from './categories.js';
export { VERSION as DATA_VERSION, MODULE_ID as DATA_MODULE_ID, FEATURE_CONTRACTS } from './contracts-data/index.js';
export {
  VERSION as QUERIES_VERSION,
  MODULE_ID as QUERIES_MODULE_ID,
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature
} from './queries.js';
export {
  VERSION as TELEMETRY_VERSION,
  MODULE_ID as TELEMETRY_MODULE_ID,
  info,
  healthCheck,
  getStatsByCategory
} from './telemetry.js';

// Main module metadata
export const VERSION = '1.0.1-FIX';
export const MODULE_ID = 'sidebar-feature-contracts';

// Default export for backward compatibility
import { CATEGORIES } from './categories.js';
import { FEATURE_CONTRACTS } from './contracts-data/index.js';
import {
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature
} from './queries.js';
import { info, healthCheck, getStatsByCategory } from './telemetry.js';

export default {
  VERSION,
  MODULE_ID,
  CATEGORIES,
  FEATURE_CONTRACTS,
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature,
  info,
  healthCheck,
  getStatsByCategory
};
