// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-index
// PURPOSE: NavRail Component - Class
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../core/constants.js
//   getPort from ../ports.js
//   NavRailComponentMounter from ../core/component-mounter.js
//   CircuitBreaker from ../core/circuit-breaker.js
//   RecoveryManager from ../core/recovery-manager.js
//   RetryManager from ../core/retry-manager.js
//   NavRailFeatureLoader from ../core/feature-loader.js
//   doInit from ./init.js
//   loadFeature, registerFeature, registerFeatures, getLoadedFeatures, getFailedFeatures, isFeatureLoaded from ./features.js
//   render, setActiveItem, getActiveItem, update, refresh, reinit, destroy from ./operations.js
//   healthCheck, info from ./health.js
//
// PROVIDES:
//   (none)
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'nav-rail.component';

import { createLogger } from '../core/constants.js';
import { getPort } from '../ports.js';
import { NavRailComponentMounter } from '../core/component-mounter.js';
import { CircuitBreaker } from '../core/circuit-breaker.js';
import { RecoveryManager } from '../core/recovery-manager.js';
import { RetryManager } from '../core/retry-manager.js';
import { NavRailFeatureLoader } from '../core/feature-loader.js';

import { doInit } from './init.js';
import { loadFeature, registerFeature, registerFeatures, getLoadedFeatures, getFailedFeatures, isFeatureLoaded } from './features.js';
import { render, setActiveItem, getActiveItem, update, refresh, reinit, destroy } from './operations.js';
import { healthCheck, info } from './health.js';

const _log = createLogger(getPort);

export class NavRailComponent {
  [key: string]: any;
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

  init(rootElement: unknown, userConfig: Record<string, unknown> = {}) {
    if (this._initPromise) {
      _log('debug', 'Init already in progress, returning existing promise');
      return this._initPromise;
    }

    if (this._initialized) {
      _log('info', 'Already initialized, performing safe reinit');
      return this.reinit(rootElement, userConfig);
    }

    this._initPromise = doInit(this, rootElement, userConfig)
      .finally(() => { this._initPromise = null; });

    return this._initPromise;
  }

  async loadFeature(featureId: string) { return loadFeature(featureId); }
  registerFeature(featureConfig: unknown) { return registerFeature(featureConfig); }
  registerFeatures(features: unknown[]) { return registerFeatures(features); }
  getLoadedFeatures() { return getLoadedFeatures(); }
  getFailedFeatures() { return getFailedFeatures(); }
  isFeatureLoaded(featureId: string) { return isFeatureLoaded(featureId); }

  render() { return render(this); }
  setActiveItem(itemId: string) { return setActiveItem(this, itemId); }
  getActiveItem() { return getActiveItem(this); }
  update(newConfig: Record<string, unknown> = {}) { return update(this, newConfig); }
  async refresh() { return refresh(this); }
  async reinit(rootElement: unknown, userConfig: Record<string, unknown> = {}) { return reinit(this, rootElement, userConfig); }
  async destroy() { return destroy(this); }

  async retryComponent(id: string) { return NavRailComponentMounter.retryComponent(id); }
  async retryFailed() { return NavRailComponentMounter.retryFailed(); }
  getFailedComponents() { return NavRailComponentMounter.getFailedComponents(); }
  async recover() { return RecoveryManager.attemptRecovery(this); }

  healthCheck() { return healthCheck(this); }
  info() { return info(this); }

  get _circuitBreaker() { return CircuitBreaker; }
  get _recoveryManager() { return RecoveryManager; }
  get _retryManager() { return RetryManager; }
  get _featureLoader() { return NavRailFeatureLoader; }
}
