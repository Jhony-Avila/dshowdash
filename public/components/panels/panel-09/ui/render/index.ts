// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-09.ui.render
// PURPOSE: Panel-09 Render Index - Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//   renderStructure — exported value
//   renderSuccessRate — exported value
//   renderMiniDonut — exported value
//   renderSparkline — exported value
//   renderSummaryCards — exported value
//   renderLineChart — exported value
//   renderBarChart — exported value
//   renderComparison — exported value
//   renderStatusDistribution — exported value
//   renderAlerts — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export { renderStructure } from './structure.js';
export { renderSuccessRate, renderMiniDonut, renderSparkline, renderSummaryCards } from './summary.js';
export { renderLineChart, renderBarChart } from './charts.js';
export { renderComparison } from './comparison.js';
export { renderStatusDistribution, renderAlerts } from './distribution.js';

export default {
  renderStructure: () => import('./structure.js').then(m => m.renderStructure),
  renderSuccessRate: () => import('./summary.js').then(m => m.renderSuccessRate),
  renderMiniDonut: () => import('./summary.js').then(m => m.renderMiniDonut),
  renderSparkline: () => import('./summary.js').then(m => m.renderSparkline),
  renderSummaryCards: () => import('./summary.js').then(m => m.renderSummaryCards),
  renderLineChart: () => import('./charts.js').then(m => m.renderLineChart),
  renderBarChart: () => import('./charts.js').then(m => m.renderBarChart),
  renderComparison: () => import('./comparison.js').then(m => m.renderComparison),
  renderStatusDistribution: () => import('./distribution.js').then(m => m.renderStatusDistribution),
  renderAlerts: () => import('./distribution.js').then(m => m.renderAlerts)
};

export const MODULE_ID = 'panel-09.ui.render';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } }; }
