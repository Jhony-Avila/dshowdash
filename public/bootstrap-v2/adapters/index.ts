// Bootstrap-V2 Adapters
// @version 2.0.1-CONTRACTS
// @changelog v2.0.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.0.0-COMPLETE: #13 OpenTelemetry Adapter
// Re-exporta todos os adapters
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   ./LoggerAdapter.js, ./TelemetryAdapter.js,
//   ./EventBusAdapter.js, ./ReadyFlagsAdapter.js,
//   ./WindowAdapter.js, ./OpenTelemetryAdapter.js
// PROVIDES: Re-exports all adapter factories (barrel)
// WINDOW ACCESS: None (delegated to sub-modules)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.adapters';

export { createLoggerAdapter } from './LoggerAdapter.js';
export { createTelemetryAdapter } from './TelemetryAdapter.js';
export { createEventBusAdapter } from './EventBusAdapter.js';
export { createReadyFlagsAdapter } from './ReadyFlagsAdapter.js';
export { createWindowAdapter } from './WindowAdapter.js';

// #13: OpenTelemetry Adapter
export {
  OTEL_ATTRIBUTES,
  SPAN_STATUS,
  METRIC_TYPES,
  createSpan,
  endSpan,
  addSpanEvent,
  recordMetric,
  recordCounter,
  recordHistogram,
  recordGauge,
  startTrace,
  endTrace,
  exportSpans,
  exportMetrics,
  recordBootPhase,
  recordBootComplete,
  configure as configureOtel,
  getConfig as getOtelConfig,
  clearSpans,
  clearMetrics,
  clearAll as clearOtelData
} from './OpenTelemetryAdapter.js';

export * as OpenTelemetryAdapter from './OpenTelemetryAdapter.js';
