import { DEFAULT_TIMEOUTS } from "./constants.js";
import {
  createAbortController,
  abortByKey,
  abortAll,
  isActive,
  getActiveCount,
  getActiveKeys
} from "./abort-controller.js";
import {
  withTimeout,
  executeWithTimeout,
  withAbortAndTimeout
} from "./timeout.js";
import {
  fetchWithTimeout,
  fetchWithAbort
} from "./fetch.js";
import {
  retryWithBackoff
} from "./retry.js";
import {
  delay,
  createDebouncedAsync,
  raceWithAbort,
  parallelLimit
} from "./utils.js";
import {
  getMetrics,
  resetMetrics
} from "./metrics.js";
import { DEFAULT_TIMEOUTS as DEFAULT_TIMEOUTS2 } from "./constants.js";
import { getActiveCount as getActiveCount2 } from "./abort-controller.js";
import { getMetrics as getMetricsBase, healthCheck as healthCheckBase } from "./metrics.js";
const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    defaultTimeouts: DEFAULT_TIMEOUTS2,
    activeControllers: getActiveCount2(),
    metrics: getMetricsBase(getActiveCount2()),
    submodules: [
      "constants",
      "metrics",
      "abort-controller",
      "timeout",
      "fetch",
      "retry",
      "utils"
    ]
  };
}
function healthCheck() {
  return healthCheckBase(getActiveCount2());
}
var async_helpers_default = {
  VERSION,
  MODULE_ID,
  DEFAULT_TIMEOUTS: DEFAULT_TIMEOUTS2,
  info,
  healthCheck
};
export {
  DEFAULT_TIMEOUTS,
  MODULE_ID,
  VERSION,
  abortAll,
  abortByKey,
  createAbortController,
  createDebouncedAsync,
  async_helpers_default as default,
  delay,
  executeWithTimeout,
  fetchWithAbort,
  fetchWithTimeout,
  getActiveCount,
  getActiveKeys,
  getMetrics,
  healthCheck,
  info,
  isActive,
  parallelLimit,
  raceWithAbort,
  resetMetrics,
  retryWithBackoff,
  withAbortAndTimeout,
  withTimeout
};
