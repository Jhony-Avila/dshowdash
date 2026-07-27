import { MODULE_ID } from "../constants.js";
import { config, logger, setLogger, setMetricsCollector } from "../state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
function log(level, ...args) {
  if (!config.logToConsole) return;
  if (logger?.[level]) {
    logger[level](`[${MODULE_ID}]`, ...args);
  } else if (typeof console !== "undefined") {
    console[level]?.(`[${MODULE_ID}]`, ...args);
  }
}
function inject(dependencies) {
  if (dependencies.logger) setLogger(dependencies.logger);
  if (dependencies.metricsCollector) setMetricsCollector(dependencies.metricsCollector);
}
export {
  VERSION,
  inject,
  log
};
