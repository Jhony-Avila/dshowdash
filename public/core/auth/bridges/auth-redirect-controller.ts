// Migrado para TypeScript: 2026-02-25
// Auth Redirect Controller
// @version 1.0.0-ENTERPRISE
// @description Enterprise AAA post-auth redirect controller
// @changelog v1.0.0-ENTERPRISE: Criacao inicial — redireciona usuario autenticado para fora de rotas publicas
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   routerStore (getAttemptedRoute, clearAttemptedRoute) from /components/router/state/store.js
//   PUBLIC_ROUTES from /app/router/contracts.js
//
// PROVIDES:
//   createAuthRedirectController(options) -> { shouldRedirect, getRedirectTarget, execute, info, healthCheck }
//
// RECEIVES (via options):
//   options.logger          — Logger instance
//   options.telemetry       — Telemetry tracker
//   options.eventBusAdapter — EventBus for emitting redirect events
//   options.windowAdapter   — WindowAdapter for global access
//
// BROWSER APIs (legitimo):
//   window.location.pathname — Current path detection
//   window.location.hash     — Current hash detection
//   history.replaceState()   — Non-disruptive redirect (preserves boot flow)
//
// DESIGN DECISIONS:
//   - Uses history.replaceState instead of location.href to avoid page reload during boot
//   - Respects attemptedRoute from routerStore (user's original destination before auth redirect)
//   - Falls back to DEFAULT_AUTHENTICATED_ROUTE ('/') when no attemptedRoute exists
//   - Only redirects from PUBLIC_ROUTES that don't require auth (e.g., /login)
//   - Never redirects from error pages (/403, /404) as they may be intentional
//   - Emits AUTH_EVENTS.REDIRECT for observability
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { routerStore } from '/components/router/state/store.js';
// PUBLIC_ROUTES removido — lógica usa REDIRECT_TRIGGER_ROUTES local
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'auth-redirect-controller';

// Default route for authenticated users when no attemptedRoute exists
const DEFAULT_AUTHENTICATED_ROUTE: string = '/';

// Routes that should trigger redirect when user is already authenticated
// (exclude error pages — user may intentionally visit /403, /404)
const REDIRECT_TRIGGER_ROUTES: readonly string[] = ['/login', '/login.html'];

