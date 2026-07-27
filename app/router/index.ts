// Migrado para TypeScript: 2026-02-25
'use strict';
// Router Global - Main Entry Point v7.1.0-ENTERPRISE
// URL SEMPRE FIXA em "/index.html" - Navegacao 100% interna via state

import { routerStore as _routerStore, createVirtualRoute } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import * as RouterValidation from '/components/router/validator/router-validation.js';
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { URLParser } from '/components/router/core/parser.js';
import { RouteResolver } from '/components/router/core/resolver.js';
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions as _RouteTransitions } from '/components/router/core/transitions.js';
const RouteTransitions = _RouteTransitions as any;
import { AUTH_EVENTS, ROUTER_EVENTS } from '../events/events-contracts.ts';

import { normalizePath, createNavigationResult } from './utils.ts';
import type { NavigationResult, RouteInfo } from './utils.ts';
import { setupGlobalStateIntegration, setupAuthEventIntegration, retryGlobalStateIntegration, retryAuthEventIntegration, getGlobalStateStatus, getAuthEventsStatus } from './integrations.ts';
import { navigate, replace, handleRouteChange, applyRouteEffects } from './navigation.ts';
import type { NavigateOptions, RouterGlobalInstance } from './navigation.ts';
import { init, shutdown, reset, getConfig, contractsValid } from './lifecycle.ts';
import type { RouterConfig } from './lifecycle.ts';
import { getStatus, healthCheck, info, createDebugObject } from './diagnostics.ts';
import type { RouterStatus, RouterHealthCheck, RouterInfo, DebugObject } from './diagnostics.ts';

// ═══════════════════════════════════════════════════════════════
// Interfaces locais
// ═══════════════════════════════════════════════════════════════

