// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.base-kernel
// PURPOSE: Shared Kernel Foundation - Classes base e utilitarios
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_FOUNDATION - Base para MainKernel e SidebarKernel
// @contract EXPORTS_CONSTANTS - Exporta KERNEL_STATUS, FEATURE_STATUS, etc.
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KERNEL_STATUS — enum de status do kernel
//   FEATURE_STATUS — enum de status de features
//   HEALTH_STATUS — enum de status de health
//   PRIORITY — enum de prioridades
//   KERNEL_EVENTS — eventos do kernel
//   createEnvelope(moduleId, version) — factory de envelopes
//   createHealthResult(checks, moduleId, version, extras) — factory de health results
//   validateDependencies(featureId, features, getDependencies) — validacao de deps
//   getDependents(featureId, features, getDependencies) — lookup reverso
//   sortByPriority(features) — ordenacao por prioridade
//   aggregateMetrics(features) — agregacao de metricas
//   createDiagnosticsExport(kernel, features, extras) — exportacao de diagnostico
//   healthCheck() — status de saude do modulo
//   info() — informacoes do modulo
//
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT, added healthCheck/info
// @changelog v1.0.0-ENTERPRISE: Initial implementation
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.base-kernel';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface EnvelopeMeta {
  readonly moduleId: string;
  readonly version: string;
  readonly timestamp: number;
}

export interface Envelope<T = unknown> {
  readonly ok: boolean;
  readonly data: T | null;
  readonly meta: EnvelopeMeta;
  readonly errors: ReadonlyArray<unknown>;
}

export interface HealthScore {
  readonly passed: number;
  readonly total: number;
  readonly percentage: number;
}

export interface HealthResult {
  status: string;
  score: HealthScore;
  moduleId: string;
  version: string;
  checks: Record<string, boolean>;
  timestamp: number;
  [key: string]: unknown;
}

export interface DependencyValidation {
  readonly valid: boolean;
  readonly missing: string[];
  readonly disabled: string[];
}

export interface FeatureEntry {
  readonly id: string;
  readonly feature: FeatureRecord;
}

export interface FeatureRecord {
  status: string;
  priority?: number;
  errorCount?: number;
  lastError?: string | null;
  initDurationMs?: number | null;
  [key: string]: unknown;
}

export interface FeatureMap {
  [featureId: string]: FeatureRecord;
}

export interface AggregatedMetrics {
  total: number;
  enabled: number;
  disabled: number;
  error: number;
  byPriority: Record<number, number>;
  byStatus: Record<string, number>;
}

export interface KernelInfo {
  readonly moduleId: string;
  readonly version: string;
  readonly status: string;
  readonly uptime?: number;
  readonly startTime?: number;
}

export interface DiagnosticsExport {
  exportedAt: string;
  kernel: {
    moduleId: string;
    version: string;
    status: string;
    uptime: number;
  };
  features: Record<string, {
    status: string;
    priority: number | undefined;
    enabled: boolean;
    errorCount: number;
    lastError: string | null;
    initDurationMs: number | null;
  }>;
  metrics: AggregatedMetrics;
  [key: string]: unknown;
}

export interface HealthCheckEntry {
  readonly ok: boolean;
  readonly severity: string;
}

export interface ModuleHealthResult {
  readonly status: string;
  readonly moduleId: string;
  readonly version: string;
  readonly score: string;
  readonly checks: Record<string, HealthCheckEntry>;
  readonly timestamp: number;
}

export interface ModuleInfo {
  readonly moduleId: string;
  readonly version: string;
  readonly constants: {
    readonly kernelStatusCount: number;
    readonly featureStatusCount: number;
    readonly healthStatusCount: number;
    readonly priorityLevels: number;
    readonly eventsCount: number;
  };
  readonly timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const KERNEL_STATUS = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  SHUTDOWN: 'shutdown'
} as const;

export type KernelStatusValue = typeof KERNEL_STATUS[keyof typeof KERNEL_STATUS];

export const FEATURE_STATUS = {
  REGISTERED: 'registered',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ERROR: 'error'
} as const;

export type FeatureStatusValue = typeof FEATURE_STATUS[keyof typeof FEATURE_STATUS];

