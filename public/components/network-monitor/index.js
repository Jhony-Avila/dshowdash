import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { NETWORK_EVENTS } from "/core/runtime/events/catalog/network.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import networkStore from "./state/store.js";
import ConnectionDetector from "./core/detector.js";
import { QualityAnalyzer as _QualityAnalyzer } from "./core/analyzer.js";
const QualityAnalyzer = _QualityAnalyzer;
import { NetworkLifecycle } from "./core/lifecycle.js";
import { trackNetworkEvent, getEventLog, getRecentEvents } from "./telemetry/tracker.js";
import { formatSpeed, calculateLatency, getConnectionType } from "./utils/helpers.js";
const VERSION = "1.9.0-P2-ENTERPRISE";
const MODULE_ID = "network-monitor";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let orchestratorCleanups = [];
let globalStateCleanups = [];
const setupGlobalStateIntegration = () => {
  const globalState = _getPort("globalState");
  if (!globalState) return;
  const syncOnlineStatus = () => {
    const isOnline = networkStore.isOnline();
    const gs = _getPort("globalState");
    if (gs?.dispatch && gs?.actions?.setOnlineStatus) {
      try {
        gs.dispatch(gs.actions.setOnlineStatus(isOnline));
      } catch (e) {
      }
    }
  };
  const unsubscribe = networkStore.subscribe(({ action }) => {
    if (action === "online-changed") syncOnlineStatus();
  });
  globalStateCleanups.push(unsubscribe);
  syncOnlineStatus();
  trackNetworkEvent("network:global-state:connected");
};
const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  globalStateCleanups = [];
};
const setupOrchestratorIntegration = () => {
  const eventBus = _getPort("eventBus");
  if (!eventBus) return;
  const unsubscribe = networkStore.subscribe(({ action }) => {
    const eb = _getPort("eventBus");
    if (!eb?.emit) return;
    if (action === "online-changed") eb.emit(NETWORK_EVENTS.STATUS_CHANGED, { online: networkStore.isOnline(), timestamp: Date.now() });
    else if (action === "quality-changed") eb.emit(NETWORK_EVENTS.QUALITY_CHANGED, { quality: networkStore.getQuality(), timestamp: Date.now() });
  });
  orchestratorCleanups.push(unsubscribe);
  trackNetworkEvent("network:orchestrator:connected");
};
const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  orchestratorCleanups = [];
};
const NetworkMonitor = {
  version: VERSION,
  name: MODULE_ID,
  init: (options = {}) => {
    trackNetworkEvent("network:api:init:called");
    _initPorts();
    return NetworkLifecycle.init(options).then((result) => {
      setupGlobalStateIntegration();
      setupOrchestratorIntegration();
      return result;
    });
  },
  shutdown: () => {
    trackNetworkEvent("network:api:shutdown:called");
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return NetworkLifecycle.shutdown();
  },
  reset: () => {
    trackNetworkEvent("network:api:reset:called");
    return NetworkLifecycle.reset();
  },
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
  measureLatency: (url) => QualityAnalyzer.measureLatency(url),
  measureBandwidth: () => QualityAnalyzer.measureBandwidth(),
  runDiagnostics: () => QualityAnalyzer.runDiagnostics(),
  // @ts-expect-error TS migration - TS2551
  getStats: () => networkStore.getStats(),
  // @ts-expect-error TS migration - TS2339
  getHistory: () => networkStore.getHistory(),
  subscribe: (listener) => networkStore.subscribe(listener),
  status: () => NetworkLifecycle.getStatus(),
  isInitialized: () => NetworkLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts,
  getPorts,
  info: () => ({ name: MODULE_ID, version: VERSION, status: NetworkLifecycle.getStatus(), orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() }),
  healthCheck: () => {
    const checks = { initialized: NetworkLifecycle.isInitialized(), storeAvailable: !!networkStore, detectorAvailable: !!ConnectionDetector, analyzerAvailable: !!QualityAnalyzer, lifecycleAvailable: !!NetworkLifecycle, globalStateConnected: globalStateCleanups.length > 0, orchestratorConnected: orchestratorCleanups.length > 0, online: networkStore.isOnline(), portsInitialized: Ports.isInitialized() };
    const issues = [];
    let score = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) score++;
      else issues.push(key);
    }
    const maxScore = Object.keys(checks).length;
    return { status: score === maxScore ? "HEALTHY" : score >= maxScore - 2 ? "DEGRADED" : "UNHEALTHY", score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, online: networkStore.isOnline(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  utils: { formatSpeed, calculateLatency, getConnectionType },
  // @ts-expect-error TS migration - TS2339
  debug: { getEventLog, getRecentEvents, getStore: () => networkStore.toJSON() }
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.NetworkMonitor = NetworkMonitor;
    trackNetworkEvent("network:global:exposed");
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, target: "window.NetworkMonitor" });
  }
  window.__dev = window.__dev || {};
  window.__dev.networkMonitor = { MODULE_ID, VERSION, healthCheck: NetworkMonitor.healthCheck, info: NetworkMonitor.info, status: NetworkMonitor.status, isOnline: NetworkMonitor.isOnline, getQuality: NetworkMonitor.getQuality, debug: NetworkMonitor.debug };
}
var network_monitor_default = NetworkMonitor;
export {
  ConnectionDetector,
  MODULE_ID,
  NetworkLifecycle,
  NetworkMonitor,
  QualityAnalyzer,
  VERSION,
  network_monitor_default as default,
  getPorts,
  injectPorts,
  networkStore
};
