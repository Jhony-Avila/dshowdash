// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-11-ui-helpers
// PURPOSE: Panel-11 UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   hashData() — exported function
//   formatNumber() — exported function
//   truncate() — exported function
//   calculateHealthStatus() — exported function
//   calculateAvgRate() — exported function
//   extractJobName() — exported function
//   downloadFile() — exported function
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

export function hashData(data: unknown) {
  if (!data) return null;
  try { return JSON.stringify(data); } catch { return null; }
}

export function formatNumber(val: unknown) {
  if (val == null) return '--';
  const n = parseInt(val as string);
  if (isNaN(n)) return val;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

export function truncate(str: string, len: number) {
  if (!str) return '';
  return str.length > len ? `${str.substring(0, len)}...` : str;
}

export function calculateHealthStatus(data: Record<string, unknown>) {
  const dataNode = (data?.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const total = parseInt(exec.total as string) || 1;
  const error = parseInt(exec.error as string) || 0;
  const errorRate = (error / total) * 100;
  if (errorRate > 20) return 'critical';
  if (errorRate > 10) return 'warning';
  return 'healthy';
}

export function calculateAvgRate(trend: Record<string, unknown>[]) {
  if (!trend || !trend.length) return 0;
  return trend.reduce((acc: number, t: Record<string, unknown>) => acc + (parseFloat(t.success_rate as string) || 0), 0) / trend.length;
}

export function extractJobName(errorMsg: string) {
  if (!errorMsg) return null;
  const match = errorMsg.match(/PROCEDURE\s+[\w.]+\.(\w+)/i);
  return match ? match[1] : null;
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default { hashData, formatNumber, truncate, calculateHealthStatus, calculateAvgRate, extractJobName, downloadFile };

export const MODULE_ID = 'panels-panel-11-ui-helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }
