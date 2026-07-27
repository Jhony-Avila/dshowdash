import { classifyError, determineSeverity } from "./classify.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.helpers.record";
function createErrorRecord(error, context = {}) {
  const errorType = classifyError(error, context);
  const severity = determineSeverity(errorType, context);
  return {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: errorType,
    severity,
    message: error?.message || String(error),
    stack: error?.stack || null,
    context: {
      overlayId: context.overlayId || null,
      overlayType: context.overlayType || null,
      operation: context.operation || null,
      ...context
    },
    timestamp: Date.now(),
    recovered: false,
    recoveryAttempts: 0
  };
}
export {
  MODULE_ID,
  VERSION,
  createErrorRecord
};
