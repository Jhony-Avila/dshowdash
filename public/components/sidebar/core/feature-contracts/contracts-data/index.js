import { CORE_CONTRACTS } from "./core.js";
import { UI_CONTRACTS } from "./ui.js";
import { SEARCH_CONTRACTS } from "./search.js";
import { NAVIGATION_CONTRACTS } from "./navigation.js";
import { DATA_CONTRACTS } from "./data.js";
import { ACCESSIBILITY_CONTRACTS } from "./accessibility.js";
import { VISUAL_CONTRACTS } from "./visual.js";
import { PERFORMANCE_CONTRACTS } from "./performance.js";
import { DEBUG_CONTRACTS } from "./debug.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "sidebar-feature-contracts-data";
const FEATURE_CONTRACTS = Object.freeze(Object.assign(
  {},
  CORE_CONTRACTS,
  UI_CONTRACTS,
  SEARCH_CONTRACTS,
  NAVIGATION_CONTRACTS,
  DATA_CONTRACTS,
  ACCESSIBILITY_CONTRACTS,
  VISUAL_CONTRACTS,
  PERFORMANCE_CONTRACTS,
  DEBUG_CONTRACTS
));
function getCategoryInfo() {
  return {
    core: { count: Object.keys(CORE_CONTRACTS).length, features: Object.keys(CORE_CONTRACTS) },
    ui: { count: Object.keys(UI_CONTRACTS).length, features: Object.keys(UI_CONTRACTS) },
    search: { count: Object.keys(SEARCH_CONTRACTS).length, features: Object.keys(SEARCH_CONTRACTS) },
    navigation: { count: Object.keys(NAVIGATION_CONTRACTS).length, features: Object.keys(NAVIGATION_CONTRACTS) },
    data: { count: Object.keys(DATA_CONTRACTS).length, features: Object.keys(DATA_CONTRACTS) },
    accessibility: { count: Object.keys(ACCESSIBILITY_CONTRACTS).length, features: Object.keys(ACCESSIBILITY_CONTRACTS) },
    visual: { count: Object.keys(VISUAL_CONTRACTS).length, features: Object.keys(VISUAL_CONTRACTS) },
    performance: { count: Object.keys(PERFORMANCE_CONTRACTS).length, features: Object.keys(PERFORMANCE_CONTRACTS) },
    debug: { count: Object.keys(DEBUG_CONTRACTS).length, features: Object.keys(DEBUG_CONTRACTS) }
  };
}
var contracts_data_default = FEATURE_CONTRACTS;
export {
  ACCESSIBILITY_CONTRACTS,
  CORE_CONTRACTS,
  DATA_CONTRACTS,
  DEBUG_CONTRACTS,
  FEATURE_CONTRACTS,
  MODULE_ID,
  NAVIGATION_CONTRACTS,
  PERFORMANCE_CONTRACTS,
  SEARCH_CONTRACTS,
  UI_CONTRACTS,
  VERSION,
  VISUAL_CONTRACTS,
  contracts_data_default as default,
  getCategoryInfo
};
