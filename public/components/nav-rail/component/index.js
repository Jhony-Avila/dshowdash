const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "nav-rail.component";
import { createLogger } from "../core/constants.js";
import { getPort } from "../ports.js";
import { NavRailComponentMounter } from "../core/component-mounter.js";
import { CircuitBreaker } from "../core/circuit-breaker.js";
import { RecoveryManager } from "../core/recovery-manager.js";
import { RetryManager } from "../core/retry-manager.js";
import { NavRailFeatureLoader } from "../core/feature-loader.js";
import { doInit } from "./init.js";
import { loadFeature, registerFeature, registerFeatures, getLoadedFeatures, getFailedFeatures, isFeatureLoaded } from "./features.js";
import { render, setActiveItem, getActiveItem, update, refresh, reinit, destroy } from "./operations.js";
import { healthCheck, info } from "./health.js";
const _log = createLogger(getPort);
class NavRailComponent {
  constructor() {
    this._root = null;
    this._config = null;
    this._initialized = false;
    this._componentsMounted = false;
    this._featuresMounted = false;
    this._registrySource = null;
    this._degradedMode = false;
    this._initPromise = null;
    this._errorState = null;
  }
  init(rootElement, userConfig = {}) {
    if (this._initPromise) {
      _log("debug", "Init already in progress, returning existing promise");
      return this._initPromise;
    }
    if (this._initialized) {
      _log("info", "Already initialized, performing safe reinit");
      return this.reinit(rootElement, userConfig);
    }
    this._initPromise = doInit(this, rootElement, userConfig).finally(() => {
      this._initPromise = null;
    });
    return this._initPromise;
  }
  async loadFeature(featureId) {
    return loadFeature(featureId);
  }
  registerFeature(featureConfig) {
    return registerFeature(featureConfig);
  }
  registerFeatures(features) {
    return registerFeatures(features);
  }
  getLoadedFeatures() {
    return getLoadedFeatures();
  }
  getFailedFeatures() {
    return getFailedFeatures();
  }
  isFeatureLoaded(featureId) {
    return isFeatureLoaded(featureId);
  }
  render() {
    return render(this);
  }
  setActiveItem(itemId) {
    return setActiveItem(this, itemId);
  }
  getActiveItem() {
    return getActiveItem(this);
  }
  update(newConfig = {}) {
    return update(this, newConfig);
  }
  async refresh() {
    return refresh(this);
  }
  async reinit(rootElement, userConfig = {}) {
    return reinit(this, rootElement, userConfig);
  }
  async destroy() {
    return destroy(this);
  }
  async retryComponent(id) {
    return NavRailComponentMounter.retryComponent(id);
  }
  async retryFailed() {
    return NavRailComponentMounter.retryFailed();
  }
  getFailedComponents() {
    return NavRailComponentMounter.getFailedComponents();
  }
  async recover() {
    return RecoveryManager.attemptRecovery(this);
  }
  healthCheck() {
    return healthCheck(this);
  }
  info() {
    return info(this);
  }
  get _circuitBreaker() {
    return CircuitBreaker;
  }
  get _recoveryManager() {
    return RecoveryManager;
  }
  get _retryManager() {
    return RetryManager;
  }
  get _featureLoader() {
    return NavRailFeatureLoader;
  }
}
export {
  MODULE_ID,
  NavRailComponent,
  VERSION
};
