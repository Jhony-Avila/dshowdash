const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.recovery";
import { attemptRecovery } from "./attempt.js";
import { registerRecoveryStrategy, removeRecoveryStrategy } from "./strategies.js";
export {
  MODULE_ID,
  VERSION,
  attemptRecovery,
  registerRecoveryStrategy,
  removeRecoveryStrategy
};
