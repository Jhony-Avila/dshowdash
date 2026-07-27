// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.audit-trail.config
// PURPOSE: Configuration, constants, and utilities for audit trail system
// ───────────────────────────────────────────────────────────────
// @contract ACTION_TYPES - Frozen object with audit action type constants
// @contract RESOURCE_TYPES - Frozen object with resource type constants
// @contract CREATE_DEFAULT_CONFIG - createDefaultConfig() returns default config
// @contract CREATE_METRICS - createMetrics() returns metrics object
// @contract LOGGER - logger object with info/warn/error methods
// @contract GET_CONFIG - getConfig() returns current configuration
// @contract SET_CONFIG - setConfig(newConfig) merges new configuration
// @contract RESET - reset() resets configuration to defaults
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: ACTION_TYPES, RESOURCE_TYPES, createDefaultConfig, createMetrics,
//           logger, DEFAULT_CONFIG, getConfig, setConfig, reset, healthCheck,
//           info, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header,
//            added ACTION_TYPES, RESOURCE_TYPES, createDefaultConfig, createMetrics, logger
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.audit-trail.config';

export const ACTION_TYPES = Object.freeze({
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PERMISSION_CHANGE: 'permission.change',
  FEATURE_FLAG_CHANGE: 'feature_flag.change',
  PANEL_ACTION: 'panel.action',
  JOB_ACTION: 'job.action',
  EXPORT: 'export',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
});

export const RESOURCE_TYPES = Object.freeze({
  USER: 'user',
  PANEL: 'panel',
  JOB: 'job',
  SETTING: 'setting',
  FEATURE_FLAG: 'feature_flag',
  PERMISSION: 'permission',
  REPORT: 'report',
  EXPORT: 'export'
});

export const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  maxEntries: 1000,
  batchSize: 50,
  flushInterval: 30000,
  endpoint: '/api/audit',
  retryAttempts: 3,
  retryDelay: 1000
});

export interface AuditConfig {
  enabled: boolean;
  maxEntries: number;
  batchSize: number;
  flushInterval: number;
  endpoint: string;
  retryAttempts: number;
  retryDelay: number;
  [key: string]: unknown;
}

export interface AuditMetrics {
  logged: number;
  flushed: number;
  errors: number;
  flushCount: number;
  lastActivity: number | null;
  lastFlush: number | null;
  lastError: number | null;
}

let _config: AuditConfig = { ...DEFAULT_CONFIG };

export function createDefaultConfig(): AuditConfig {
  return { ...DEFAULT_CONFIG };
}

export function createMetrics(): AuditMetrics {
  return {
    logged: 0,
    flushed: 0,
    errors: 0,
    flushCount: 0,
    lastActivity: null,
    lastFlush: null,
    lastError: null
  };
}

export const logger = {
  info: (...args: unknown[]): void => {
    if (typeof console !== 'undefined' && console.info) {
      console.info('[audit-trail]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[audit-trail]', ...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[audit-trail]', ...args);
    }
  }
};

export function getConfig(): AuditConfig {
  return { ..._config };
}

export function setConfig(newConfig: Partial<AuditConfig>): void {
  _config = { ..._config, ...newConfig };
}

export function reset(): void {
  _config = { ...DEFAULT_CONFIG };
}

export function healthCheck() {
  const checks = {
    hasConfig: !!_config,
    hasEndpoint: !!_config.endpoint,
    validFlushInterval: _config.flushInterval > 0,
    validBatchSize: _config.batchSize > 0
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    actionTypes: Object.keys(ACTION_TYPES),
    resourceTypes: Object.keys(RESOURCE_TYPES),
    timestamp: Date.now()
  };
}

export default {
  ACTION_TYPES,
  RESOURCE_TYPES,
  DEFAULT_CONFIG,
  createDefaultConfig,
  createMetrics,
  logger,
  getConfig,
  setConfig,
  reset,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
