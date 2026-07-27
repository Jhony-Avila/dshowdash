import { createModuleCircuitBreaker } from "../../_shared/core/circuit-breaker-base.js";
const MODULE_ID = "header/components/panel-maps/core/circuit-breaker";
const _mod = createModuleCircuitBreaker(MODULE_ID);
const { CircuitBreaker, getMetrics, resetMetrics, VERSION } = _mod;
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default,
  getMetrics,
  resetMetrics
};
