// Migrado para TypeScript: 2026-02-25
// Router Global - Diagnostics v7.1.0
// @version 7.1.0-ENTERPRISE

import { routerStore as _routerStore } from '/components/router/state/store.js';
const routerStore = _routerStore as any;
import { routerTelemetry as _routerTelemetry } from '/components/router/telemetry/tracker.js';
const routerTelemetry = _routerTelemetry as any;
import { RouteResolver as _RouteResolver } from '/components/router/core/resolver.js';
const RouteResolver = _RouteResolver as any;
import { HistoryManager as _HistoryManager } from '/components/router/core/history.js';
const HistoryManager = _HistoryManager as any;
import { RouteGuard } from '/components/router/core/guard.js';
import { RouteTransitions as _RouteTransitions } from '/components/router/core/transitions.js';
const RouteTransitions = _RouteTransitions as any;
import { getContractsInfo, AUTH_EVENTS, ROUTER_EVENTS } from '../events/events-contracts.ts';
import type { ContractsInfo } from '../events/events-contracts.ts';
import { getRoutesInfo } from '/components/router/registry/validation.js';
import { getGlobalStateStatus, getAuthEventsStatus, retryGlobalStateIntegration, retryAuthEventIntegration } from './integrations.ts';
import type { IntegrationStatus } from './integrations.ts';
import { getConfig, contractsValid } from './lifecycle.ts';
import type { RouterConfig } from './lifecycle.ts';
import type { RouterGlobalInstance } from './navigation.ts';
import type { RouteInfo } from './utils.ts';

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

interface HealthIssue {
  type: string;
  severity: 'error' | 'warning';
  error?: unknown;
}

export interface RouterStatus {
  version: string;
  moduleId: string;
  initialized: boolean;
  destroyed: boolean;
  ready: boolean;
  contractsValid: boolean;
  config: RouterConfig;
  currentRoute: string | null;
  currentVirtualRoute: unknown;
  previousRoute: string | null;
  attemptedRoute: string | null;
  isNavigating: boolean;
  error: unknown;
  globalStateConnected: boolean;
  globalStateRetryCount: number;
  authEventsConnected: boolean;
  authEventRetryCount: number;
}

export interface RouterHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: string;
  healthy: boolean;
  version: string;
  moduleId: string;
  initialized: boolean;
  destroyed: boolean;
  ready: boolean;
  contractsValid: boolean;
  globalStateConnected: boolean;
  authEventsConnected: boolean;
  historyInitialized: boolean;
  permissionsGuardAvailable: boolean;
  routesValid: boolean;
  issues: HealthIssue[] | null;
  timestamp: number;
}

interface RoutesInfoResult {
  validation: { valid: boolean; [key: string]: unknown };
  [key: string]: unknown;
}

export interface RouterInfo {
  name: string;
  version: string;
  moduleId: string;
  initialized: boolean;
  ready: boolean;
  config: RouterConfig;
  currentRoute: string | null;
  currentVirtualRoute: unknown;
  state: unknown;
  contracts: ContractsInfo;
  routes: RoutesInfoResult;
  guard: unknown;
  history: unknown;
  resolver: unknown;
  transitions: unknown;
  telemetry: unknown;
  integrations: {
    globalStateConnected: boolean;
    authEventsConnected: boolean;
    eventBusAvailable: boolean;
  };
  capabilities: readonly string[];
}

export interface DebugObject {
  getStore: () => unknown;
  getStoreStatus: () => unknown;
  getVirtualRoute: () => unknown;
  getMetrics: () => unknown;
  getGuardStatus: () => unknown;
  getHistoryStatus: () => unknown;
  getResolverStatus: () => unknown;
  getTransitionsStatus: () => unknown;
  getContractsInfo: () => ContractsInfo;
  getRoutesInfo: () => RoutesInfoResult;
  getAuthEvents: () => typeof AUTH_EVENTS;
  getRouterEvents: () => typeof ROUTER_EVENTS;
  getEventLog: () => unknown;
  getRecentEvents: (n: number) => unknown;
  getConfig: () => RouterConfig;
  retryGlobalState: () => boolean;
  retryAuthEvents: () => boolean;
}

// ═══════════════════════════════════════════════════════════════
// getStatus
// ═══════════════════════════════════════════════════════════════

export function getStatus(routerGlobal: RouterGlobalInstance): RouterStatus {
  const gsStatus: IntegrationStatus = getGlobalStateStatus();
  const aeStatus: IntegrationStatus = getAuthEventsStatus();
  const currentRoute = routerStore.getCurrentRoute() as RouteInfo | null;
  const previousRoute = routerStore.getPreviousRoute() as RouteInfo | null;
  const attemptedRoute = routerStore.getAttemptedRoute() as { path?: string } | null;
  return {
    version: routerGlobal.version, moduleId: routerGlobal.moduleId, initialized: routerGlobal.isInitialized, destroyed: routerGlobal.isDestroyed, ready: routerGlobal.isReady(),
    contractsValid, config: getConfig(), currentRoute: currentRoute?.path || null,
    currentVirtualRoute: routerStore.getVirtualRoute(), previousRoute: previousRoute?.path || null,
    attemptedRoute: attemptedRoute?.path || null, isNavigating: routerStore.isNavigating(),
    error: routerStore.getError(), globalStateConnected: gsStatus.connected, globalStateRetryCount: gsStatus.retryCount,
    authEventsConnected: aeStatus.connected, authEventRetryCount: aeStatus.retryCount
  };
}

