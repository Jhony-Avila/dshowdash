const VERSION = "1.0.0-MODULAR";
const MODULE_ID = "container-main:metrics-persistence";
const METRIC_TYPES = Object.freeze({
  TIMING: "timing",
  COUNTER: "counter",
  GAUGE: "gauge",
  HISTOGRAM: "histogram",
  SUMMARY: "summary"
});
const AGGREGATION_PERIODS = Object.freeze({
  MINUTE: 6e4,
  HOUR: 36e5,
  DAY: 864e5,
  WEEK: 6048e5
});
const DEFAULT_CONFIG = Object.freeze({
  STORAGE_PREFIX: "dsd-metrics",
  MAX_ENTRIES_PER_PANEL: 1e3,
  MAX_TOTAL_ENTRIES: 1e4,
  PERSIST_INTERVAL: 3e4
});
var constants_default = {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG
};
export {
  AGGREGATION_PERIODS,
  DEFAULT_CONFIG,
  METRIC_TYPES,
  MODULE_ID,
  VERSION,
  constants_default as default
};
