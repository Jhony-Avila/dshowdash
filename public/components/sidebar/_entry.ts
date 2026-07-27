// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.sidebar
// PURPOSE: Sidebar with kernel-orchestrated architecture, features, and health monitoring
// ───────────────────────────────────────────────────────────────
// @contract CREATE - createSidebar(options) creates sidebar instance
// @contract GET - getSidebar() gets sidebar instance
// @contract DESTROY - destroySidebar() destroys sidebar instance
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module info
// @contract METRICS - getMetrics() returns metrics
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract KERNEL - kernel.* for feature management
// @contract METRICS_HUB - metricsHub.* for metrics aggregation
// @contract CIRCUIT_BREAKER - circuitBreaker.* for failure protection
// @contract HEALTH_MONITOR - healthMonitor.* for health tracking
// ───────────────────────────────────────────────────────────────
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: sidebar-lifecycle — createSidebar, getSidebar, destroySidebar
// IMPORTS: observability — healthCheck, info, getMetrics, namespaces
// IMPORTS: Kernel, MetricsHub, CircuitBreaker, HealthMonitor — for window globals
// PROVIDES: createSidebar, getSidebar, destroySidebar, healthCheck, info, getMetrics,
//           injectPorts, getPorts, kernel, metricsHub, circuitBreaker, healthMonitor,
//           VERSION, MODULE_ID, CAPABILITIES, CORE_VERSION, LIFECYCLE_STATES,
//           SIDEBAR_EVENTS, SidebarRegistry, Sidebar
// WINDOW ACCESS (legítimo — sidebar global):
//   (window as any).SidebarKernel, (window as any).SidebarMetricsHub,
//   (window as any).SidebarCircuitBreaker, (window as any).SidebarHealthMonitor
// @changelog v7.4.0-P2-ENTERPRISE: Modularização — feature-loader, sidebar-lifecycle, observability extraídos
// @changelog v7.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v7.2.0-ES6-STRICT-MODE: Strict mode integration
// @changelog v7.2.0-ES6: var → const/let migration
// @changelog v7.1.0-PORTSFACTORY: _log migrado para usar Ports
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// Re-exports (preserved from original contract)
export { VERSION as CORE_VERSION, MODULE_ID, CAPABILITIES } from './core/constants.js';
export { LIFECYCLE_STATES } from './domain/state-machine.js';
export { SIDEBAR_EVENTS };
export { default as SidebarRegistry } from './registry/registry.js';
export { Sidebar } from './sidebar.js';

import { MODULE_ID, CAPABILITIES } from './core/constants.js';
import { setupWindowAPI } from './core/window-api.js';
import { setupDevTools } from './core/dev-tools.js';

// Direct imports for window globals (backward compatibility)
import * as Kernel from './kernel/index.js';
import * as MetricsHub from './telemetry/metrics-hub.js';
import * as CircuitBreaker from './kernel/circuit-breaker.js';
import * as HealthMonitor from './kernel/health-monitor.js';

// Modularized core (v7.4.0)
import { createCreateSidebar, createGetSidebar, createDestroySidebar } from './core/sidebar-lifecycle.js';
import { createHealthCheck, createInfo, createGetMetrics, kernelNamespace, metricsHubNamespace, circuitBreakerNamespace, healthMonitorNamespace } from './api/observability.js';


export const VERSION = '7.4.0-P2-ENTERPRISE';

// ── Port Infrastructure ─────────────────────────────────────
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const prefix = '[Sidebar]';
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](...[prefix].concat(args));
  } else if (level === 'error' || level === 'warn' || level === 'info') {
    const fn = console.debug;
    fn.apply(console, [prefix].concat(args));
  }
};

function _getEventBus() { return _getPort('eventBus') || _getPort('eventBusGlobal'); }

// ── Shared State ────────────────────────────────────────────
let _instance: DynObj | null = null;
let _featuresLoaded = false;
const _featureModules = new Map();
let _safeMode = false;

const DEFAULT_CONFIG = {
  enableConsoleCommands: true,
  enableHealthMonitor: true,
  enableCircuitBreaker: true,
  healthMonitorIntervalMs: 30000,
  healthMonitorAutoRecover: true,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerTimeout: 30000,
  autoEnableMaxPriority: 1,
  featureEnableTimeoutMs: 5000,
  logLevel: 'info'
};

let _config = Object.assign({}, DEFAULT_CONFIG);

let _moduleMetrics = {
  instancesCreated: 0,
  featuresRegistered: 0,
  featuresEnabled: 0,
  featuresSkipped: 0,
  featureErrors: 0,
  circuitBreakerBlocks: 0,
  initTime: null as number | null,
  lastError: null as string | null,
  safeModeBoots: 0
};

const _getSidebarEl = () => {
  if (!_instance || !_instance._renderer || !_instance._renderer.getSidebar) return null;
  return _instance._renderer.getSidebar();
};

// ── Shared Context ──────────────────────────────────────────
const ctx = {
  Ports,
  VERSION,
  DEFAULT_CONFIG,
  log: _log,
  initPorts: _initPorts,
  getEventBus: _getEventBus,
  getSidebarEl: _getSidebarEl,
  moduleMetrics: _moduleMetrics,
  featureModules: _featureModules,
  getInstance: () => _instance,
  setInstance: (v: DynObj ) => { _instance = v; },
  getConfig: () => _config,
  setConfig: (v: DynObj ) => { _config = v; },
  getSafeMode: () => _safeMode,
  setSafeMode: (v: DynObj ) => { _safeMode = v; },
  getFeaturesLoaded: () => _featuresLoaded,
  setFeaturesLoaded: (v: DynObj ) => { _featuresLoaded = v; }
};

// ── Build APIs from factories ───────────────────────────────
export const createSidebar = createCreateSidebar(ctx);
export const getSidebar = createGetSidebar(ctx);
export const destroySidebar = createDestroySidebar(ctx);
export const healthCheck = createHealthCheck(ctx);
export const info = createInfo(ctx);
export const getMetrics = createGetMetrics();

// ── Namespace exports ───────────────────────────────────────
export const kernel = kernelNamespace;
export const metricsHub = metricsHubNamespace;
export const circuitBreaker = circuitBreakerNamespace;
export const healthMonitor = healthMonitorNamespace;

// ── Window Exposure ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  setupDevTools(() => _instance);

  // APIs globais condicionadas ao strict mode
  if (!isStrict()) {
    setupWindowAPI(() => _instance, (_getSidebarEl as DynObj), createSidebar, destroySidebar);
    (window as any).SidebarKernel = Kernel;
    (window as any).SidebarMetricsHub = MetricsHub;
    (window as any).SidebarCircuitBreaker = CircuitBreaker;
    (window as any).SidebarHealthMonitor = HealthMonitor;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).SidebarKernel' });
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).SidebarMetricsHub' });
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).SidebarCircuitBreaker' });
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: '(window as any).SidebarHealthMonitor' });
  }
}

export default {
  VERSION,
  MODULE_ID,
  CAPABILITIES,
  createSidebar,
  getSidebar() { return _instance; },
  destroySidebar,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts,
  kernel,
  metricsHub,
  circuitBreaker,
  healthMonitor
};
