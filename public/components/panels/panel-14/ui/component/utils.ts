// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-component-utils
// PURPOSE: Panel-14 UI Component - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatNumber() — exported function
//   formatDate() — exported function
//   formatErrorMessage() — exported function
//   hashData() — exported function
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

export function formatNumber(val: unknown) {
  if (val == null) return '--';
  const n = parseInt(String(val));
  if (isNaN(n)) return val;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function formatErrorMessage(msg: string) {
  if (!msg) return 'Erro desconhecido';
  if (msg.length > 80) return `${msg.substring(0, 80)}...`;
  return msg;
}

export function hashData(data: unknown) {
  if (!data) return null;
  try { return JSON.stringify(data); } catch { return null; }
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

export default { formatNumber, formatDate, formatErrorMessage, hashData, downloadFile };

export const MODULE_ID = 'panel-14.ui.utils';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } }; }
