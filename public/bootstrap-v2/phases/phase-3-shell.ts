
// Phase 3 - Shell & Router
// @version 5.20.0-AUTH-STATE-FIX
// @changelog v5.20.0-AUTH-STATE-FIX: Fix _getAuthState() — data-state='authenticated' agora retorna true (antes caía em return false quando SM/GS indisponíveis)
// @changelog v5.19.0-STRICT-MODE: Migração _resolveGlobal para strict mode (NR-FULL)
// @changelog v5.18.0-FADE-TRANSITIONS: Unified region fade-in transitions with cascade effect
// @changelog v5.17.0-REGION-RESOLVER: Migrado para Region Resolver Service (findRegion/REGION_IDS)
// @changelog v5.16.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0
// @changelog v5.15.0-DOMAIN-PURE: window.SessionManager/GlobalState → _resolveGlobal() via windowAdapter → window fallback
// @changelog v5.14.0-LAYOUT-SAFE: Fixed LayoutManager init error handling (non-critical should not break phase)
// @changelog v5.13.0-FIX: FIXED - AppShell deve ser inicializado para CRIAR as regiões (lógica estava invertida)
// @changelog v5.12.0-BOOT-SAFE: _getAuthState() melhorado com detecção de login page/modal/data-state
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.20.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via execute(ports)):
//   ports.logger           — Logger instance
//   ports.telemetry        — Telemetry tracker
//   ports.windowAdapter    — For exposing/getting globals safely
//   ports.readyFlagsAdapter — For marking ready flags
//   ports.eventBusAdapter  — For emitting events
//
// RESOLVES auth state via _resolveGlobal():
//   1. windowAdapter.get(name) — adapter layer
//   2. window[name]            — último fallback
//   Targets: SessionManager, GlobalState
//
// CREATES (via windowAdapter.expose):
//   LayoutManager, AppShell, Header, Sidebar, NavRail, Footer, RouterGlobal
//
// IMPORTS:
//   ROUTER_EVENTS, ORCHESTRATOR_EVENTS from /core/runtime/events/
//   findRegion, REGION_IDS from /platform/shell/layout-regions.ts
//
// DOM QUERIES (via Region Resolver Service):
//   findRegion(REGION_IDS.*) — shell regions via SSOT
//   document.querySelector — login detection
//   document.body.getAttribute — data-state check
//
// PROVIDES (v5.18.0):
//   _revealRegion(region, logger) — Fade-in a region with transition
//   _revealAllRegions(ports) — Cascade reveal all regions
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.js';
import { findRegion, REGION_IDS } from '/platform/shell/layout-regions.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

var MODULE_ID = 'phase-3-shell';
var VERSION = '5.20.0-AUTH-STATE-FIX';

// v5.15.0: cached windowAdapter for _resolveGlobal
var _windowAdapter: Record<string, Function> | null = null;

/**
 * v5.19.0: Resolver globals via windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @param {string} name - Nome do global a resolver
 * @returns {Object|null}
 */
function _resolveGlobal(name: string) {
  var strictMode = isStrict();

  // Primary: windowAdapter
  if (_windowAdapter && _windowAdapter.get) {
    var resolved = _windowAdapter.get(name);
    if (resolved) return resolved;
  }

  // Em modo strict, não usa fallback
  if (strictMode) return null;

  // Fallback: window[name] (legacy)
  var win = window as unknown as Record<string, unknown>;
  if (typeof window !== 'undefined' && win[name]) {
    recordViolation('WINDOW_' + name.toUpperCase() + '_FALLBACK', { module: MODULE_ID, method: '_resolveGlobal' });
    return win[name];
  }
  return null;
}

// v5.18.0: Reveal a region with fade-in transition
function _revealRegion(region: HTMLElement | null, logger: Record<string, Function> | null) {
  if (!region) return;
  
  // Remove legacy hidden class
  region.classList.remove('hidden');
  
  // Add transition classes
  region.classList.remove('dsd-shell__region--hidden');
  region.classList.add('dsd-shell__region--visible');
  
  // Set data attribute for CSS hooks
  region.setAttribute('data-visibility', 'visible');
  
  if (logger) {
    logger.debug('Region revealed with fade transition', { 
      region: region.id || region.className 
    });
  }
}

