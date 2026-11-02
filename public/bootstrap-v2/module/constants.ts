// Bootstrap-V2 Constants
// @version 3.4.1-CONTRACTS
// @changelog v3.4.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.0.0-COMPLETE: Sprints 7-9 completos (26 melhorias)
// @changelog v2.8.0-PERSISTENCE: Sprint 5 - Persistência
// @changelog v2.7.0-QUALITY: Sprint 4 - Quality
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.4.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: VERSION, MODULE_ID, SINGLETON_KEY, SINGLETON_STATES,
//   BOOT_LOOP_CONFIG, GLOBAL_TIMEOUT_CONFIG, PERIODIC_HEALTH_CONFIG,
//   FEATURE_FLAGS
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.4.0-SPRINT7';
export const MODULE_ID = 'bootstrap-v2';

// Singleton key for global state
export const SINGLETON_KEY = '__BOOTSTRAP_V2_STATE__';

export const SINGLETON_STATES = {
  IDLE: 'idle',
  STARTING: 'starting',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SAFE_MODE: 'safe_mode'
};

export const BOOT_LOOP_CONFIG = {
  maxBootsInWindow: 3,
  windowMs: 60000,
  cooldownMs: 30000,
  enabled: true
};

export const GLOBAL_TIMEOUT_CONFIG = {
  timeoutMs: 120000,
  warningThresholdMs: 90000,
  enabled: true
};

export const PERIODIC_HEALTH_CONFIG = {
  enabled: true,
  intervalMs: 30000,
  autoStart: true,
  startDelay: 5000,
  maxHistory: 20
};

// Feature flags for all sprints
export const FEATURE_FLAGS = {
  // Sprint 1: Enterprise
  CIRCUIT_BREAKER: true,
  KERNEL_SYNC: true,
  LISTENER_CLEANUP: true,
  
  // Sprint 2: Robust
  RETRY_JITTER: true,
  BOOT_LOOP_DETECTION: true,
  GLOBAL_TIMEOUT: true,
  
  // Sprint 3: Observability
  PERIODIC_HEALTH: true,
  MEMORY_METRICS: true,
  DEGRADATION_NOTIFIER: true,
  
  // Sprint 4: Quality
  KERNEL_TESTS: true,
  IMMUTABLE_SNAPSHOT: true,
  CYCLE_VALIDATION: true,
  
  // Sprint 5: Persistence
  SESSION_PERSISTENCE: true,
  BOOT_HISTORY: true,
  DEBUG_MODE: true,
  
  // Sprint 6: Quick Wins
  IDEMPOTENT_CACHE: true,
  KERNEL_HISTORY_LIMIT: true,
  
  // Sprint 7: Observability Advanced
  GRANULAR_EVENTS: true,
  OPENTELEMETRY: true,
  ROOT_CAUSE_ANALYSIS: true,
  
  // Sprint 8: Resilience Advanced
  DYNAMIC_TIMEOUT: true,
  MANIFEST_INTEGRITY: true,
  PHASE_ROLLBACK: true,
  
  // Sprint 9: Performance
  LAZY_LOADING: true,
  BOOT_CANCELLATION: true,
  PARTIAL_REINIT: true
};

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  SINGLETON_KEY: SINGLETON_KEY,
  SINGLETON_STATES: SINGLETON_STATES,
  BOOT_LOOP_CONFIG: BOOT_LOOP_CONFIG,
  GLOBAL_TIMEOUT_CONFIG: GLOBAL_TIMEOUT_CONFIG,
  PERIODIC_HEALTH_CONFIG: PERIODIC_HEALTH_CONFIG,
  FEATURE_FLAGS: FEATURE_FLAGS
};
