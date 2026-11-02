// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.listeners-registry
// PURPOSE: Central registry of event listeners for auditability
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   registerListener() — exported function
//   unregisterListener() — exported function
//   getListeners() — exported function
//   getListenersByEvent() — exported function
//   getListenersByModule() — exported function
//   getListenerStats() — exported function
//   auditListeners() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none - P0 ENTERPRISE compliant)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0-P1-ENTERPRISE
// @changelog v1.0.0-P1-ENTERPRISE - Initial P1 implementation for listener auditability
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID: string = 'core-events-listeners-registry';
export const VERSION: string = '1.0.0-P1-ENTERPRISE';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Interface for the Ports object returned by createCorePorts */
interface CorePorts {
  get(name: string): Record<string, unknown> | null;
  inject(p: Record<string, unknown>): void;
  snapshot(): Record<string, unknown>;
  isInitialized(): boolean;
  init(): void;
}

/** Logger port interface */
interface LoggerPort {
  debug?(msg: string, ...args: unknown[]): void;
  warn?(msg: string, ...args: unknown[]): void;
}

/** Listener registration input */
export interface ListenerRegistration {
  event: string;
  moduleId: string;
  handler?: string;
  purpose?: string;
  longLived?: boolean;
}

/** Internal listener registry entry */
interface ListenerEntry {
  id: string;
  event: string;
  moduleId: string;
  handler: string;
  purpose: string;
  longLived: boolean;
  registeredAt: number;
  unregisteredAt: number | null;
  active: boolean;
}

/** Registration result */
interface RegisterResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Unregister result */
interface UnregisterResult {
  ok: boolean;
  error?: string | null;
}

/** Query options */
interface ListenerQueryOptions {
  activeOnly?: boolean;
}

/** Public listener entry (returned from queries) */
interface ListenerPublicEntry {
  id: string;
  event: string;
  moduleId: string;
  handler: string;
  purpose: string;
  longLived: boolean;
  active: boolean;
  registeredAt: number;
  unregisteredAt?: number | null;
}

/** Listener entry scoped to event query */
interface ListenerByEventEntry {
  id: string;
  moduleId: string;
  handler: string;
  purpose: string;
  longLived: boolean;
  active: boolean;
  registeredAt: number;
}

/** Listener entry scoped to module query */
interface ListenerByModuleEntry {
  id: string;
  event: string;
  handler: string;
  purpose: string;
  longLived: boolean;
  active: boolean;
  registeredAt: number;
}

/** Metrics tracking object */
interface RegistryMetrics {
  totalRegistrations: number;
  totalUnregistrations: number;
  activeListeners: number;
  peakListeners: number;
}

/** Stats result */
interface ListenerStats {
  activeListeners: number;
  totalRegistrations: number;
  totalUnregistrations: number;
  peakListeners: number;
  longLivedListeners: number;
  eventCount: number;
  moduleCount: number;
  byEvent: Record<string, number>;
  byModule: Record<string, number>;
}

/** Audit warning entry */
interface AuditWarning {
  type: string;
  event?: string;
  count?: number;
  id?: string;
  moduleId?: string;
  age?: number;
  message: string;
}

/** Audit result */
interface AuditResult {
  timestamp: number;
  stats: ListenerStats;
  issues: AuditWarning[];
  warnings: AuditWarning[];
  healthy: boolean;
}

/** Info result */
interface InfoResult {
  moduleId: string;
  version: string;
  p1Enterprise: boolean;
  portsInitialized: boolean;
  stats: ListenerStats;
  timestamp: number;
}

/** Health check score */
interface HealthScore {
  passed: number;
  total: number;
  percentage: number;
}

/** Health check result */
interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'NOT_INITIALIZED';
  score: HealthScore;
  moduleId: string;
  version: string;
  p1Enterprise: boolean;
  portsInitialized: boolean;
  checks: Record<string, boolean>;
  metrics: RegistryMetrics;
  auditWarnings: number;
  timestamp: number;
}

