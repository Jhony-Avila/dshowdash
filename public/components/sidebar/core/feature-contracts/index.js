import { VERSION, MODULE_ID, CATEGORIES } from "./categories.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, FEATURE_CONTRACTS } from "./contracts-data/index.js";
import {
  VERSION as VERSION3,
  MODULE_ID as MODULE_ID3,
  getFeatureNames,
  getContract,
  getFeatureMethods,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  validateContracts,
  getFeaturesByCategory,
  getMethodSignature
} from "./queries.js";
import {
  VERSION as VERSION4,
  MODULE_ID as MODULE_ID4,
  info,
  healthCheck,
  getStatsByCategory
} from "./telemetry.js";
const VERSION5 = "1.0.1-FIX";
const MODULE_ID5 = "sidebar-feature-contracts";
import { CATEGORIES as CATEGORIES2 } from "./categories.js";
import { FEATURE_CONTRACTS as FEATURE_CONTRACTS2 } from "./contracts-data/index.js";
import {
  getFeatureNames as getFeatureNames2,
  getContract as getContract2,
  getFeatureMethods as getFeatureMethods2,
  findFeatureByLegacyMethod as findFeatureByLegacyMethod2,
  getAllLegacyMappings as getAllLegacyMappings2,
  validateContracts as validateContracts2,
  getFeaturesByCategory as getFeaturesByCategory2,
  getMethodSignature as getMethodSignature2
} from "./queries.js";
import { info as info2, healthCheck as healthCheck2, getStatsByCategory as getStatsByCategory2 } from "./telemetry.js";
var feature_contracts_default = {
  VERSION: VERSION5,
  MODULE_ID: MODULE_ID5,
  CATEGORIES: CATEGORIES2,
  FEATURE_CONTRACTS: FEATURE_CONTRACTS2,
  getFeatureNames: getFeatureNames2,
  getContract: getContract2,
  getFeatureMethods: getFeatureMethods2,
  findFeatureByLegacyMethod: findFeatureByLegacyMethod2,
  getAllLegacyMappings: getAllLegacyMappings2,
  validateContracts: validateContracts2,
  getFeaturesByCategory: getFeaturesByCategory2,
  getMethodSignature: getMethodSignature2,
  info: info2,
  healthCheck: healthCheck2,
  getStatsByCategory: getStatsByCategory2
};
export {
  CATEGORIES,
  MODULE_ID as CATEGORIES_MODULE_ID,
  VERSION as CATEGORIES_VERSION,
  MODULE_ID2 as DATA_MODULE_ID,
  VERSION2 as DATA_VERSION,
  FEATURE_CONTRACTS,
  MODULE_ID5 as MODULE_ID,
  MODULE_ID3 as QUERIES_MODULE_ID,
  VERSION3 as QUERIES_VERSION,
  MODULE_ID4 as TELEMETRY_MODULE_ID,
  VERSION4 as TELEMETRY_VERSION,
  VERSION5 as VERSION,
  feature_contracts_default as default,
  findFeatureByLegacyMethod,
  getAllLegacyMappings,
  getContract,
  getFeatureMethods,
  getFeatureNames,
  getFeaturesByCategory,
  getMethodSignature,
  getStatsByCategory,
  healthCheck,
  info,
  validateContracts
};