// v5.18.0: Reveal all regions with cascade effect
function _revealAllRegions(ports: Record<string, unknown>, LayoutManagerRef: Record<string, Function> | null) {
  var logger = ports.logger as Record<string, Function> | null;
  var eventBusAdapter = ports.eventBusAdapter as Record<string, Function> | null;
  
  try {
    var isAuthenticated = _getAuthState(ports);
    if (!isAuthenticated) return;

    if (logger) logger.info('Revealing regions with fade transitions');

    if (LayoutManagerRef && LayoutManagerRef.setFullscreen) {
      LayoutManagerRef.setFullscreen(false);
    } else if (eventBusAdapter && eventBusAdapter.emit) {
      eventBusAdapter.emit(ORCHESTRATOR_EVENTS.LAYOUT_REQUEST, { 
        mode: 'default', 
        source: MODULE_ID, 
        timestamp: Date.now() 
      });
    }

    // Get all regions
    var headerRegion = findRegion(REGION_IDS.HEADER);
    var tickerRegion = findRegion((REGION_IDS as any).TICKER);
    var navRailRegion = findRegion(REGION_IDS.NAV_RAIL);
    var sidebarRegion = findRegion(REGION_IDS.SIDEBAR);
    var mainRegion = findRegion(REGION_IDS.MAIN);
    var footerRegion = findRegion(REGION_IDS.FOOTER);

    // Reveal with cascade (CSS handles the delay via transition-delay)
    _revealRegion(headerRegion as HTMLElement | null, logger);
    _revealRegion(tickerRegion as HTMLElement | null, logger);
    _revealRegion(navRailRegion as HTMLElement | null, logger);
    _revealRegion(sidebarRegion as HTMLElement | null, logger);
    _revealRegion(mainRegion as HTMLElement | null, logger);
    _revealRegion(footerRegion as HTMLElement | null, logger);

    // Remove full-screen-mode if present
    if (mainRegion) mainRegion.classList.remove('full-screen-mode');

    if (eventBusAdapter && eventBusAdapter.emit) {
      eventBusAdapter.emit(ROUTER_EVENTS.LAYOUT_CHANGED, { 
        hideNav: false, 
        source: 'phase-3',
        transition: 'fade-cascade'
      });
    }
    
    if (logger) logger.info('All regions revealed with fade transitions');
  } catch (layoutError: any) {
    if (logger) logger.warn('Layout reveal warning (non-critical)', { error: layoutError.message });
  }
}

/**
 * v5.20.0-AUTH-STATE-FIX: Detect auth state from multiple sources
 * Priority order:
 *   1. URL login indicators → false
 *   2. Visible login modal → false
 *   3. data-state='unauthenticated' → false
 *   4. data-state='authenticated' → true (NEW — v5.20.0 fix)
 *   5. SessionManager.isAuthenticated() → boolean
 *   6. GlobalState.auth.isAuthenticated → boolean
 *   7. Default → false
 *
 * BUG FIXED: Before v5.20.0, after post-login reload (phase-2 v3.10.0),
 * data-state was 'authenticated' but SM/GS were not yet exposed via
 * windowAdapter. The function fell through to return false, causing
 * AppShell to be skipped and a black screen.
 */
function _getAuthState(ports: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && window.location) {
      var pathname = (window.location.pathname || '').toLowerCase();
      var hash = (window.location.hash || '').toLowerCase();
      var loginIndicators = ['/login', 'login.html', '#login', '#/login'];
      for (var i = 0; i < loginIndicators.length; i++) {
        if (pathname.indexOf(loginIndicators[i]) !== -1 || hash.indexOf(loginIndicators[i]) !== -1) {
          return false;
        }
      }
    }

    if (typeof document !== 'undefined') {
      var loginModal = document.querySelector('.login-modal, #login-modal, [data-login-modal]');
      if (loginModal && (loginModal as HTMLElement).offsetParent !== null) {
        return false;
      }
    }

    if (typeof document !== 'undefined' && document.body) {
      var dataState = document.body.getAttribute('data-state');
      if (dataState === 'unauthenticated') return false;
      // v5.20.0-AUTH-STATE-FIX: Trust data-state set by phase-2 (authoritative source)
      if (dataState === 'authenticated') return true;
    }

    var sm = _resolveGlobal('SessionManager');
    if (sm && sm.isAuthenticated) return !!sm.isAuthenticated();

    var gs = _resolveGlobal('GlobalState');
    if (gs && gs.getState) {
      var st = gs.getState();
      return !!(st && st.auth && st.auth.isAuthenticated);
    }
  } catch (e) { }

  return false;
}

