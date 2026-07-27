// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-export-import
// PURPOSE: Export/Import Handler - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from ../index.js
//
// PROVIDES:
//   createExportImportHandlers() — exported function
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

import { VERSION } from '../index.js';

export const MODULE_ID = 'panel-nav-admin-handlers-export-import';

export function createExportImportHandlers(deps: Record<string, unknown>) {
  const store = deps.store as { getState: () => Record<string, unknown>; get: (key: string) => unknown };
  const showToast = deps.showToast as (msg: string, type: string) => void;

  function exportJSON() {
    try {
      const state = store.getState();
      const items = (state.items as Record<string, unknown>[]) || [];
      const itemsWithTitle = items.map((item: Record<string, unknown>) => ({ ...item, display_title: item.displayTitle || item.display_title || '' }));
      const exportData = { version: VERSION, exportedAt: new Date().toISOString(), items: itemsWithTitle, sections: state.sections };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `nav-config-${getDateStamp()}.json`);
      showToast('Exportação concluída', 'success');
    } catch (error) { showToast(`Erro ao exportar: ${(error as Error).message}`, 'error'); }
  }

  function exportCSV() {
    try {
      const items = store.get('items') || [];
      const headers = ['id', 'label', 'display_title', 'href', 'section', 'minLevel', 'order', 'isActive'];
      const rows = (items as Record<string, unknown>[]).map((item: Record<string, unknown>) => headers.map((h: string) => { const val = h === 'display_title' ? (item.displayTitle || item.display_title || '') : item[h]; return escapeCSV(val != null ? val : ''); }).join(','));
      const csv = [headers.join(',')].concat(rows).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `nav-items-${getDateStamp()}.csv`);
      showToast('CSV exportado', 'success');
    } catch (error) { showToast(`Erro: ${(error as Error).message}`, 'error'); }
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {

      // @ts-expect-error TS migration - TS2339
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      file.text().then((text: string) => {
        const data = JSON.parse(text);
        if (!validateImportData(data)) { showToast('Formato inválido', 'error'); return; }
        showToast(`Importado: ${(data.items && data.items.length) || 0} itens`, 'success');
      }).catch((error: Error) => { showToast(`Erro ao importar: ${error.message}`, 'error'); });
    };
    input.click();
  }

  return { exportJSON, exportCSV, handleImport };
}

function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function getDateStamp() { return new Date().toISOString().slice(0, 10); }
function escapeCSV(value: unknown) { const str = String(value); if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) { return `"${str.replace(/"/g, '""')}"`; } return str; }
function validateImportData(data: Record<string, unknown>) { if (!data || typeof data !== 'object') return false; if (!Array.isArray(data.items)) return false; return true; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
