import * as Constants from "./constants.js";
import * as Types from "./types.js";
import * as FeatureFlags from "./feature-flags.js";
import { BaseError, MountError, TimeoutError, ContractError, NetworkError, ConfigError, PluginError } from "./errors/index.js";
import * as CircuitBreakerAPI from "./circuit-breaker-api.js";
import * as RetryWithJitter from "./retry-with-jitter.js";
import * as SelfHealing from "./self-healing.js";
import * as GracefulDegradation from "./graceful-degradation.js";
import * as ConfigValidator from "./config-validator.js";
import * as HeaderGateway from "./header-gateway.js";
import * as PluginSystem from "./plugin-system.js";
import * as HeaderCore from "./header-core.js";
import * as LazyLoader from "./lazy-loader.js";
import * as CacheManager from "./cache-manager.js";
import * as OrchestratorAdapter from "./orchestrator-adapter.js";
import * as ServiceWorkerBridge from "./service-worker-bridge.js";
import * as VirtualScroller from "./virtual-scroller.js";
import * as VersionManager from "./version-manager.js";
import * as Integrations from "./header-integrations.js";
import * as Bootstrap from "./bootstrap.js";
import * as DevTools from "./devtools.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/modules-index";
function listModules() {
  return [
    "Constants",
    "Types",
    "FeatureFlags",
    "Errors",
    "CircuitBreakerAPI",
    "RetryWithJitter",
    "SelfHealing",
    "GracefulDegradation",
    "ConfigValidator",
    "HeaderGateway",
    "PluginSystem",
    "HeaderCore",
    "LazyLoader",
    "CacheManager",
    "OrchestratorAdapter",
    "ServiceWorkerBridge",
    "VirtualScroller",
    "VersionManager",
    "Integrations",
    "Bootstrap",
    "DevTools"
  ];
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules: listModules(),
    totalModules: listModules().length
  };
}
export {
  BaseError,
  Bootstrap,
  CacheManager,
  CircuitBreakerAPI,
  ConfigError,
  ConfigValidator,
  Constants,
  ContractError,
  DevTools,
  FeatureFlags,
  GracefulDegradation,
  HeaderCore,
  HeaderGateway,
  Integrations,
  LazyLoader,
  MODULE_ID,
  MountError,
  NetworkError,
  OrchestratorAdapter,
  PluginError,
  PluginSystem,
  RetryWithJitter,
  SelfHealing,
  ServiceWorkerBridge,
  TimeoutError,
  Types,
  VERSION,
  VersionManager,
  VirtualScroller,
  info,
  listModules
};
