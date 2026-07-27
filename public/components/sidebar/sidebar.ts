
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar
// PURPOSE: Classe Sidebar principal — orquestrador modular enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts — from '/core/runtime/ports-profiles.js'
//   SIDEBAR_EVENTS — from '/core/runtime/events/catalog/sidebar.events.js'
//   MODULE_ID, KEYBOARD_CONFIG — from './core/constants.js'
//   saveCollapsedState — from './core/state-persistence.js'
//   setDependencies as setErrorDeps, emitDegraded, getDegradedComponents, getStatus, setStatus — from './core/error-emitter.js'
//   setDependencies as setEventDeps — from './features/event-setup.js'
//   setLogger as setRouterLogger — from './features/router-sync.js'
//   reloadNavigation — from './core/navigation-reload.js'
//   SidebarRegistry — from './registry/registry.js'
//   NavigationModelLoader — from './integration/navigation-model-loader.js'
//   LIFECYCLE_STATES — from './domain/sidebar-engine.js'
//   createLogger — from './telemetry/logger.js'
//   createTracker — from './telemetry/tracker.js'
//   createPublicMethods — from './api/public-methods.js'
//   createGetState — from './api/health-info.js'
//   createInitializer, createSetupCoordinator, createDestroyer — from './lifecycle/index.js'
//   createMetricsManager — from './metrics/metrics-manager.js'
//   createHealthReporter — from './diagnostics/health-reporter.js'
//
// PROVIDES:
//   Sidebar (class, named export) — classe principal
//   injectPorts(p) / getPorts() — ports API
//   VERSION — constante
//
// RECEIVES (via init/options): nenhum (configurado via Ports)
// EMITS (eventos):
//   SIDEBAR_EVENTS.* — via eventBus port
// LISTENS (eventos):
//   (via event-setup.js)
// WINDOW ACCESS: window.location (fallback para hash)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';

import { MODULE_ID, KEYBOARD_CONFIG } from './core/constants.js';
import { saveCollapsedState } from './core/state-persistence.js';
import { setDependencies as setErrorDeps, emitDegraded, getDegradedComponents, getStatus, setStatus } from './core/error-emitter.js';
import { setDependencies as setEventDeps } from './features/event-setup.js';
import { setLogger as setRouterLogger } from './features/router-sync.js';
import { reloadNavigation } from './core/navigation-reload.js';

import SidebarRegistry from './registry/registry.js';
import NavigationModelLoader from './integration/navigation-model-loader.js';
import { LIFECYCLE_STATES } from './domain/sidebar-engine.js';

import { createLogger } from './telemetry/logger.js';
import { createTracker } from './telemetry/tracker.js';

import { createPublicMethods } from './api/public-methods.js';
import { createGetState } from './api/health-info.js';

import { createInitializer, createSetupCoordinator, createDestroyer } from './lifecycle/index.js';
import { createMetricsManager } from './metrics/metrics-manager.js';
import { createHealthReporter } from './diagnostics/health-reporter.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.5.1-IMPORT-FIX';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getEventBus() {
  return _getPort('eventBus') || _getPort('eventBusGlobal');
}

