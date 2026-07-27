// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ROUTE-RESOLVE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-context-builder
// PURPOSE: ContextBuilder - Construtor de Contexto via DI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRouteByIdOrPath from /components/router/registry/routes.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   buildContext() — exported function
//   buildNavigationContext() — exported function
//   extractPanelId() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// @changelog
//   8.1.0-ROUTE-RESOLVE-FIX: CRITICAL FIX — extractPanelId() now consults
//     the router registry via getRouteByIdOrPath() to resolve routes like
//     /admin/navegacao → panel-nav-admin. Previously only had hardcoded aliases
//     for home/dashboard/index, causing all admin/* routes to return the raw
//     path string instead of the correct panelId, breaking panel mounting.
//   8.0.0-UNIFIED: Previous version
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getRouteByIdOrPath } from '/components/router/registry/routes.js';

declare const adapters: Record<string, unknown>;
declare const ports: Record<string, unknown>;
export const VERSION = '8.1.0-ROUTE-RESOLVE-FIX';
export const MODULE_ID = 'main-context-builder';

let _metrics = { contextBuilds: 0, navBuilds: 0, errors: 0, routeLookups: 0, routeHits: 0 };

export function buildContext(options: Record<string, unknown> = {}) {
  try {

    const { ports: portsDep = {}, adapters: adaptersDep = {}, eventBus = null, router = null, globalState = null, telemetry = null } = options as { ports?: Record<string, unknown>; adapters?: Record<string, unknown>; eventBus?: unknown; router?: unknown; globalState?: unknown; telemetry?: unknown };
    _metrics.contextBuilds++;
    return Object.freeze({
      ports: Object.freeze({ ...portsDep }),
      adapters: Object.freeze({ ...adaptersDep }),
      eventBus,
      router,
      globalState,
      telemetry,
      timestamp: Date.now(),
      version: VERSION
    });
  } catch (error) {
    _metrics.errors++;
    throw error;
  }
}

export function buildNavigationContext(route: string | { path?: string; params?: Record<string, unknown> }, options: Record<string, unknown> = {}) {
  try {
    const path = typeof route === 'string' ? route : route?.path || '/';
    const panelId = extractPanelId(path);
    _metrics.navBuilds++;
    const routeObj = typeof route === 'string' ? null : route;
    return { path, panelId, params: routeObj?.params || options.params || {}, origin: options.origin || 'navigation', timestamp: Date.now() };
  } catch (error) {
    _metrics.errors++;
    throw error;
  }
}

export function extractPanelId(path: string) {
  if (!path || typeof path !== 'string') return 'panel-cards';
  let clean = path.replace(/^[#/]+/, '').split('?')[0].trim();

  // Static aliases for common routes
  const aliases: Record<string, string> = { '': 'panel-cards', 'home': 'panel-cards', 'dashboard': 'panel-cards', 'index': 'panel-cards' };
  if (aliases[clean] !== undefined) return aliases[clean];

  // If it already starts with 'panel-', return as-is
  if (clean.match(/^panel-[a-z0-9-]+$/i)) return clean;

  // v8.1.0-ROUTE-RESOLVE-FIX: Consult router registry to resolve routes like
  // admin/navegacao → panel-nav-admin via the defaultView field in route definitions.
  // This mirrors the lookup logic in listeners.js extractPanelId() but is used by
  // the navigator.js executeNavigation flow via context-builder.
  _metrics.routeLookups++;

  // Try multiple path formats that getRouteByIdOrPath might match
  const pathVariants = [
    '/' + clean,           // /admin/navegacao
    clean,                 // admin/navegacao
    '#/' + clean,          // #/admin/navegacao
  ];

  // Also try with first segment only for single-segment routes
  const firstSegment = clean.split('/')[0];
  if (firstSegment !== clean) {
    pathVariants.push('/' + firstSegment, firstSegment, '#/' + firstSegment);
  }

  for (let i = 0; i < pathVariants.length; i++) {
    const routeDef = getRouteByIdOrPath(pathVariants[i]);
    if (routeDef && routeDef.defaultView) {
      _metrics.routeHits++;
      return routeDef.defaultView;
    }
  }

  // Fallback: return cleaned path or default
  return clean || 'panel-cards';
}

export function getMetrics() { return { ..._metrics }; }

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { noErrors: _metrics.errors === 0, hasRouteLookup: true },
    metrics: getMetrics()
  };
}

export default { buildContext, buildNavigationContext, extractPanelId, getMetrics, healthCheck, VERSION, MODULE_ID };