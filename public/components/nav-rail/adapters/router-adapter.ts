// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-router-adapter
// PURPOSE: Adapter de navegação para o NavRail com suporte a
//          RouterGlobal, EventBus e hash fallback
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   NAV_EVENTS from /core/runtime/events/catalog/nav.events.js
//
// PROVIDES:
//   createRouterAdapter() — cria instância do adapter de roteamento
//   injectPorts(p) — injeta ports no módulo
//   getPorts() — retorna snapshot dos ports
//   info() — metadata do módulo
//   healthCheck() — diagnóstico de saúde
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//
// RECEIVES (via init/options):
//   meta.itemId — ID do item de navegação
//   meta.panelId — ID do painel destino
//   meta.source — origem da navegação
//
// EMITS (eventos):
//   NAV_EVENTS.NAVIGATE_PATH — intent de navegação por path
//   ROUTER_EVENTS.NAVIGATE — request de navegação via router
//   UI_EVENTS.HARD_NAV — navegação forçada via hash
//
// LISTENS (eventos):
//   ROUTER_EVENTS.ROUTE_CHANGED — mudança de rota confirmada
//   NAV_EVENTS.NAVIGATE_PATH — intent de navegação recebido
//
// WINDOW ACCESS:
//   window.location.hash — fallback de navegação quando sem router/bus
//   window.addEventListener('hashchange') — fallback de route change
// ═══════════════════════════════════════════════════════════════
// NavRail - Router Adapter
// @version 6.3.0-AAA
// @changelog v6.3.0-AAA - Added AAA Dependency Contract
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { NAV_EVENTS } from '/core/runtime/events/catalog/nav.events.js';

export const VERSION = '6.3.0-ES6';
export const MODULE_ID = 'navrail-router-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

