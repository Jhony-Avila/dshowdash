import { VERSION, MODULE_ID } from "./constants.js";
import { init, shutdown } from "./core/lifecycle.js";
import { getMode, getRuntimeContext, isIntegrated, canOpenOverlay, getMetrics } from "./core/queries.js";
import { getAggregatedHealth, healthCheck, info } from "./diagnostics/health.js";
var runtime_integration_default = {
  VERSION,
  MODULE_ID,
  init,
  shutdown,
  getMode,
  getRuntimeContext,
  isIntegrated,
  canOpenOverlay,
  getMetrics,
  getAggregatedHealth,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  canOpenOverlay,
  runtime_integration_default as default,
  getAggregatedHealth,
  getMetrics,
  getMode,
  getRuntimeContext,
  healthCheck,
  info,
  init,
  isIntegrated,
  shutdown
};
