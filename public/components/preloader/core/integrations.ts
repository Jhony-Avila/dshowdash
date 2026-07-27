// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-integrations
// PURPOSE: Preloader Integrations - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS, ORCHESTRATOR_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupGlobalStateIntegration() — exported function
//   setupOrchestratorIntegration() — exported function
//   setupRouterGlobalIntegration() — exported function
//   cleanupIntegrations() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   event
//   ROUTER_EVENTS.READY
//   ROUTER_EVENTS.ROUTE_CHANGED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';

const MODULE_ID = 'preloader-integrations';
const VERSION = '1.4.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _metrics = { globalStateSetups: 0, orchestratorSetups: 0, routerSetups: 0, cleanups: 0 };

function setupGlobalStateIntegration(preloaderInstance: Record<string, any>) {
  _metrics.globalStateSetups++;
  _initPorts();
  const gs = _getPort('globalState');
  if (!gs) { preloaderInstance.addTrace('globalstate:not-available'); return []; }
  const cleanups = [];
  try {
    const syncLoadingState = (isLoading: boolean) => { try { const gs2 = _getPort('globalState'); if (gs2 && gs2.dispatch && gs2.actions && gs2.actions.setLoading) { gs2.dispatch(gs2.actions.setLoading(isLoading)); } } catch (error: any) { } };
    syncLoadingState(true);
    const gs3 = _getPort('globalState');
    if (typeof (gs3 && gs3.subscribe) === 'function') { const unsubscribeLoading = gs3.subscribe(() => { }, 'app.isLoading'); if (unsubscribeLoading) { cleanups.push(unsubscribeLoading); preloaderInstance._integrationsStatus.globalStateConnected = true; } }
    const originalHide = preloaderInstance.hide.bind(preloaderInstance);
    preloaderInstance.hide = (callback: (() => void) | undefined) => { syncLoadingState(false); originalHide(callback); };
    preloaderInstance.addTrace('globalstate:connected');
  } catch (error: any) { preloaderInstance.addTrace('globalstate:error', { error: error.message }); preloaderInstance._metrics.errorCount++; }
  return cleanups;
}

function setupOrchestratorIntegration(preloaderInstance: Record<string, any>) {
  _metrics.orchestratorSetups++;
  const cleanups: (() => void)[] = [];
  if (!preloaderInstance.eventBus || !preloaderInstance.config.orchestrator.trackStatus) { return cleanups; }
  const handlers: Record<string, (data?: Record<string, any>) => void> = {};
  handlers['main:orchestrator:initialized'] = (data?: Record<string, any>) => { preloaderInstance.orchestratorState.initialized = true; preloaderInstance.addTrace('orchestrator:initialized', { preset: data ? data.preset : undefined }); };
  handlers[ORCHESTRATOR_EVENTS.PRESET_APPLIED] = (data?: Record<string, any>) => { preloaderInstance.orchestratorState.preset = data ? data.presetId : undefined; preloaderInstance.addTrace('orchestrator:preset-applied', { preset: data ? data.presetId : undefined }); };
  handlers['main:orchestrator:error'] = (data?: Record<string, any>) => { preloaderInstance.orchestratorState.initialized = false; preloaderInstance.addTrace('orchestrator:error', { error: data ? data.error : undefined }); };
  const keys = Object.keys(handlers);
  for (let i = 0; i < keys.length; i++) {
    ((event: string) => {
      const handler = handlers[event];
      preloaderInstance.eventBus.on(event, handler);
      cleanups.push(() => { preloaderInstance.eventBus.off(event, handler); });
    })(keys[i]);
  }
  preloaderInstance._integrationsStatus.orchestratorConnected = cleanups.length > 0;
  return cleanups;
}

function setupRouterGlobalIntegration(preloaderInstance: Record<string, any>) {
  _metrics.routerSetups++;
  if (!preloaderInstance.eventBus) return null;
  const handleRouterReady = (data?: Record<string, any>) => { preloaderInstance.addTrace('router-global:ready', { routerVersion: data ? data.version : undefined }); };
  const handleRouteChange = (data?: Record<string, any>) => { preloaderInstance.addTrace('router-global:route-changed', { path: data && data.route ? data.route.path : undefined }); };
  preloaderInstance.eventBus.on(ROUTER_EVENTS.READY, handleRouterReady);
  preloaderInstance.eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, handleRouteChange);
  preloaderInstance._integrationsStatus.routerGlobalConnected = true;
  return () => { preloaderInstance.eventBus.off(ROUTER_EVENTS.READY, handleRouterReady); preloaderInstance.eventBus.off(ROUTER_EVENTS.ROUTE_CHANGED, handleRouteChange); };
}

function cleanupIntegrations(preloaderInstance: Record<string, any>) {
  _metrics.cleanups++;
  preloaderInstance.globalStateCleanups.forEach((cleanup: () => void) => { try { cleanup(); } catch(e) {} });
  preloaderInstance.globalStateCleanups = [];
  preloaderInstance._integrationsStatus.globalStateConnected = false;
  preloaderInstance.orchestratorCleanups.forEach((cleanup: () => void) => { try { cleanup(); } catch(e) {} });
  preloaderInstance.orchestratorCleanups = [];
  preloaderInstance._integrationsStatus.orchestratorConnected = false;
  if (preloaderInstance.routerGlobalCleanup) { try { preloaderInstance.routerGlobalCleanup(); } catch(e) {} preloaderInstance.routerGlobalCleanup = null; }
  preloaderInstance._integrationsStatus.routerGlobalConnected = false;
}

function getMetrics() { return Object.assign({}, _metrics); }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), ports: Object.keys(Ports.snapshot()).filter(k => (Ports.snapshot() as Record<string, unknown>)[k] !== null) }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { integrationsReady: true, portsInitialized: Ports.isInitialized() }, metrics: getMetrics() }; }

export { MODULE_ID, VERSION, setupGlobalStateIntegration, setupOrchestratorIntegration, setupRouterGlobalIntegration, cleanupIntegrations, getMetrics, info, healthCheck, injectPorts, getPorts };
export default { MODULE_ID, VERSION, setupGlobalStateIntegration, setupOrchestratorIntegration, setupRouterGlobalIntegration, cleanupIntegrations, getMetrics, info, healthCheck, injectPorts, getPorts };
