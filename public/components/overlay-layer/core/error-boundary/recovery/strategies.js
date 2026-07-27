import { ERROR_TYPES } from "../constants.js";
import { recoveryStrategies } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.recovery.strategies";
function registerRecoveryStrategy(errorType, strategy) {
  if (!ERROR_TYPES[errorType] && !Object.values(ERROR_TYPES).includes(errorType)) {
    return { ok: false, error: "invalid-error-type" };
  }
  if (typeof strategy !== "function") {
    return { ok: false, error: "strategy-must-be-function" };
  }
  recoveryStrategies[errorType] = strategy;
  return { ok: true, errorType };
}
function removeRecoveryStrategy(errorType) {
  delete recoveryStrategies[errorType];
  return { ok: true };
}
export {
  MODULE_ID,
  VERSION,
  registerRecoveryStrategy,
  removeRecoveryStrategy
};
