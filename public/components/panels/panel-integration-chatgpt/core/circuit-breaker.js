const VERSION = "9.3.0-P2-ENTERPRISE";
import { createModuleCircuitBreaker } from "../../_shared/core/circuit-breaker-base.js";
const MODULE_ID = "panels/panel-integration-chatgpt/core/circuit-breaker";
const _mod = createModuleCircuitBreaker(MODULE_ID);
const { CircuitBreaker } = _mod;
var circuit_breaker_default = CircuitBreaker;
export {
  CircuitBreaker,
  MODULE_ID,
  VERSION,
  circuit_breaker_default as default
};
