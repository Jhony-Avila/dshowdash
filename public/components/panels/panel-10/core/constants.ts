// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-10
// PURPOSE: Panel-10 Constants Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PAINEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   PANEL_TITLE — exported value
//   REFRESH_INTERVAL_BASE — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   REFRESH_INTERVAL_SLOW — exported value
//   REFRESH_INTERVAL_FAST — exported value
//   REFRESH_INTERVAL_SECONDS — exported value
//   REQUEST_TIMEOUT — exported value
//   MOUNT_TIMEOUT — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   MAX_CONSECUTIVE_ERRORS — exported value
//   CSS_PATH — exported value
//   ... and 7 more exports
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

export const PAINEL_ID = 'panel-10';
export const MODULE_ID = 'panel-10.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_TITLE = 'Financeiro';

export const REFRESH_INTERVAL_BASE = 60000;
export const REFRESH_INTERVAL_DEGRADED = 180000;
export const REFRESH_INTERVAL_SLOW = 120000;
export const REFRESH_INTERVAL_FAST = 30000;
export const REFRESH_INTERVAL_SECONDS = 60;

export const REQUEST_TIMEOUT = 10000;
export const MOUNT_TIMEOUT = 5000;

export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;
export const MAX_CONSECUTIVE_ERRORS = 3;

export const CSS_PATH = '/components/panels/panel-10/styles/index.css';
export const API_PATH = '/api/modules/panels/panel-10/api.php';

export const THRESHOLDS = Object.freeze({
  CPU_WARNING: 70,
  CPU_CRITICAL: 90,
  RAM_WARNING: 75,
  RAM_CRITICAL: 90,
  DISK_WARNING: 80,
  DISK_CRITICAL: 95
});

export const STATES = Object.freeze({
  IDLE: 'IDLE',
  MOUNTING: 'MOUNTING',
  MOUNTED: 'MOUNTED',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
  DEGRADED: 'DEGRADED',
  UNMOUNTING: 'UNMOUNTING',
  DESTROYED: 'DESTROYED'
});

export const SERVER_STATUS = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded',
  UNKNOWN: 'unknown'
});

export const DEFAULT_PERFORMANCE_METRICS = Object.freeze({
  mountTime: 0,
  loadTime: 0,
  renderTime: 0,
  lastRefresh: null,
  totalRequests: 0,
  failedRequests: 0,
  avgLoadTime: 0,
  successRate: 100
});

export default {
  PAINEL_ID, MODULE_ID, VERSION, PANEL_TITLE,
  REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED, REFRESH_INTERVAL_SLOW, REFRESH_INTERVAL_FAST, REFRESH_INTERVAL_SECONDS,
  REQUEST_TIMEOUT, MOUNT_TIMEOUT,
  CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, MAX_CONSECUTIVE_ERRORS,
  CSS_PATH, API_PATH,
  THRESHOLDS, STATES, SERVER_STATUS, DEFAULT_PERFORMANCE_METRICS
};

export function info() { return { moduleId: 'panels-panel-10-core-constants', version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-10-core-constants', version: VERSION, checks: { constantsLoaded: true } }; }
