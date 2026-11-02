// Manifest Config Resolver
// @version 3.1.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: createConfigResolver(getPhaseConfig)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.manifest.config-resolver';

interface ConfigPhase {
  id: string;
  name: string;
  critical?: boolean;
  recoverable?: boolean;
  timeout?: number;
  onFail?: Record<string, unknown> | null;
  suppressWhenUnauth?: boolean;
  circuitBreaker?: boolean;
}

export function createConfigResolver(getPhaseConfig: ((phaseId: string) => Record<string, unknown> | null) | undefined) {
  return {
    resolve: function(phase: ConfigPhase) {
      const manifestConfig = getPhaseConfig ? getPhaseConfig(phase.id) : null;
      
      if (manifestConfig) {
        return manifestConfig;
      }
      
      return {
        id: phase.id,
        name: phase.name,
        critical: phase.critical !== false,
        recoverable: phase.recoverable || false,
        timeout: phase.timeout || 30000,
        retry: { enabled: false, maxAttempts: 1, delay: 1000, backoff: 1.5 },
        onFail: phase.onFail || null,
        suppressWhenUnauth: phase.suppressWhenUnauth || false,
        circuitBreaker: phase.circuitBreaker !== false
      };
    }
  };
}

export default { createConfigResolver };