export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  NOT_INITIALIZED: 'NOT_INITIALIZED'
} as const;

export type HealthStatusValue = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

export const PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
} as const;

export type PriorityValue = typeof PRIORITY[keyof typeof PRIORITY];

// ═══════════════════════════════════════════════════════════════
// KERNEL EVENTS
// ═══════════════════════════════════════════════════════════════

export const KERNEL_EVENTS = {
  READY: 'kernel:ready',
  SHUTDOWN: 'kernel:shutdown',
  FEATURE_REGISTERED: 'kernel:feature:registered',
  FEATURE_ENABLED: 'kernel:feature:enabled',
  FEATURE_DISABLED: 'kernel:feature:disabled',
  FEATURE_ERROR: 'kernel:feature:error',
  HEALTH_DEGRADED: 'kernel:health:degraded',
  HEALTH_RECOVERED: 'kernel:health:recovered'
} as const;

export type KernelEventValue = typeof KERNEL_EVENTS[keyof typeof KERNEL_EVENTS];

// ═══════════════════════════════════════════════════════════════
// ENVELOPE HELPER
// ═══════════════════════════════════════════════════════════════

export function createEnvelope(moduleId: string, version: string): (ok: boolean, data?: unknown, errors?: unknown[]) => Envelope {
  return (ok: boolean, data?: unknown, errors?: unknown[]): Envelope => ({
    ok,
    data: data || null,

    meta: {
      moduleId,
      version,
      timestamp: Date.now()
    },

    errors: errors || []
  });
}

// ═══════════════════════════════════════════════════════════════
// HEALTH RESULT HELPER
// ═══════════════════════════════════════════════════════════════

