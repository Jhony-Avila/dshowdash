// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:utils:colors
// PURPOSE: Panel-05 Dashboard Utils - Colors
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getStatusColor() — exported function
//   getRiscoColor() — exported function
//   getTrendColor() — exported function
//   hexToRgba() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

export function getStatusColor(status: unknown) {
  const colors: Record<string, string> = {
    ativo: '#22C55E', inativo: '#6B7280', pendente: '#F59E0B', cancelado: '#EF4444',
    success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6', neutral: '#6B7280'
  };
  return colors[String(status || '').toLowerCase()] || colors.neutral;
}

export function getRiscoColor(risco: unknown) {
  const colors: Record<string, string> = { baixo: '#22C55E', medio: '#F59E0B', alto: '#EF4444', critico: '#DC2626' };
  return colors[String(risco || '').toLowerCase()] || '#6B7280';
}

export function getTrendColor(value: unknown) {
  const num = Number(value);
  if (num > 0) return 'var(--p05-success)';
  if (num < 0) return 'var(--p05-danger)';
  return 'var(--p05-text-muted)';
}

export function hexToRgba(hex: string, alpha = 1) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return hex;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default { getStatusColor, getRiscoColor, getTrendColor, hexToRgba };

export const MODULE_ID = 'panel-05:utils:colors';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { colorsReady: true } }; }
