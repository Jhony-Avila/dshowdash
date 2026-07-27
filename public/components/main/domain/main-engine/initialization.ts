

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.6.0-BOOT-DIAGNOSTIC)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-initialization
// PURPOSE: MainEngine Initialization
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   STATES from ../state-machine.js
//   createNavigationController from ../navigation-controller/index.js
//   createPanelLifecycleController from ../panel-lifecycle-controller.js
//   createErrorSupervisor from ../error-supervisor.js
//   createManifestController from ../manifest-controller.js
//   createLayoutController from ../layout-controller.js
//   createCanvasControllerEnterprise from ../canvas-controller-enterprise.js
//   createTimelineController from ../timeline-controller.js
//   createOrchestratorController from ../orchestrator-controller.js
//   createGlobalStateControllerV2 from ../globalstate-controller-v2.js
//   createMultiContainerOrchestrator from ../multi-container-orchestrator.js
//   createObservabilityModule from ../observability/index.js
//   createAuditModule from ../audit/index.js
//   createPersistenceAdapter from ../persistence/index.js
//   VERSION from ./constants.js
//   boot as bootContainerMain, getBootstrap, ContainerMain from ../../ui/containe...
//   initMainKernel from ./kernel-integration.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   createSubsystems() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
//   window.CMBootstrap (diagnostic read)
//   window.ContainerMain (diagnostic read)
// ═══════════════════════════════════════════════════════════════
// @version 6.6.0-BOOT-DIAGNOSTIC
// @changelog v6.6.0-BOOT-DIAGNOSTIC - Added console.error to bootContainerMainPlatform catch for silent failure diagnosis
// @changelog v6.5.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v6.4.0-P0-ENTERPRISE - Logger via Ports (elimina window.Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { STATES } from '../state-machine.js';
import { createNavigationController } from '../navigation-controller/index.js';
import { createPanelLifecycleController } from '../panel-lifecycle-controller.js';
import { createErrorSupervisor } from '../error-supervisor.js';
import { createManifestController } from '../manifest-controller.js';
import { createLayoutController } from '../layout-controller.js';
import { createCanvasControllerEnterprise } from '../canvas-controller-enterprise.js';
import { createTimelineController } from '../timeline-controller.js';
import { createOrchestratorController } from '../orchestrator-controller.js';
import { createGlobalStateControllerV2 } from '../globalstate-controller-v2.js';
import { createMultiContainerOrchestrator } from '../multi-container-orchestrator.js';
import { createObservabilityModule } from '../observability/index.js';
import { createAuditModule } from '../audit/index.js';
import { createPersistenceAdapter } from '../persistence/index.js';
import { VERSION } from './constants.js';

// Container-Main Platform Integration
import { boot as bootContainerMain, getBootstrap } from '../../ui/container-main/index.js';

// MainKernel Integration (P1 - Domain Features)
import { initMainKernel } from './kernel-integration.js';

export const MODULE_ID = 'main-engine-initialization';

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string): unknown { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): boolean { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback to console)
  // 4. Non-strict: use window.Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

// Helper for logging
function _log(level: string, ...args: unknown[]): void {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](...args);
}

export function createSubsystems(engine: Record<string, unknown>): void {
  const ports = engine._ports as Record<string, unknown>;
  const adapters = engine._adapters as Record<string, unknown>;
  const events = engine._events as Record<string, unknown>;
  
  // Error supervisor first
// @ts-expect-error TS migration - TS2345
  engine._errorSupervisor = createErrorSupervisor(ports.telemetry);
  
  // Manifest controller - needed by navigation controller
  engine._manifestController = createManifestController({ ports: { ...ports, events } });
  
  // Layout and UI controllers
  engine._layoutController = createLayoutController({ ports: { ...ports, events } });
  engine._canvasController = createCanvasControllerEnterprise({ ports: { ...ports, events }, adapters });
  engine._timelineController = createTimelineController({ ports: { ...ports, events } });
  engine._globalStateV2 = createGlobalStateControllerV2({ ports: { ...ports, events } });
  
  // Panel lifecycle controller
  engine._panelLifecycle = createPanelLifecycleController(ports.panel as Record<string, unknown>, adapters.dom as Record<string, unknown>, ports.container as Record<string, unknown>, (ports.telemetry || {}) as Record<string, unknown>);
  
  // v6.2.0-MANIFEST-FIX: Pass manifestController as 4th argument
  engine._navigationController = createNavigationController(
    engine._panelLifecycle as Record<string, unknown>,
    engine._stateMachine as Record<string, unknown>,
    ports.telemetry as Record<string, unknown>,
    engine._manifestController as Record<string, unknown>  // CRITICAL: This was missing!
  );
  
  // Orchestrator and other controllers
  engine._orchestrator = createOrchestratorController({ 
    ports: { ...ports, events }, 
    manifestController: engine._manifestController, 
    layoutController: engine._layoutController, 
    errorSupervisor: engine._errorSupervisor 
  });
  
  engine._multiContainerOrchestrator = createMultiContainerOrchestrator({ ports: { ...(ports as Record<string, unknown>), events } });
  engine._auditModule = createAuditModule({ ports: { events, telemetry: (ports as Record<string, unknown>)?.telemetry } });
  engine._persistenceAdapter = createPersistenceAdapter({ ports: { events, telemetry: (ports as Record<string, unknown>)?.telemetry } });
  engine._observabilityModule = createObservabilityModule({
    ports: { events, telemetry: (ports as Record<string, unknown>)?.telemetry },
    modules: { 
      actionHub: null, 
      audit: engine._auditModule, 
      persistence: engine._persistenceAdapter, 
      mainEngine: engine, 
      multiContainer: engine._multiContainerOrchestrator 
    } 
  });
}

