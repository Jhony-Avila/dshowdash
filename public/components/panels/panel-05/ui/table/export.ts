// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:export
// PURPOSE: Panel-05 Table Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_COLUMNS from ./constants.js
//   downloadCSV from ./utils.js
//   formatCurrency from ../../utils/dashboard-utils.js
//   TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ExportMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.EXPORTED
//   UI_INTENTS.SHOW_TOAST
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_COLUMNS } from './constants.js';
import { downloadCSV } from './utils.js';
import { formatCurrency } from '../../utils/dashboard-utils.js';
import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:export';

export const ExportMixin = {
  _exportCSV(selectedOnly = false) {
    const exportCols = TABLE_COLUMNS.filter(c => c.exportKey);
    let dataToExport;

    if (selectedOnly) {
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getDisplayData().filter((item: Record<string, unknown>) =>
        // @ts-expect-error strict migration — TS2339
        this._state.isSelected(String(item.id))
      );

      if (!dataToExport.length) {
        // @ts-expect-error strict migration — TS2339
        this.emit(UI_INTENTS.SHOW_TOAST, { type: 'warning', message: 'Nenhum item selecionado' });
        return;
      }
    } else {
      // @ts-expect-error strict migration — TS2339
      dataToExport = this._state.getDisplayData();
    }

    const headers = exportCols.map(c => c.label);

    const rows = dataToExport.map((item: Record<string, unknown>) => exportCols.map(col => {
      // @ts-expect-error strict migration — TS2538
      let val = item[col.exportKey];

      if (col.type === 'currency') {
        val = formatCurrency(val);
      } else if (col.id === 'cidade') {
        val = `${item.cidade || ''}${item.uf ? `/${item.uf}` : ''}`;
      }

      val = String(val ?? '').replace(/"/g, '""');
      return `"${val}"`;
    }).join(';'));

    const csvContent = [headers.join(';'), ...rows].join('\n');

    const date = new Date().toISOString().slice(0, 10);
    const filename = `clientes_${selectedOnly ? 'selecionados_' : ''}${date}.csv`;

    downloadCSV(csvContent, filename);

    // @ts-expect-error strict migration — TS2339
    this.emit(TABLE_EVENTS.EXPORTED, { type: 'csv', count: dataToExport.length, selectedOnly });
    // @ts-expect-error strict migration — TS2339
    this.emit(UI_INTENTS.SHOW_TOAST, { type: 'success', message: `${dataToExport.length} registros exportados` });
  },

  exportCSV(selectedOnly = false) {
    this._exportCSV(selectedOnly);
  }
};

export default ExportMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } }; }
