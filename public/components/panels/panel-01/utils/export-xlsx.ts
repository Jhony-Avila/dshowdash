declare const XLSX: Record<string, any>;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/export-xlsx
// PURPOSE: Panel-01 - Export XLSX (Excel)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ExcelExporter() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/export-xlsx';

export function ExcelExporter(this: any, options: Record<string, unknown> = {}) {
  options = options || {};
  this.filename = options.filename || 'export';
  this.sheetName = options.sheetName || 'Dados';
  this.columns = options.columns || [];
  this.formatters = options.formatters || {};
}

ExcelExporter.prototype.export = async function(data: Record<string, unknown>[]) {
  if (typeof XLSX === 'undefined') await this._loadSheetJS();
  const wb = XLSX.utils.book_new();
  const wsData = this._prepareData(data);
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, this.sheetName);
  const filename = `${this.filename}_${this._getDateString()}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};

ExcelExporter.prototype._loadSheetJS = () => new Promise((resolve, reject) => {

  // @ts-expect-error TS migration - TS2794
  if (typeof XLSX !== 'undefined') { resolve(); return; }
  const script = document.createElement('script');
  script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

ExcelExporter.prototype._prepareData = function(data: Record<string, unknown>[]) {
  const self = this;
  const result: unknown[][] = [];
  const headers = this.columns.map((col: Record<string, unknown>) => col.label || col.field);
  result.push(headers);
  data.forEach((item: Record<string, unknown>) => {
    const row = self.columns.map((col: Record<string, unknown>) => {
      let value = item[col.field as string] || '';
      if (self.formatters[col.field as string]) value = self.formatters[col.field as string](value, item);
      return value;
    });
    result.push(row);
  });
  return result;
};

ExcelExporter.prototype._getDateString = () => {
  const d = new Date();
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
};

ExcelExporter.prototype.destroy = () => {};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { ExcelExporter, info, healthCheck };
