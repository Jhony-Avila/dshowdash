// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-exporter
// PURPOSE: Panel Session Admin - Exporter Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   mapSessionsForCSV, mapSessionsForJSON, mapSessionForExport from ./mappers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportToCSV() — exported function
//   exportToJSON() — exported function
//   copyToClipboard() — exported function
//   print() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.open
// ═══════════════════════════════════════════════════════════════
'use strict';

import { mapSessionsForCSV, mapSessionsForJSON, mapSessionForExport } from './mappers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-session-admin-exporter';

export function exportToCSV(sessions: Record<string, unknown>[], filename: string = 'sessoes') {
  if (!sessions || !sessions.length) return { ok: false, error: 'NO_DATA' };
  try {
    const csv = mapSessionsForCSV(sessions);
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${_getTimestamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, format: 'csv', count: sessions.length };
  } catch (error: any) { return { ok: false, error: error.message }; }
}

export function exportToJSON(sessions: Record<string, unknown>[], filename: string = 'sessoes') {
  if (!sessions || !sessions.length) return { ok: false, error: 'NO_DATA' };
  try {
    const json = mapSessionsForJSON(sessions);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${_getTimestamp()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, format: 'json', count: sessions.length };
  } catch (error: any) { return { ok: false, error: error.message }; }
}

export function copyToClipboard(sessions: Record<string, unknown>[], format: string = 'text') {
  if (!sessions || !sessions.length) return Promise.resolve({ ok: false, error: 'NO_DATA' });
  return new Promise(resolve => {
    try {
      let content;
      if (format === 'json') { content = mapSessionsForJSON(sessions); }
      else if (format === 'csv') { content = mapSessionsForCSV(sessions); }
      else {
        const texts = [];
        for (let i = 0; i < sessions.length; i++) {
          const mapped = mapSessionForExport(sessions[i]);
          const lines = [];
          for (const k in mapped) { if (Object.prototype.hasOwnProperty.call(mapped, k)) lines.push(`${k}: ${(mapped as Record<string, unknown>)[k]}`); }
          texts.push(lines.join('\n'));
        }
        content = texts.join('\n\n---\n\n');
      }
      navigator.clipboard.writeText(content).then(() => { resolve({ ok: true, format, count: sessions.length }); }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        resolve({ ok: true, format, count: sessions.length, fallback: true });
      });
    } catch (e: any) { resolve({ ok: false, error: e.message }); }
  });
}

export function print(sessions: Record<string, unknown>[], title: string = 'Relatório de Sessões') {
  if (!sessions || !sessions.length) return { ok: false, error: 'NO_DATA' };
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return { ok: false, error: 'POPUP_BLOCKED' };
    const html = _generatePrintHTML(sessions, title);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
    return { ok: true, count: sessions.length };
  } catch (error: any) { return { ok: false, error: error.message }; }
}

function _getTimestamp() { const now = new Date(); return now.toISOString().slice(0, 19).replace(/[-:T]/g, ''); }

function _generatePrintHTML(sessions: Record<string, unknown>[], title: string) {
  const mapped = []; for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i]));
  const headers = mapped[0] ? Object.keys(mapped[0]) : [];
  let headerCells = ''; for (let h = 0; h < headers.length; h++) headerCells += `<th>${headers[h]}</th>`;
  let rows = ''; for (let j = 0; j < mapped.length; j++) { const row = mapped[j] as Record<string, unknown>; rows += '<tr>'; for (let c = 0; c < headers.length; c++) rows += `<td>${row[headers[c]] || '-'}</td>`; rows += '</tr>'; }
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11pt;padding:20px}h1{font-size:16pt;margin-bottom:10px;color:#333}.meta{font-size:9pt;color:#666;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:9pt}th{background:#f5f5f5;font-weight:bold}tr:nth-child(even){background:#fafafa}.footer{margin-top:20px;font-size:9pt;color:#666;text-align:right}@media print{@page{size:A4 landscape;margin:1cm}body{padding:0}}</style></head><body><h1>${title}</h1><div class="meta">Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${sessions.length} sessão(ões)</div><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table><div class="footer">DshowDash - Gerenciamento de Sessões</div></body></html>`;
}

export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportToCSVReady: typeof exportToCSV === 'function', exportToJSONReady: typeof exportToJSON === 'function' } }; }

export default { VERSION, MODULE_ID, exportToCSV, exportToJSON, copyToClipboard, print, getVersion, info, healthCheck };
