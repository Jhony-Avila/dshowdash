// Migrado para TypeScript: 2026-02-25
// Router Global - Integrations v7.1.0
// @version 7.1.0-ENTERPRISE
// GlobalState e AuthEvents integration

import { routerStore } from '/components/router/state/store.js';
import { routerTelemetry } from '/components/router/telemetry/tracker.js';
import { AUTH_EVENTS } from '../events/events-contracts.ts';
import type { RouteInfo } from './utils.ts';
import type { RouterGlobalInstance } from './navigation.ts';

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

export interface IntegrationStatus {
  connected: boolean;
  retryCount: number;
}

interface VirtualRouteSnapshot {
  view?: string;
  tab?: string;
  section?: string;
  entity?: string;
  id?: string | number;
  mode?: string;
  page?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

interface LoginEventData {
  attemptedRoute?: string;
  [key: string]: unknown;
}

type CleanupFn = () => void;
type GetRouterGlobalFn = () => RouterGlobalInstance;

// ═══════════════════════════════════════════════════════════════
// Estado interno
// ═══════════════════════════════════════════════════════════════

const RETRY_MAX = 5 as const;
const RETRY_DELAY = 300 as const;

let globalStateCleanups: CleanupFn[] = [];
let authEventCleanups: CleanupFn[] = [];
let globalStateRetryCount = 0;
let authEventRetryCount = 0;

// ═══════════════════════════════════════════════════════════════
// Status getters
// ═══════════════════════════════════════════════════════════════

export function getGlobalStateStatus(): IntegrationStatus {
  return { connected: globalStateCleanups.length > 0, retryCount: globalStateRetryCount };
}

export function getAuthEventsStatus(): IntegrationStatus {
  return { connected: authEventCleanups.length > 0, retryCount: authEventRetryCount };
}

// ═══════════════════════════════════════════════════════════════
// GlobalState Integration
// ═══════════════════════════════════════════════════════════════

export function setupGlobalStateIntegration(): boolean {
  if (globalStateCleanups.length > 0) return true;
  if (!window.GlobalState) {
    if (globalStateRetryCount < RETRY_MAX) {
      globalStateRetryCount++;
      setTimeout(setupGlobalStateIntegration, RETRY_DELAY * globalStateRetryCount);
    }
    return false;
  }
  try {
    const syncNavigation = (route: RouteInfo, virtualRoute: VirtualRouteSnapshot | null): void => {
      if (!window.GlobalState || !route) return;
      try {
        const gs = window.GlobalState as Record<string, unknown>;
        const dispatch = gs.dispatch as ((action: unknown) => void) | undefined;
        const actions = gs.actions as Record<string, (payload: unknown) => unknown> | undefined;
        if (dispatch && actions?.updateNavigation) {
          dispatch(actions.updateNavigation({
            currentRoute: route.path, currentPage: route.page,
            previousRoute: (routerStore.getPreviousRoute() as RouteInfo | null)?.path || null,
            activePanel: virtualRoute?.view || route.defaultHash || null,
            view: virtualRoute?.view, tab: virtualRoute?.tab, section: virtualRoute?.section,
            entity: virtualRoute?.entity, entityId: virtualRoute?.id, mode: virtualRoute?.mode,
            page: virtualRoute?.page, sort: virtualRoute?.sort, filters: virtualRoute?.filters,
            lastNavigationAt: Date.now()
          }));
        }
      } catch (_e: unknown) { /* silenced */ }
    };
    const unsubscribe: unknown = routerStore.subscribe(() => {
      const currentRoute = routerStore.getCurrentRoute() as RouteInfo | null;
      const virtualRoute = routerStore.getVirtualRoute() as VirtualRouteSnapshot | null;
      if (currentRoute) syncNavigation(currentRoute, virtualRoute);
    });
    if (typeof unsubscribe === 'function') globalStateCleanups.push(unsubscribe as CleanupFn);
    routerTelemetry.track('router:globalstate:connected', { retriesNeeded: globalStateRetryCount });
    return true;
  } catch (_error: unknown) { return false; }
}

export function cleanupGlobalStateIntegration(): void {
  globalStateCleanups.forEach((cleanup: CleanupFn) => { try { if (typeof cleanup === 'function') cleanup(); } catch (_e: unknown) { /* silenced */ } });
  globalStateCleanups = [];
  globalStateRetryCount = 0;
}

// ═══════════════════════════════════════════════════════════════
// AuthEvent Integration
// ═══════════════════════════════════════════════════════════════

export function setupAuthEventIntegration(getRouterGlobal: GetRouterGlobalFn): boolean {
  if (authEventCleanups.length > 0) return true;
  if (!window.EventBus || typeof window.EventBus.on !== 'function') {
    if (authEventRetryCount < RETRY_MAX) {
      authEventRetryCount++;
      setTimeout(() => setupAuthEventIntegration(getRouterGlobal), RETRY_DELAY * authEventRetryCount);
    }
    return false;
  }
  try {
    if (AUTH_EVENTS?.LOGIN_SUCCESS) {
      const loginHandler = (data: LoginEventData): void => {
        try {
          const attempted = routerStore.getAttemptedRoute() as { path?: string } | null;
          const attemptedRoute: string | undefined = attempted?.path || data?.attemptedRoute;
          const targetRoute: string = (attemptedRoute && attemptedRoute !== '/login') ? attemptedRoute : '/';
          if (targetRoute) {
            routerStore.clearAttemptedRoute();
            setTimeout(() => {
              try { const router = getRouterGlobal(); if (router?.isInitialized) router.navigate(targetRoute, { replace: true }); } catch (_e: unknown) { /* silenced */ }
            }, 100);
          }
        } catch (_e: unknown) { /* silenced */ }
      };
      // @ts-expect-error strict migration — TS2345
      window.EventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler);
      // @ts-expect-error strict migration — TS2345
      authEventCleanups.push(() => { try { window.EventBus!.off(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler); } catch (_e: unknown) { /* silenced */ } });
    }
    if (AUTH_EVENTS?.LOGOUT) {
      const logoutHandler = (): void => {
        setTimeout(() => {
          try { const router = getRouterGlobal(); if (router?.isInitialized) router.navigate('/login', { replace: true }); } catch (_e: unknown) { /* silenced */ }
        }, 100);
      };
      window.EventBus.on(AUTH_EVENTS.LOGOUT, logoutHandler);
      authEventCleanups.push(() => { try { window.EventBus!.off(AUTH_EVENTS.LOGOUT, logoutHandler); } catch (_e: unknown) { /* silenced */ } });
      if (AUTH_EVENTS?.LOGOUT_SUCCESS) {
        window.EventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler);
        authEventCleanups.push(() => { try { window.EventBus!.off(AUTH_EVENTS.LOGOUT_SUCCESS, logoutHandler); } catch (_e: unknown) { /* silenced */ } });
      }
    }
    routerTelemetry.track('router:auth-events:connected', { retriesNeeded: authEventRetryCount });
    return true;
  } catch (_error: unknown) { return false; }
}

export function cleanupAuthEventIntegration(): void {
  authEventCleanups.forEach((cleanup: CleanupFn) => { try { if (typeof cleanup === 'function') cleanup(); } catch (_e: unknown) { /* silenced */ } });
  authEventCleanups = [];
  authEventRetryCount = 0;
}

// ═══════════════════════════════════════════════════════════════
// Retry helpers
// ═══════════════════════════════════════════════════════════════

export function retryGlobalStateIntegration(): boolean {
  globalStateRetryCount = 0;
  globalStateCleanups = [];
  return setupGlobalStateIntegration();
}

export function retryAuthEventIntegration(getRouterGlobal: GetRouterGlobalFn): boolean {
  authEventRetryCount = 0;
  authEventCleanups = [];
  return setupAuthEventIntegration(getRouterGlobal);
}
