// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.validate
// PURPOSE: Validation Helpers para eventos
// ───────────────────────────────────────────────────────────────
// PROVIDES: validateEventName, validatePayload, logValidationError
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.2.0-PORTSFACTORY: Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { validateEventName } from './namespaces.js';
import { LEGACY_ALIASES } from './catalog/system.events.js';

/** Interface for the Ports object returned by createCorePorts */
interface CorePorts {
  get(name: string): Record<string, unknown> | null;
  inject(p: Record<string, unknown>): void;
  snapshot(): Record<string, unknown>;
  isInitialized(): boolean;
  init(): void;
}

/** Interface for a logger port */
interface LoggerPort {
  warn?(msg: string, data?: unknown): void;
  debug?(msg: string, data?: unknown): void;
}

/** Options for validatePayload */
interface ValidatePayloadOptions {
  strict?: boolean;
  warn?: boolean;
}

/** Result of validatePayload */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Payload base interface */
interface EventPayload {
  timestamp?: number;
  source?: string;
  moduleId?: string;
  [key: string]: unknown;
}

/** Created payload interface */
interface CreatedPayload {
  timestamp: number;
  source: string;
  moduleId: string;
  [key: string]: unknown;
}

/** Health check result */
interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED';
  moduleId: string;
  version: string;
  checks: { portsInitialized: boolean };
  timestamp: number;
}

/** Module info result */
interface InfoResult {
  moduleId: string;
  version: string;
  portsInitialized: boolean;
}

/** Catalog module shape (dynamic import result) */
interface CatalogModule {
  [key: string]: Record<string, string> | string | unknown;
}

const MODULE_ID: string = 'events-validate';
const VERSION: string = '1.2.0-PORTSFACTORY';
const REQUIRED_FIELDS: readonly string[] = ['timestamp', 'source', 'moduleId'];
let _allEvents: Set<string> | null = null;

const _Ports: CorePorts = createCorePorts({ moduleId: MODULE_ID }) as CorePorts;
const _getPort = (name: string): Record<string, unknown> | null => _Ports.get(name);
const injectPorts = (p: Record<string, unknown>): void => _Ports.inject(p);
const getPortsSnapshot = (): Record<string, unknown> => _Ports.snapshot();

const _log = {
  warn: (msg: string, data?: unknown): void => {
    const logger: LoggerPort | null = _getPort('logger') as LoggerPort | null;
    if (logger && logger.warn) { logger.warn(`[${MODULE_ID}] ${msg}`, data); }
  }
};

const getAllEvents = (): Promise<Set<string>> => {
  if (_allEvents) return Promise.resolve(_allEvents);
  _allEvents = new Set<string>();
  return Promise.all([
    import('./catalog/auth.events.js'),
    import('./catalog/router.events.js'),
    import('./catalog/session.events.js'),
    import('./catalog/panels.events.js'),
    import('./catalog/permissions.events.js'),
    import('./catalog/security.events.js'),
    import('./catalog/ui.events.js'),
    import('./catalog/telemetry.events.js'),
    import('./catalog/orchestrator.events.js'),
    import('./catalog/system.events.js')
  ]).then((catalogs: CatalogModule[]) => {
    for (const catalog of catalogs) {
      for (const group of Object.values(catalog)) {
        if (typeof group === 'object' && group !== null) {
          for (const event of Object.values(group as Record<string, unknown>)) {
            if (typeof event === 'string') { _allEvents!.add(event); }
          }
        }
      }
    }
    return _allEvents!;
  }).catch((e: unknown) => {
    _log.warn('Failed to load event catalogs for validation', e);
    return _allEvents!;
  });
};

export const isValidEvent = (eventName: string): boolean => { const validation = validateEventName(eventName); return validation.valid; };

export const validatePayload = (payload: unknown, options: ValidatePayloadOptions = {}): ValidationResult => {
  const strict: boolean = options.strict || false;
  const warn: boolean = options.warn !== false;
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!payload || typeof payload !== 'object') { errors.push('Payload must be an object'); return { valid: false, errors, warnings }; }
  const p = payload as EventPayload;
  for (const field of REQUIRED_FIELDS) {
    if (p[field] === undefined || p[field] === null) {
      if (strict) { errors.push(`Missing required field: ${field}`); }
      else { warnings.push(`Missing recommended field: ${field}`); }
    }
  }
  if (p.timestamp !== undefined && typeof p.timestamp !== 'number') { errors.push('timestamp must be a number'); }
  if (p.source !== undefined && typeof p.source !== 'string') { errors.push('source must be a string'); }
  if (p.moduleId !== undefined && typeof p.moduleId !== 'string') { errors.push('moduleId must be a string'); }
  const valid: boolean = errors.length === 0;
  if (warn && warnings.length > 0) { _log.warn('Payload validation warnings', warnings); }
  return { valid, errors, warnings };
};

export const createPayload = (source: string, moduleId: string, data: Record<string, unknown> = {}): CreatedPayload => {
  const result: CreatedPayload = { timestamp: Date.now(), source, moduleId };
  for (const [key, value] of Object.entries(data)) { result[key] = value; }
  return result;
};

export const resolveLegacyEvent = (legacyEvent: string): string | null => (LEGACY_ALIASES as Record<string, string>)[legacyEvent] || null;

export const warnIfUnknownEvent = (eventName: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  return getAllEvents().then((allEvents: Set<string>) => {
    if (!allEvents.has(eventName)) {
      const resolved: string | null = resolveLegacyEvent(eventName);
      if (resolved) { _log.warn(`Legacy event "${eventName}" detected. Use "${resolved}" instead.`); }
      else { _log.warn(`Unknown event "${eventName}". Consider adding to catalog.`); }
    }
  });
};

export { MODULE_ID, VERSION, injectPorts, getPortsSnapshot };
export const info = (): InfoResult => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() });
export const healthCheck = (): HealthCheckResult => {
  const portsReady: boolean = _Ports.isInitialized();
  return { status: portsReady ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { portsInitialized: portsReady }, timestamp: Date.now() };
};
