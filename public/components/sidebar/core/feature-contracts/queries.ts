// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-FIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-contracts-queries
// PURPOSE: Sidebar Feature Contracts Queries - Enterprise Query Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FEATURE_CONTRACTS from ./contracts-data/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getFeatureNames() — exported function
//   getContract() — exported function
//   getFeatureMethods() — exported function
//   findFeatureByLegacyMethod() — exported function
//   getAllLegacyMappings() — exported function
//   validateContracts() — exported function
//   getFeaturesByCategory() — exported function
//   getMethodSignature() — exported function
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

import { FEATURE_CONTRACTS as _FEATURE_CONTRACTS } from './contracts-data/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const FEATURE_CONTRACTS: Record<string, DynObj> = _FEATURE_CONTRACTS;

export const VERSION = '1.0.1-FIX';
export const MODULE_ID = 'sidebar-feature-contracts-queries';

// Get all feature names
export function getFeatureNames() {
  return Object.keys(FEATURE_CONTRACTS);
}

// Get contract by feature name
export function getContract(featureName: string) {
  return FEATURE_CONTRACTS[featureName] || null;
}

// Get all methods for a feature
export function getFeatureMethods(featureName: string) {
  const contract = FEATURE_CONTRACTS[featureName];
  return contract ? Object.keys(contract.methods) : [];
}

// Find feature by legacy method name
export function findFeatureByLegacyMethod(legacyMethodName: string) {
  for (const [featureName, contract] of Object.entries(FEATURE_CONTRACTS) as [string, any][]) {
    if (contract.legacyMethods && contract.legacyMethods[legacyMethodName]) {
      return { feature: featureName, method: contract.legacyMethods[legacyMethodName], contract };
    }
  }
  return null;
}

// Get all legacy method mappings
export function getAllLegacyMappings() {
  const mappings: DynObj = {};
  for (const [featureName, contract] of Object.entries(FEATURE_CONTRACTS) as [string, any][]) {
    if (contract.legacyMethods) {
      for (const [legacy, modern] of Object.entries(contract.legacyMethods)) {
        (mappings)[legacy] = { feature: featureName, method: modern };
      }
    }
  }
  return mappings;
}

// Validate contract integrity
export function validateContracts() {
  const issues = [];
  for (const [name, contract] of Object.entries(FEATURE_CONTRACTS) as [string, any][]) {
    if (!contract.module) issues.push({ feature: name, error: 'Missing module' });
    if (!contract.methods || Object.keys(contract.methods).length === 0) {
      issues.push({ feature: name, error: 'No methods defined' });
    }
  }
  return { valid: issues.length === 0, issues, totalFeatures: Object.keys(FEATURE_CONTRACTS).length };
}

// Get features by category
export function getFeaturesByCategory(category: string) {
  return (Object.entries(FEATURE_CONTRACTS) as [string, any][])
    .filter(([, contract]) => contract.category === category)
    .map(([name]) => name);
}

// Get method signature
export function getMethodSignature(featureName: string, methodName: string) {
  const contract = FEATURE_CONTRACTS[featureName];
  if (!contract || !contract.methods[methodName]) return null;
  return (contract.methods as DynObj)[methodName];
}

export default {
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature
};
