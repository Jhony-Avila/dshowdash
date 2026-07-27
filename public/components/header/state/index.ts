// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/state
// PURPOSE: State module index — re-exports all state submodules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   StateStore from ./store.js
//   StateUpdaters from ./updaters.js
//   StateSnapshots from ./snapshots.js
//   StateValidators from ./validators.js
// PROVIDES:
//   StateStore, StateUpdaters, StateSnapshots, StateValidators
//   modules — list of submodule names
//   info() — module info
// ═══════════════════════════════════════════════════════════════
// Header State - Module Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B01: var → const
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/state';

// State Modules
export { StateStore } from './store.js';
export { StateUpdaters } from './updaters.js';
export { StateSnapshots } from './snapshots.js';

export { default as StateValidators } from './validators.js';

// Module list
export const modules = ['store', 'updaters', 'snapshots', 'validators'];

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}

export default { VERSION, MODULE_ID, modules, info };