interface VirtualRoute {
  view?: string;
  tab?: string;
  section?: string;
  entity?: string;
  id?: string | number;
  mode?: string;
  page?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  extras?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CurrentRouteResult {
  path: string;
  name: string;
  panelPage: string | undefined;
  title: string | undefined;
  layout: string | undefined;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  public: boolean | undefined;
  requiresAuth: boolean | undefined;
  permissions: string[];
  view: string | null;
  tab: string | null;
  section: string | null;
  entity: string | null;
  id: string | number | null;
  mode: string;
  page: number;
  sort: string | null;
  filters: Record<string, unknown> | null;
  extras: Record<string, unknown>;
  source: 'router';
  timestamp: number | undefined;
}

interface CurrentRouteCompact {
  path: string;
  page: string | undefined;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  meta: {
    title: string | undefined;
    public: boolean | undefined;
    layout: string | undefined;
  };
}

interface RouteChangeEvent {
  logicalRoute: CurrentRouteResult | null;
  virtualRoute: VirtualRoute;
  meta: { source: string; timestamp: number };
}

type RouteChangeHandler = (event: RouteChangeEvent) => void;
type TransitionHook = (from: RouteInfo | null, to: RouteInfo) => boolean | Promise<boolean>;
type StoreCallback = () => void;
type Unsubscribe = () => void;

interface HistoryState {
  route?: string;
  virtualRoute?: VirtualRoute;
  [key: string]: unknown;
}

interface UpdateContextOptions {
  source?: string;
  [key: string]: unknown;
}

interface ResolvedFromUrl {
  logicalPath: string;
  virtualRoute: VirtualRoute;
}

interface DevRouterGlobal {
  getVersion: () => string;
  info: () => RouterInfo;
  healthCheck: () => RouterHealthCheck;
  getStatus: () => RouterStatus;
  current: () => CurrentRouteCompact | null;
  getConfig: () => RouterConfig;
  debug: DebugObject | null;
  retryGlobalState: () => boolean;
  retryAuthEvents: () => boolean;
}

// ═══════════════════════════════════════════════════════════════
// Window augmentation (apenas para este modulo)
// ═══════════════════════════════════════════════════════════════

// Window types estendidos (merge com events-contracts.ts)

// ═══════════════════════════════════════════════════════════════
// Constantes
// ═══════════════════════════════════════════════════════════════

export const VERSION = '7.1.0-ENTERPRISE' as const;
export const MODULE_ID = 'router-global' as const;

export function getVersion(): string { return VERSION; }

// ═══════════════════════════════════════════════════════════════
// RouterGlobal
// ═══════════════════════════════════════════════════════════════

const RouterGlobal = {
  version: VERSION,
  name: MODULE_ID,
  moduleId: MODULE_ID,
  isInitialized: false,
  isDestroyed: false,

  getVersion(): string { return VERSION; },
  isReady(): boolean { return this.isInitialized && !this.isDestroyed; },

  AUTH_EVENTS,
  ROUTER_EVENTS,

  async init(config: Record<string, unknown> = {}): Promise<NavigationResult> { return init(this as unknown as RouterGlobalInstance, config); },
  async navigate(logicalPathOrId: string, options: NavigateOptions = {}): Promise<NavigationResult> { return navigate(this as unknown as RouterGlobalInstance, logicalPathOrId, options); },
  async replace(logicalPathOrId: string, options: NavigateOptions = {}): Promise<NavigationResult> { return replace(this as unknown as RouterGlobalInstance, logicalPathOrId, options); },
  async handleRouteChange(path: string, state: unknown): Promise<void> { return handleRouteChange(this as unknown as RouterGlobalInstance, path, state); },

  applyRouteEffects,

  getCurrentRoute(): CurrentRouteResult | null {
    const route = routerStore.getCurrentRoute() as RouteInfo | null;
    const virtualRoute = routerStore.getVirtualRoute() as VirtualRoute | null;
    if (!route) return null;
    return {
      path: route.path, name: (route.id as string) || route.page || "unknown", panelPage: route.page, title: route.title, layout: route.layout,
      params: (route.params as Record<string, string>) || {}, query: (route.query as Record<string, string>) || {}, hash: (route.hash as string) || '',
      public: route.public, requiresAuth: route.requiresAuth, permissions: route.permissions || [],
      view: virtualRoute?.view || route.defaultView || null, tab: virtualRoute?.tab || null, section: virtualRoute?.section || null,
      entity: virtualRoute?.entity || null, id: virtualRoute?.id || null, mode: virtualRoute?.mode || 'view',
      page: virtualRoute?.page || 1, sort: virtualRoute?.sort || null, filters: (virtualRoute?.filters as Record<string, unknown>) || null,
      extras: (virtualRoute?.extras as Record<string, unknown>) || {}, source: "router" as const, timestamp: route.timestamp
    };
  },

  // @ts-expect-error strict migration — TS2352
  getRouteContext(): VirtualRoute { return (routerStore.getVirtualRoute() as VirtualRoute) || (createVirtualRoute() as VirtualRoute); },

  updateRouteContext(partialVirtualRoute: Partial<VirtualRoute>, options: UpdateContextOptions = {}): VirtualRoute {
    const currentVirtual = (routerStore.getVirtualRoute() as VirtualRoute) || {};
    // @ts-expect-error strict migration — TS2352
    const newVirtual = createVirtualRoute({ ...currentVirtual, ...partialVirtualRoute }) as VirtualRoute;
    routerStore.setVirtualRoute(newVirtual);
    const gs = window.GlobalState as Record<string, unknown> | undefined;
    const dispatch = gs?.dispatch as ((action: unknown) => void) | undefined;
    const actions = gs?.actions as Record<string, (payload: unknown) => unknown> | undefined;
    if (dispatch && actions?.updateNavigation) {
      try { dispatch(actions.updateNavigation({ view: newVirtual.view, tab: newVirtual.tab, section: newVirtual.section, entity: newVirtual.entity, entityId: newVirtual.id, mode: newVirtual.mode, page: newVirtual.page, sort: newVirtual.sort, filters: newVirtual.filters })); } catch (_e: unknown) { /* silenced */ }
    }
    if (window.EventBus?.emit) window.EventBus.emit("router:context:updated", { context: newVirtual, source: options.source || "updateRouteContext", timestamp: Date.now() });
    routerTelemetry.track("router:context:updated", { context: newVirtual });
    return newVirtual;
  },

  resolveFromUrl(_urlLike: string | null = null): ResolvedFromUrl {
    const state = (window.history.state as HistoryState) || {};
    // @ts-expect-error strict migration — TS2352
    return { logicalPath: state.route || '/', virtualRoute: state.virtualRoute || (createVirtualRoute() as VirtualRoute) };
  },

  encodeToUrl(_logicalPath: string, _virtualRoute: Record<string, unknown> = {}): string { return '/index.html'; },

  onRouteChange(handler: RouteChangeHandler): Unsubscribe {
    if (typeof handler !== "function") return () => {};
    const wrappedHandler = (): void => {
      const route = this.getCurrentRoute();
      const context = this.getRouteContext();
      handler({ logicalRoute: route, virtualRoute: context, meta: { source: "onRouteChange", timestamp: Date.now() } });
    };
    return routerStore.subscribe(wrappedHandler) as Unsubscribe;
  },

  gotoLogin(): Promise<NavigationResult> { return this.replace('/login'); },
  gotoHome(): Promise<NavigationResult> { return this.navigate('/'); },
  gotoForbidden(): Promise<NavigationResult> { return this.replace('/forbidden'); },
  gotoNotFound(): Promise<NavigationResult> { return this.replace('/404'); },

  current(): CurrentRouteCompact | null {
    const route = routerStore.getCurrentRoute() as RouteInfo | null;
    if (!route) return null;
    return { path: route.path, page: route.page, params: (route.params as Record<string, string>) || {}, query: (route.query as Record<string, string>) || {}, hash: (route.hash as string) || '', meta: { title: route.title, public: route.public, layout: route.layout } };
  },

  previous(): RouteInfo | null { return routerStore.getPreviousRoute() as RouteInfo | null; },
  history(): unknown[] { return routerStore.getNavigationHistory() as unknown[]; },
  back(): void { HistoryManager.back(); },
  forward(): void { HistoryManager.forward(); },
  onChange(callback: StoreCallback): Unsubscribe { return routerStore.subscribe(callback) as Unsubscribe; },

  beforeEach(hook: TransitionHook): Unsubscribe { return RouteTransitions.addBeforeHook(hook) as Unsubscribe; },

  afterEach(hook: TransitionHook): Unsubscribe { return RouteTransitions.addAfterHook(hook) as Unsubscribe; },

  getConfig(): RouterConfig { return getConfig(); },
  getStatus(): RouterStatus { return getStatus(this as unknown as RouterGlobalInstance); },
  healthCheck(): RouterHealthCheck { return healthCheck(this as unknown as RouterGlobalInstance); },
  info(): RouterInfo { return info(this as unknown as RouterGlobalInstance); },

  getEventLog(): unknown { return routerTelemetry.getEventLog(); },
  getRecentEvents(count: number): unknown { return routerTelemetry.getRecentEvents(count); },
  clearEventLog(): unknown { return routerTelemetry.clearEventLog(); },
  getTrackerStats(): unknown { return routerTelemetry.getTrackerStats(); },
  getMetrics(): unknown { return routerTelemetry.getMetrics(); },

  reset(): void { return reset(); },
  shutdown(): boolean { return shutdown(this as unknown as RouterGlobalInstance); },
  destroy(): boolean { return shutdown(this as unknown as RouterGlobalInstance); },

  debug: null as DebugObject | null
};

RouterGlobal.debug = createDebugObject(RouterGlobal as unknown as RouterGlobalInstance);

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).RouterGlobal = RouterGlobal;
  (window as unknown as Record<string, unknown>).RouterGlobalVersion = VERSION;
  window.__dev = window.__dev || {} as NonNullable<typeof window.__dev>;
  (window as unknown as Record<string, unknown>).RouterValidation = RouterValidation;
  (window.__dev as Record<string, unknown>).routerGlobal = {
    getVersion: () => VERSION, info: () => RouterGlobal.info(), healthCheck: () => RouterGlobal.healthCheck(),
    getStatus: () => RouterGlobal.getStatus(), current: () => RouterGlobal.current(), getConfig: () => RouterGlobal.getConfig(),
    debug: RouterGlobal.debug, retryGlobalState: retryGlobalStateIntegration, retryAuthEvents: () => retryAuthEventIntegration(() => RouterGlobal as unknown as RouterGlobalInstance)
  };
}

export default RouterGlobal;
export { RouterGlobal, routerStore, routerTelemetry, RouteGuard, RouteResolver, HistoryManager, RouteTransitions, URLParser, AUTH_EVENTS, ROUTER_EVENTS, createVirtualRoute };
