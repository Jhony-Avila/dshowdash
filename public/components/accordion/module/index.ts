// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module
// PURPOSE: Internal barrel export for accordion module layer
// ───────────────────────────────────────────────────────────────
// @contract BARREL - Re-exports all module layer components
// ───────────────────────────────────────────────────────────────
// IMPORTS: All module layer files
// PROVIDES: Consolidated module exports
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

export { VERSION, MODULE_ID, STYLE_PATHS } from './constants.js';
export { injectStyles, isStylesInjected } from './style-injector.js';
export { initPorts, injectPorts, getPorts, getPort, isPortsInitialized } from './ports-manager.js';
export * from './singleton-state.js';
export { createAccordion, createAccordionWithMock, mountAccordion, mountAccordionWithMock } from './factory.js';
export { getAccordion, getAccordionView, getAccordionTelemetry, destroyAccordion } from './accessors.js';
export { getMetrics, healthCheck, info, audit } from './diagnostics.js';
export { setupWindowAPI } from './window-api.js';