function _getCurrentHashViaPort() {
  const rg = _getPort('routerGlobal');
  if (rg && rg.getCurrentRoute) {
    try {
      const route = rg.getCurrentRoute();
      if (route && (route.hash || route.path)) return route.hash || route.path;
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && window.location) return window.location.hash || '#/';
  return '#/';
}

export class Sidebar {
  [key: string]: any;
  constructor() {
    this._logger = createLogger({ debug: false });
    this._tracker = createTracker({ enabled: true });
    this._keyboardNavEnabled = KEYBOARD_CONFIG.enabled;

    this._context = {
      engine: null,
      renderer: null,
      adapters: {},
      ports: null,
      config: null,
      initialized: false,
      initAt: null,
      safeMode: false,
      modelLoaderInitialized: false,
      keyboardNavEnabled: this._keyboardNavEnabled
    };

    this._metricsManager = createMetricsManager();
    
    this._setupCoordinator = createSetupCoordinator({
      logger: this._logger,
      tracker: this._tracker,
      getPort: _getPort,
      emitDegraded
    });

    this._initializer = createInitializer({
      logger: this._logger,
      tracker: this._tracker,
      metricsManager: this._metricsManager
    });

    this._destroyer = createDestroyer({
      logger: this._logger
    });

    this._healthReporter = createHealthReporter({
      getContext: () => this._context,
      metricsManager: this._metricsManager,
      setupCoordinator: this._setupCoordinator,
      portsManager: Ports
    });

    setErrorDeps(this._logger, this._tracker);
    setEventDeps(this._logger, this._tracker);
    setRouterLogger(this._logger);
    _initPorts();
  }

  get status() { return getStatus(); }

  async init(options: DynObj) {
    if (options === undefined) options = {};
    
    if (this._context.initialized) {
      this._logger.warn('Already initialized');
      return { success: true, message: 'Already initialized' };
    }

    const initResult = await this._initializer.execute(options, this._context);
    if (!initResult.success) {
      return initResult;
    }

    this._setupCoordinator.setupCore({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      adapters: this._context.adapters,
      onToggle: () => this.toggle(),
      onSetActiveItem: (id: string) => this._setActiveItem(id),
      onToggleSection: (id: string) => this.toggleSection(id)
    });

    if (!this._context.safeMode) {
      this._setupCoordinator.setupPostReady({
        engine: this._context.engine,
        renderer: this._context.renderer,
        registry: SidebarRegistry,
        adapters: this._context.adapters,
        onToggle: () => this.toggle(),
        onSetActiveItem: (id: string) => this._setActiveItem(id),
        onExpandSection: (id: string) => this.expandSection(id),
        onCollapseSection: (id: string) => this.collapseSection(id),
        onCloseMobile: () => this.closeMobile(),
        onReloadNavigation: () => this._reloadNavigation()
      });
    } else {
      this._logger.info('SafeMode: Skipping POST_READY features');
    }

    try {
      await this._context.engine.ready();
    } catch (error: any) {
      emitDegraded('engine-ready', error.message);
    }

    // Wire renderer items-changed to full reload cycle (invalidate cache + API fetch + re-render)
    if (this._context.renderer?.setItemsChangedCallback) {
      this._context.renderer.setItemsChangedCallback(() => this._reloadNavigation());
    }

    this._bindPublicMethods();
    this._context.initialized = true;
    this._context.initAt = Date.now();

    const degraded = getDegradedComponents();
    setStatus(degraded.length > 0 ? 'degraded' : 'healthy');

    this._emitReadyEvent();

    this._logger.info(`Sidebar V6.5 ES6 initialized (${this.status})`, {
      version: VERSION,
      safeMode: this._context.safeMode,
      degradedComponents: degraded,
      modelLoaderInitialized: this._context.modelLoaderInitialized
    });

    this._tracker.track('initialized', {
      version: VERSION,
      status: this.status,
      safeMode: this._context.safeMode
    });

    return { success: true, version: VERSION, status: this.status, safeMode: this._context.safeMode };
  }

  _emitReadyEvent() {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      bus.emit(SIDEBAR_EVENTS.READY, {
        version: VERSION,
        status: this.status,
        safeMode: this._context.safeMode,
        timestamp: Date.now()
      });
      this._logger.info('SIDEBAR_EVENTS.READY emitted');
    }
  }

  _setActiveItem(itemId: string) {
    try {
      this._metricsManager.incrementNavigations();
      this._context.engine.setActiveItem(itemId);
      this._context.renderer.setActiveItem(itemId);
    } catch (error: any) {
      this._logger.error('setActiveItem error:', error);
    }
  }

  async _reloadNavigation() {
    return reloadNavigation({
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      adapters: this._context.adapters,
      logger: this._logger,
      metrics: this._metricsManager.getAll(),
      modelLoaderInitialized: this._context.modelLoaderInitialized,
      getCurrentHash: _getCurrentHashViaPort
    });
  }

  _bindPublicMethods() {
    const self = this;
    const deps = {
      engine: this._context.engine,
      renderer: this._context.renderer,
      registry: SidebarRegistry,
      routerAdapter: this._context.adapters.router,
      permissionsAdapter: this._context.adapters.permissions,
      tracker: this._tracker,
      logger: this._logger,
      saveState() { saveCollapsedState(self._context.engine.collapsed); }
    };
    const methods = createPublicMethods(deps);

    this.toggle = () => { self._metricsManager.incrementToggles(); return methods.toggle.call(self); };
    this.collapse = methods.collapse.bind(this);
    this.expand = methods.expand.bind(this);
    this.forceSync = methods.forceSync?.bind(this);
    this.getToggleMetrics = methods.getToggleMetrics?.bind(this);
    this.toggleSection = methods.toggleSection.bind(this);
    this.expandSection = methods.expandSection.bind(this);
    this.collapseSection = methods.collapseSection.bind(this);
    this.expandAllSections = methods.expandAllSections.bind(this);
    this.collapseAllSections = methods.collapseAllSections.bind(this);
    this.isSectionExpanded = methods.isSectionExpanded.bind(this);
    this.getExpandedSections = methods.getExpandedSections.bind(this);
    this.setAccordionMode = methods.setAccordionMode.bind(this);
    this.openMobile = methods.openMobile.bind(this);
    this.closeMobile = methods.closeMobile.bind(this);
    this.toggleMobile = methods.toggleMobile.bind(this);
    this.navigate = (id: string) => { self._metricsManager.incrementNavigations(); return methods.navigate.call(self, id); };
    this.setBadge = methods.setBadge.bind(this);
    this.refresh = methods.refresh.bind(this);
    this.getState = createGetState(this._context.engine);

    this.healthCheck = () => self._healthReporter.healthCheck();
    this.info = () => self._healthReporter.info();
    this.getManifest = () => self._healthReporter.getManifest();
    this.getMetrics = () => self._healthReporter.getMetrics();
  }

  destroy() {
    this._destroyer.execute(this._context, this._setupCoordinator);
    this._metricsManager.reset();
  }
}

export default Sidebar;

export const VERSION_EXPORT = VERSION;
export const MODULE_ID_EXPORT = 'sidebar';
export { SIDEBAR_EVENTS, LIFECYCLE_STATES };

export function getManifest() {
  return {
    registryId: 'sidebar',
    version: VERSION,
    loadedAt: null as number | null,
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: 'sidebar',
    version: VERSION,
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    modelLoaderAvailable: typeof NavigationModelLoader !== 'undefined'
  };
}

export function getMetrics() {
  return {
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    modular: true,
    modelLoaderInfo: NavigationModelLoader.info?.() ?? {}
  };
}

export function healthCheck() {
  const checks = {
    classAvailable: true,
    portsInitialized: Ports.isInitialized(),
    modelLoaderAvailable: typeof NavigationModelLoader !== 'undefined'
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    checks,
    issues: [] as DynObj[],
    moduleId: 'sidebar',
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    p24ModelFirst: true,
    modular: true,
    modelLoaderHealth: NavigationModelLoader.healthCheck?.() ?? { healthy: false },
    timestamp: Date.now()
  };
}
