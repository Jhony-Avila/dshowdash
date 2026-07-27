// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.network-monitor
// PURPOSE: Network connectivity monitoring with quality analysis
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes network monitor
// @contract SHUTDOWN - shutdown() shuts down network monitor
// @contract RESET - reset() resets network monitor
// @contract IS_ONLINE - isOnline() returns online status
// @contract GET_QUALITY - getQuality() returns connection quality
// @contract GET_LATENCY - getLatency() returns latency
// @contract GET_BANDWIDTH - getBandwidth() returns bandwidth
// @contract GET_CONNECTION_TYPE - getConnectionType() returns connection type
// @contract MEASURE_LATENCY - measureLatency(url) measures latency to URL
// @contract MEASURE_BANDWIDTH - measureBandwidth() measures bandwidth
// @contract RUN_DIAGNOSTICS - runDiagnostics() runs network diagnostics
// @contract SUBSCRIBE - subscribe(listener) subscribes to changes
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: NETWORK_EVENTS from /core/runtime/events/index.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: networkStore, ConnectionDetector, QualityAnalyzer, NetworkLifecycle
// PROVIDES: NetworkMonitor, networkStore, ConnectionDetector, QualityAnalyzer,
//           NetworkLifecycle, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.8.0-STRICT-MODE: Strict mode integration
// @changelog v1.7.0-ENTERPRISE: ES6 modernization
// @changelog v1.6.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { NETWORK_EVENTS } from '/core/runtime/events/catalog/network.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

import networkStore from './state/store.js';

import ConnectionDetector from './core/detector.js';
import { QualityAnalyzer as _QualityAnalyzer } from './core/analyzer.js';
const QualityAnalyzer = _QualityAnalyzer as any;
import { NetworkLifecycle } from './core/lifecycle.js';
import { trackNetworkEvent, getEventLog, getRecentEvents } from './telemetry/tracker.js';
import { formatSpeed, calculateLatency, getConnectionType } from './utils/helpers.js';

export const VERSION = '1.9.0-P2-ENTERPRISE';
export const MODULE_ID = 'network-monitor';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let orchestratorCleanups: (() => void)[] = [];
let globalStateCleanups: (() => void)[] = [];

const setupGlobalStateIntegration = () => {
  const globalState = _getPort('globalState');
  if (!globalState) return;
  const syncOnlineStatus = () => {
    // @ts-expect-error TS migration - TS2551
    const isOnline = networkStore.isOnline();
    const gs = _getPort('globalState');
    if (gs?.dispatch && gs?.actions?.setOnlineStatus) {
      try { gs.dispatch(gs.actions.setOnlineStatus(isOnline)); } catch(e) {}
    }
  };
  // @ts-expect-error strict migration — TS2345
  const unsubscribe = networkStore.subscribe(({ action }: { action: string }) => { if (action === 'online-changed') syncOnlineStatus(); });
  globalStateCleanups.push(unsubscribe);
  syncOnlineStatus();
  trackNetworkEvent('network:global-state:connected');
};

const cleanupGlobalStateIntegration = () => { globalStateCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); }); globalStateCleanups = []; };

const setupOrchestratorIntegration = () => {
  const eventBus = _getPort('eventBus');
  if (!eventBus) return;
  // @ts-expect-error strict migration — TS2345
  const unsubscribe = networkStore.subscribe(({ action }: { action: string }) => {
    const eb = _getPort('eventBus');
    if (!eb?.emit) return;
    // @ts-expect-error TS migration - TS2551
    if (action === 'online-changed') eb.emit(NETWORK_EVENTS.STATUS_CHANGED, { online: networkStore.isOnline(), timestamp: Date.now() });
    // @ts-expect-error TS migration - TS2339
    else if (action === 'quality-changed') eb.emit(NETWORK_EVENTS.QUALITY_CHANGED, { quality: networkStore.getQuality(), timestamp: Date.now() });
  });
  orchestratorCleanups.push(unsubscribe);
  trackNetworkEvent('network:orchestrator:connected');
};

