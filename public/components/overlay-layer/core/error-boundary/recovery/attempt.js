import { SEVERITY } from "../constants.js";
import { config, state, getRecoveryStrategies } from "../state.js";
import { log } from "../helpers/logger.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.recovery.attempt";
async function attemptRecovery(errorRecord) {
  const strategies = getRecoveryStrategies();
  const strategy = strategies[errorRecord.type];
  if (!strategy) return false;
  for (let attempt = 1; attempt <= config.recoverAttempts; attempt++) {
    errorRecord.recoveryAttempts = attempt;
    try {
      await new Promise((r) => setTimeout(r, config.recoverDelay * attempt));
      const result = await strategy(errorRecord);
      if (result?.recovered) {
        errorRecord.recovered = true;
        state.recoveredErrors++;
        log("info", `Error recovered after ${attempt} attempts:`, errorRecord.id);
        return true;
      }
    } catch (e) {
      log("warn", `Recovery attempt ${attempt} failed:`, e.message);
    }
  }
  if (errorRecord.severity === SEVERITY.HIGH) {
    state.fatalErrors++;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  attemptRecovery
};
