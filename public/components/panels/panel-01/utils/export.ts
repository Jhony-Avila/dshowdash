// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/export
// PURPOSE: Panel-01 Export Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   toCSV() — exported function
//   downloadCSV() — exported function
//   toJSON() — exported function
//   downloadJSON() — exported function
//   printData() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.close
//   window.open
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/export';

// CSV/Excel Injection (AZUL, 27/11): o MESMO critério de _shared-react/csv/neutralizar.ts (cópia mínima: este arquivo é carregado sem bundle).
// Texto que começa com = + - @ TAB CR LF (também depois de espaços/NBSP e nas formas de largura total) ganha apóstrofo; números tipados intactos.
const FORMULA_PERIGOSA = /^[\s\u00a0\u2000-\u200b\u3000\ufeff]*[=+\-@\uff1d\uff0b\uff0d\uff20\t\r\n]/u;
export function celulaCsv(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean') return String(v);
  let s = String(v);
  if (FORMULA_PERIGOSA.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(data: Record<string, unknown>[], columns?: string[]) {
  if (!data || !data.length) return '';
  
  const cols = columns || Object.keys(data[0]);
  const header = cols.map(celulaCsv).join(';');
  const rows = data.map((row: Record<string, unknown>) =>
    cols.map((col: string) => celulaCsv(row[col])).join(';')
  );
  
  return `\uFEFF${header}\n${rows.join('\n')}`;
}

export function downloadCSV(data: Record<string, unknown>[], columns?: string[], filename = 'export.csv') {
  const csv = toCSV(data, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function toJSON(data: unknown, pretty = true) {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

export function downloadJSON(data: unknown, filename = 'export.json') {
  const json = toJSON(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printData(data: Record<string, unknown>[], title = 'Relatório') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>${title}</h1>
    <table><thead><tr>${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}</tr></thead>
    <tbody>${data.map((row: Record<string, unknown>) => `<tr>${Object.values(row).map((v: unknown) => `<td>${v ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <script>window.print();window.close();</script>
    </body></html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { toCSV, downloadCSV, toJSON, downloadJSON, printData };
