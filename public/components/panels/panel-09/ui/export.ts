// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-09-ui-export
// PURPOSE: Panel-09 UI Export
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


// @ts-expect-error TS migration - TS2614
import { downloadFile } from './helpers.js';

export function exportCSV(data: Record<string, unknown>) {
  if (!data) return alert('Sem dados para exportar');
  
  const rows: (string | number | unknown)[][] = [['Período', 'Atual Total', 'Anterior Total', 'Variação %', 'Atual Sucesso', 'Anterior Sucesso', 'Variação %']];
  
  ['today_vs_yesterday', 'this_week_vs_last_week', 'this_month_vs_last_month'].forEach(period => {
    const d = data[period] as Record<string, Record<string, unknown>> | undefined;
    if (d) {
      rows.push([
        period,
        d.current?.total || 0,
        d.previous?.total || 0,
        d.change?.total || 0,
        d.current?.success || 0,
        d.previous?.success || 0,
        d.change?.success || 0
      ]);
    }
  });
  
  const csv = rows.map(r => r.join(',')).join('\n');
  downloadFile(csv, `analise_comparativa_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

export function exportJSON(data: Record<string, unknown>) {
  if (!data) return alert('Sem dados para exportar');
  const json = JSON.stringify({ exported: new Date().toISOString(), data }, null, 2);
  downloadFile(json, `analise_comparativa_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}

export default { exportCSV, exportJSON };

export const MODULE_ID = 'panels-panel-09-ui-export';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } }; }
