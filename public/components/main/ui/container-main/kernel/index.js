import { VERSION, MODULE_ID, KERNEL_STATES } from "./constants.js";
import { createStateMachine } from "./state-machine.js";
import { createErrorHandler } from "./error-handler.js";
import { createManagerRegistry } from "./manager-registry.js";
import { initializeSubsystems, CLEANUP_STRATEGIES, MEMORY_LIMITS } from "./subsystem-initializer.js";
import { createHealthReporter } from "./health-reporter.js";
export * from "./facades/index.js";
export {
  CLEANUP_STRATEGIES,
  KERNEL_STATES,
  MEMORY_LIMITS,
  MODULE_ID,
  VERSION,
  createErrorHandler,
  createHealthReporter,
  createManagerRegistry,
  createStateMachine,
  initializeSubsystems
};
