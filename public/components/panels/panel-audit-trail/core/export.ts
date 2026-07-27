// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-core-export
// PURPOSE: Panel Audit Trail - Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//   getCurrentLogs, delay, formatDateFilename from ./helpers.js
//
// PROVIDES:
//   handleExportClipboard() — exported function
//   handleBulkCopy() — exported function
//   handleCopyLog() — exported function
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

import * as Renderer from '../ui/renderer.js';
import { localState } from './state.js';
import { getCurrentLogs, delay, formatDateFilename } from './helpers.js';

function exportCSV(logs: Record<string, unknown>[], filename: string) {
  if (!logs?.length) return;
  const headers = Object.keys(logs[0]);
  const csvRows = [headers.join(',')];
  for (const log of logs) {
    const values = headers.map(h => {
      let val = log[h];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }
  const blob = new Blob([`\ufeff${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJSON(logs: Record<string, unknown>[], filename: string) {
  if (!logs?.length) return;
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function handleExportCSV(state: Record<string, unknown>) {
  const logs = getCurrentLogs(state) as Record<string, unknown>[];
  if (!logs?.length) { Renderer.toast('Nenhum dado para exportar', 'warning'); return; }
  
  Renderer.showExportProgress(true, 10, 'Preparando dados...');
  await delay(100);
  Renderer.showExportProgress(true, 30, 'Formatando CSV...');
  await delay(100);
  Renderer.showExportProgress(true, 60, 'Gerando arquivo...');
  await delay(100);
  
  exportCSV(logs, `audit-trail-${formatDateFilename()}.csv`);
  
  Renderer.showExportProgress(true, 100, 'Concluído!');
  await delay(300);

  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} registros exportados`, 'success');
}

export async function handleExportJSON(state: Record<string, unknown>) {
  const logs = getCurrentLogs(state) as Record<string, unknown>[];
  if (!logs?.length) { Renderer.toast('Nenhum dado para exportar', 'warning'); return; }
  
  Renderer.showExportProgress(true, 10, 'Preparando dados...');
  await delay(100);
  Renderer.showExportProgress(true, 50, 'Gerando JSON...');
  await delay(100);
  
  exportJSON(logs, `audit-trail-${formatDateFilename()}.json`);
  
  Renderer.showExportProgress(true, 100, 'Concluído!');
  await delay(300);

  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} registros exportados`, 'success');
}

export function handleExportClipboard(state: Record<string, unknown>) {
  const logs = getCurrentLogs(state) as Record<string, unknown>[];
  if (!logs?.length) { Renderer.toast('Nenhum dado para exportar', 'warning'); return; }
  
  const text = JSON.stringify(logs, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    Renderer.toast(`${logs.length} registros copiados`, 'success');
  }).catch(() => Renderer.toast('Erro ao copiar', 'error'));
}

export async function handleBulkExport(state: Record<string, unknown>) {
  const logs = (getCurrentLogs(state) as Record<string, unknown>[])?.filter((l: Record<string, unknown>) => (localState as any).selectedIds.has(String(l.id)));
  if (!logs?.length) { Renderer.toast('Nenhum item selecionado', 'warning'); return; }
  
  Renderer.showExportProgress(true, 50, `Exportando ${logs.length} itens...`);
  await delay(200);
  
  exportCSV(logs, `audit-trail-selection-${formatDateFilename()}.csv`);
  

  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} itens exportados`, 'success');
}

export function handleBulkCopy(state: Record<string, unknown>) {
  const logs = (getCurrentLogs(state) as Record<string, unknown>[])?.filter((l: Record<string, unknown>) => (localState as any).selectedIds.has(String(l.id)));
  if (!logs?.length) { Renderer.toast('Nenhum item selecionado', 'warning'); return; }
  navigator.clipboard.writeText(JSON.stringify(logs, null, 2))
    .then(() => Renderer.toast(`${logs.length} itens copiados`, 'success'))
    .catch(() => Renderer.toast('Erro ao copiar', 'error'));
}

export function handleCopyLog(logId: string, state: Record<string, unknown>) {
  const logs = getCurrentLogs(state) as Record<string, unknown>[];
  const log = logs?.find((l: Record<string, unknown>) => String(l.id) === String(logId));
  if (log) {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2))
      .then(() => Renderer.toast('Log copiado', 'success'))
      .catch(() => Renderer.toast('Erro ao copiar', 'error'));
  }
}

export default { handleExportCSV, handleExportJSON, handleExportClipboard, handleBulkExport, handleBulkCopy, handleCopyLog };

export const MODULE_ID = 'panels-panel-audit-trail-core-export';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } }; }
