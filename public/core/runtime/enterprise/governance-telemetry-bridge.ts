// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-GOVERNANCE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.enterprise.governance-telemetry-bridge
// PURPOSE: Bridge entre Governance Events e Telemetry System
// ───────────────────────────────────────────────────────────────
// @contract TELEMETRY_BRIDGE - Conecta eventos de governança à telemetria
// @contract STRICT_MODE_INTEGRATION - Integração com enterprise strict-mode
// @changelog v1.1.0-SEVERITY-COMPLETE: Adicionado subscription para governance.alert:unknown-severity
// @changelog v1.0.0-GOVERNANCE: Initial bridge implementation
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, healthCheck as strictModeHealthCheck, setEventBusGetter } from './strict-mode.js';
import { GOVERNANCE_EVENTS, GOVERNANCE_THRESHOLDS } from '/core/runtime/events/catalog/governance.events.js';

export const VERSION: string = '1.1.0-SEVERITY-COMPLETE';
export const MODULE_ID: string = 'governance-telemetry-bridge';

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface ViolationPayload {
  type?: string;
  severity?: string;
  moduleId?: string;
  strictMode?: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

interface HealthPayload {
  status: string;
  scorePercentage?: number;
  summary?: unknown;
  topOffenders?: unknown;
  recommendations?: unknown;
  [key: string]: unknown;
}

interface Logger {
  info: (message: string, data: Record<string, unknown>) => void;
  warn: (message: string, data: Record<string, unknown>) => void;
  error: (message: string, data: Record<string, unknown>) => void;
  debug: (message: string, data: Record<string, unknown>) => void;
  [level: string]: ((message: string, data: Record<string, unknown>) => void) | undefined;
}

interface Telemetry {
  track: (event: string, data: Record<string, unknown>) => void;
}

interface EventBus {
  on: (event: string, handler: (payload: Record<string, unknown>) => void) => (() => void) | void;
  emit: (event: string, payload: Record<string, unknown>) => void;
}

interface InitOptions {
  healthCheckInterval?: number;
}

interface InitResult {
  ok: boolean;
  alreadyInitialized?: boolean;
}

interface ComplianceReport {
  compliant: boolean;
  strictModeActive: boolean;
  status: string;
  scorePercentage: unknown;
  summary: unknown;
  topOffenders: unknown;
  recommendations: unknown;
  timestamp: string;
}

interface BridgeHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: string;
  checks: Record<string, boolean>;
  strictMode: boolean;
  lastHealthStatus: string | null;
  subscriptionsCount: number;
  moduleId: string;
  version: string;
  portsInitialized: boolean;
  timestamp: number;
}

