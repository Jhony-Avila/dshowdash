import { boot, getBootstrap, resetBootstrap, BOOTSTRAP_STATES, VERSION, MODULE_ID } from "./bootstrap/index.js";
import { createAdaptiveKernel, KERNEL_STATES, VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./adaptive-kernel.js";
import { createContainer } from "./container-factory.js";
import { FEATURES, TIMEOUTS, LIMITS, MODE, ENV, DEFAULT_OPTIONS, validateMode, getModeRisks, mergeOptions, generateContainerId } from "./config.js";
import { initComponents, initComponentsAsync } from "./init-components.js";
export * from "./core/index.js";
export * from "./utils/index.js";
export * from "./resources/index.js";
export * from "./components/index.js";
export * from "./adapters/global-state-adapter.js";
export * from "./bootstrap-integration/index.js";
import { boot as boot2, getBootstrap as getBootstrap2, BOOTSTRAP_STATES as BOOTSTRAP_STATES2 } from "./bootstrap/index.js";
import { createAdaptiveKernel as createAdaptiveKernel2, KERNEL_STATES as KERNEL_STATES2 } from "./adaptive-kernel.js";
import { createContainer as createContainer2 } from "./container-factory.js";
var container_main_default = {
  boot: boot2,
  getBootstrap: getBootstrap2,
  BOOTSTRAP_STATES: BOOTSTRAP_STATES2,
  createAdaptiveKernel: createAdaptiveKernel2,
  createKernel: createAdaptiveKernel2,
  KERNEL_STATES: KERNEL_STATES2,
  createContainer: createContainer2
};
export {
  MODULE_ID as BOOTSTRAP_MODULE_ID,
  BOOTSTRAP_STATES,
  VERSION as BOOTSTRAP_VERSION,
  DEFAULT_OPTIONS,
  ENV,
  FEATURES,
  MODULE_ID2 as KERNEL_MODULE_ID,
  KERNEL_STATES,
  VERSION2 as KERNEL_VERSION,
  LIMITS,
  MODE,
  TIMEOUTS,
  boot,
  createAdaptiveKernel,
  createContainer,
  container_main_default as default,
  generateContainerId,
  getBootstrap,
  getModeRisks,
  initComponents,
  initComponentsAsync,
  mergeOptions,
  resetBootstrap,
  validateMode
};
