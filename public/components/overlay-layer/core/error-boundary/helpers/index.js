const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.helpers";
import { log, inject } from "./logger.js";
import { classifyError, determineSeverity } from "./classify.js";
import { createErrorRecord } from "./record.js";
export {
  MODULE_ID,
  VERSION,
  classifyError,
  createErrorRecord,
  determineSeverity,
  inject,
  log
};
