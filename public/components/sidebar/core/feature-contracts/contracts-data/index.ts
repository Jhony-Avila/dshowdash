// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-contracts-data
// PURPOSE: Sidebar Feature Contracts Data - Aggregator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CORE_CONTRACTS from ./core.js
//   UI_CONTRACTS from ./ui.js
//   SEARCH_CONTRACTS from ./search.js
//   NAVIGATION_CONTRACTS from ./navigation.js
//   DATA_CONTRACTS from ./data.js
//   ACCESSIBILITY_CONTRACTS from ./accessibility.js
//   VISUAL_CONTRACTS from ./visual.js
//   PERFORMANCE_CONTRACTS from ./performance.js
//   DEBUG_CONTRACTS from ./debug.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FEATURE_CONTRACTS — exported value
//   getCategoryInfo() — exported function
//   CORE_CONTRACTS — exported value
//   UI_CONTRACTS — exported value
//   SEARCH_CONTRACTS — exported value
//   NAVIGATION_CONTRACTS — exported value
//   DATA_CONTRACTS — exported value
//   ACCESSIBILITY_CONTRACTS — exported value
//   VISUAL_CONTRACTS — exported value
//   PERFORMANCE_CONTRACTS — exported value
//   DEBUG_CONTRACTS — exported value
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

import { CORE_CONTRACTS } from './core.js';
import { UI_CONTRACTS } from './ui.js';
import { SEARCH_CONTRACTS } from './search.js';
import { NAVIGATION_CONTRACTS } from './navigation.js';
import { DATA_CONTRACTS } from './data.js';
import { ACCESSIBILITY_CONTRACTS } from './accessibility.js';
import { VISUAL_CONTRACTS } from './visual.js';
import { PERFORMANCE_CONTRACTS } from './performance.js';
import { DEBUG_CONTRACTS } from './debug.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'sidebar-feature-contracts-data';

export const FEATURE_CONTRACTS = Object.freeze(Object.assign({},
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

export {
  CORE_CONTRACTS,
  UI_CONTRACTS,
  SEARCH_CONTRACTS,
  NAVIGATION_CONTRACTS,
  DATA_CONTRACTS,
  ACCESSIBILITY_CONTRACTS,
  VISUAL_CONTRACTS,
  PERFORMANCE_CONTRACTS,
  DEBUG_CONTRACTS
};

export function getCategoryInfo() {
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

export default FEATURE_CONTRACTS;
