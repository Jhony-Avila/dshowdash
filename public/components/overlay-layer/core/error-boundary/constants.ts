// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-error-boundary
// PURPOSE: Error Boundary - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ERROR_TYPES — exported value
//   SEVERITY — exported value
//   DEFAULT_CONFIG — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-error-boundary';

export const ERROR_TYPES = {
  RENDER: 'RENDER_ERROR',
  LIFECYCLE: 'LIFECYCLE_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  NETWORK: 'NETWORK_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  STATE: 'STATE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const DEFAULT_CONFIG = {
  enabled: true,
  maxErrors: 100,
  errorTTL: 300000,
  autoRecover: true,
  recoverAttempts: 3,
  recoverDelay: 1000,
  fallbackContent: null as DynObj,
  reportErrors: true,
  logToConsole: true
};