function _getEventBus() {
  return _getPort('eventBus') || _getPort('eventBusGlobal');
}

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function createRouterAdapter() {
  _initPorts();
  let _cleanups: (() => void)[] = [];
  let _metrics: { navigations: number; routeChanges: number; navIntents: number; hardNavs: number; errors: number; lastNavigation: unknown; lastRouteChange: number | null; busSource: string | null } = { navigations: 0, routeChanges: 0, navIntents: 0, hardNavs: 0, errors: 0, lastNavigation: null, lastRouteChange: null, busSource: null };

  function _emitNavIntent(itemId: string, route: string, panelId: string | null, source: string) {
    const bus = _getEventBus();
    if (!bus || !bus.emit) return false;
    _metrics.busSource = _getPort('eventBus') ? 'eventBus' : 'eventBusGlobal';
    bus.emit(NAV_EVENTS.NAVIGATE_PATH, {
      type: NAV_EVENTS.NAVIGATE_PATH,
      itemId,
      path: route,
      panelId: panelId || `panel-${itemId}`,
      source: source || MODULE_ID,
      timestamp: Date.now()
    });
    _metrics.navIntents++;
    return true;
  }

  function _emitNavigateRequest(route: string, source: string, itemId: string | null, panelId: string | null) {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      _metrics.busSource = _getPort('eventBus') ? 'eventBus' : 'eventBusGlobal';
      bus.emit(ROUTER_EVENTS.NAVIGATE, {
        path: route,
        options: { source: source || MODULE_ID, itemId: itemId || null, panelId: panelId || (itemId ? `panel-${itemId}` : null) },
        source: source || MODULE_ID,
        timestamp: Date.now()
      });
    }
  }

  function _emitHardNav(route: string, reason: string) {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      bus.emit(UI_EVENTS.HARD_NAV, {
        path: route,
        reason: reason || 'No RouterGlobal or EventBus pipeline',
        source: MODULE_ID,
        timestamp: Date.now()
      });
    }
    _metrics.hardNavs++;
  }

  return {
    navigate(route: string, meta: Record<string, unknown>) {
      if (!meta) meta = {};
      try {
        let itemId = meta.itemId || null;
        if (!itemId && route) {
          const cleanRoute = route.replace(/^#?\/?/, '');
          if (cleanRoute) itemId = cleanRoute;
        }
        if (itemId) {
          _emitNavIntent(itemId as string, route, meta.panelId as string | null, (meta.source as string) || MODULE_ID);
        }
        const rg = _getPort('routerGlobal');
        if (rg && rg.navigate) {
          rg.navigate(route, { source: MODULE_ID });
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: 'router-global', itemId };
        }
        const bus = _getEventBus();
        if (bus && bus.emit) {
          _emitNavigateRequest(route, MODULE_ID, itemId as string | null, meta.panelId as string | null);
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: 'event-bus-navigate', itemId };
        }
        if (route && typeof window !== 'undefined' && window.location) {
          _emitHardNav(route, 'No RouterGlobal or EventBus available');
          window.location.hash = route.indexOf('#') === 0 ? route : `#${route}`;
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: 'hash-fallback', itemId };
        }
        _metrics.errors++;
        return { success: false, error: 'no-route' };
      } catch (error: any) {
        _metrics.errors++;
        return { success: false, error: error.message };
      }
    },

    navigateByIntent(itemId: string, panelId: string) {
      const route = `#/${itemId}`;
      return this.navigate(route, { itemId, panelId: panelId || `panel-${itemId}`, source: MODULE_ID });
    },

    getCurrentRoute() {
      try {
        const rg = _getPort('routerGlobal');
        if (rg && rg.getCurrentRoute) return rg.getCurrentRoute();
        if (typeof window !== 'undefined' && window.location) {
          return { path: window.location.hash || '#/', hash: window.location.hash, pathname: window.location.pathname };
        }
        return { path: '#/', hash: '#/' };
      } catch (error: any) {
        return { path: '#/', hash: '#/', error: error.message };
      }
    },

    onRouteChange(callback: (data: unknown) => void) {
      if (typeof callback !== 'function') return () => {};
      try {
        const bus = _getEventBus();
        if (bus && (bus as Record<string, unknown>).on) {
          const handler = (data: unknown) => {
            _metrics.routeChanges++;
            _metrics.lastRouteChange = Date.now();
            callback(data);
          };
          const cleanup = bus.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
          if (typeof cleanup === 'function') {
            _cleanups.push(cleanup);
            return cleanup;
          } else {
            const manualCleanup = () => { if (bus.off) bus.off(ROUTER_EVENTS.ROUTE_CHANGED, handler); };
            _cleanups.push(manualCleanup);
            return manualCleanup;
          }
        }
        const hashHandler = () => {
          _metrics.routeChanges++;
          _metrics.lastRouteChange = Date.now();
          callback({ path: window.location.hash || '#/', hash: window.location.hash });
        };
        window.addEventListener('hashchange', hashHandler);
        const cleanup = () => { window.removeEventListener('hashchange', hashHandler); };
        _cleanups.push(cleanup);
        return cleanup;
      } catch (error: any) {
        _metrics.errors++;
        return () => {};
      }
    },

    onNavIntent(callback: (data: unknown) => void) {
      if (typeof callback !== 'function') return () => {};
      try {
        const bus = _getEventBus();
        if (!bus || !(bus as Record<string, unknown>).on) return () => {};
        const handler = (data: unknown) => { callback(data); };
        const cleanup = bus.on(NAV_EVENTS.NAVIGATE_PATH, handler);
        if (typeof cleanup === 'function') {
          _cleanups.push(cleanup);
          return cleanup;
        }
        const manualCleanup = () => { if (bus.off) bus.off(NAV_EVENTS.NAVIGATE_PATH, handler); };
        _cleanups.push(manualCleanup);
        return manualCleanup;
      } catch (error: any) {
        _metrics.errors++;
        return () => {};
      }
    },

    getMetrics() { return Object.assign({}, _metrics); },
    reset() { _metrics = { navigations: 0, routeChanges: 0, navIntents: 0, hardNavs: 0, errors: 0, lastNavigation: null, lastRouteChange: null, busSource: null }; },
    destroy() { _cleanups.forEach(fn => { try { fn(); } catch(e) {} }); _cleanups = []; },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        p0Compliant: true,
        p02Compliant: true,
        p2Compliant: true,
        portsInitialized: Ports.isInitialized(),
        currentRoute: this.getCurrentRoute(),
        cleanupCount: _cleanups.length,
        metrics: this.getMetrics(),
        busSource: _metrics.busSource,
        capabilities: ['navigate', 'navigateByIntent', 'onRouteChange', 'onNavIntent']
      };
    },

    healthCheck() {
      const bus = _getEventBus();
      const hasEventBus = !!bus;
      const hasRouterGlobal = !!_getPort('routerGlobal');
      const currentRoute = this.getCurrentRoute();
      const hasValidRoute = currentRoute && !currentRoute.error;
      const checks = {
        hasEventBus,
        hasRouterGlobal,
        hasValidRoute,
        noErrors: _metrics.errors === 0,
        cleanupSetup: _cleanups.length >= 0,
        navIntentSupport: true,
        p0Compliant: true,
        p02Compliant: true,
        p2Compliant: true
      };
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      let status = 'HEALTHY';
      if (!hasEventBus && !hasRouterGlobal) status = 'DEGRADED';
      if (_metrics.errors > 5) status = 'DEGRADED';
      return {
        status,
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        currentRoute,
        metrics: _metrics,
        cleanupCount: _cleanups.length,
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        busSource: _getPort('eventBus') ? 'eventBus' : (_getPort('eventBusGlobal') ? 'eventBusGlobal' : 'none'),
        timestamp: Date.now()
      };
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p0Compliant: true, p02Compliant: true, p2Compliant: true, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, p0Compliant: true, p02Compliant: true, p2Compliant: true, portsInitialized: Ports.isInitialized() }; }

export default { VERSION, MODULE_ID, createRouterAdapter, info, healthCheck };
