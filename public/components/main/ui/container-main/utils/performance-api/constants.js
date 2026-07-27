const VERSION = "1.0.0";
const MODULE_ID = "container-main:performance-api";
const METRIC_TYPES = Object.freeze({
  TIMING: "timing",
  COUNTER: "counter",
  GAUGE: "gauge",
  HISTOGRAM: "histogram"
});
const METRIC_CATEGORIES = Object.freeze({
  RENDER: "render",
  LOAD: "load",
  INTERACTION: "interaction",
  NETWORK: "network",
  MEMORY: "memory",
  CUSTOM: "custom"
});
export {
  METRIC_CATEGORIES,
  METRIC_TYPES,
  MODULE_ID,
  VERSION
};