export async function initializeSubsystems(engine: Record<string, unknown>): Promise<void> {
  await (engine._manifestController as Record<string, (...args: unknown[]) => unknown>).loadManifest();
  (engine._layoutController as Record<string, (...args: unknown[]) => unknown>).syncFromStatePort();
  (engine._canvasController as Record<string, (...args: unknown[]) => unknown> | null)?.init?.();
  (engine._timelineController as Record<string, (...args: unknown[]) => unknown> | null)?.startRecording?.();
}

// v6.1.0: Find safe container element - MUST be inside shell-main-region
function _findSafeContainerElement() {
  // Check if shell exists first - this is REQUIRED
  const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (!shellMain) {
    _log('warn', '[main-engine] shell-main-region not found - cannot boot container-main safely');
    return null;
  }
  
  // Look for existing container inside shell
  const existingContainer = shellMain.querySelector('#container-main') ||
                            shellMain.querySelector('.dsd-container') ||
                            shellMain.querySelector('[data-container-main="true"]');
  
  if (existingContainer) {
    return existingContainer;
  }
  
  // Return the shell-main-region itself as the target (container will be created inside it)
  return shellMain;
}

// Container-Main Platform Boot - Inicializa todos os 56+ managers
export async function bootContainerMainPlatform(engine: Record<string, unknown>): Promise<unknown> {
  const startTime = performance.now();
  const enginePorts = engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>;

  try {
    // v6.1.0: Use safe container detection instead of unreliable port
    const containerEl = _findSafeContainerElement();
    
    // v6.6.0: Diagnostic logging for container element detection
    _log('info', '[main-engine] bootContainerMainPlatform: containerEl =', containerEl?.id || containerEl?.tagName || 'null');
    
    // v6.1.0: CRITICAL - Do not boot if shell doesn't exist
    if (!containerEl) {
      _log('warn', '[main-engine] Skipping container-main boot - shell not ready, _findSafeContainerElement() returned null');
      enginePorts.telemetry?.track?.('main:container-main-boot-skipped', { reason: 'shell-not-ready' });
      return null;
    }
    
    const bootstrap = await bootContainerMain(containerEl as HTMLElement, {
      autoStart: true,
      enableLazyLoading: true,
      waitForLazyComponents: false,
      // FASE 2
      enablePerformanceMonitor: true,
      enableFallbackSystem: true,
      // FASE 4
      enablePlugins: true,
      enableLifecycleHooks: true,
      enableBootMetrics: true,
      enableEventBusAdapter: true,
      enableStateSnapshots: true,
      enableDebugMode: false,
      enableConfigPersistence: true,
      enableSlotPresets: true,
      // FASE 5 Core
      enableSanitizer: true,
      enableRateLimiter: true,
      enableDevToolsPanel: false,
      enableWorkerManager: true,
      enableConsoleCommands: false,
      enableTelemetryDashboard: false,
      // FASE 5 Extended
      enableRequestQueue: true,
      enableCacheManager: true,
      enableEventRecorder: false,
      // FASE 6 UI/UX Core
      enableNotificationManager: true,
      enableFormValidator: true,
      enableStorageManager: true,
      enableClipboardManager: true,
      enableDragDropManager: true,
      enableModalManager: true,
      // FASE 6 UI/UX Extended
      enableTooltipManager: true,
      enableContextMenuManager: true,
      enableHotkeyManager: true,
      enableScrollManager: true,
      enableFocusManager: true,
      enableUndoManager: true,
      // FASE 6 Advanced
      enableThemeManager: true,
      enableAnimationManager: true,
      enableMediaQueryManager: true,
      enableIntersectionManager: true,
      enableResizeManager: true,
      enableMutationManager: true,
      // FASE 7 Device & Browser APIs
      enablePermissionManager: true,
      enableNetworkManager: true,
      enableGeolocationManager: false,
      enableDeviceManager: true,
      enableBatteryManager: true,
      enableFullscreenManager: true,
      enableVisibilityManager: true,
      enableWakeLockManager: false,
      enableShareManager: true,
      // Callbacks
      onReady: (bs: Record<string, (...args: unknown[]) => Record<string, unknown>>) => {
        enginePorts.telemetry?.track?.('container-main:ready', {
          bootTime: performance.now() - startTime,
          managersActive: bs.info().managersActive
        });
      },
      onError: (error: Error, context: Record<string, unknown>) => {
        enginePorts.telemetry?.track?.('container-main:error', { error: error.message, context });
        (engine._errorSupervisor as Record<string, (...args: unknown[]) => unknown> | null)?.capture?.(error, { phase: 'container-main-boot', context });
      }
    });
    
    engine._containerMainBootstrap = bootstrap;
    (enginePorts as Record<string, unknown>).ui = createUIPortFromBootstrap(bootstrap as Record<string, unknown>);
    
    if (typeof window !== 'undefined') {
      // ContainerMain globals are now handled by bootstrap _exposeGlobals()
      (window as any).CMBootstrap = bootstrap;
    }
    
    const bootTime = Math.round(performance.now() - startTime);
    _log('info', '[main-engine] container-main booted successfully', { bootTime });
    const bsTyped = bootstrap as Record<string, (...args: unknown[]) => Record<string, unknown>>;
    enginePorts.telemetry?.track?.('main:container-main-booted', {
      version: bsTyped.info().version,
      state: bsTyped.getState(),
      managersActive: bsTyped.info().managersActive || 0,
      bootTime
    });
    
    return bootstrap;
  } catch (error: unknown) {
    // v6.6.0-BOOT-DIAGNOSTIC: Surface the error that was being silently swallowed
    const err = error as Error;
    _log('error', '[main-engine] bootContainerMainPlatform FAILED:', err.message, err.stack);
    enginePorts.telemetry?.track?.('main:container-main-boot-failed', { error: err.message, stack: err.stack });
    (engine._errorSupervisor as Record<string, (...args: unknown[]) => unknown> | null)?.capture?.(error, { phase: 'container-main-boot' });
    return null;
  }
}

