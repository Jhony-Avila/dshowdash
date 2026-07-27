const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/_shared";
import { LifecycleManager, createLifecycleManager } from "./core/lifecycle.js";
import { CircuitBreaker, createCircuitBreaker } from "./core/circuit-breaker.js";
import { StateStore, createStore } from "./state/store.js";
import { Logger, createLogger } from "./telemetry/logger.js";
import { Tracker, createTracker } from "./telemetry/tracker.js";
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    modules: ["lifecycle", "circuit-breaker", "store", "logger", "tracker"],
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["LifecycleManager", "CircuitBreaker", "StateStore", "Logger", "Tracker"],
    modules: ["lifecycle", "circuit-breaker", "store", "logger", "tracker"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var shared_default = {
  VERSION,
  MODULE_ID,
  healthCheck,
  info
};
export {
  CircuitBreaker,
  LifecycleManager,
  Logger,
  MODULE_ID,
  StateStore,
  Tracker,
  VERSION,
  createCircuitBreaker,
  createLifecycleManager,
  createLogger,
  createStore,
  createTracker,
  shared_default as default,
  healthCheck,
  info
};
