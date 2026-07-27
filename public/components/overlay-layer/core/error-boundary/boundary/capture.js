import { SEVERITY } from "../constants.js";
import { config, errors, state, getErrorHandlers, metricsCollector } from "../state.js";
import { log } from "../helpers/logger.js";
import { createErrorRecord } from "../helpers/record.js";
import { attemptRecovery } from "../recovery/attempt.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.boundary.capture";
function capture(error, context = {}) {
  if (!config.enabled) return null;
  const errorRecord = createErrorRecord(error, context);
  errors.push(errorRecord);
  state.totalErrors++;
  state.lastError = errorRecord;
  while (errors.length > config.maxErrors) {
    errors.shift();
  }
  log("error", `[${errorRecord.type}] ${errorRecord.message}`, {
    severity: errorRecord.severity,
    context: errorRecord.context
  });
  if (config.reportErrors && metricsCollector?.recordError) {
    metricsCollector.recordError(errorRecord.context.overlayType, error, errorRecord.context);
  }
  const handlers = getErrorHandlers();
  for (const handler of handlers) {
    try {
      handler(errorRecord);
    } catch (e) {
      log("warn", "Error handler threw:", e.message);
    }
  }
  if (config.autoRecover && errorRecord.severity !== SEVERITY.CRITICAL) {
    attemptRecovery(errorRecord);
  }
  return errorRecord;
}
export {
  MODULE_ID,
  VERSION,
  capture
};