interface BridgeInfo {
  moduleId: string;
  version: string;
  initialized: boolean;
  strictMode: boolean;
  subscriptionsCount: number;
  lastHealthStatus: string | null;
  healthMonitorActive: boolean;
  portsInitialized: boolean;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): boolean { return _Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _initialized: boolean = false;
let _subscriptions: Array<(() => void) | void> = [];
let _lastHealthStatus: string | null = null;
let _healthCheckInterval: ReturnType<typeof setInterval> | null = null;

// ═══════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════

const _log = (level: string, message: string, data?: Record<string, unknown>): void => {
  const prefix: string = `[${MODULE_ID}]`;
  const logger = _getPort('logger') as Logger | null;
  if (logger && logger[level]) {
    (logger[level] as (message: string, data: Record<string, unknown>) => void)(`${prefix} ${message}`, data || {});
  }
};

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Handler para violações - envia para telemetria
 */
function _handleViolation(payload: ViolationPayload): void {
  const telemetry = _getPort('telemetry') as Telemetry | null;
  if (!telemetry || !telemetry.track) return;

  telemetry.track('governance:violation', {
    type: payload.type,
    severity: payload.severity,
    moduleId: payload.moduleId,
    strictMode: payload.strictMode,
    timestamp: payload.timestamp
  } as Record<string, unknown>);

  // Para violações críticas, também emite métrica
  if (payload.severity === 'CRITICAL') {
    telemetry.track('governance:violation:critical', {
      type: payload.type,
      moduleId: payload.moduleId
    } as Record<string, unknown>);
  }
}

/**
 * Handler para alertas - envia para telemetria e log
 */
function _handleAlert(eventName: string, payload: Record<string, unknown>): void {
  const telemetry = _getPort('telemetry') as Telemetry | null;

  _log('warn', `Governance Alert: ${eventName}`, payload);

  if (telemetry && telemetry.track) {
    telemetry.track('governance:alert', {
      alertType: eventName,
      ...payload
    });
  }
}

/**
 * Handler para mudanças de health
 */
function _handleHealthChange(health: HealthPayload): void {
  const telemetry = _getPort('telemetry') as Telemetry | null;
  const eventBus = _getPort('eventBus') as EventBus | null;

  // Detecta mudança de status
  if (_lastHealthStatus && _lastHealthStatus !== health.status) {
    _log('info', `Governance health changed: ${_lastHealthStatus} -> ${health.status}`);

    if (telemetry && telemetry.track) {
      telemetry.track('governance:health:changed', {
        from: _lastHealthStatus,
        to: health.status,
        scorePercentage: health.scorePercentage
      } as Record<string, unknown>);
    }

    // Emite evento de degradação se aplicável
    if (health.status === 'DEGRADED' || health.status === 'UNHEALTHY' || health.status === 'CRITICAL') {
      if (eventBus && eventBus.emit) {
        eventBus.emit(GOVERNANCE_EVENTS.HEALTH_DEGRADED, {
          previousStatus: _lastHealthStatus,
          currentStatus: health.status,
          scorePercentage: health.scorePercentage,
          timestamp: Date.now()
        } as Record<string, unknown>);
      }
    }

    // Emite evento de restauração se voltou a HEALTHY
    if (_lastHealthStatus !== 'HEALTHY' && health.status === 'HEALTHY') {
      if (eventBus && eventBus.emit) {
        eventBus.emit(GOVERNANCE_EVENTS.HEALTH_RESTORED, {
          previousStatus: _lastHealthStatus,
          currentStatus: health.status,
          scorePercentage: health.scorePercentage,
          timestamp: Date.now()
        } as Record<string, unknown>);
      }
    }
  }

  _lastHealthStatus = health.status;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa o bridge
 */
export function init(options: InitOptions = {}): InitResult {
  if (_initialized) {
    return { ok: true, alreadyInitialized: true };
  }

  const eventBus = _getPort('eventBus') as EventBus | null;

  // Configura o getter do EventBus no strict-mode
  setEventBusGetter(() => _getPort('eventBus'));

  // Subscribe para eventos de violação
  if (eventBus && eventBus.on) {
    // Violações por severidade
    _subscriptions.push(
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_CRITICAL, (p: Record<string, unknown>) => _handleViolation({ ...p, severity: 'CRITICAL' })),
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_HIGH, (p: Record<string, unknown>) => _handleViolation({ ...p, severity: 'HIGH' })),
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_MEDIUM, (p: Record<string, unknown>) => _handleViolation({ ...p, severity: 'MEDIUM' })),
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_LOW, (p: Record<string, unknown>) => _handleViolation({ ...p, severity: 'LOW' })),
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_INFO, (p: Record<string, unknown>) => _handleViolation({ ...p, severity: 'INFO' })),
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_RECORDED, _handleViolation as (payload: Record<string, unknown>) => void)
    );

    // Alertas
    _subscriptions.push(
      eventBus.on(GOVERNANCE_EVENTS.VIOLATION_SPIKE, (p: Record<string, unknown>) => _handleAlert('violation-spike', p)),
      eventBus.on(GOVERNANCE_EVENTS.CRITICAL_THRESHOLD_EXCEEDED, (p: Record<string, unknown>) => _handleAlert('critical-threshold', p)),
      eventBus.on(GOVERNANCE_EVENTS.MODULE_NON_COMPLIANT, (p: Record<string, unknown>) => _handleAlert('module-non-compliant', p)),
      eventBus.on(GOVERNANCE_EVENTS.COMPLIANCE_DEGRADED, (p: Record<string, unknown>) => _handleAlert('compliance-degraded', p)),
      eventBus.on(GOVERNANCE_EVENTS.UNKNOWN_SEVERITY, (p: Record<string, unknown>) => _handleAlert('unknown-severity', p))
    );
  }

  // Health check periódico
  const healthCheckIntervalMs: number = options.healthCheckInterval || 60000; // 1 minuto
  if (healthCheckIntervalMs > 0) {
    _healthCheckInterval = setInterval(() => {
      try {
        const health = strictModeHealthCheck() as HealthPayload;
        _handleHealthChange(health);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        _log('error', 'Health check failed', { error: errorMessage });
      }
    }, healthCheckIntervalMs);
  }

  _initialized = true;
  _log('info', 'Governance Telemetry Bridge initialized', {
    strictMode: isStrict(),
    healthCheckInterval: healthCheckIntervalMs
  } as Record<string, unknown>);

  return { ok: true };
}

