// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-11-ui-export
// PURPOSE: Panel-11 UI Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   downloadFile from ./helpers.js
//
// PROVIDES:
//   exportCSV() — exported function
//   exportJSON() — exported function
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

import { downloadFile } from './helpers.js';

export function exportCSV(data: Record<string, unknown>) {
  if (!data) return;
  const dataNode = (data.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const rows = [
    ['Métrica', 'Valor'],
    ['Total Execuções', exec.total || 0],
    ['Sucessos', exec.success || 0],
    ['Erros', exec.error || 0]
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadFile(csv, `resumo_geral_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportJSON(data: Record<string, unknown>) {
  if (!data) return;
  const json = JSON.stringify({ exported: new Date().toISOString(), data }, null, 2);
  downloadFile(json, `resumo_geral_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

export default { exportCSV, exportJSON };

export const MODULE_ID = 'panels-panel-11-ui-export';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } }; }
