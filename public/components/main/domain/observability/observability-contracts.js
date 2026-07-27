const OBSERVABILITY_EVENTS = Object.freeze({
  // Request/Response pattern
  METRICS_REQUEST: "observability.metrics.request",
  METRICS: "observability.metrics",
  HEALTH_REQUEST: "observability.health.request",
  HEALTH: "observability.health"
});
const VERSION = "1.0.0-P18EC";
const MODULE_ID = "observability.contracts";
var observability_contracts_default = { VERSION, MODULE_ID, OBSERVABILITY_EVENTS };
export {
  MODULE_ID,
  OBSERVABILITY_EVENTS,
  VERSION,
  observability_contracts_default as default
};
