// Phase 4 Module - Barrel Export
// DEPENDENCY CONTRACT (4.2.0-MODULAR) — BARREL FILE
// @version 4.2.0-MODULAR
'use strict';

export { VERSION, MODULE_ID, BOOT_CONFIG } from './constants.js';
export { createPortsManager } from './ports-manager.js';
export { createAuthDetector } from './auth-detector.js';
export { createAuthListener } from './auth-listener.js';
export { detectExistingContainer } from './container-detector.js';
export { createMainMounter } from './main-mounter.js';
export { createContainerMounter } from './container-mounter.js';
export { createBootstrapBoot } from './bootstrap-boot.js';
