// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.ui.kernel-governance-panel.helpers
// PURPOSE: Helper Functions - formatação e classes CSS
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: getModeClass, getHealthClass, getCategoryClass, formatNumber, formatTime
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.ui.kernel-governance-panel.helpers';

export function getModeClass(mode: string) {
  if (!mode) return '';
  const m = mode.toLowerCase();
  if (m === 'normal') return 'kgp__status-card--normal';
  if (m === 'degraded') return 'kgp__status-card--degraded';
  if (m === 'maintenance') return 'kgp__status-card--maintenance';
  if (m === 'failed' || m === 'recovery') return 'kgp__status-card--failed';
  return '';
}

export function getHealthClass(score: number) {
  if (score >= 90) return 'kgp__status-card--healthy';
  if (score >= 50) return 'kgp__status-card--degraded';
  return 'kgp__status-card--failed';
}

export function getCategoryClass(status: string) {
  if (!status) return 'kgp__category--unknown';
  const s = status.toLowerCase();
  if (s === 'healthy') return 'kgp__category--healthy';
  if (s === 'degraded') return 'kgp__category--degraded';
  if (s === 'unhealthy' || s === 'critical') return 'kgp__category--unhealthy';
  return 'kgp__category--unknown';
}

export function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function formatTime(ts: number | null) {
  if (!ts) return 'Never';
  const d = new Date(ts);
  return d.toLocaleTimeString();
}
