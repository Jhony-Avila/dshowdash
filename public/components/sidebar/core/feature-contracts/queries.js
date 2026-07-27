import { FEATURE_CONTRACTS as _FEATURE_CONTRACTS } from "./contracts-data/index.js";
const FEATURE_CONTRACTS = _FEATURE_CONTRACTS;
const VERSION = "1.0.1-FIX";
const MODULE_ID = "sidebar-feature-contracts-queries";
function getFeatureNames() {
  return Object.keys(FEATURE_CONTRACTS);
}
function getContract(featureName) {
  return FEATURE_CONTRACTS[featureName] || null;
}
function getFeatureMethods(featureName) {
  const contract = FEATURE_CONTRACTS[featureName];
  return contract ? Object.keys(contract.methods) : [];
}
function findFeatureByLegacyMethod(legacyMethodName) {
  for (const [featureName, contract] of Object.entries(FEATURE_CONTRACTS)) {
    if (contract.legacyMethods && contract.legacyMethods[legacyMethodName]) {
      return { feature: featureName, method: contract.legacyMethods[legacyMethodName], contract };
    }
  }
  return null;
}
function getAllLegacyMappings() {
  const mappings = {};
  for (const [featureName, contract] of Object.entries(FEATURE_CONTRACTS)) {
    if (contract.legacyMethods) {
      for (const [legacy, modern] of Object.entries(contract.legacyMethods)) {
        mappings[legacy] = { feature: featureName, method: modern };
      }
    }
  }
  return mappings;
}
function validateContracts() {
  const issues = [];
  for (const [name, contract] of Object.entries(FEATURE_CONTRACTS)) {
    if (!contract.module) issues.push({ feature: name, error: "Missing module" });
    if (!contract.methods || Object.keys(contract.methods).length === 0) {
      issues.push({ feature: name, error: "No methods defined" });
    }
  }
  return { valid: issues.length === 0, issues, totalFeatures: Object.keys(FEATURE_CONTRACTS).length };
}
function getFeaturesByCategory(category) {
  return Object.entries(FEATURE_CONTRACTS).filter(([, contract]) => contract.category === category).map(([name]) => name);
}
function getMethodSignature(featureName, methodName) {
  const contract = FEATURE_CONTRACTS[featureName];
  if (!contract || !contract.methods[methodName]) return null;
  return contract.methods[methodName];
}
var queries_default = {
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature
};
export {
  MODULE_ID,
  VERSION,
  queries_default as default,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  getContract,
  getFeatureMethods,
  getFeatureNames,
  getFeaturesByCategory,
  getMethodSignature,
  validateContracts
};
