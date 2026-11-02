
// Phase 5 - UI Components
// @version 5.7.0-ROUTE-CHANGED-EVENT
// @changelog v5.7.0-ROUTE-CHANGED-EVENT: CRITICAL FIX — Bootstrap was emitting
//   'orchestrator:navigate' which no listener in main.bundle.js handles.
//   Now emits 'router.route.changed' (ROUTER_EVENTS.ROUTE_CHANGED) which is
//   the canonical event that main listeners.js line 34208 handles via
//   extractPanelId() → engine.navigate(). This is the same event the sidebar
//   and router emit when hash changes, ensuring consistent navigation flow.
// @changelog v5.6.0-ROUTE-RESOLVE-FIX: Bootstrap route resolution now uses
//   resolveFromURL() instead of emit('navigate') which created unknown intents.
// @changelog v5.5.0-FASE-C: Fase C Enterprise: fallback window.ContextProvider eliminado (NR-FULL)
// @changelog v5.4.0-STRICT-MODE: Migração _resolveOptionalDeps para strict mode (NR-FULL)
// @changelog v5.3.0-WAIT-SHELL-READY: Preloader aguarda shell components (header/sidebar/navRail/footer) antes de fade
// @changelog v5.2.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v5.1.0-DOMAIN-PURE: Referências locais _overlayLayer/_uiOrchestrator eliminam window.* leituras repetidas
// @changelog v5.0.0-DOMAIN-PURE: _resolveRuntimeContext() helper — elimina 4 window.RuntimeContext diretos
// @changelog v4.9.0-DEFENSIVE-CONTRACTS: Ação 2 — Defensive Guards + Contrato de Dependências formal
// @changelog v4.8.0-PRELOADER-API: Preloader fade usa PreloaderController API em vez de DOM direto
// @changelog v4.7.0-P0: Consumir RuntimeContext do Kernel (ADR-002 compliance)
// @changelog v4.6.0-ELEVATION: Adicionado OverlayLayer com RuntimeContext (ADR-002)
// @changelog v4.5.0: ES5 conversion
// @contract STRICT_MODE - Em modo strict, sem fallback para window.* em optional deps
'use strict';

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.7.0)
// ═══════════════════════════════════════════════════════════════
// RESOLVES RuntimeContext via chain:
//   1. getRuntimeContext() (kernel/index.js) — injeção preferida
//   2. window.RuntimeContext                 — último fallback
// RESOLVES EventBus via chain:
//   1. window.Core.EventBus                  — via Core namespace
//   2. window.EventBus                       — fallback direto
//   3. window.EventBusGlobal                 — último fallback
// RESOLVES ReadyFlags via chain:
//   1. window.ReadyFlags                     — global API
// CREATES (registers on window via windowAdapter.expose):
//   window.OverlayLayer, window.UIOrchestrator, window.Toast
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// NOTE: Após criação, referências locais (_overlayLayer, _uiOrchestrator)
//   são usadas internamente — window.* leituras eliminadas.
// OPTIONAL DEPS (resolvidos defensivamente via _resolveOptionalDeps):
//   window.AppShell, window.ApplicationKernel, window.PermissionsGuard,
//   window.HealthAggregator, window.ContextProvider
// BROWSER APIs (legítimo):
//   window.PreloaderController, window.location, window.__dev,
//   window.AppShellReady, document.querySelector, performance.now()
//
// SHELL READY FLAGS (v5.3.0 - aguardados antes do preloader fade):
//   appshell, header, sidebar, navRail, footer
//
// NAVIGATION EVENT (v5.7.0):
//   Emits 'router.route.changed' via eventBus after resolveFromURL().
//   This is ROUTER_EVENTS.ROUTE_CHANGED — the canonical event that
//   main/listeners.js (setupAllListeners) handles to call engine.navigate().
// ═══════════════════════════════════════════════════════════════

// P0: Import RuntimeContext from Kernel
import { getRuntimeContext } from '/bootstrap-v2/kernel/index.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

