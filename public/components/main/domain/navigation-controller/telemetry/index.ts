// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ABORT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation-controller-telemetry
// PURPOSE: NavigationController - Telemetry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getMetrics() — exported function
//   getNavigationDiagnostics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const MODULE_ID = 'navigation-controller-telemetry';
export const VERSION = '8.1.0-ABORT-FIX';

export function getMetrics(state: Record<string, unknown>) {
  const metrics = state.metrics as Record<string, unknown>;
  const navQueue = state.navigationQueue as unknown[];
  const intentHistory = state.intentHistory as unknown[];
  return Object.assign({}, metrics, {
    queueSize: navQueue.length,
    isNavigating: state.navigating,
    intentHistorySize: intentHistory.length
  });
}

export function getNavigationDiagnostics(state: Record<string, unknown>, getPort: (name: string) => unknown) {
  const broker = getPort('navigationBroker') as Record<string, (...args: unknown[]) => Record<string, unknown>> | null;
  const brokerDiag = broker && broker.getNavigationDiagnostics ? broker.getNavigationDiagnostics() : null;

  return {
    localHistory: (state.intentHistory as unknown[]).slice(0, 20),
    brokerHistory: brokerDiag ? brokerDiag.history : [],
    lastValidNavigation: state.lastValidNavigation,
    currentNavigation: state.currentNavigation,
    metrics: getMetrics(state),
    brokerMetrics: brokerDiag ? brokerDiag.metrics : null,
    timestamp: Date.now()
  };
}

export function info(state: Record<string, unknown>, panelLifecycle: Record<string, unknown>, manifestController: Record<string, unknown>, getPort: (name: string) => unknown, portsInitialized: unknown) {
  const pl = panelLifecycle as Record<string, (...args: unknown[]) => unknown> | null;
  return {
    version: VERSION,
    moduleId: 'main-navigation-controller',
    navigating: state.navigating,
    currentPanel: pl && pl.getCurrentPanelId ? pl.getCurrentPanelId() : null,
    currentNavigation: state.currentNavigation,
    lastValidNavigation: state.lastValidNavigation,
    queueSize: (state.navigationQueue as unknown[]).length,
    timeoutMs: state.timeoutMs,
    hasManifestController: !!manifestController,
    hasNavigationBroker: !!getPort('navigationBroker'),
    portsStatus: { initialized: portsInitialized },
    usingP18Intents: true,
    abortSignalSupport: true,
    metrics: getMetrics(state)
  };
}

export function healthCheck(state: Record<string, unknown>, panelLifecycle: Record<string, unknown>, stateMachine: Record<string, unknown>, telemetry: Record<string, unknown>, manifestController: Record<string, unknown>, getPort: (name: string) => unknown, portsInitialized: unknown) {
  const hasPanelLifecycle = !!panelLifecycle;
  const hasStateMachine = !!stateMachine;
  const hasManifestController = !!manifestController;
  const hasBroker = !!getPort('navigationBroker');

  const m = state.metrics as Record<string, number>;
  const total = m.navigationsCompleted + m.navigationsFailed;
  const failureRate = total > 0 ? (m.navigationsFailed / total) * 100 : 0;
  const timeoutRate = total > 0 ? (m.navigationsTimedOut / total) * 100 : 0;
  const blockRate = total > 0 ? (m.navigationsBlocked / (total + m.navigationsBlocked)) * 100 : 0;
  const cancelRate = total > 0 ? (m.navigationsCancelled / total) * 100 : 0;

  let status = 'HEALTHY';
  if (!hasPanelLifecycle || !hasStateMachine) status = 'UNHEALTHY';
  else if (failureRate > 30 || timeoutRate > 10 || state.navigating) status = 'DEGRADED';

  return {
    status,
    version: VERSION,
    moduleId: 'main-navigation-controller',
    checks: {
      hasPanelLifecycle,
      hasStateMachine,
      hasTelemetry: !!telemetry,
      hasManifestController,
      hasNavigationBroker: hasBroker,
      isNavigating: state.navigating,
      queueSize: (state.navigationQueue as unknown[]).length,
      failureRate: `${Math.round(failureRate)}%`,
      timeoutRate: `${Math.round(timeoutRate)}%`,
      blockRate: `${Math.round(blockRate)}%`,
      cancelRate: `${Math.round(cancelRate)}%`,
      avgNavigationTime: `${m.avgNavigationTime}ms`,
      portsInitialized,
      p18IntentsAvailable: true,
      abortSignalSupport: true
    },
    metrics: getMetrics(state)
  };
}

export default {
  getMetrics,
  getNavigationDiagnostics,
  info,
  healthCheck
};
