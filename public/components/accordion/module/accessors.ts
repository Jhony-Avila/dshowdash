// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.accessors
// PURPOSE: Accessor functions for accordion singleton components
// ───────────────────────────────────────────────────────────────
// @contract GET_ACCORDION - getAccordion() returns controller instance
// @contract GET_ACCORDION_VIEW - getAccordionView() returns view instance
// @contract GET_ACCORDION_TELEMETRY - getAccordionTelemetry() returns telemetry
// @contract DESTROY_ACCORDION - destroyAccordion() destroys all instances
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: singleton-state functions from ./singleton-state.js
// PROVIDES: getAccordion, getAccordionView, getAccordionTelemetry,
//           destroyAccordion, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as state from './singleton-state.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.accessors';

export function getAccordion() {
  return state.getInstance();
}

export function getAccordionView() {
  return state.getView();
}

export function getAccordionTelemetry() {
  return state.getTelemetry();
}

export function destroyAccordion() {
  const telemetry = state.getTelemetry();
  if (telemetry) {
    telemetry.destroy();
  }

  const view = state.getView();
  if (view) {
    view.destroy();
  }

  const instance = state.getInstance();
  if (instance) {
    instance.destroy();
  }

  state.clearAll();

  return { success: true };
}

export function healthCheck() {
  const checks = {
    accessorsAvailable: true,
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= 1 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasAccordion: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  getAccordion,
  getAccordionView,
  getAccordionTelemetry,
  destroyAccordion,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