var MODULE_ID = 'phase-5-ui';
var VERSION = '5.7.0-ROUTE-CHANGED-EVENT';

// v5.3.0: Shell component flags to wait for before hiding preloader
var SHELL_READY_FLAGS = ['appshell', 'header', 'sidebar', 'navRail', 'footer'];
var SHELL_READY_TIMEOUT = 8000; // 8 seconds max wait per flag

// ============================================================================
// RESOLVERS — Cadeia AAA para dependências obrigatórias
// ============================================================================

// v5.0.0: Resolver RuntimeContext via cadeia AAA (kernel → window fallback)
var _cachedRuntimeContext: Record<string, unknown> | null = null;
function _resolveRuntimeContext() {
  if (_cachedRuntimeContext) return _cachedRuntimeContext;
  var rc = getRuntimeContext();
  if (rc) {
    _cachedRuntimeContext = rc;
    return _cachedRuntimeContext;
  }
  if (typeof window !== 'undefined' && window.RuntimeContext) {
    _cachedRuntimeContext = window.RuntimeContext;
  }
  return _cachedRuntimeContext;
}

// v5.3.0: Resolver ReadyFlags
function _resolveReadyFlags() {
  if (typeof window !== 'undefined' && window.ReadyFlags) {
    return window.ReadyFlags;
  }
  return null;
}

// v5.3.0: Wait for all shell components to be ready
function _waitForShellReady(logger: Record<string, Function> | null) {
  var readyFlags = _resolveReadyFlags();
  
  if (!readyFlags || !readyFlags.waitFor) {
    if (logger) logger.warn('[phase-5] ReadyFlags not available, skipping shell wait');
    return Promise.resolve({ allReady: false, readyCount: 0, total: 0, notReady: [] as string[], reason: 'ReadyFlags not available' });
  }
  
  if (logger) logger.info('[phase-5] Waiting for shell components...', { flags: SHELL_READY_FLAGS });
  
  var waitPromises = SHELL_READY_FLAGS.map(function(flag) {
    return readyFlags!.waitFor(flag, SHELL_READY_TIMEOUT).then(function(ready) {
      return { flag: flag, ready: ready };
    });
  });
  
  return Promise.all(waitPromises).then(function(results) {
    var readyCount = results.filter(function(r) { return r.ready; }).length;
    var notReady = results.filter(function(r) { return !r.ready; }).map(function(r) { return r.flag; });
    
    if (logger) {
      if (notReady.length > 0) {
        logger.warn('[phase-5] Some shell components not ready (timeout)', { 
          ready: readyCount + '/' + SHELL_READY_FLAGS.length,
          notReady: notReady 
        });
      } else {
        logger.info('[phase-5] All shell components ready', { 
          ready: readyCount + '/' + SHELL_READY_FLAGS.length 
        });
      }
    }
    
    return { 
      allReady: notReady.length === 0, 
      readyCount: readyCount,
      total: SHELL_READY_FLAGS.length,
      notReady: notReady
    };
  });
}

// v5.1.0: Referências locais para OverlayLayer e UIOrchestrator
// Populadas durante execute(), usadas por healthCheck/info e módulos sequenciais
var _overlayLayer: Record<string, Function> | null = null;
var _uiOrchestrator: Record<string, Function> | null = null;

// ============================================================================
// DEFENSIVE GUARDS — Resolução de dependências opcionais (Ação 2A)
// v5.4.0: Strict mode awareness para ContextProvider
// ============================================================================
function _resolveOptionalDeps(logger: Record<string, Function> | null) {
  var strictMode = isStrict();

  // Core.windowAdapter é o único canal — Fase C
  var contextProvider = null;
  if (typeof window !== 'undefined') {
    // Primary: Core.windowAdapter
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      contextProvider = window.Core.windowAdapter.get('ContextProvider');
    }
  }

  var deps: Record<string, unknown> = {
    appShell: (typeof window !== 'undefined' && (window as any).AppShell) ? (window as any).AppShell : null,
    applicationKernel: (typeof window !== 'undefined' && window.ApplicationKernel) ? window.ApplicationKernel : null,
    permissionsGuard: (typeof window !== 'undefined' && window.PermissionsGuard) ? window.PermissionsGuard : null,
    healthAggregator: (typeof window !== 'undefined' && (window as any).HealthAggregator) ? (window as any).HealthAggregator : null,
    contextProvider: contextProvider
  };

  var missing = Object.keys(deps).filter(function(k) { return deps[k] === null; });
  if (missing.length > 0 && logger) {
    logger.warn('[phase-5] Optional dependencies not available', { missing: missing, available: Object.keys(deps).filter(function(k) { return deps[k] !== null; }), strictMode: strictMode });
  }

  return deps;
}