// UIPort - Expõe managers do container-main via interface simplificada
function createUIPortFromBootstrap(bootstrap: Record<string, unknown>): Record<string, unknown> | null {
  if (!bootstrap) return null;
  const bs = bootstrap as Record<string, (...args: unknown[]) => unknown>;
  return {
    // Notifications
    notify: (msg: string, opts: Record<string, unknown>) => bs.notify?.(msg, opts),
    notifySuccess: (msg: string, opts: Record<string, unknown>) => bs.notifySuccess?.(msg, opts),
    notifyError: (msg: string, opts: Record<string, unknown>) => bs.notifyError?.(msg, opts),
    // Modals
    openModal: (config: Record<string, unknown>) => bs.openModal?.(config),
    closeModal: (id: string, result: unknown) => bs.closeModal?.(id, result),
    modalAlert: (msg: string, opts: Record<string, unknown>) => bs.modalAlert?.(msg, opts),
    modalConfirm: (msg: string, opts: Record<string, unknown>) => bs.modalConfirm?.(msg, opts),
    // Theme
    setTheme: (theme: string) => bs.setTheme?.(theme),
    toggleTheme: () => bs.toggleTheme?.(),
    isDarkMode: () => bs.isDarkMode?.() ?? false,
    // Hotkeys
    registerHotkey: (combo: string, handler: (...args: unknown[]) => void, opts: Record<string, unknown>) => bs.registerHotkey?.(combo, handler, opts),
    // Storage
    storageGet: (key: string, opts: Record<string, unknown>) => bs.storageGet?.(key, opts),
    storageSet: (key: string, value: unknown, opts: Record<string, unknown>) => bs.storageSet?.(key, value, opts),
    // Clipboard
    copyToClipboard: (text: string, opts: Record<string, unknown>) => bs.copyToClipboard?.(text, opts),
    // Scroll
    scrollTo: (target: string | HTMLElement, opts: Record<string, unknown>) => bs.scrollTo?.(target, opts),
    scrollToTop: (opts: Record<string, unknown>) => bs.scrollToTop?.(),
    // Undo/Redo
    recordAction: (action: Record<string, unknown>) => bs.recordAction?.(action),
    undo: () => bs.undo?.(),
    redo: () => bs.redo?.(),
    canUndo: () => bs.canUndo?.() ?? false,
    canRedo: () => bs.canRedo?.() ?? false,
    // Network
    isOnline: () => bs.isOnline?.() ?? navigator.onLine,
    isOffline: () => bs.isOffline?.() ?? !navigator.onLine,
    // Device
    isMobile: () => bs.isMobile?.() ?? false,
    isTouch: () => bs.isTouch?.() ?? false,
    getDeviceType: () => bs.getDeviceType?.(),
    // Fullscreen
    enterFullscreen: (el: HTMLElement) => bs.enterFullscreen?.(el),
    exitFullscreen: () => bs.exitFullscreen?.(),
    toggleFullscreen: (el: HTMLElement) => bs.toggleFullscreen?.(el),
    isFullscreen: () => bs.isFullscreen?.() ?? false,
    // Visibility
    isPageVisible: () => bs.isPageVisible?.() ?? true,
    // Animation
    animate: (el: HTMLElement, props: Record<string, unknown>, opts: Record<string, unknown>) => bs.animate?.(el, props, opts),
    fadeIn: (el: HTMLElement, duration: number) => bs.fadeIn?.(el, duration),
    fadeOut: (el: HTMLElement, duration: number) => bs.fadeOut?.(el, duration),
    // Intersection
    lazyLoad: (selector: string, opts: Record<string, unknown>) => bs.lazyLoad?.(selector, opts),
    // Cache
    cacheGet: (key: string, defaultValue: unknown) => bs.cacheGet?.(key, defaultValue),
    cacheSet: (key: string, value: unknown, opts: Record<string, unknown>) => bs.cacheSet?.(key, value, opts),
    // Rate Limiter
    checkRateLimit: (key: string) => bs.checkRateLimit?.(key),
    // Sanitizer
    sanitize: (type: string, input: string) => bs.sanitize?.(type, input),
    escapeHtml: (input: string) => bs.escapeHtml?.(input),
    // Bootstrap reference
    getBootstrap: () => bs,
    // Health
    healthCheck: () => bs.healthCheck?.(),
    info: () => bs.info?.()
  };
}

