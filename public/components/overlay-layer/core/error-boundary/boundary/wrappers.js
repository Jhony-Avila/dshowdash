import { config } from "../state.js";
import { capture } from "./capture.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.boundary.wrappers";
function boundary(operation, context = {}) {
  return async (...args) => {
    try {
      const result = await operation(...args);
      return result;
    } catch (error) {
      const errorRecord = capture(error, context);
      if (context.fallback !== void 0) {
        return context.fallback;
      }
      if (config.fallbackContent !== null && context.returnFallback) {
        return { ok: false, error: errorRecord, fallback: config.fallbackContent };
      }
      if (context.rethrow) {
        throw error;
      }
      return { ok: false, error: errorRecord };
    }
  };
}
function boundarySync(operation, context = {}) {
  return (...args) => {
    try {
      return operation(...args);
    } catch (error) {
      const errorRecord = capture(error, context);
      if (context.fallback !== void 0) {
        return context.fallback;
      }
      if (context.rethrow) {
        throw error;
      }
      return { ok: false, error: errorRecord };
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  boundary,
  boundarySync
};
