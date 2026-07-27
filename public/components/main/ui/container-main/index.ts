// ═══════════════════════════════════════════════════════════════
// container-main/index.js — Enterprise Barrel (non-circular)
// ═══════════════════════════════════════════════════════════════
// PURPOSE: Re-export from source modules (NOT from dist/bundle)
// FIXES: Circular dependency that prevented Vite rebuild
// ═══════════════════════════════════════════════════════════════
'use strict';

// Bootstrap (boot, getBootstrap, BOOTSTRAP_STATES)
export { boot, getBootstrap, resetBootstrap, BOOTSTRAP_STATES, VERSION as BOOTSTRAP_VERSION, MODULE_ID as BOOTSTRAP_MODULE_ID } from './bootstrap/index.js';

// Adaptive Kernel
export { createAdaptiveKernel, KERNEL_STATES, VERSION as KERNEL_VERSION, MODULE_ID as KERNEL_MODULE_ID } from './adaptive-kernel.js';

// Container Factory
export { createContainer } from './container-factory.js';

// Config
export { FEATURES, TIMEOUTS, LIMITS, MODE, ENV, DEFAULT_OPTIONS, validateMode, getModeRisks, mergeOptions, generateContainerId } from './config.js';

// Init Components
export { initComponents, initComponentsAsync } from './init-components.js';

// Core barrel
export * from './core/index.js';

// Utils barrel

// @ts-expect-error TS migration - TS2308
export * from './utils/index.js';

// Resources barrel

// @ts-expect-error TS migration - TS2308
export * from './resources/index.js';

// Components barrel

// @ts-expect-error TS migration - TS2308
export * from './components/index.js';

// Adapters

// @ts-expect-error TS migration - TS2308
export * from './adapters/global-state-adapter.js';

// Bootstrap Integration

// @ts-expect-error TS migration - TS2308
export * from './bootstrap-integration/index.js';

// Default export — minimal facade for backward compat
import { boot, getBootstrap, BOOTSTRAP_STATES } from './bootstrap/index.js';
import { createAdaptiveKernel, KERNEL_STATES } from './adaptive-kernel.js';
import { createContainer } from './container-factory.js';

export default {
  boot,
  getBootstrap,
  BOOTSTRAP_STATES,
  createAdaptiveKernel,
  createKernel: createAdaptiveKernel,
  KERNEL_STATES,
  createContainer
};