interface LoggerPort {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface TelemetryPort {
  track: (event: string, payload?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface EventBusAdapterPort {
  emit: (eventName: string, data?: Record<string, unknown>) => void;
  [key: string]: unknown;
}

interface AuthRedirectControllerOptions {
  logger?: LoggerPort | null;
  telemetry?: TelemetryPort | null;
  eventBusAdapter?: EventBusAdapterPort | null;
  windowAdapter?: Record<string, unknown> | null;
}

interface RedirectTarget {
  path: string;
  source: 'attempted' | 'default';
  original: string | null;
}

interface ShouldRedirectResult {
  shouldRedirect: boolean;
  reason: string;
  target: RedirectTarget | null;
}

interface ExecuteResult {
  executed: boolean;
  target: RedirectTarget | null;
  reason: string;
}

interface RedirectMetrics {
  checks: number;
  redirectsExecuted: number;
  redirectsSkipped: number;
  attemptedRouteUsed: number;
  defaultRouteUsed: number;
  errors: number;
}

interface RedirectControllerInfo {
  moduleId: string;
  version: string;
  defaultRoute: string;
  triggerRoutes: string[];
  metrics: RedirectMetrics;
  currentPath: string;
  isOnTriggerRoute: boolean;
}

interface RedirectControllerHealthCheck {
  status: 'HEALTHY' | 'DEGRADED';
  version: string;
  moduleId: string;
  checks: {
    lowErrorRate: boolean;
    routerStoreAvailable: boolean;
    historyAPIAvailable: boolean;
  };
  metrics: RedirectMetrics;
}

interface AuthRedirectControllerAPI {
  shouldRedirect: (isAuthenticated: boolean) => ShouldRedirectResult;
  getRedirectTarget: () => RedirectTarget;
  execute: (isAuthenticated: boolean) => ExecuteResult;
  info: () => RedirectControllerInfo;
  healthCheck: () => RedirectControllerHealthCheck;
}

const Ports: ReturnType<typeof createCorePorts> = createCorePorts({ moduleId: MODULE_ID });

/**
 * Creates an Auth Redirect Controller instance.
 *
 * Responsibility: When a user is confirmed authenticated but is on a public
 * route (like /login), redirect them to their intended destination or the
 * default authenticated route.
 */
export function createAuthRedirectController(options?: AuthRedirectControllerOptions): AuthRedirectControllerAPI {
  if (!options) options = {};

  const logger: LoggerPort | null = options.logger || null;
  const telemetry: TelemetryPort | null = options.telemetry || null;
  const eventBusAdapter: EventBusAdapterPort | null = options.eventBusAdapter || null;
  const windowAdapter: Record<string, unknown> | null = options.windowAdapter || null;

  const _metrics: RedirectMetrics = {
    checks: 0,
    redirectsExecuted: 0,
    redirectsSkipped: 0,
    attemptedRouteUsed: 0,
    defaultRouteUsed: 0,
    errors: 0
  };

  function _log(level: keyof LoggerPort, message: string, data?: Record<string, unknown>): void {
    if (logger && typeof logger[level] === 'function') {
      (logger[level] as (msg: string, d: Record<string, unknown>) => void)('[' + MODULE_ID + '] ' + message, data || {});
    }
  }

  function _track(event: string, payload?: Record<string, unknown>): void {
    if (telemetry && telemetry.track) {
      telemetry.track(event, Object.assign({ module: MODULE_ID }, payload || {}));
    }
  }

  function _emit(eventName: string, data?: Record<string, unknown>): void {
    if (eventBusAdapter && eventBusAdapter.emit) {
      try {
        eventBusAdapter.emit(eventName, Object.assign({
          source: MODULE_ID,
          timestamp: Date.now()
        }, data || {}));
      } catch (e) {
        _metrics.errors++;
      }
    }
  }

  /**
   * Gets the current normalized pathname.
   */
  function _getCurrentPath(): string {
    if (typeof window === 'undefined' || !window.location) return '/';
    return (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  }

  /**
   * Checks if the current route is one that should trigger a redirect
   * for an authenticated user.
   */
  function _isOnRedirectTriggerRoute(): boolean {
    const currentPath: string = _getCurrentPath();
    for (var i = 0; i < REDIRECT_TRIGGER_ROUTES.length; i++) {
      if (currentPath === REDIRECT_TRIGGER_ROUTES[i]) return true;
    }
    return false;
  }

  /**
   * Determines the best redirect target.
   * Priority:
   *   1. attemptedRoute from routerStore (user's original destination)
   *   2. DEFAULT_AUTHENTICATED_ROUTE ('/')
   */
  function getRedirectTarget(): RedirectTarget {
    let attempted: { path?: string; [key: string]: unknown } | null = null;
    try {
      attempted = routerStore.getAttemptedRoute();
    } catch (e) {
      _log('warn', 'Failed to get attemptedRoute', { error: (e as Error).message });
    }

    if (attempted && attempted.path && attempted.path !== '/login') {
      return {
        path: attempted.path,
        source: 'attempted',
        original: attempted.path
      };
    }

    return {
      path: DEFAULT_AUTHENTICATED_ROUTE,
      source: 'default',
      original: null
    };
  }

  /**
   * Checks whether a redirect should be performed.
   */
  function shouldRedirect(isAuthenticated: boolean): ShouldRedirectResult {
    _metrics.checks++;

    if (!isAuthenticated) {
      return { shouldRedirect: false, reason: 'not-authenticated', target: null };
    }

    if (!_isOnRedirectTriggerRoute()) {
      return { shouldRedirect: false, reason: 'not-on-trigger-route', target: null };
    }

    let target: RedirectTarget = getRedirectTarget();
    return { shouldRedirect: true, reason: 'authenticated-on-public-route', target: target };
  }

  /**
   * Executes the redirect using history.replaceState (non-disruptive).
   * Does NOT reload the page — allows the boot pipeline to continue
   * with the correct path so phase-3 will see the new route.
   */
  function execute(isAuthenticated: boolean): ExecuteResult {
    const check: ShouldRedirectResult = shouldRedirect(isAuthenticated);

    if (!check.shouldRedirect) {
      _metrics.redirectsSkipped++;
      _log('debug', 'Redirect not needed', { reason: check.reason });
      return { executed: false, target: null, reason: check.reason };
    }

    const target: RedirectTarget = check.target as RedirectTarget;

    try {
      _log('info', 'Executing post-auth redirect', {
        from: _getCurrentPath(),
        to: target.path,
        source: target.source
      });

      // Use history.replaceState — non-disruptive, no page reload
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState(
          { authRedirect: true, source: MODULE_ID, timestamp: Date.now() },
          '',
          target.path
        );
      }

      // Clear attemptedRoute after using it
      if (target.source === 'attempted') {
        _metrics.attemptedRouteUsed++;
        try {
          routerStore.clearAttemptedRoute();
        } catch (e) {
          _log('warn', 'Failed to clear attemptedRoute', { error: (e as Error).message });
        }
      } else {
        _metrics.defaultRouteUsed++;
      }

      _metrics.redirectsExecuted++;

      // Emit redirect event for observability
      _emit(AUTH_EVENTS.SESSION_CHECKED || 'auth:redirect', {
        type: 'post-auth-redirect',
        from: '/login',
        to: target.path,
        targetSource: target.source
      });

      _track('auth-redirect-executed', {
        from: '/login',
        to: target.path,
        targetSource: target.source
      });

      _log('info', 'Post-auth redirect complete', {
        newPath: target.path,
        source: target.source
      });

      return { executed: true, target: target, reason: 'redirect-complete' };
    } catch (error) {
      _metrics.errors++;
      _log('error', 'Redirect failed', { error: (error as Error).message });
      _track('auth-redirect-error', { error: (error as Error).message });
      return { executed: false, target: target, reason: 'error: ' + (error as Error).message };
    }
  }

  function info(): RedirectControllerInfo {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      defaultRoute: DEFAULT_AUTHENTICATED_ROUTE,
      triggerRoutes: REDIRECT_TRIGGER_ROUTES.slice() as string[],
      metrics: Object.assign({}, _metrics),
      currentPath: _getCurrentPath(),
      isOnTriggerRoute: _isOnRedirectTriggerRoute()
    };
  }

  function healthCheck(): RedirectControllerHealthCheck {
    const isHealthy: boolean = _metrics.errors === 0 ||
      (_metrics.errors / Math.max(_metrics.checks, 1)) < 0.1;

    return {
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        lowErrorRate: isHealthy,
        routerStoreAvailable: !!(routerStore && routerStore.getAttemptedRoute),
        historyAPIAvailable: typeof window !== 'undefined' && !!window.history
      },
      metrics: Object.assign({}, _metrics)
    };
  }

  return {
    shouldRedirect: shouldRedirect,
    getRedirectTarget: getRedirectTarget,
    execute: execute,
    info: info,
    healthCheck: healthCheck
  };
}

export default { createAuthRedirectController, VERSION, MODULE_ID };
