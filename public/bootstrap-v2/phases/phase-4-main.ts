
// Phase 4 - Main Enterprise v2 (P21)
// @version 4.6.0-HEALTH-CONTRACT
// @changelog v4.6.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v4.5.0-DOMAIN-PURE - window.CMBootstrap/ContainerMain → _resolveGlobal() via windowAdapter → window fallback (cadeia AAA)
// @changelog v4.4.0-MODULAR - Fix: Removed fallback boot - Main.init is sole owner of bootstrap
// @changelog v4.3.0-MODULAR - Fix: Prevent double boot (Main.init already boots container-main)
// @changelog v4.2.0-MODULAR - Refatorado para arquitetura modular
// @description Integração completa container-main Bootstrap (56+ managers)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.6.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES globals via _resolveGlobal():
//   1. windowAdapter.get(name)       — adapter layer
//   2. bootstrapBoot.getBootstrap()  — internal state (CMBootstrap)
//   3. window[name]                  — último fallback
// IMPORTS: phase-4/index (modular components),
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// CREATES (via windowAdapter.expose): ContainerMain API
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { SHELL_EVENTS } from '/core/runtime/events/catalog/shell.events.js';
import {
  VERSION as _BASE_VERSION,
  MODULE_ID,
  createPortsManager,
  createAuthDetector,
  createAuthListener,
  createMainMounter,
  createContainerMounter,
  createBootstrapBoot
} from './phase-4/index.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

var VERSION = '4.6.0-HEALTH-CONTRACT';

export { VERSION, MODULE_ID };

// Criar componentes modulares
var portsManager = createPortsManager();
var authDetector = createAuthDetector({ portsManager: portsManager });
var authListener = createAuthListener();
var mainMounter = createMainMounter({ portsManager: portsManager });
var containerMounter = createContainerMounter({ portsManager: portsManager });
var bootstrapBoot = createBootstrapBoot({ portsManager: portsManager });

// v4.5.0: Resolver globals via windowAdapter → window fallback
function _resolveGlobal(name: string) {
  if (typeof window === 'undefined') return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var resolved = window.Core.windowAdapter.get(name);
    if (resolved) return resolved;
  }
  return (window as unknown as Record<string, unknown>)[name] || null;
}

// === EXPORTS COMPATÍVEIS ===

export function injectPorts(ports: Record<string, unknown>) {
  portsManager.inject(ports);
}

export function getPorts() {
  return portsManager.getAll();
}

export function getContainerMainBootstrap() {
  return bootstrapBoot.getBootstrap() || _resolveGlobal('CMBootstrap');
}

// === MOUNT FUNCTIONS ===

function mountMain(ports: Record<string, unknown>, results: { initialized: string[]; failed: Array<{ id: string; error: string }> }, logger: Record<string, Function> | null) {
  return mainMounter.mount(ports, results).then(function(main) {
    if (!main) return null;

    // v4.4.0: Main.init() faz boot do container-main internamente
    syncContainerMainReference(logger, ports.windowAdapter as Record<string, Function> | null);

    return main;
  });
}

// v4.5.0: Apenas sincroniza referência (sem fallback boot), usa _resolveGlobal
function syncContainerMainReference(logger: Record<string, Function> | null, windowAdapter: Record<string, Function> | null) {
  var existingBootstrap = _resolveGlobal('CMBootstrap');

  if (!existingBootstrap) {
    if (logger) logger.info('[P14] CMBootstrap not yet available - Main.init may still be initializing');
    return;
  }

  if (logger) logger.info('[P14] Bootstrap found - syncing reference');

  // Sincroniza a referência interna
  bootstrapBoot._setBootstrap(existingBootstrap);

  // Marca container como montado
  containerMounter._setMounted(true);

  // Expõe ContainerMain API se ainda não exposto
  var containerMain = _resolveGlobal('ContainerMain');
  if (!containerMain) {
    var containerEl = document.getElementById('container-main') ||
                      document.querySelector('.dsd-container') ||
                      document.querySelector('[data-container-main="true"]');

    var containerAPI = {
      element: containerEl,
      contentElement: containerEl ? containerEl.querySelector('.dsd-container__content') : null,
      id: 'container-main',
      mode: 'synced',
      mount: function() {},
      unmount: function() {},
      getElement: function() { return containerEl; },
      getContentElement: function() { return this.contentElement; },
      getBootstrap: function() { return existingBootstrap; },
      isBootstrapped: function() { return true; }
    };

    if (windowAdapter && windowAdapter.expose) windowAdapter.expose('ContainerMain', containerAPI);
    portsManager.exposeGlobal('ContainerMain', containerAPI);
  }

  var info = existingBootstrap.info ? existingBootstrap.info() : {};
  if (logger) logger.info('[P14] container-main Bootstrap synced', {
    state: existingBootstrap.getState ? existingBootstrap.getState() : 'unknown',
    version: info.version || 'unknown',
    managersActive: info.managersActive || 0
  });
}

// === PHASE DEFINITION ===

