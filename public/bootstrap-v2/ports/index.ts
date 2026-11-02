// Bootstrap-V2 Ports
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.1.0-QUICKWINS: QW#10 Validação de contratos, QW#11 ReadyFlagsPort
// Re-exporta todas as interfaces
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   BootstrapPort from ./BootstrapPort.js
//   PhasePort from ./PhasePort.js
//   TelemetryPort from ./TelemetryPort.js
//   LoggerPort from ./LoggerPort.js
//   ReadyFlagsPort from ./ReadyFlagsPort.js
// PROVIDES: Re-exports all port contracts + validateAllPorts()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════

'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.ports';

export { 
  BOOTSTRAP_CONTRACT, 
  MODULE_STATES, 
  validateBootstrapModule, 
  createBootstrapModule 
} from './BootstrapPort.js';

export { 
  PHASE_CONTRACT, 
  PHASE_STATES, 
  validatePhase, 
  createPhase 
} from './PhasePort.js';

export { 
  TELEMETRY_CONTRACT, 
  TELEMETRY_EVENTS, 
  createNullTelemetry, 
  validateTelemetry 
} from './TelemetryPort.js';

export { 
  LOG_LEVELS, 
  LOGGER_CONTRACT, 
  createNullLogger, 
  createConsoleLogger, 
  validateLogger 
} from './LoggerPort.js';

export {
  READY_FLAGS_CONTRACT,
  createNullReadyFlags,
  validateReadyFlags
} from './ReadyFlagsPort.js';

// QW#10: Validação centralizada de todos os ports
function validateAllPorts(ports: Record<string, unknown>) {
  const results: { valid: boolean; errors: unknown[]; warnings: unknown[] } = { valid: true, errors: [], warnings: [] };
  
  if (ports.logger) {
    const loggerValidation = require('./LoggerPort.js').validateLogger(ports.logger);
    if (!loggerValidation.valid) {
      results.warnings.push({ port: 'logger', errors: loggerValidation.errors });
    }
  }
  
  if (ports.telemetry) {
    const telemetryValidation = require('./TelemetryPort.js').validateTelemetry(ports.telemetry);
    if (!telemetryValidation.valid) {
      results.warnings.push({ port: 'telemetry', errors: telemetryValidation.errors });
    }
  }
  
  if (ports.readyFlagsAdapter) {
    const readyFlagsValidation = require('./ReadyFlagsPort.js').validateReadyFlags(ports.readyFlagsAdapter);
    if (!readyFlagsValidation.valid) {
      results.warnings.push({ port: 'readyFlags', errors: readyFlagsValidation.errors });
    }
  }
  
  results.valid = results.errors.length === 0;
  return results;
}

export { validateAllPorts };
