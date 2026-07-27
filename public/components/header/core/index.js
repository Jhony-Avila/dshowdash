const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core";
import * as Constants from "./constants.js";
import * as Types from "./types.js";
import * as FeatureFlags from "./feature-flags.js";
import * as FeatureFlagsSync from "./feature-flags-sync.js";
import * as CircuitBreaker from "./circuit-breaker.js";
import * as CircuitBreakerAPI from "./circuit-breaker-api.js";
import * as CircuitBreakerUnified from "./circuit-breaker-unified.js";
import * as RetryWithJitter from "./retry-with-jitter.js";
import * as GracefulDegradation from "./graceful-degradation.js";
import * as SelfHealing from "./self-healing.js";
import * as ComponentsSelfHealing from "./components-self-healing.js";
import * as HealthAggregator from "./health-aggregator.js";
import * as HealthScheduler from "./health-scheduler.js";
import * as ConfigValidator from "./config-validator.js";
import * as HeaderGateway from "./header-gateway.js";
import * as CacheManager from "./cache-manager.js";
import * as Lifecycle from "./lifecycle.js";
import * as Helpers from "./helpers.js";
import * as MountHandler from "./mount-handler.js";
import * as UnmountHandler from "./unmount-handler.js";
import * as ComponentsLoader from "./components-loader.js";
import * as ComponentsLazyIntegration from "./components-lazy-integration.js";
import * as ComponentFallbackUI from "./component-fallback-ui.js";
import * as LazyLoader from "./lazy-loader.js";
import * as Polling from "./polling.js";
import * as PollingWithDegradation from "./polling-with-degradation.js";
import * as HeaderIntegrations from "./header-integrations.js";
import * as OrchestratorAdapter from "./orchestrator-adapter.js";
import * as VersionManager from "./version-manager.js";
import * as PluginSystem from "./plugin-system.js";
const modules = [
  "constants",
  "types",
  "feature-flags",
  "feature-flags-sync",
  "circuit-breaker",
  "circuit-breaker-api",
  "circuit-breaker-unified",
  "retry-with-jitter",
  "graceful-degradation",
  "self-healing",
  "components-self-healing",
  "health-aggregator",
  "health-scheduler",
  "config-validator",
  "header-gateway",
  "cache-manager",
  "lifecycle",
  "helpers",
  "mount-handler",
  "unmount-handler",
  "components-loader",
  "components-lazy-integration",
  "component-fallback-ui",
  "lazy-loader",
  "polling",
  "polling-with-degradation",
  "header-integrations",
  "orchestrator-adapter",
  "version-manager",
  "plugin-system"
];
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules,
    totalModules: modules.length
  };
}
var core_default = {
  VERSION,
  MODULE_ID,
  modules,
  info
};
export {
  CacheManager,
  CircuitBreaker,
  CircuitBreakerAPI,
  CircuitBreakerUnified,
  ComponentFallbackUI,
  ComponentsLazyIntegration,
  ComponentsLoader,
  ComponentsSelfHealing,
  ConfigValidator,
  Constants,
  FeatureFlags,
  FeatureFlagsSync,
  GracefulDegradation,
  HeaderGateway,
  HeaderIntegrations,
  HealthAggregator,
  HealthScheduler,
  Helpers,
  LazyLoader,
  Lifecycle,
  MODULE_ID,
  MountHandler,
  OrchestratorAdapter,
  PluginSystem,
  Polling,
  PollingWithDegradation,
  RetryWithJitter,
  SelfHealing,
  Types,
  UnmountHandler,
  VERSION,
  VersionManager,
  core_default as default,
  info,
  modules
};
