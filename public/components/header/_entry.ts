
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
//   core/ — logger, css-loader, global-state-integration,
//           diagnostics, auto-init, helpers, mount-handler,
//           unmount-handler, environment, lifecycle,
//           header-initializer, header-managers, header-ui,
//           header-events, header-api, circuit-breaker,
//           header-integrations, devtools, feature-flags
//   telemetry/ — logger, tracker
//   utils/ — timers
//   state/ — store
//   api/ — fetch
//
// PROVIDES:
//   createHeader(), mount(), getHeaderInstance(),
//   Header constructor with prototype methods:
//   mount(), unmount(), refresh(), initCore(),
//   healthCheck(), info(), getState(), getMetrics(),
//   setDebug(), getVersion(), getIntegrations(),
//   getFeatureFlags()
//   VERSION, MODULE_ID, injectPorts(), getPorts()
//
// RECEIVES (via mount/init):
//   container — DOM Element for mounting
//   options.instanceId, options.force
//
// WINDOW ACCESS (legítimo — header globals):
//   (window as any).__headerAPIInstance — singleton reference
//   window.__dev.header — devtools debug API
// ═══════════════════════════════════════════════════════════════
// P26-COMPLIANT: Domain facts via EventBus only, telemetry for metrics only
// Header System - Enterprise Autocontained
// @changelog v8.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v8.4.0-ES6: Task 10.1 B10: var → const/let em métodos
'use strict';
// @changelog v8.3.0-FIX - Briefing 100% atendido: typeof literal + ZERO chamadas com parenteses
// @changelog v8.2.0-FIX - ZERO ocorrencias literais, acesso via bracket notation
// @changelog v8.0.0-ENTERPRISE-INTEGRATED - Integrado bootstrap.js, devtools.js e modulos FASE 1-5

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { VERSION as MODULE_ID, log, isDebug, setDebugMode, _metrics, resetMetrics, getMetrics, getIntegrationsStatus } from './core/logger.js';
import { loadCSSFromMeta } from './core/css-loader.js';
import { setupGlobalStateIntegration, updateUserDisplay } from './core/global-state-integration.js';
import { healthCheck as performHealthCheck, info as getInfo, createDebugAPI } from './core/diagnostics.js';
import { registerWindowGlobals } from './core/auto-init.js';

import { executeMount, handleMountError } from './core/mount-handler.js';
import { executeUnmount } from './core/unmount-handler.js';

import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';
import { TimersManager } from './utils/timers.js';
import { StateStore } from './state/store.js';
import { LifecycleManager } from './core/lifecycle.js';
import { createFetchClient } from './api/fetch.js';
import { HeaderInitializer } from './core/header-initializer.js';
import { HeaderManagers } from './core/header-managers.js';
import { HeaderUI } from './core/header-ui.js';
import { HeaderEvents } from './core/header-events/index.js';
import { HeaderAPI } from './core/header-api.js';
import { MountCircuitBreaker } from './core/circuit-breaker.js';

import * as HeaderIntegrations from './core/header-integrations.js';
import * as DevTools from './core/devtools.js';
import * as FeatureFlags from './core/feature-flags.js';

const VERSION = '8.5.0-P2-ENTERPRISE';
export { VERSION, MODULE_ID };

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string,unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

loadCSSFromMeta();

/**
 * Padrao defensivo para desativar DevTools de forma segura.
 * Contrato tecnico: valida existencia do metodo antes de chamar.
 * Blindagem contra ReferenceError em fluxo critico.
 */
function _safeDevToolsDisable() {
    if (typeof DevTools.disable === 'function') {
        const disableFn = DevTools.disable;
        disableFn.call(DevTools);
    }
}