var phase3 = {
  id: 'phase-3-shell',
  name: 'Shell & Router',
  order: 3,
  critical: true,
  recoverable: false,
  dependsOn: ['phase-2-auth'],
  parallel: false,

  modules: [
    { id: 'layout-manager', name: 'Layout Manager', critical: false, timeout: 5000 },
    { id: 'app-shell', name: 'App Shell', critical: true, timeout: 10000 },
    { id: 'header', name: 'Header', critical: false, timeout: 8000 },
    { id: 'sidebar', name: 'Sidebar', critical: false, timeout: 8000 },
    { id: 'nav-rail', name: 'NavRail', critical: false, timeout: 5000 },
    { id: 'footer', name: 'Footer', critical: false, timeout: 5000 },
    { id: 'router-global', name: 'Router Global', critical: true, timeout: 5000 }
  ],

  execute: function (ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var readyFlagsAdapter = ports.readyFlagsAdapter as Record<string, Function> | null;
    var eventBusAdapter = ports.eventBusAdapter as Record<string, Function> | null;

    _windowAdapter = windowAdapter;

    var results: { initialized: string[]; failed: Array<{ id: string; error: string; critical: boolean }>; skipped: Array<{ id: string; reason: string }> } = { initialized: [], failed: [], skipped: [] };
    var startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var LayoutManagerRef: Record<string, Function> | null = null;

    if (logger) logger.info('Phase 3 starting: Shell & Router', { version: VERSION });
    if (telemetry && telemetry.track) telemetry.track('phase-3-start');

    // 0) LayoutManager (non-critical)
    return Promise.resolve().then(function () {
      return import('/components/layout-manager/index.js').then(function (LayoutManagerModule) {
        LayoutManagerRef = (LayoutManagerModule.default || LayoutManagerModule.LayoutManager) as unknown as Record<string, Function>;
        if (LayoutManagerRef) {
          if (logger) logger.info('Initializing LayoutManager...');
          return Promise.resolve(LayoutManagerRef.init()).then(function (initResult): null {
            if (windowAdapter && windowAdapter.expose) windowAdapter.expose('LayoutManager', LayoutManagerRef);
            results.initialized.push('layout-manager');
            if (logger) logger.info('LayoutManager initialized', {
              alreadyInitialized: initResult && initResult.alreadyInitialized
            });
            return null;
          }).catch(function (initError): null {
            results.failed.push({ id: 'layout-manager', error: initError.message, critical: false });
            if (logger) logger.warn('LayoutManager init failed (non-critical)', { error: initError.message });
            return null;
          });
        }
        return null;
      }).catch(function (importError): null {
        results.failed.push({ id: 'layout-manager', error: importError.message, critical: false });
        if (logger) logger.warn('LayoutManager import failed (non-critical)', { error: importError.message });
        return null;
      });
    }).then(function () {
      // 1) AppShell
      var isAuthenticated = _getAuthState(ports);

      if (!isAuthenticated) {
        results.skipped.push({ id: 'app-shell', reason: 'not-authenticated' });
        if (logger) logger.warn('AppShell skipped (not authenticated) — login mode');
        return null;
      }

      if (logger) logger.info('Initializing AppShell (authenticated)...');

      return import('/components/app-shell/index.js').then(function (AppShellModule) {
        var AppShellRef: { init?: Function; finalize?: Function; VERSION?: string; version?: string } = AppShellModule.default || AppShellModule;
        if (!AppShellRef) throw new Error('AppShell not found in module');

        // @ts-expect-error strict migration — TS2722
        return Promise.resolve(AppShellRef.init()).then(function (initResult): null {
          if (!initResult || initResult.ok !== true) {
            var errMsg = (initResult && initResult.error) ? initResult.error : 'AppShell.init() failed';
            throw new Error(errMsg);
          }

          if (AppShellRef.finalize) AppShellRef.finalize();

          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('AppShell', AppShellRef);
          if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('appshell', true);
          results.initialized.push('app-shell');

          if (logger) logger.info('AppShell initialized and finalized', {
            alreadyInitialized: initResult.alreadyInitialized,
            version: AppShellRef.version
          });
          return null;
        });
      }).catch(function (error) {
        results.failed.push({ id: 'app-shell', error: error.message, critical: true });
        if (logger) logger.error('AppShell init failed (CRITICAL)', { error: error.message });
        throw error;
      });
    }).then(function () {
      // 2) Shell Components
      return mountShellComponents(ports, results, logger, windowAdapter, readyFlagsAdapter);
    }).then(function () {
      // 3) RouterGlobal
      var isAuthenticated = _getAuthState(ports);

      if (!isAuthenticated) {
        results.skipped.push({ id: 'router-global', reason: 'not-authenticated' });
        if (logger) logger.warn('RouterGlobal skipped (not authenticated) — boot continues');
        return null;
      }

      return import('/app/router/index.js').then(function (RouterModule) {
        var RouterGlobal = RouterModule.RouterGlobal || RouterModule.default;
        if (!RouterGlobal) throw new Error('RouterGlobal not found in module');

        if (logger) logger.info('Initializing RouterGlobal...');
        return Promise.resolve(RouterGlobal.init()).then(function (): null {
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('RouterGlobal', RouterGlobal);
          if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('router', true);
          results.initialized.push('router-global');

          if (eventBusAdapter && eventBusAdapter.emit) eventBusAdapter.emit(ROUTER_EVENTS.READY, { router: RouterGlobal });
          if (logger) logger.info('RouterGlobal initialized');
          return null;
        });
      }).catch(function (error) {
        results.failed.push({ id: 'router-global', error: error.message, critical: true });
        if (logger) logger.error('RouterGlobal init failed (CRITICAL)', { error: error.message });
        throw error;
      });
    }).then(function (): null {
      // 4) v5.18.0: Reveal regions with fade transitions (replaces instant remove('hidden'))
      _revealAllRegions(ports, LayoutManagerRef);
      return null;
    }).then(function () {
      var elapsed = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startTime);

      if (telemetry && telemetry.track) {
        telemetry.track('phase-3-complete', { initialized: results.initialized.length, failed: results.failed.length, time: elapsed });
      }

      if (logger) {
        logger.info('Phase 3 complete', {
          initialized: results.initialized,
          failed: results.failed.length,
          skipped: results.skipped.length,
          time: elapsed
        });
      }

      var criticalFailed = results.failed.filter(function (f) { return f.critical; });
      return {
        success: criticalFailed.length === 0,
        initialized: results.initialized,
        failed: results.failed,
        skipped: results.skipped,
        time: elapsed
      };
    }).catch(function (error) {
      var isAuthenticated = _getAuthState(ports);

      if (!isAuthenticated) {
        results.failed.push({ id: 'phase-3-shell', error: error.message, critical: false });
        if (logger) logger.warn('Phase 3 error suppressed (unauthenticated, BOOT-SAFE)', { error: error.message });

        return {
          success: true,
          initialized: results.initialized,
          failed: results.failed,
          skipped: results.skipped,
          degraded: true
        };
      }

      results.failed.push({ id: 'phase-3-shell', error: error.message, critical: true });
      if (logger) logger.error('Phase 3 failed (CRITICAL)', { error: error.message });
      throw error;
    });
  },

  healthCheck: function () {
    return createHealthResult({ status: HEALTH_STATUS.HEALTHY, moduleId: MODULE_ID, version: VERSION });
  },

  info: function () {
    return { moduleId: MODULE_ID, version: VERSION, modules: phase3.modules.map(function (m) { return m.id; }) };
  }
};

