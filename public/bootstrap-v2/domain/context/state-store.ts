// Context State Store
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   CONTEXT_STATES from ./constants.js
//   BOOT_HEALTH, BOOT_MANIFEST from ../../boot-manifest/index.js
// PROVIDES: createStateStore() — centralized boot state management
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTEXT_STATES } from './constants.js';
import { BOOT_HEALTH, BOOT_MANIFEST } from '../../boot-manifest/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.context.state-store';

interface PhaseData {
  id: string;
  status: string;
  success: boolean;
  recovered: boolean;
  degraded: boolean;
  suppressed: boolean;
  time: number;
  error: string | null;
  timestamp: number;
  [key: string]: unknown;
}

interface AuthState {
  authenticated: boolean;
  user: string | null;
  checked: boolean;
  loginRequired?: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

interface PermissionsState {
  mode: string;
  ready: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

interface NavigationState {
  ready: boolean;
  currentRoute: string | null;
  timestamp?: number;
  [key: string]: unknown;
}

interface UIState {
  ready: boolean;
  preloaderDismissed: boolean;
  timestamp?: number;
  [key: string]: unknown;
}

interface MetricsState {
  startTime: number | null;
  endTime: number | null;
  totalTime: number;
  phaseTimings: Record<string, number>;
  recoveries: number;
  failures: number;
  [key: string]: unknown;
}

interface DegradationEntry {
  phase: string;
  mode: string;
  message: string;
  disabled: string[];
  allowed: string[];
  timestamp: number;
  [key: string]: unknown;
}

interface ErrorEntry {
  phase: string;
  error: string | null;
  critical: boolean;
  timestamp: number;
  [key: string]: unknown;
}

interface WarningEntry {
  phase: string | null;
  type: string;
  message: string;
  data?: unknown;
  originalError?: string | null;
  timestamp: number;
  [key: string]: unknown;
}

interface ProgressState {
  currentPhase: string | null;
  currentPhaseIndex: number;
  totalPhases: number;
  percentage: number;
  [key: string]: unknown;
}

export function createStateStore() {
  const _state: {
    status: string;
    phases: Record<string, PhaseData>;
    auth: AuthState;
    permissions: PermissionsState;
    navigation: NavigationState;
    ui: UIState;
    metrics: MetricsState;
    degradations: DegradationEntry[];
    errors: ErrorEntry[];
    warnings: WarningEntry[];
    health: string;
    healthScore: number;
    progress: ProgressState;
  } = {
    status: CONTEXT_STATES.PENDING,
    phases: {},
    auth: { authenticated: false, user: null, checked: false },
    permissions: { mode: 'unknown', ready: false },
    navigation: { ready: false, currentRoute: null },
    ui: { ready: false, preloaderDismissed: false },
    metrics: {
      startTime: null,
      endTime: null,
      totalTime: 0,
      phaseTimings: {},
      recoveries: 0,
      failures: 0
    },
    degradations: [],
    errors: [],
    warnings: [],
    health: BOOT_HEALTH.HEALTHY,
    healthScore: 0,
    progress: {
      currentPhase: null,
      currentPhaseIndex: 0,
      totalPhases: BOOT_MANIFEST.phases.length,
      percentage: 0
    }
  };

  return {
    getStatus: function() { return _state.status; },
    getPhases: function() { return _state.phases; },
    getPhase: function(id: string) { return _state.phases[id]; },
    getAuth: function() { return _state.auth; },
    getPermissions: function() { return _state.permissions; },
    getNavigation: function() { return _state.navigation; },
    getUI: function() { return _state.ui; },
    getMetrics: function() { return _state.metrics; },
    getDegradations: function() { return _state.degradations; },
    getErrors: function() { return _state.errors; },
    getWarnings: function() { return _state.warnings; },
    getHealth: function() { return _state.health; },
    getHealthScore: function() { return _state.healthScore; },
    getProgress: function() { return _state.progress; },

    setStatus: function(status: string) { _state.status = status; },

    setPhase: function(id: string, data: PhaseData) {
      _state.phases[id] = data;
      _state.metrics.phaseTimings[id] = data.time || 0;
    },

    setAuth: function(auth: { authenticated?: boolean; user?: string | null; loginRequired?: boolean }) {
      _state.auth = {
        authenticated: auth.authenticated || false,
        user: auth.user || null,
        checked: true,
        loginRequired: auth.loginRequired || false,
        timestamp: Date.now()
      };
    },

    setPermissions: function(perm: { mode?: string; ready?: boolean }) {
      _state.permissions = {
        mode: perm.mode || 'unknown',
        ready: perm.ready || false,
        timestamp: Date.now()
      };
    },

    setNavigation: function(nav: { ready?: boolean; currentRoute?: string | null }) {
      _state.navigation = {
        ready: nav.ready || false,
        currentRoute: nav.currentRoute || null,
        timestamp: Date.now()
      };
    },

    setUI: function(ui: { ready?: boolean; preloaderDismissed?: boolean }) {
      _state.ui = {
        ready: ui.ready || false,
        preloaderDismissed: ui.preloaderDismissed || false,
        timestamp: Date.now()
      };
    },

    setHealth: function(health: string, score: number) {
      _state.health = health;
      _state.healthScore = score;
    },

    setProgress: function(progress: Partial<ProgressState>) {
      Object.assign(_state.progress, progress);
    },

    startMetrics: function() {
      _state.metrics.startTime = performance.now();
    },

    endMetrics: function() {
      _state.metrics.endTime = performance.now();
      // @ts-expect-error strict migration — TS18047
      _state.metrics.totalTime = Math.round(_state.metrics.endTime - _state.metrics.startTime);
    },

    incrementRecoveries: function() { _state.metrics.recoveries++; },
    incrementFailures: function() { _state.metrics.failures++; },

    addDegradation: function(deg: DegradationEntry) { _state.degradations.push(deg); },
    addError: function(err: ErrorEntry) { _state.errors.push(err); },
    addWarning: function(warn: WarningEntry) { _state.warnings.push(warn); },

    reset: function() {
      _state.status = CONTEXT_STATES.PENDING;
      _state.phases = {};
      _state.auth = { authenticated: false, user: null, checked: false };
      _state.permissions = { mode: 'unknown', ready: false };
      _state.navigation = { ready: false, currentRoute: null };
      _state.ui = { ready: false, preloaderDismissed: false };
      _state.metrics = {
        startTime: null,
        endTime: null,
        totalTime: 0,
        phaseTimings: {},
        recoveries: 0,
        failures: 0
      };
      _state.degradations = [];
      _state.errors = [];
      _state.warnings = [];
      _state.health = BOOT_HEALTH.HEALTHY;
      _state.healthScore = 0;
      _state.progress = {
        currentPhase: null,
        currentPhaseIndex: 0,
        totalPhases: BOOT_MANIFEST.phases.length,
        percentage: 0
      };
    }
  };
}

export default { createStateStore };
