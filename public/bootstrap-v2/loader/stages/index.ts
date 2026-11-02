// Bootstrap-V2 Loader - Stages Index
// DEPENDENCY CONTRACT (6.2.1) — BARREL FILE
// @version 6.2.1
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.loader.stages';

export { executePreBoot } from './pre-boot.js';
export { executeBootstrap } from './bootstrap.js';
export { executePostBoot } from './post-boot.js';
