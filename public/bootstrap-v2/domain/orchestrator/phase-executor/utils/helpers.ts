// Phase Executor Helpers
// @version 3.1.1-CONTRACTS
// @changelog v3.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v3.1.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory options):
//   options.logger, options.telemetry,
//   options.eventEmitter, options.moduleId
// PROVIDES: createHelpers() factory returning:
//   log(), track(), emit()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.utils.helpers';

interface HelpersOptions {
  logger: Record<string, Function> | null | undefined;
  telemetry: Record<string, Function> | null | undefined;
  eventEmitter: Record<string, Function> | null | undefined;
  moduleId: string;
}

export function createHelpers(options: HelpersOptions) {
  const logger = options.logger;
  const telemetry = options.telemetry;
  const eventEmitter = options.eventEmitter;
  const moduleId = options.moduleId;

  return {
    log: function(level: string, message: string, data?: Record<string, unknown>) {
      if (logger && logger[level]) {
        logger[level](message, Object.assign({}, data, { module: moduleId }));
      }
    },

    track: function(event: string, payload: Record<string, unknown>) {
      if (telemetry && telemetry.track) {
        telemetry.track(event, Object.assign({}, payload, { module: moduleId }));
      }
    },

    emit: function(event: string, data: Record<string, unknown>) {
      if (eventEmitter && eventEmitter.emit) {
        eventEmitter.emit(event, data);
      }
    }
  };
}

export default { createHelpers };
