// Bootstrap Phases Index
// DEPENDENCY CONTRACT (3.1.0-ENTERPRISE) — BARREL FILE
// @version 3.1.0-ENTERPRISE
// @changelog v3.1.0: ES5 conversion
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.phases';

export { default as phase0 } from './phase-0-critical.js';
export { default as phase1 } from './phase-1-core.js';
export { default as phase2 } from './phase-2-auth.js';
export { default as phase3 } from './phase-3-shell.js';
export { default as phase4 } from './phase-4-main.js';
export { default as phase5 } from './phase-5-ui.js';
export { default as phase6 } from './phase-6-platform.js';

const PHASES = ['phase-0-critical', 'phase-1-core', 'phase-2-auth', 'phase-3-shell', 'phase-4-main', 'phase-5-ui', 'phase-6-platform'];

export { PHASES };
export default { PHASES: PHASES };