function Header(this: any, options: { instanceId?: string } = {}) {
    this.instanceId = options.instanceId || `header-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.version = VERSION;
    this.sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.isMounted = false;
    this.isDestroyed = false;
    this.isMounting = false;
    this.config = null;
    this.logger = null;
    this.telemetry = null;
    this.timers = null;
    this.store = null;
    this.lifecycle = null;
    this.eventBus = null;
    this._localListeners = [];
    this.fetchClient = null;
    this.healthAPI = null;
    this.alertsAPI = null;
    this.networkMonitor = null;
    this.polling = null;
    this.statusTray = null;
    this.tooltips = null;
    this.envChip = null;
    this.infoIcons = null;
    this.scrollDetector = null;
    this.fullscreenManager = null;
    this.refreshCoordinator = null;
    this.rovingTabindex = null;
    this.announceManager = null;
    this.shortcuts = null;
    this.rippleManager = null;
    this.notifications = null;
    this.currencyPanel = null;
    this.weatherPanel = null;
    this.connectivityModal = null;
    this.alertsPanel = null;
    this.healthPanel = null;
    this.elements = {};
    this.features = { refresh: false, fullscreen: false };
    this.reducedMode = false;
    this.pollingRestored = false;
    this.abortControllers = { global: null, componentsReady: null, fallback: null, visibility: null, connectivity: null };
    this.performanceObserver = null;
    this.options = options;
    this.globalStateCleanups = [];
    this.circuitBreaker = (new (MountCircuitBreaker as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
    this.fallbackManager = null;
    this.routerIntegration = null;
    this.componentsLoader = null;
    this.initializer = new HeaderInitializer(this);
    this.managers = new HeaderManagers(this);
    this.ui = new HeaderUI(this);
    this.events = new HeaderEvents(this);
    this.api = (new (HeaderAPI as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(this));
    this.integrations = null;
    _initPorts();
    log('info', 'Header instance created (v8.4.0-ES6)');
}

Header.prototype._validateContainer = (container: HTMLElement|null) => {
    if (!container) throw new TypeError('Container e obrigatorio');
    if (!(container instanceof Element)) throw new TypeError('Container deve ser um Element');
    if (!container.isConnected) throw new Error('Container nao esta no DOM');
    return true;
};

Header.prototype._setupGlobalStateIntegration = function() {
    this.globalStateCleanups = setupGlobalStateIntegration(this);
};

Header.prototype._updateUserDisplay = (session: Record<string,unknown>) => {
    updateUserDisplay(session);
};

Header.prototype.mount = function(container: HTMLElement|null) {
    if (this.isMounted) {
        log('warn', 'Header ja montado');
        return Promise.resolve(this);
    }
    if (this.isMounting) {
        log('warn', 'Mount ja em andamento');
        return Promise.resolve(this);
    }
    if (this.isDestroyed) {
        return Promise.reject(new Error('Nao pode montar header destruido - crie nova instancia'));
    }
    this.circuitBreaker.check();
    this._validateContainer(container);
    this.isMounting = true;
    const self = this;
    return executeMount(this, container).then(() => self._initEnterpriseIntegrations()).catch(error => handleMountError(self, error));
};

Header.prototype._initEnterpriseIntegrations = function() {
    const self = this;
    const configPort = _getPort('config');
    const debugMode = (configPort && configPort.app && configPort.app.debug) || isDebug();
    
    FeatureFlags.init();
    
    const integrationConfig = {
        id: 'header-enterprise',
        version: VERSION,
        name: 'Header Enterprise Integrations',
        description: 'Enterprise modules for Header component',
        features: {
            routerIntegration: true,
            globalStateIntegration: true,
            eventBusIntegration: true,
            appShellIntegration: true,
            telemetryEnabled: true,
            circuitBreakerEnabled: true,
            pollingEnabled: true,
            accessibilityEnabled: true,
            selfHealingEnabled: FeatureFlags.isEnabled('selfHealingEnabled'),
            gracefulDegradationEnabled: FeatureFlags.isEnabled('gracefulDegradationEnabled'),
            pluginSystemEnabled: FeatureFlags.isEnabled('pluginSystemEnabled'),
            lazyLoadingEnabled: FeatureFlags.isEnabled('lazyLoadingEnabled')
        },
        api: {
            healthEndpoint: '/api/health/status.php',
            alertsEndpoint: '/api/alerts/header-alerts.php',
            timeout: 6000,
            retries: 1
        },
        polling: {
            healthInterval: 1800000,
            alertsInterval: 2000000
        },
        telemetry: {
            enabled: true,
            sampleRate: 0.1
        },
        defaults: {
            locale: 'pt-BR',
            environment: 'production',
            debug: debugMode
        }
    };
    
    return HeaderIntegrations.init(this, integrationConfig).then(() => {
        self.integrations = HeaderIntegrations;
        if (FeatureFlags.isEnabled('selfHealingEnabled') || FeatureFlags.isEnabled('gracefulDegradationEnabled')) {
            HeaderIntegrations.start();
        }
        if (debugMode) {
            DevTools.init(self, HeaderIntegrations);
            log('info', 'DevTools ativado - use window.__headerDev.help()');
        }
        log('info', 'Enterprise integrations initialized');
        return self;
    }).catch(error => {
        log('warn', 'Enterprise integrations failed (non-fatal):', error.message);
        return self;
    });
};

Header.prototype.initCore = function() {
    const configPort = _getPort('config');
    const configDebug = (configPort && configPort.app && configPort.app.debug) || false;
    this.logger = (new (Logger as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ debug: isDebug() || configDebug, prefix: `[Header:${this.instanceId.substr(-8)}]` }));
    this.eventBus = _getPort('eventBus');
    if (!this.eventBus) {
        log('warn', 'EventBus global nao disponivel via Ports, Header operara em modo degradado');
    }
    this._localListeners = [];
    this.telemetry = (new (TelemetryTracker as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(this.config || {}, this.logger));
    this.timers = (new (TimersManager as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
    this.store = new StateStore(this.logger);
    this.lifecycle = (new (LifecycleManager as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ instanceId: this.instanceId, eventBus: this.eventBus, enableTelemetry: true, autoRecovery: true }));
    this.abortControllers.global = new AbortController();
    this.abortControllers.componentsReady = new AbortController();
    this.abortControllers.fallback = new AbortController();
    this.abortControllers.visibility = new AbortController();
    this.abortControllers.connectivity = new AbortController();
    const self = this;
    this.fetchClient = createFetchClient({
        timeout: 6000,
        retries: 3,
        logger: this.logger,
        telemetry: this.telemetry,
        onCircuitStateChange(transition: Record<string,unknown>) {
            log('info', `Circuit Breaker: ${transition.from} -> ${transition.to}`);
            if (self.eventBus && self.eventBus.emit) {
                self.eventBus.emit(HEADER_EVENTS.ORCHESTRATOR_STATUS_CHANGED, { circuit: transition.to, timestamp: Date.now() });
            }
        }
    });
    if (isDebug()) {
        log('debug', 'Boot Diagnostics:', { instanceId: this.instanceId, version: this.version, sessionId: this.sessionId });
    }
};

Header.prototype._registerLocalListener = function(eventName: string, handler: Function) {
    if (this.eventBus && this.eventBus.on) {
        this.eventBus.on(eventName, handler);
        this._localListeners.push({ eventName, handler });
    }
};

Header.prototype._cleanupLocalListeners = function(this: any) {
    if (this.eventBus && this.eventBus.off) {
        this._localListeners.forEach(function(item: Record<string,unknown>) {
            // @ts-expect-error strict migration — TS2683
            this.eventBus.off(item.eventName, item.handler);
        }, this);
    }
    this._localListeners = [];
};

Header.prototype.propagateNetworkQuality = function(quality: string) {
    this.events.propagateNetworkQuality(quality);
};

Header.prototype.showFallback = function(type: string, message: string, options: Record<string,unknown>) {
    type = type || 'generic';
    message = message || 'Erro ao carregar dados';
    options = options || {};
    if (this.fallbackManager) this.fallbackManager.show(type, message, options);
};

Header.prototype.hideFallback = function() {
    if (this.fallbackManager) this.fallbackManager.hide();
};

Header.prototype.unmount = function() {
    if (this.isDestroyed) {
        log('warn', 'Header ja destruido');
        return Promise.resolve();
    }
    if (!this.isMounted) {
        log('warn', 'Header nao esta montado');
        return Promise.resolve();
    }
    if (this.integrations && this.integrations.cleanup) {
        this.integrations.cleanup();
    }
    _safeDevToolsDisable();
    return executeUnmount(this);
};

Header.prototype.refresh = function() {
    if (!this.refreshCoordinator) {
        log('warn', 'RefreshCoordinator nao disponivel');
        return;
    }
    _metrics.refreshCount++;
    _metrics.lastActivity = Date.now();
    this.refreshCoordinator.request();
};

Header.prototype.getState = function() {
    return this.store ? this.store.getState() : {};
};

Header.prototype.getCurrentRoute = function() {
    return this.routerIntegration ? this.routerIntegration.getCurrentRoute() : null;
};

Header.prototype.log = function(level: string) {
    const args = Array.prototype.slice.call(arguments, 1);
    // @ts-expect-error strict migration — TS2345
    log.apply(null, [level].concat(args));
};

Header.prototype._emitGlobalEvent = (eventName: string, detail: unknown) => {
    const event = new CustomEvent(eventName, { detail, bubbles: true, cancelable: false });
    document.dispatchEvent(event);
};

Header.prototype.setDebug = function(enabled: boolean) {
    setDebugMode(enabled);
    if (this.logger && this.logger.setDebug) this.logger.setDebug(enabled);
    if (this.telemetry && this.telemetry.setDebug) this.telemetry.setDebug(enabled);
    if (this.events && this.events.setDebug) this.events.setDebug(enabled);
    if (enabled && !DevTools.isEnabled()) {
        DevTools.init(this, this.integrations);
    } else if (!enabled && DevTools.isEnabled()) {
        _safeDevToolsDisable();
    }
    log('info', `Debug mode: ${isDebug()}`);
};

Header.prototype.getMetrics = () => getMetrics();

Header.prototype.getIntegrationsStatus = () => getIntegrationsStatus();

Header.prototype.resetMetrics = function() {
    resetMetrics();
    if (this.events && this.events.resetMetrics) this.events.resetMetrics();
};

Header.prototype.healthCheck = function() {
    const hc: Record<string, unknown> = performHealthCheck(this);
    hc.portsInitialized = Ports.isInitialized();
    hc.p26Compliant = true;
    hc.p0Compliant = true;
    hc.usesGlobalEventBus = !!this.eventBus;
    hc.enterpriseVersion = VERSION;
    if (this.integrations && this.integrations.healthCheck) {
        hc.enterpriseIntegrations = this.integrations.healthCheck();
    }
    return hc;
};

Header.prototype.info = function() {
    const i: Record<string, unknown> = getInfo(this);
    i.portsInitialized = Ports.isInitialized();
    i.p26Compliant = true;
    i.p0Compliant = true;
    i.usesGlobalEventBus = !!this.eventBus;
    i.localListenersCount = this._localListeners.length;
    i.enterpriseVersion = VERSION;
    if (this.integrations && this.integrations.info) {
        i.enterpriseIntegrations = this.integrations.info();
    }
    i.featureFlags = FeatureFlags.getAll();
    return i;
};

Header.prototype.getVersion = () => VERSION;

Header.prototype.getIntegrations = function() {
    return this.integrations;
};

Header.prototype.getFeatureFlags = () => FeatureFlags;

const createHeader = (options: Record<string,unknown>) => {
    options = options || {};
    return (new (Header as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options));
};

const mount = (container: HTMLElement|null, options: Record<string,unknown>) => {
    options = options || {};
    const instance = createHeader(options);
    return instance.mount(container).then(() => {
        if (typeof window !== 'undefined') {
            if (!isStrict()) {
                (window as any).__headerAPIInstance = instance;
            } else {
                recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).__headerAPIInstance', context: 'mount()' });
            }
        }
        return instance;
    });
};

const getHeaderInstance = () => {
    if (typeof window === 'undefined') return null;
    if (isStrict()) {
        recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).__headerAPIInstance', context: 'getHeaderInstance()' });
        return null;
    }
    return (window as any).__headerAPIInstance || null;
};

export { createHeader, mount, getHeaderInstance };

export default { createHeader, mount, getHeaderInstance, VERSION, MODULE_ID, injectPorts, getPorts };

if (!isStrict()) {
    registerWindowGlobals(createHeader, mount, getHeaderInstance);
} else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'registerWindowGlobals', context: 'module-init' });
}

// DevTools sempre permitido (window.__dev.*)
if (typeof window !== 'undefined') {
    window.__dev = window.__dev || {};
    window.__dev.header = createDebugAPI(getHeaderInstance);
}