// P0 ENTERPRISE: Ports-based access
const Ports: CorePorts = createCorePorts({ moduleId: MODULE_ID }) as CorePorts;
let _portsInitialized: boolean = false;
function _initPorts(): void { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string): Record<string, unknown> | null { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): void { return Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const _registry: Map<string, Set<ListenerEntry>> = new Map(); // event -> Set of listeners
const _byModule: Map<string, Set<ListenerEntry>> = new Map(); // moduleId -> Set of registrations
let _idCounter: number = 0;

const _metrics: RegistryMetrics = {
  totalRegistrations: 0,
  totalUnregistrations: 0,
  activeListeners: 0,
  peakListeners: 0
};

// ═══════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Register a listener in the central registry
 * @param registration - Listener registration info
 * @returns Registration result with ok status and id
 */
export function registerListener(registration: ListenerRegistration): RegisterResult {
  if (!registration || !registration.event || !registration.moduleId) {
    return { ok: false, error: 'event and moduleId are required' };
  }

  const id: string = `listener_${++_idCounter}_${Date.now()}`;

  const entry: ListenerEntry = {
    id,
    event: registration.event,
    moduleId: registration.moduleId,
    handler: registration.handler || 'anonymous',
    purpose: registration.purpose || 'unspecified',
    longLived: registration.longLived || false,
    registeredAt: Date.now(),
    unregisteredAt: null,
    active: true
  };

  // Add to event registry
  if (!_registry.has(registration.event)) {
    _registry.set(registration.event, new Set<ListenerEntry>());
  }
  _registry.get(registration.event)!.add(entry);

  // Add to module registry
  if (!_byModule.has(registration.moduleId)) {
    _byModule.set(registration.moduleId, new Set<ListenerEntry>());
  }
  _byModule.get(registration.moduleId)!.add(entry);

  // Update metrics
  _metrics.totalRegistrations++;
  _metrics.activeListeners++;
  if (_metrics.activeListeners > _metrics.peakListeners) {
    _metrics.peakListeners = _metrics.activeListeners;
  }

  const logger: LoggerPort | null = (_getPort('logger') || console) as LoggerPort;
  if (logger.debug) {
    logger.debug(`[ListenersRegistry] Registered: ${registration.moduleId} -> ${registration.event}`);
  }

  return { ok: true, id };
}

/**
 * Unregister a listener by ID
 * @param id - Listener ID returned from registerListener
 * @returns Unregister result with ok status
 */
export function unregisterListener(id: string): UnregisterResult {
  if (!id) {
    return { ok: false, error: 'id is required' };
  }

  let found: boolean = false;

  // Search through all events
  for (const [event, listeners] of _registry.entries()) {
    for (const entry of listeners) {
      if (entry.id === id && entry.active) {
        entry.active = false;
        entry.unregisteredAt = Date.now();
        found = true;
        _metrics.totalUnregistrations++;
        _metrics.activeListeners--;
        break;
      }
    }
    if (found) break;
  }

  return { ok: found, error: found ? null : 'Listener not found' };
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get all registered listeners
 * @param options - Filter options
 * @returns Array of listener entries
 */
export function getListeners(options?: ListenerQueryOptions): ListenerPublicEntry[] {
  const opts: ListenerQueryOptions = options || {};
  const activeOnly: boolean = opts.activeOnly !== false;

  const result: ListenerPublicEntry[] = [];

  for (const [event, listeners] of _registry.entries()) {
    for (const entry of listeners) {
      if (!activeOnly || entry.active) {
        result.push({
          id: entry.id,
          event: entry.event,
          moduleId: entry.moduleId,
          handler: entry.handler,
          purpose: entry.purpose,
          longLived: entry.longLived,
          active: entry.active,
          registeredAt: entry.registeredAt,
          unregisteredAt: entry.unregisteredAt
        });
      }
    }
  }

  return result;
}

/**
 * Get listeners for a specific event
 * @param event - Event name
 * @param options - Filter options
 * @returns Array of listener entries
 */
export function getListenersByEvent(event: string, options?: ListenerQueryOptions): ListenerByEventEntry[] {
  if (!event) return [];

  const opts: ListenerQueryOptions = options || {};
  const activeOnly: boolean = opts.activeOnly !== false;
  const listeners: Set<ListenerEntry> | undefined = _registry.get(event);

  if (!listeners) return [];

  const result: ListenerByEventEntry[] = [];
  for (const entry of listeners) {
    if (!activeOnly || entry.active) {
      result.push({
        id: entry.id,
        moduleId: entry.moduleId,
        handler: entry.handler,
        purpose: entry.purpose,
        longLived: entry.longLived,
        active: entry.active,
        registeredAt: entry.registeredAt
      });
    }
  }

  return result;
}

/**
 * Get listeners registered by a specific module
 * @param moduleId - Module ID
 * @param options - Filter options
 * @returns Array of listener entries
 */
export function getListenersByModule(moduleId: string, options?: ListenerQueryOptions): ListenerByModuleEntry[] {
  if (!moduleId) return [];

  const opts: ListenerQueryOptions = options || {};
  const activeOnly: boolean = opts.activeOnly !== false;
  const listeners: Set<ListenerEntry> | undefined = _byModule.get(moduleId);

  if (!listeners) return [];

  const result: ListenerByModuleEntry[] = [];
  for (const entry of listeners) {
    if (!activeOnly || entry.active) {
      result.push({
        id: entry.id,
        event: entry.event,
        handler: entry.handler,
        purpose: entry.purpose,
        longLived: entry.longLived,
        active: entry.active,
        registeredAt: entry.registeredAt
      });
    }
  }

  return result;
}

/**
 * Get statistics about registered listeners
 * @returns Statistics object
 */
export function getListenerStats(): ListenerStats {
  const eventCounts: Record<string, number> = {};
  const moduleCounts: Record<string, number> = {};
  let longLivedCount: number = 0;

  for (const [event, listeners] of _registry.entries()) {
    let count: number = 0;
    for (const entry of listeners) {
      if (entry.active) {
        count++;
        if (entry.longLived) longLivedCount++;
      }
    }
    if (count > 0) {
      eventCounts[event] = count;
    }
  }

  for (const [moduleId, listeners] of _byModule.entries()) {
    let count: number = 0;
    for (const entry of listeners) {
      if (entry.active) count++;
    }
    if (count > 0) {
      moduleCounts[moduleId] = count;
    }
  }

  return {
    activeListeners: _metrics.activeListeners,
    totalRegistrations: _metrics.totalRegistrations,
    totalUnregistrations: _metrics.totalUnregistrations,
    peakListeners: _metrics.peakListeners,
    longLivedListeners: longLivedCount,
    eventCount: Object.keys(eventCounts).length,
    moduleCount: Object.keys(moduleCounts).length,
    byEvent: eventCounts,
    byModule: moduleCounts
  };
}

// ═══════════════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════════════

/**
 * Audit listeners for potential issues
 * @returns Audit report
 */
export function auditListeners(): AuditResult {
  const issues: AuditWarning[] = [];
  const warnings: AuditWarning[] = [];

  // Check for orphaned listeners (active but module might be gone)
  const stats: ListenerStats = getListenerStats();

  // Check for too many listeners on same event
  for (const [event, count] of Object.entries(stats.byEvent)) {
    if (count > 10) {
      warnings.push({
        type: 'high-listener-count',
        event,
        count,
        message: `Event "${event}" has ${count} listeners - consider consolidation`
      });
    }
  }

  // Check for non-long-lived listeners that have been active too long
  const now: number = Date.now();
  const LONG_THRESHOLD_MS: number = 5 * 60 * 1000; // 5 minutes

  for (const entry of getListeners({ activeOnly: true })) {
    if (!entry.longLived && (now - entry.registeredAt) > LONG_THRESHOLD_MS) {
      warnings.push({
        type: 'potentially-leaked-listener',
        id: entry.id,
        event: entry.event,
        moduleId: entry.moduleId,
        age: Math.round((now - entry.registeredAt) / 1000),
        message: `Listener for "${entry.event}" from "${entry.moduleId}" has been active for ${Math.round((now - entry.registeredAt) / 1000)}s but is not marked longLived`
      });
    }
  }

  // Check for modules with many listeners
  for (const [moduleId, count] of Object.entries(stats.byModule)) {
    if (count > 20) {
      warnings.push({
        type: 'module-high-listener-count',
        moduleId,
        count,
        message: `Module "${moduleId}" has ${count} active listeners`
      });
    }
  }

  return {
    timestamp: Date.now(),
    stats,
    issues,
    warnings,
    healthy: issues.length === 0 && warnings.length < 5
  };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function info(): InfoResult {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p1Enterprise: true,
    portsInitialized: _portsInitialized,
    stats: getListenerStats(),
    timestamp: Date.now()
  };
}

export function healthCheck(): HealthCheckResult {
  const audit: AuditResult = auditListeners();

  const checks: Record<string, boolean> = {
    portsInitialized: _portsInitialized,
    noIssues: audit.issues.length === 0,
    fewWarnings: audit.warnings.length < 5,
    reasonableListenerCount: _metrics.activeListeners < 200
  };

  const passed: number = Object.values(checks).filter(Boolean).length;
  const total: number = Object.keys(checks).length;

  let status: 'HEALTHY' | 'DEGRADED' | 'NOT_INITIALIZED' = 'HEALTHY';
  if (audit.issues.length > 0) status = 'DEGRADED';
  if (_metrics.activeListeners > 500) status = 'DEGRADED';
  if (!_portsInitialized) status = 'NOT_INITIALIZED';

  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p1Enterprise: true,
    portsInitialized: _portsInitialized,
    checks,
    metrics: _metrics,
    auditWarnings: audit.warnings.length,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  registerListener,
  unregisterListener,
  getListeners,
  getListenersByEvent,
  getListenersByModule,
  getListenerStats,
  auditListeners,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