/**
 * Desliga o bridge
 */
export function shutdown(): void {
  // Limpa subscriptions
  _subscriptions.forEach((unsub: (() => void) | void) => {
    if (typeof unsub === 'function') unsub();
  });
  _subscriptions = [];

  // Limpa interval
  if (_healthCheckInterval) {
    clearInterval(_healthCheckInterval);
    _healthCheckInterval = null;
  }

  _initialized = false;
  _lastHealthStatus = null;
  _log('info', 'Governance Telemetry Bridge shutdown');
}

// ═══════════════════════════════════════════════════════════════
// MANUAL OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Força emissão de relatório de compliance
 */
export function emitComplianceReport(): ComplianceReport | null {
  const eventBus = _getPort('eventBus') as EventBus | null;
  const telemetry = _getPort('telemetry') as Telemetry | null;

  try {
    const health = strictModeHealthCheck() as HealthPayload;
    const report: ComplianceReport = {
      compliant: health.status === 'HEALTHY',
      strictModeActive: isStrict(),
      status: health.status,
      scorePercentage: health.scorePercentage,
      summary: health.summary,
      topOffenders: health.topOffenders,
      recommendations: health.recommendations,
      timestamp: new Date().toISOString()
    };

    if (eventBus && eventBus.emit) {
      eventBus.emit(GOVERNANCE_EVENTS.COMPLIANCE_REPORT, report as unknown as Record<string, unknown>);
    }

    if (telemetry && telemetry.track) {
      telemetry.track('governance:compliance:report', report as unknown as Record<string, unknown>);
    }

    _log('info', 'Compliance report emitted', { status: health.status });
    return report;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    _log('error', 'Failed to emit compliance report', { error: errorMessage });
    return null;
  }
}

/**
 * Força emissão de sumário de violações
 */
export function emitViolationSummary(): void {
  const eventBus = _getPort('eventBus') as EventBus | null;
  const telemetry = _getPort('telemetry') as Telemetry | null;

  try {
    // Import dinâmico para evitar dependência circular
    import('./strict-mode.js').then((strictMode: Record<string, unknown>) => {
      const summary = (strictMode.getViolationsSummary as () => Record<string, unknown>)();

      if (eventBus && eventBus.emit) {
        eventBus.emit(GOVERNANCE_EVENTS.VIOLATION_SUMMARY, summary);
      }

      if (telemetry && telemetry.track) {
        telemetry.track('governance:violation:summary', summary);
      }

      _log('info', 'Violation summary emitted', { total: (summary as Record<string, unknown>).total });
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    _log('error', 'Failed to emit violation summary', { error: errorMessage });
  }
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK / INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck(): BridgeHealthCheck {
  const checks: Record<string, boolean> = {
    initialized: _initialized,
    eventBusConnected: !!_getPort('eventBus'),
    telemetryAvailable: !!_getPort('telemetry'),
    subscriptionsActive: _subscriptions.length > 0,
    healthMonitorActive: !!_healthCheckInterval,
    portsInitialized: _Ports.isInitialized()
  };

  const passed: number = Object.values(checks).filter(Boolean).length;
  const total: number = Object.keys(checks).length;

  return {
    status: _initialized ? (passed === total ? 'HEALTHY' : 'DEGRADED') : 'UNHEALTHY',
    score: `${passed}/${total}`,
    checks,
    strictMode: isStrict(),
    lastHealthStatus: _lastHealthStatus,
    subscriptionsCount: _subscriptions.length,
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export function info(): BridgeInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    strictMode: isStrict(),
    subscriptionsCount: _subscriptions.length,
    lastHealthStatus: _lastHealthStatus,
    healthMonitorActive: !!_healthCheckInterval,
    portsInitialized: _Ports.isInitialized(),
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEVTOOLS
// ═══════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  const _win = window as unknown as Record<string, unknown>;
  _win.__dev = _win.__dev || {};
  const __dev = _win.__dev as Record<string, unknown>;
  __dev.governanceBridge = {
    getVersion: (): string => VERSION,
    info,
    healthCheck,
    emitComplianceReport,
    emitViolationSummary,
    getSubscriptionsCount: (): number => _subscriptions.length,
    isInitialized: (): boolean => _initialized
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  init,
  shutdown,
  emitComplianceReport,
  emitViolationSummary,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
