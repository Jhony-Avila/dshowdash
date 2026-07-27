// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08
// PURPOSE: Panel-08 Contracts Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_NAME — exported value
//   STATES — exported value
//   LOCAL_EVENTS — exported value
//   ALERT_TYPES — exported value
//   SEVERITIES — exported value
//   CONFIG — exported value
//   CSS_PREFIX — exported value
//   isValidAlert() — exported function
//   isValidAlertType() — exported function
//   isValidSeverity() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-08.core.contracts';
export const PANEL_NAME = 'Alertas do Sistema';

export const STATES = Object.freeze({ IDLE: 'IDLE', MOUNTING: 'MOUNTING', MOUNTED: 'MOUNTED', LOADING: 'LOADING', READY: 'READY', ERROR: 'ERROR', DEGRADED: 'DEGRADED', UNMOUNTING: 'UNMOUNTING', DESTROYED: 'DESTROYED' });

export const LOCAL_EVENTS = Object.freeze({ MOUNT_START: 'panel-08:mount:start', MOUNT_SUCCESS: 'panel-08:mount:success', MOUNT_ERROR: 'panel-08:mount:error', UNMOUNT: 'panel-08:unmount', REFRESH_START: 'panel-08:refresh:start', REFRESH_SUCCESS: 'panel-08:refresh:success', REFRESH_ERROR: 'panel-08:refresh:error', DATA_UPDATED: 'panel-08:data:updated', ALERT_ACKNOWLEDGED: 'panel-08:alert:acknowledged' });

export const ALERT_TYPES = Object.freeze({ ERROR: 'ERROR', WARNING: 'WARNING', INFO: 'INFO', SUCCESS: 'SUCCESS' });

export const SEVERITIES = Object.freeze({ CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' });

export const CONFIG = Object.freeze({ REFRESH_INTERVAL: 60000, REFRESH_INTERVAL_DEGRADED: 180000, REQUEST_TIMEOUT: 10000, MAX_CONSECUTIVE_ERRORS: 3, CIRCUIT_BREAKER_THRESHOLD: 5, CIRCUIT_BREAKER_TIMEOUT: 30000, MAX_ALERTS_DISPLAY: 15, AUTO_REFRESH_DEFAULT: true });

export const CSS_PREFIX = 'p08';

export const isValidAlert = (alert: unknown) => alert && typeof alert === 'object' && (alert as Record<string, unknown>).id;
export const isValidAlertType = (type: string) => (Object.values(ALERT_TYPES) as string[]).includes(type);
export const isValidSeverity = (severity: string) => severity && (Object.values(SEVERITIES) as string[]).includes(severity.toLowerCase());

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, panelName: PANEL_NAME });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { statesCount: Object.keys(STATES).length, alertTypesCount: Object.keys(ALERT_TYPES).length } });
