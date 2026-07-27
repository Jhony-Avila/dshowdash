// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:export
// PURPOSE: Table Engine - Export Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ExportMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'table-engine:export';

export const ExportMixin = {
  _exportCSV(selectedOnly = false) {
    // @ts-expect-error strict migration — TS2339
    const columns = this._state.get('columns') || [];
    const exportCols = columns.filter((c: Record<string, unknown>) => c.exportable !== false);
    let dataToExport;

    if (selectedOnly) {
      // @ts-expect-error strict migration — TS2339
      const selection = this._state.getSelection();
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getFilteredData().filter((item: Record<string, unknown>) => selection.has(String(item.id)));
      // @ts-expect-error strict migration — TS2339
      if (!dataToExport.length) { this.emit(TABLE_EVENTS.TOAST, { type: 'warning', message: 'Nenhum item selecionado' }); return; }
    } else {
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getFilteredData();
    }

    // @ts-expect-error strict migration — TS2339
    const fmt = this._formatters || {};
    const headers = exportCols.map((c: Record<string, unknown>) => c.label || c.id);

    const rows = dataToExport.map((item: Record<string, unknown>) => exportCols.map((col: Record<string, unknown>) => {
      let val = item[col.id as string];
      if (col.type === 'currency' && fmt.formatCurrency) val = fmt.formatCurrency(val);
      else if (col.type === 'date' && fmt.formatDate) val = fmt.formatDate(val);
      val = String(val ?? '').replace(/"/g, '""');
      return `"${val}"`;
    }).join(';'));

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const date = new Date().toISOString().slice(0, 10);
    const filename = `export_${selectedOnly ? 'selected_' : ''}${date}.csv`;

    this._downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.EXPORTED, { type: 'csv', count: dataToExport.length, selectedOnly });
  },

  _exportJSON(selectedOnly = false) {
    let dataToExport;
    if (selectedOnly) {
      // @ts-expect-error strict migration — TS2339
      const selection = this._state.getSelection();
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getFilteredData().filter((item: Record<string, unknown>) => selection.has(String(item.id)));
      // @ts-expect-error strict migration — TS2339
      if (!dataToExport.length) { this.emit(TABLE_EVENTS.TOAST, { type: 'warning', message: 'Nenhum item selecionado' }); return; }
    } else {
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getFilteredData();
    }

    const jsonContent = JSON.stringify(dataToExport, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `export_${selectedOnly ? 'selected_' : ''}${date}.json`;

    this._downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.EXPORTED, { type: 'json', count: dataToExport.length, selectedOnly });
  },

  _downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportCSV(selectedOnly = false) { this._exportCSV(selectedOnly); },
  exportJSON(selectedOnly = false) { this._exportJSON(selectedOnly); }
};

export default ExportMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