// ═══════════════════════════════════════════════════════════════
// healthCheck
// ═══════════════════════════════════════════════════════════════

export function healthCheck(routerGlobal: RouterGlobalInstance): RouterHealthCheck {
  const issues: HealthIssue[] = [];
  let score = 0;
  const maxScore = 8;
  const gsStatus: IntegrationStatus = getGlobalStateStatus();
  const aeStatus: IntegrationStatus = getAuthEventsStatus();

  if (routerGlobal.isInitialized) score++; else issues.push({ type: 'not-initialized', severity: 'error' });
  if (!routerGlobal.isDestroyed) score++; else issues.push({ type: 'destroyed', severity: 'error' });
  if (HistoryManager.isInitialized) score++; else issues.push({ type: 'history-not-initialized', severity: 'error' });
  if (contractsValid) score++; else issues.push({ type: 'contracts-invalid', severity: 'warning' });
  if (window.GlobalState) { if (gsStatus.connected) score++; else issues.push({ type: 'globalstate-not-connected', severity: 'warning' }); } else score++;
  if (window.EventBus) { if (aeStatus.connected) score++; else issues.push({ type: 'auth-events-not-connected', severity: 'warning' }); } else score++;
  if (routerStore.getCurrentRoute()) score++; else issues.push({ type: 'no-current-route', severity: 'warning' });
  if (!routerStore.getError()) score++; else issues.push({ type: 'has-error', error: routerStore.getError(), severity: 'warning' });

  const permGuard = window.PermissionsGuard as Record<string, unknown> | undefined;
  const routesInfoResult = getRoutesInfo() as RoutesInfoResult;

  const result: RouterHealthCheck = {
    status: score === maxScore ? 'HEALTHY' : (score >= 6 ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${score}/${maxScore}`, healthy: issues.filter(i => i.severity === 'error').length === 0,
    version: routerGlobal.version, moduleId: routerGlobal.moduleId, initialized: routerGlobal.isInitialized, destroyed: routerGlobal.isDestroyed, ready: routerGlobal.isReady(),
    contractsValid, globalStateConnected: gsStatus.connected, authEventsConnected: aeStatus.connected,
    historyInitialized: HistoryManager.isInitialized, permissionsGuardAvailable: !!permGuard?.canAccessRoute,
    routesValid: routesInfoResult.validation.valid, issues: issues.length > 0 ? issues : null, timestamp: Date.now()
  };
  routerTelemetry.trackHealthCheck(result);
  return result;
}

// ═══════════════════════════════════════════════════════════════
// info
// ═══════════════════════════════════════════════════════════════

export function info(routerGlobal: RouterGlobalInstance): RouterInfo {
  const currentRoute = routerStore.getCurrentRoute() as RouteInfo | null;
  return {
    name: routerGlobal.moduleId, version: routerGlobal.version, moduleId: routerGlobal.moduleId, initialized: routerGlobal.isInitialized, ready: routerGlobal.isReady(),
    config: getConfig(), currentRoute: currentRoute?.path || null,
    currentVirtualRoute: routerStore.getVirtualRoute(), state: routerStore.getStatus(),
    contracts: getContractsInfo(), routes: getRoutesInfo() as RoutesInfoResult, guard: RouteGuard.getStatus(),

    history: HistoryManager.getStatus(), resolver: RouteResolver.getStatus(),

    transitions: RouteTransitions.getStatus(), telemetry: routerTelemetry.getStatus(),
    integrations: { globalStateConnected: getGlobalStateStatus().connected, authEventsConnected: getAuthEventsStatus().connected, eventBusAvailable: !!window.EventBus },
    capabilities: ['navigation', 'guards', 'hooks', 'history', 'globalstate', 'auth-events', 'telemetry', 'health-check', 'fixed-url'] as const
  };
}

// ═══════════════════════════════════════════════════════════════
// createDebugObject
// ═══════════════════════════════════════════════════════════════

export function createDebugObject(routerGlobal: RouterGlobalInstance): DebugObject {
  return {
    getStore: () => routerStore.getSnapshot(),
    getStoreStatus: () => routerStore.getStatus(),
    getVirtualRoute: () => routerStore.getVirtualRoute(),
    getMetrics: () => routerTelemetry.getMetrics(),
    getGuardStatus: () => RouteGuard.getStatus(),
    getHistoryStatus: () => HistoryManager.getStatus(),

    getResolverStatus: () => RouteResolver.getStatus(),

    getTransitionsStatus: () => RouteTransitions.getStatus(),
    getContractsInfo: () => getContractsInfo(),
    getRoutesInfo: () => getRoutesInfo() as RoutesInfoResult,
    getAuthEvents: () => AUTH_EVENTS,
    getRouterEvents: () => ROUTER_EVENTS,
    getEventLog: () => routerTelemetry.getEventLog(),
    getRecentEvents: (n: number) => routerTelemetry.getRecentEvents(n),
    getConfig: () => getConfig(),
    retryGlobalState: retryGlobalStateIntegration,
    retryAuthEvents: () => retryAuthEventIntegration(() => routerGlobal)
  };
}