const cleanupOrchestratorIntegration = () => { orchestratorCleanups.forEach((cleanup) => { if (typeof cleanup === 'function') cleanup(); }); orchestratorCleanups = []; };

const NetworkMonitor = {
  version: VERSION, name: MODULE_ID,
  init: (options = {}) => {
    trackNetworkEvent('network:api:init:called');
    _initPorts();
    return NetworkLifecycle.init(options).then((result) => { setupGlobalStateIntegration(); setupOrchestratorIntegration(); return result; });
  },
  shutdown: () => { trackNetworkEvent('network:api:shutdown:called'); cleanupGlobalStateIntegration(); cleanupOrchestratorIntegration(); return NetworkLifecycle.shutdown(); },
  reset: () => { trackNetworkEvent('network:api:reset:called'); return NetworkLifecycle.reset(); },
  // @ts-expect-error TS migration - TS2551
  isOnline: () => networkStore.isOnline(),
  // @ts-expect-error TS migration - TS2339
  getQuality: () => networkStore.getQuality(),
  // @ts-expect-error TS migration - TS2339
  getLatency: () => networkStore.getLatency(),
  // @ts-expect-error TS migration - TS2339
  getBandwidth: () => networkStore.getBandwidth(),
  // @ts-expect-error TS migration - TS2339
  getConnectionType: () => ConnectionDetector.getType(),
  // @ts-expect-error TS migration - TS2339
  getEffectiveType: () => ConnectionDetector.getEffectiveType(),
  // @ts-expect-error TS migration - TS2339
  isMetered: () => ConnectionDetector.isMetered(),
  measureLatency: (url: string) => QualityAnalyzer.measureLatency(url),
  measureBandwidth: () => QualityAnalyzer.measureBandwidth(),
  runDiagnostics: () => QualityAnalyzer.runDiagnostics(),
  // @ts-expect-error TS migration - TS2551
  getStats: () => networkStore.getStats(),
  // @ts-expect-error TS migration - TS2339
  getHistory: () => networkStore.getHistory(),
  subscribe: (listener: (state: unknown) => void) => networkStore.subscribe(listener),
  status: () => NetworkLifecycle.getStatus(),
  isInitialized: () => NetworkLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts, getPorts,
  info: () => ({ name: MODULE_ID, version: VERSION, status: NetworkLifecycle.getStatus(), orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() }),
  healthCheck: () => {
    // @ts-expect-error TS migration - TS2551
    const checks = { initialized: NetworkLifecycle.isInitialized(), storeAvailable: !!networkStore, detectorAvailable: !!ConnectionDetector, analyzerAvailable: !!QualityAnalyzer, lifecycleAvailable: !!NetworkLifecycle, globalStateConnected: globalStateCleanups.length > 0, orchestratorConnected: orchestratorCleanups.length > 0, online: networkStore.isOnline(), portsInitialized: Ports.isInitialized() };
    const issues = [];
    let score = 0;
    for (const [key, value] of Object.entries(checks)) { if (value) score++; else issues.push(key); }
    const maxScore = Object.keys(checks).length;
    // @ts-expect-error TS migration - TS2551
    return { status: score === maxScore ? 'HEALTHY' : score >= maxScore - 2 ? 'DEGRADED' : 'UNHEALTHY', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, online: networkStore.isOnline(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  utils: { formatSpeed, calculateLatency, getConnectionType },
  // @ts-expect-error TS migration - TS2339
  debug: { getEventLog, getRecentEvents, getStore: () => networkStore.toJSON() }
};

if (typeof window !== 'undefined') {
  if (!isStrict()) {
    (window as any).NetworkMonitor = NetworkMonitor;
    trackNetworkEvent('network:global:exposed');
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.NetworkMonitor' });
  }
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.networkMonitor = { MODULE_ID, VERSION, healthCheck: NetworkMonitor.healthCheck, info: NetworkMonitor.info, status: NetworkMonitor.status, isOnline: NetworkMonitor.isOnline, getQuality: NetworkMonitor.getQuality, debug: NetworkMonitor.debug };
}

export default NetworkMonitor;
export { NetworkMonitor, networkStore, ConnectionDetector, QualityAnalyzer, NetworkLifecycle };