function _resolveEventBus() {
  if (typeof window === 'undefined') return null;
  if (window.Core && window.Core.EventBus) return window.Core.EventBus;
  return window.EventBus || (window as any).EventBusGlobal || null;
}

var phase5 = {
  id: 'phase-5-ui',
  name: 'UI Components',
  order: 5,
  critical: false,
  recoverable: true,
  dependsOn: ['phase-4-main'],
  parallel: true,

  modules: [
    { id: 'overlay-layer', name: 'Overlay Layer', critical: true, timeout: 5000 },
    { id: 'ui-orchestrator', name: 'UI Orchestrator', critical: true, timeout: 5000 },
    { id: 'ticker', name: 'Ticker', critical: false, timeout: 5000 },
    { id: 'toast', name: 'Toast Service', critical: false, timeout: 3000 },
    { id: 'shell-ready-wait', name: 'Shell Ready Wait', critical: false, timeout: 10000 },
    { id: 'preloader-fade', name: 'Preloader Fade', critical: false, timeout: 2000 }
  ],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ id: string; error: string }>; skipped: Array<{ id: string; reason: string }> } = { initialized: [], failed: [], skipped: [] };
    var startTime = performance.now();

    // Ação 2A: Resolver dependências com guards defensivos
    var optDeps = _resolveOptionalDeps(logger);
    var eventBus = _resolveEventBus();

    if (!eventBus && logger) {
      logger.error('[phase-5] CRITICAL: EventBus not available — UI components may fail');
    }

    if (logger) logger.info('Phase 5 starting: UI Components', { version: VERSION, optionalDepsAvailable: Object.keys(optDeps).filter(function(k) { return optDeps[k] !== null; }).length + '/5' });
    if (telemetry) telemetry.track('phase-5-start');

    return Promise.resolve().then(function() {
      // 0. OverlayLayer - CRÍTICO para overlays (ADR-002)
      // v5.1.0: Usa _overlayLayer local em vez de window.OverlayLayer para check
      if (_overlayLayer && _overlayLayer.info) {
        var overlayInfo = _overlayLayer.info();
        if (overlayInfo && overlayInfo.initialized) {
          results.skipped.push({ id: 'overlay-layer', reason: 'already initialized' });
          if (logger) logger.info('OverlayLayer already initialized');
          return null;
        }
      }
      // Fallback: check via window (caso já inicializado por outro caminho)
      var overlayInfo = (typeof window !== 'undefined' && (window as any).OverlayLayer && (window as any).OverlayLayer.info) ? (window as any).OverlayLayer.info() : null;
      if (overlayInfo && overlayInfo.initialized) {
        _overlayLayer = (window as any).OverlayLayer;
        results.skipped.push({ id: 'overlay-layer', reason: 'already initialized' });
        if (logger) logger.info('OverlayLayer already initialized');
        return null;
      }
      
      return import('/components/overlay-layer/index.js').then(function(OverlayModule) {
        var OverlayLayer = (OverlayModule.default || OverlayModule.OverlayLayer) as unknown as Record<string, Function> | null;
        if (OverlayLayer && OverlayLayer.init) {
          var runtimeContext = _resolveRuntimeContext() as Record<string, Function> | null;

          if (logger) {
            if (runtimeContext) {
              logger.info('RuntimeContext obtained from Kernel', {
                version: runtimeContext.VERSION || 'unknown',
                mode: runtimeContext.getMode ? runtimeContext.getMode() : 'unknown',
                ready: runtimeContext.isReady ? runtimeContext.isReady() : false
              });
            } else {
              logger.warn('RuntimeContext not available from Kernel, OverlayLayer may have limited functionality');
            }
          }
          
          // Ação 2A: Usa dependências resolvidas defensivamente em vez de window.* direto
          var initContext = runtimeContext ? {
            runtimeContext: runtimeContext,
            eventBus: eventBus,
            applicationKernel: optDeps.applicationKernel,
            permissionsGuard: optDeps.permissionsGuard,
            healthAggregator: optDeps.healthAggregator,
            contextProvider: optDeps.contextProvider,
            appShell: optDeps.appShell,
            kernelMode: runtimeContext.getMode ? runtimeContext.getMode() : 'INITIALIZING',
            kernelReady: runtimeContext.isReady ? runtimeContext.isReady() : false,
            kernelHealthy: runtimeContext.isHealthy ? runtimeContext.isHealthy() : false
          } : {
            eventBus: eventBus,
            applicationKernel: optDeps.applicationKernel,
            permissionsGuard: optDeps.permissionsGuard,
            healthAggregator: optDeps.healthAggregator,
            contextProvider: optDeps.contextProvider,
            appShell: optDeps.appShell
          };
          
          return Promise.resolve(OverlayLayer.init(initContext)).then(function(initResult) {
            // v5.1.0: Captura referência local + expõe via windowAdapter
            _overlayLayer = OverlayLayer;
            if (windowAdapter && windowAdapter.expose) windowAdapter.expose('OverlayLayer', OverlayLayer);
            if (typeof window !== 'undefined') (window as any).OverlayLayer = OverlayLayer;
            results.initialized.push('overlay-layer');
            if (logger) logger.info('OverlayLayer initialized with RuntimeContext', { 
              version: OverlayLayer!.getVersion ? OverlayLayer!.getVersion() : 'unknown',
              kernelIntegrated: OverlayLayer!.isKernelIntegrated ? OverlayLayer!.isKernelIntegrated() : false,
              kernelMode: OverlayLayer!.getKernelMode ? OverlayLayer!.getKernelMode() : 'unknown',
              runtimeContextProvided: !!runtimeContext
            });
            
            // v5.1.0: Usa _uiOrchestrator local (pode já existir se módulo 1 rodou antes)
            if (_uiOrchestrator && _uiOrchestrator.connectOverlayLayer) {
              _uiOrchestrator.connectOverlayLayer(OverlayLayer);
              if (logger) logger.info('OverlayLayer connected to UIOrchestrator');
            }
          });
        } else {
          results.failed.push({ id: 'overlay-layer', error: 'No init function' });
          if (logger) logger.error('OverlayLayer module missing init function');
        }
      }).catch(function(error) {
        results.failed.push({ id: 'overlay-layer', error: error.message });
        if (logger) logger.error('OverlayLayer init error', { error: error.message });
      });
    }).then(function() {
      // 1. UIOrchestrator - CRÍTICO para roteamento
      // v5.1.0: Check via _uiOrchestrator local primeiro
      if (_uiOrchestrator && _uiOrchestrator.info) {
        var uiOrchInfo = _uiOrchestrator.info();
        if (uiOrchInfo && uiOrchInfo.initialized) {
          results.skipped.push({ id: 'ui-orchestrator', reason: 'already initialized' });
          if (logger) logger.info('UIOrchestrator already initialized');
          if (_overlayLayer && _uiOrchestrator.connectOverlayLayer) {
            _uiOrchestrator.connectOverlayLayer(_overlayLayer);
            if (logger) logger.info('OverlayLayer connected to existing UIOrchestrator');
          }
          return null;
        }
      }
      // Fallback: check via window
      var uiOrchInfo = (typeof window !== 'undefined' && window.UIOrchestrator && window.UIOrchestrator.info) ? window.UIOrchestrator.info() : null;
      if (uiOrchInfo && uiOrchInfo.initialized) {
        _uiOrchestrator = window.UIOrchestrator;
        results.skipped.push({ id: 'ui-orchestrator', reason: 'already initialized' });
        if (logger) logger.info('UIOrchestrator already initialized');
        if (_overlayLayer && _uiOrchestrator!.connectOverlayLayer) {
          _uiOrchestrator!.connectOverlayLayer(_overlayLayer);
          if (logger) logger.info('OverlayLayer connected to existing UIOrchestrator');
        }
        return null;
      }

      return import('/core/ui-orchestrator/index.js').then(function(UIOrchModule) {
        var UIOrch = (UIOrchModule.default || UIOrchModule) as unknown as Record<string, Function>;
        if (UIOrch && UIOrch.init) {
          var runtimeContext = _resolveRuntimeContext();
          
          return Promise.resolve(UIOrch.init({
            eventBus: eventBus,
            overlayLayer: _overlayLayer,
            runtimeContext: runtimeContext,
            config: { enableTelemetry: true, enableLogging: true, autoSyncAuth: true }
          })).then(function(initResult) {
            if (initResult.success) {
              // v5.1.0: Captura referência local + expõe via windowAdapter
              _uiOrchestrator = UIOrch;
              if (windowAdapter && windowAdapter.expose) windowAdapter.expose('UIOrchestrator', UIOrch);
              if (typeof window !== 'undefined') window.UIOrchestrator = UIOrch;
              results.initialized.push('ui-orchestrator');
              if (logger) logger.info('UIOrchestrator initialized', { 
                version: UIOrch.VERSION,
                runtimeContextProvided: !!runtimeContext
              });

              // v5.7.0-ROUTE-CHANGED-EVENT: Resolve current hash via ROUTES manifest
              // and emit router.route.changed (ROUTER_EVENTS.ROUTE_CHANGED) which is
              // the canonical event that main/listeners.js setupAllListeners() handles.
              // The listener calls extractPanelId(data) → engine.navigate(panelId).
              var currentHash = (typeof window !== 'undefined' && window.location) ? window.location.hash : '#/';
              if (currentHash && currentHash !== '#/' && currentHash !== '#//') {
                if (logger) logger.info('Resolving current route after UIOrchestrator init', { hash: currentHash });
                var resolution = UIOrch.resolveFromURL(currentHash) as Record<string, unknown> | null;
                if (resolution && resolution.success) {
                  var resPanel = resolution.panel as Record<string, unknown> | null;
                  var resRoute = resolution.route as Record<string, unknown> | null;
                  var resolvedPanelId = resPanel ? resPanel.id : null;
                  if (logger) logger.info('Route resolved from URL', {
                    hash: currentHash,
                    panelId: resolvedPanelId,
                    region: resolution.region,
                    routeId: resRoute ? resRoute.id : null
                  });
                  // v5.7.0: Emit router.route.changed with path for extractPanelId()
                  // AND emit main:navigate with panelId as direct fallback.
                  if (eventBus && eventBus.emit) {
                    // Primary: router.route.changed — canonical navigation event
                    // extractPanelId receives { path: "#/admin/navegacao" } and
                    // calls getRouteByIdOrPath() to find panel-nav-admin
                    eventBus.emit('router.route.changed', {
                      path: currentHash,
                      hash: currentHash,
                      route: resolution.route || null,
                      panel: resolution.panel || null,
                      region: resolution.region || 'main',
                      source: MODULE_ID,
                      timestamp: Date.now()
                    });
                  }
                } else {
                  if (logger) logger.warn('No route found for current hash', {
                    hash: currentHash,
                    error: resolution ? resolution.error : 'no resolution'
                  });
                }
              }
            } else {
              results.failed.push({ id: 'ui-orchestrator', error: initResult.error });
              if (logger) logger.error('UIOrchestrator init failed', { error: initResult.error });
            }
          });
        } else {
          results.failed.push({ id: 'ui-orchestrator', error: 'No init function' });
          if (logger) logger.error('UIOrchestrator module missing init function');
        }
      }).catch(function(error) {
        results.failed.push({ id: 'ui-orchestrator', error: error.message });
        if (logger) logger.error('UIOrchestrator init error', { error: error.message });
      });
    }).then(function() {
      // 2. Ticker via AppShell.adapters.ticker
      var appShellDep = optDeps.appShell as Record<string, Record<string, Record<string, Function>>> | null;
      if (appShellDep && appShellDep.adapters && appShellDep.adapters.ticker) {
        if (logger) logger.info('Connecting Ticker via AppShell adapter...');
        return Promise.resolve(appShellDep.adapters.ticker.connect('shell-ticker-region')).then(function(connected) {
          if (connected) {
            results.initialized.push('ticker');
            if (logger) logger.info('Ticker connected via AppShell adapter');
          } else {
            results.skipped.push({ id: 'ticker', reason: 'connect returned false' });
            if (logger) logger.warn('Ticker connect returned false');
          }
        });
      } else {
        if (logger) logger.warn('AppShell.adapters.ticker not available, using direct import');
        return import('/components/app-shell/adapters/ticker-adapter.js').then(function(TickerAdapter) {
          return Promise.resolve(TickerAdapter.default.connect('shell-ticker-region')).then(function(connected) {
            if (connected) {
              results.initialized.push('ticker');
            } else {
              results.skipped.push({ id: 'ticker', reason: 'fallback connect failed' });
            }
          });
        }).catch(function(error) {
          results.failed.push({ id: 'ticker', error: error.message });
          if (logger) logger.warn('Ticker init failed (non-critical)', { error: error.message });
        });
      }
    }).then(function() {
      // 3. Toast Service
      if (typeof window !== 'undefined' && window.Toast) {
        results.skipped.push({ id: 'toast', reason: 'already initialized' });
        return null;
      }
      return import('/components/toast/service/index.js').then(function(ToastModule: Record<string, any>) {
        var ToastService = ToastModule.default || ToastModule.ToastService;
        if (ToastService && ToastService.init) {
          return Promise.resolve(ToastService.init()).then(function() {
            if (windowAdapter && windowAdapter.expose) windowAdapter.expose('Toast', ToastService);
            results.initialized.push('toast');
            if (logger) logger.info('Toast service initialized');
          });
        }
      }).catch(function(error) {
        results.failed.push({ id: 'toast', error: error.message });
        if (logger) logger.warn('Toast init failed (non-critical)', { error: error.message });
      });
    }).then(function() {
      // 4. v5.3.0: Wait for shell components before hiding preloader
      return _waitForShellReady(logger).then(function(shellStatus) {
        results.initialized.push('shell-ready-wait');
        if (telemetry) {
          telemetry.track('shell-components-ready', {
            allReady: shellStatus.allReady,
            readyCount: shellStatus.readyCount,
            total: shellStatus.total,
            notReady: shellStatus.notReady
          });
        }
        return shellStatus;
      });
    }).then(function() {
      // 5. Preloader Fade - Enterprise API (v4.8.0)
      // v5.3.0: Now executes AFTER shell components are ready
      // Hierarquia: PreloaderController API > AppShell.fadeOutPreloader > DOM fallback
      try {
        if (typeof window !== 'undefined' && (window as any).PreloaderController && (window as any).PreloaderController.hide) {
          (window as any).PreloaderController.hide(function() {
            if (logger) logger.info('Preloader hidden via PreloaderController API');
          });
          results.initialized.push('preloader-fade');
        } else if (optDeps.appShell && (optDeps.appShell as Record<string, Function>).fadeOutPreloader) {
          (optDeps.appShell as Record<string, Function>).fadeOutPreloader(500);
          results.initialized.push('preloader-fade');
          if (logger) logger.info('Preloader fade triggered via AppShell');
        } else {
          // DOM fallback: busca por data-attribute (AAA) ou ID (legado)
          var preloaderEl = document.querySelector('[data-preloader-root]') || document.getElementById('shell-preloader-region') || document.getElementById('loading-screen');
          if (preloaderEl) {
            (preloaderEl as HTMLElement).style.transition = 'opacity 0.5s ease-out';
            (preloaderEl as HTMLElement).style.opacity = '0';
            setTimeout(function() {
              if (preloaderEl && preloaderEl.parentNode) {
                (preloaderEl as HTMLElement).style.display = 'none';
                (preloaderEl as HTMLElement).style.visibility = 'hidden';
              }
            }, 550);
            results.initialized.push('preloader-fade');
            if (logger) logger.info('Preloader fade via DOM fallback', { element: preloaderEl.className || preloaderEl.id });
          } else {
            results.skipped.push({ id: 'preloader-fade', reason: 'no preloader found' });
            if (logger) logger.warn('No preloader element found for fade');
          }
        }
      } catch (error: any) {
        results.failed.push({ id: 'preloader-fade', error: error.message });
        if (logger) logger.error('Preloader fade error', { error: error.message });
      }
    }).then(function() {
      // 6. Finalizar AppShell
      try {
        var appShellRef = optDeps.appShell as Record<string, Function> | null;
        if (appShellRef && appShellRef.finalize && !(typeof window !== 'undefined' && (window as any).AppShellReady)) {
          appShellRef.finalize();
          if (logger) logger.info('AppShell finalized');
        }
      } catch (error: any) {
        if (logger) logger.warn('AppShell finalize warning', { error: error.message });
      }
    }).then(function() {
      var elapsed = Math.round(performance.now() - startTime);
      if (telemetry) telemetry.track('phase-5-complete', { initialized: results.initialized.length, failed: results.failed.length, skipped: results.skipped.length, time: elapsed });
      if (logger) logger.info('Phase 5 complete', { initialized: results.initialized, failed: results.failed.length, skipped: results.skipped.length, time: elapsed });
      return { success: true, initialized: results.initialized, failed: results.failed, skipped: results.skipped, time: elapsed };
    });
  },

  healthCheck: function() {
    var runtimeContext = _resolveRuntimeContext();
    // v5.2.0: HEALTH CONTRACT — padronizado com createHealthResult
    var ol = _overlayLayer || (typeof window !== 'undefined' ? (window as any).OverlayLayer : null);
    var uo = _uiOrchestrator || (typeof window !== 'undefined' ? (window as any).UIOrchestrator : null);

    var overlayReady = !!(ol && ol.isInitialized && ol.isInitialized());
    var uiOrchestratorReady = !!(uo && uo.info);
    var runtimeContextAvailable = !!runtimeContext;

    var status: string = HEALTH_STATUS.HEALTHY;
    if (!overlayReady && !uiOrchestratorReady && !runtimeContextAvailable) status = HEALTH_STATUS.UNHEALTHY;
    else if (!overlayReady || !uiOrchestratorReady || !runtimeContextAvailable) status = HEALTH_STATUS.DEGRADED;

    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        overlayLayerReady: overlayReady,
        uiOrchestratorReady: uiOrchestratorReady,
        runtimeContextAvailable: runtimeContextAvailable
      },
      details: {
        overlayLayerReady: overlayReady,
        uiOrchestratorReady: uiOrchestratorReady,
        runtimeContextAvailable: runtimeContextAvailable
      }
    });
  },

  info: function() {
    var runtimeContext = _resolveRuntimeContext();
    // v5.1.0: Usa _overlayLayer local com fallback window
    var ol = _overlayLayer || (typeof window !== 'undefined' ? (window as any).OverlayLayer : null);
    return { 
      moduleId: MODULE_ID, 
      version: VERSION, 
      modules: phase5.modules.map(function(m) { return m.id; }),
      overlayLayerIntegrated: !!(ol && ol.isKernelIntegrated && ol.isKernelIntegrated()),
      runtimeContextVersion: runtimeContext ? runtimeContext.VERSION : null,
      shellReadyFlags: SHELL_READY_FLAGS,
      shellReadyTimeout: SHELL_READY_TIMEOUT
    };
  }
};

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.phase5 = { version: VERSION };
}

export { phase5, MODULE_ID, VERSION };
export default phase5;