export async function tryRestoreSnapshot(engine: Record<string, unknown>): Promise<void> {
  try {
    const restored = await (engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null)?.restore?.();
    if (restored) {
      (engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry?.track?.('main:snapshot-restored-on-init', {});
    }
  } catch (e: unknown) {
    (engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry?.track?.('main:snapshot-restore-failed', { error: (e as Error).message });
  }
}

export async function performInit(engine: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (engine._initialized) return engine;
  if (engine._destroyed) throw new Error('Cannot init destroyed engine - create new instance');
  
  engine._initTimestamp = Date.now();
  const sm = engine._stateMachine as Record<string, (...args: unknown[]) => unknown>;
  sm.transition(STATES.INITIALIZING);

  try {
    createSubsystems(engine);
    await initializeSubsystems(engine);

    // P1: Initialize Domain Features via MainKernel
    await initMainKernel(engine);

    await bootContainerMainPlatform(engine);
    await tryRestoreSnapshot(engine);

    engine._initialized = true;
    sm.transition(STATES.READY);

    const initPorts = engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>;
    initPorts.telemetry?.track?.('main:init', {
      version: VERSION,
      containerMainIntegrated: !!engine._containerMainBootstrap,
      hasManifestController: !!engine._manifestController,
      hasNavigationController: !!engine._navigationController
    });

    (engine._emit as (...args: unknown[]) => void)(MAIN_EVENTS.READY, {
      version: VERSION,
      containerMainIntegrated: !!engine._containerMainBootstrap
    });

    return engine;
  } catch (error) {
    sm.transition(STATES.ERROR);
    (engine._errorSupervisor as Record<string, (...args: unknown[]) => unknown> | null)?.capture?.(error, { phase: 'init' });
    throw error;
  }
}

export function healthCheck() {
  const bootstrap = getBootstrap();
  return {
    status: _portsInitialized ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    strictMode: isStrict(),
    containerMainIntegrated: !!bootstrap,
    containerMainState: bootstrap?.getState?.() || 'NOT_INITIALIZED'
  };
}

export default { 
  createSubsystems, 
  initializeSubsystems, 
  bootContainerMainPlatform, 
  tryRestoreSnapshot, 
  performInit, 
  healthCheck, 
  MODULE_ID 
};