export function createHealthResult(checks: Record<string, boolean>, moduleId: string, version: string, extras?: Record<string, unknown>): HealthResult {
  let passed = 0;
  let total = 0;

  for (const key in checks) {
    if (checks.hasOwnProperty(key)) {
      total++;
      if (checks[key]) passed++;
    }
  }

  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  let status: string = HEALTH_STATUS.HEALTHY;

  if (passed === 0) {
    status = HEALTH_STATUS.NOT_INITIALIZED;
  } else if (percentage < 50) {
    status = HEALTH_STATUS.UNHEALTHY;
  } else if (percentage < 100) {
    status = HEALTH_STATUS.DEGRADED;
  }

  const result: HealthResult = {
    status,
    score: { passed, total, percentage },
    moduleId,
    version,
    checks,
    timestamp: Date.now()
  };

  if (extras) {
    for (const k in extras) {
      if (extras.hasOwnProperty(k)) {
        result[k] = extras[k];
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY VALIDATION
// ═══════════════════════════════════════════════════════════════

export function validateDependencies(featureId: string, features: FeatureMap, getDependencies: (id: string) => string[]): DependencyValidation {
  const visited: Record<string, boolean> = {};
  const stack: string[] = [featureId];
  const missing: string[] = [];
  const disabled: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited[current]) continue;
    visited[current] = true;

    const deps = getDependencies(current) || [];
    for (let i = 0; i < deps.length; i++) {
      const depId = deps[i];
      const depFeature = features[depId];

      if (!depFeature) {
        missing.push(depId);
      } else if (depFeature.status !== FEATURE_STATUS.ENABLED) {
        disabled.push(depId);
      }

      if (!visited[depId]) {
        stack.push(depId);
      }
    }
  }

  return {
    valid: missing.length === 0 && disabled.length === 0,
    missing,
    disabled
  };
}

// ═══════════════════════════════════════════════════════════════
// GET DEPENDENTS (reverse dependency lookup)
// ═══════════════════════════════════════════════════════════════

export function getDependents(featureId: string, features: FeatureMap, getDependencies: (id: string) => string[]): string[] {
  const dependents: string[] = [];

  for (const id in features) {
    if (!features.hasOwnProperty(id) || id === featureId) continue;

    const deps = getDependencies(id) || [];
    if (deps.indexOf(featureId) >= 0) {
      dependents.push(id);
    }
  }

  return dependents;
}

// ═══════════════════════════════════════════════════════════════
// FEATURE SORTING BY PRIORITY
// ═══════════════════════════════════════════════════════════════

export function sortByPriority(features: FeatureMap): FeatureEntry[] {
  const arr: FeatureEntry[] = [];
  for (const id in features) {
    if (features.hasOwnProperty(id)) {
      arr.push({ id, feature: features[id] });
    }
  }

  arr.sort((a, b) => {
    const pa = a.feature.priority !== undefined ? a.feature.priority : PRIORITY.NORMAL;
    const pb = b.feature.priority !== undefined ? b.feature.priority : PRIORITY.NORMAL;
    return pa - pb;
  });

  return arr;
}

// ═══════════════════════════════════════════════════════════════
// METRICS AGGREGATION
// ═══════════════════════════════════════════════════════════════

export function aggregateMetrics(features: FeatureMap): AggregatedMetrics {
  const metrics: AggregatedMetrics = {
    total: 0,
    enabled: 0,
    disabled: 0,
    error: 0,
    byPriority: { 0: 0, 1: 0, 2: 0, 3: 0 },
    byStatus: {}
  };

  for (const id in features) {
    if (!features.hasOwnProperty(id)) continue;
    const f = features[id];

    metrics.total++;

    if (f.status === FEATURE_STATUS.ENABLED) metrics.enabled++;
    else if (f.status === FEATURE_STATUS.DISABLED) metrics.disabled++;
    else if (f.status === FEATURE_STATUS.ERROR) metrics.error++;

    const p = f.priority !== undefined ? f.priority : PRIORITY.NORMAL;
    metrics.byPriority[p] = (metrics.byPriority[p] || 0) + 1;

    metrics.byStatus[f.status] = (metrics.byStatus[f.status] || 0) + 1;
  }

  return metrics;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function createDiagnosticsExport(kernel: KernelInfo, features: FeatureMap, extras?: Record<string, unknown>): DiagnosticsExport {
  const diag: DiagnosticsExport = {
    exportedAt: new Date().toISOString(),
    kernel: {
      moduleId: kernel.moduleId,
      version: kernel.version,
      status: kernel.status,
      uptime: kernel.startTime ? Date.now() - kernel.startTime : 0
    },
    features: {},
    metrics: aggregateMetrics(features)
  };

  for (const id in features) {
    if (features.hasOwnProperty(id)) {
      const f = features[id];
      diag.features[id] = {
        status: f.status,
        priority: f.priority,
        enabled: f.status === FEATURE_STATUS.ENABLED,
        errorCount: f.errorCount || 0,
        lastError: f.lastError || null,
        initDurationMs: f.initDurationMs || null
      };
    }
  }

  if (extras) {
    for (const k in extras) {
      if (extras.hasOwnProperty(k)) {
        diag[k] = extras[k];
      }
    }
  }

  return diag;
}

// ═══════════════════════════════════════════════════════════════
// HEALTH & INFO
// ═══════════════════════════════════════════════════════════════

export function healthCheck(): ModuleHealthResult {
  const checks: Record<string, HealthCheckEntry> = {
    constantsDefined: { ok: !!KERNEL_STATUS && !!FEATURE_STATUS && !!HEALTH_STATUS, severity: 'crit' },
    helpersDefined: { ok: typeof createEnvelope === 'function' && typeof createHealthResult === 'function', severity: 'crit' },
    validationDefined: { ok: typeof validateDependencies === 'function', severity: 'warn' }
  };

  const passed = Object.values(checks).filter(c => c.ok).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    score: `${passed}/${total}`,
    checks,
    timestamp: Date.now()
  };
}

export function info(): ModuleInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    constants: {
      kernelStatusCount: Object.keys(KERNEL_STATUS).length,
      featureStatusCount: Object.keys(FEATURE_STATUS).length,
      healthStatusCount: Object.keys(HEALTH_STATUS).length,
      priorityLevels: Object.keys(PRIORITY).length,
      eventsCount: Object.keys(KERNEL_EVENTS).length
    },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  KERNEL_STATUS,
  FEATURE_STATUS,
  HEALTH_STATUS,
  PRIORITY,
  KERNEL_EVENTS,
  createEnvelope,
  createHealthResult,
  validateDependencies,
  getDependents,
  sortByPriority,
  aggregateMetrics,
  createDiagnosticsExport,
  healthCheck,
  info
};
