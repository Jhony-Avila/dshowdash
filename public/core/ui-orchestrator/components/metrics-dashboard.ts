// @upgrade v*.*.*-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// Metrics Dashboard - Wrapper de Compatibilidade
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-ENTERPRISE-MODULAR
// Este arquivo re-exporta do módulo modularizado para manter compatibilidade
'use strict';

export {
  VERSION,
  MODULE_ID,
  mount,
  unmount,
  refresh,
  healthCheck,
  info,
  collectMetrics,
  exportMetrics
} from './metrics-dashboard/index.js';

export { default } from './metrics-dashboard/index.js';