var phase4 = {
  id: 'phase-4-main',
  name: 'Main Enterprise v2',
  order: 4,
  critical: true,
  recoverable: true,
  dependsOn: ['phase-3-shell'],
  parallel: false,
  modules: [{ id: 'main', name: 'Main Enterprise Engine v2', critical: true, timeout: 15000 }],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ id: string; error: string }> } = { initialized: [], failed: [] };
    var startTime = performance.now();

    portsManager.init();

    if (mainMounter.isMounted()) {
      if (logger) logger.info('[P14] Main already mounted - skipping');
      return Promise.resolve({ success: true, skipped: true, reason: 'already-mounted', time: 0 });
    }

    if (logger) logger.info('[P14] Phase 4 starting: Main Enterprise v2', { version: VERSION });
    if (telemetry) telemetry.track('phase-4-start', { version: VERSION });

    // Always register auth listeners first
    authListener.register(ports, function(phasePorts: Record<string, unknown> | null, data: Record<string, unknown>) {
      if (mainMounter.isMounted()) {
        if (logger) logger.info('[P14] Main already mounted - skipping');
        return;
      }
      if (logger) logger.info('[P14] Auth event received - mounting Main', { data: data });
      var mountResults: { initialized: string[]; failed: Array<{ id: string; error: string }> } = { initialized: [], failed: [] };
      // @ts-expect-error strict migration — TS2345
      mountMain(phasePorts, mountResults, logger).catch(function(e) {
        if (logger) logger.error('[P14] Mount after auth event failed', { error: e.message });
      });
    });

    // Check authentication status
    var isAuthenticated = authDetector.checkAuthentication();
    var dataState = authDetector.getDataState();

    if (logger) logger.info('[P14] Auth check result', {
      isAuthenticated: isAuthenticated,
      dataState: dataState,
      authReady: authDetector.getAuthReady()
    });

    // Not authenticated and no state - defer
    if (!isAuthenticated && dataState === null) {
      if (logger) logger.info('[P14] User not authenticated - Main mount deferred');
      return Promise.resolve({
        success: true,
        deferred: true,
        reason: 'awaiting-auth',
        listenersActive: true,
        initialized: results.initialized,
        failed: results.failed,
        time: Math.round(performance.now() - startTime)
      });
    }

    // Authenticated - mount immediately
    if (isAuthenticated || dataState === 'authenticated') {
      return mountMain(ports, results, logger).then(function() {
        var elapsed = Math.round(performance.now() - startTime);
        if (telemetry) telemetry.track('phase-4-complete', { initialized: results.initialized.length, time: elapsed });
        if (logger) logger.info('[P14] Phase 4 complete', { initialized: results.initialized, time: elapsed });
        return { success: results.failed.length === 0, initialized: results.initialized, failed: results.failed, time: elapsed };
      });
    }

    // Fallback: defer mount
    if (logger) logger.info('[P14] User not authenticated - Main mount deferred');
    return Promise.resolve({
      success: true,
      deferred: true,
      reason: 'awaiting-auth',
      listenersActive: true,
      initialized: results.initialized,
      failed: results.failed,
      time: Math.round(performance.now() - startTime)
    });
  },

  recover: function(error: Error, ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    if (logger) logger.warn('[P14] Phase 4 recovery: Main will operate in degraded mode', { error: error.message });
    if (telemetry) telemetry.track('phase-4-recovery', { error: error.message });
    return Promise.resolve();
  }
};

// === LIFECYCLE ===

export function resetPhase4() {
  authListener.reset();
  mainMounter.reset();
  containerMounter.reset();
  bootstrapBoot.reset();
  portsManager.reset();
}

export function destroy() {
  resetPhase4();
}

export function healthCheck() {
  var bootstrap = getContainerMainBootstrap();
  var bootstrapInfo = bootstrap && bootstrap.info ? bootstrap.info() : null;
  var bootstrapHealth = bootstrap && bootstrap.healthCheck ? bootstrap.healthCheck() : null;

  return createHealthResult({
    status: mainMounter.isMounted() ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      mainMounted: mainMounter.isMounted(),
      containerMainMounted: containerMounter.isMounted(),
      containerMainBootstrapped: !!bootstrap,
      authListenerRegistered: authListener.isRegistered()
    },
    details: {
      modular: true,
      mainMounted: mainMounter.isMounted(),
      containerMainMounted: containerMounter.isMounted(),
      containerMainBootstrapped: !!bootstrap,
      containerMainState: bootstrap && bootstrap.getState ? bootstrap.getState() : null,
      containerMainManagers: bootstrapInfo ? bootstrapInfo.managersActive : 0,
      containerMainHealth: bootstrapHealth ? bootstrapHealth.status : null,
      authListenerRegistered: authListener.isRegistered(),
      cleanups: authListener.getCleanups().length,
      p21Compliant: true,
      p0Compliant: true,
      diEnabled: true,
      unifiedIntegration: true
    }
  });
}

// === DEV TOOLS ===

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.phase4 = {
    getState: function() {
      return {
        authListenerRegistered: authListener.isRegistered(),
        mainMounted: mainMounter.isMounted(),
        containerMainMounted: containerMounter.isMounted(),
        containerMainBootstrapped: !!getContainerMainBootstrap(),
        cleanups: authListener.getCleanups().length,
        portsInitialized: portsManager.isInitialized()
      };
    },
    getPorts: function() { return portsManager.getAll(); },
    getBootstrap: function() { return getContainerMainBootstrap(); },
    healthCheck: healthCheck,
    version: VERSION
  };
}

export { phase4, AUTH_EVENTS };
export default phase4;