function mountShellComponents(ports: Record<string, unknown>, results: { initialized: string[]; failed: Array<{ id: string; error: string; critical: boolean }>; skipped: Array<{ id: string; reason: string }> }, logger: Record<string, Function> | null, windowAdapter: Record<string, Function> | null, readyFlagsAdapter: Record<string, Function> | null) {
  return Promise.resolve().then(function () {
    var headerRegion = findRegion(REGION_IDS.HEADER);
    if (!headerRegion) {
      results.skipped.push({ id: 'header', reason: 'region not found' });
      if (logger) logger.warn('Header region not found, skipping');
      return null;
    }

    if (logger) logger.info('Loading Header module...');
    return import('/components/header/index.js').then(function (HeaderModule) {
      var mountFn = HeaderModule.mount || (HeaderModule.default ? HeaderModule.default.mount : null);
      if (!mountFn) {
        results.skipped.push({ id: 'header', reason: 'mount function not found' });
        if (logger) logger.warn('Header mount function not found');
        return null;
      }

      return Promise.resolve(mountFn(headerRegion)).then(function (): null {
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('Header', HeaderModule.default || HeaderModule);
        if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('header', true);
        results.initialized.push('header');
        if (logger) logger.info('Header mounted successfully', { version: HeaderModule.VERSION });
        return null;
      });
    }).catch(function (error): null {
      results.failed.push({ id: 'header', error: error.message, critical: false });
      if (logger) logger.warn('Header mount failed (non-critical)', { error: error.message });
      return null;
    });
  }).then(function () {
    var sidebarRegion = findRegion(REGION_IDS.SIDEBAR);
    if (!sidebarRegion) {
      results.skipped.push({ id: 'sidebar', reason: 'region not found' });
      if (logger) logger.warn('Sidebar region not found, skipping');
      return null;
    }

    if (logger) logger.info('Loading Sidebar module...');
    return import('/components/sidebar/index.js').then(function (SidebarModule) {
      var createFn = SidebarModule.createSidebar || (SidebarModule.default ? SidebarModule.default.createSidebar : null);
      if (!createFn) {
        results.skipped.push({ id: 'sidebar', reason: 'createSidebar function not found' });
        if (logger) logger.warn('Sidebar createSidebar function not found');
        return null;
      }

      var sidebarInstance = createFn();
      if (!sidebarInstance || !sidebarInstance.init) return null;

      return Promise.resolve(sidebarInstance.init({ containerSelector: '[data-region="sidebar"], #shell-sidebar-region, #sidebar' })).then(function (): null {
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('Sidebar', SidebarModule.default || SidebarModule);
        if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('sidebar', true);
        results.initialized.push('sidebar');
        if (logger) logger.info('Sidebar mounted successfully', { version: SidebarModule.VERSION || 'unknown' });
        return null;
      });
    }).catch(function (error): null {
      results.failed.push({ id: 'sidebar', error: error.message, critical: false });
      if (logger) logger.warn('Sidebar mount failed (non-critical)', { error: error.message });
      return null;
    });
  }).then(function () {
    var navRailRegion = findRegion(REGION_IDS.NAV_RAIL);
    if (!navRailRegion) {
      results.skipped.push({ id: 'nav-rail', reason: 'region not found' });
      if (logger) logger.warn('NavRail region not found, skipping');
      return null;
    }

    if (logger) logger.info('Loading NavRail module...');
    return import('/components/nav-rail/index.js').then(function (NavRailModule) {
      var NavRail = NavRailModule.NavRail || NavRailModule.default;
      if (!NavRail || !NavRail.init) {
        results.skipped.push({ id: 'nav-rail', reason: 'init function not found' });
        if (logger) logger.warn('NavRail init function not found');
        return null;
      }

      return Promise.resolve(NavRail.init(navRailRegion)).then(function (): null {
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('NavRail', NavRail);
        if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('navRail', true);
        results.initialized.push('nav-rail');
        if (logger) logger.info('NavRail mounted successfully', { version: NavRailModule.VERSION });
        return null;
      });
    }).catch(function (error): null {
      results.failed.push({ id: 'nav-rail', error: error.message, critical: false });
      if (logger) logger.warn('NavRail mount failed (non-critical)', { error: error.message });
      return null;
    });
  }).then(function () {
    var footerRegion = findRegion(REGION_IDS.FOOTER);
    if (!footerRegion) {
      results.skipped.push({ id: 'footer', reason: 'region not found' });
      if (logger) logger.warn('Footer region not found, skipping');
      return null;
    }

    if (logger) logger.info('Loading Footer module...');
    return import('/components/footer/index.js').then(function (FooterModule) {
      var mountFn = FooterModule.mount || (FooterModule.default ? FooterModule.default.mount : null);
      if (!mountFn) {
        results.skipped.push({ id: 'footer', reason: 'mount function not found' });
        if (logger) logger.warn('Footer mount function not found');
        return null;
      }

      return Promise.resolve((mountFn as (c: Element | string | null) => unknown)(footerRegion)).then(function (): null {
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('Footer', FooterModule.default || FooterModule);
        if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('footer', true);
        results.initialized.push('footer');
        if (logger) logger.info('Footer mounted successfully', { version: FooterModule.VERSION });
        return null;
      });
    }).catch(function (error): null {
      results.failed.push({ id: 'footer', error: error.message, critical: false });
      if (logger) logger.warn('Footer mount failed (non-critical)', { error: error.message });
      return null;
    });
  });
}

if (typeof window !== 'undefined') {
  window.__dev = window.__dev || {};
  window.__dev.phase3 = { version: VERSION };
}

export { phase3, ROUTER_EVENTS, MODULE_ID, VERSION };
export default phase3;
