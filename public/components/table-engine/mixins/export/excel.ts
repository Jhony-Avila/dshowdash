// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:export-excel
// PURPOSE: Table Engine - Excel Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportToExcel() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:export-excel';

// Criar arquivo XLSX simples (sem dependências externas)
export function exportToExcel(data: Array<Record<string, unknown>>, columns: Array<Record<string, unknown>>, options: { filename?: string; sheetName?: string; includeHeaders?: boolean } = {}) {
  const filename = options.filename || `export-${Date.now()}.xlsx`;
  const sheetName = options.sheetName || 'Dados';
  const includeHeaders = options.includeHeaders !== false;
  
  // Criar XML para XLSX (formato Office Open XML simplificado)
  const xml = createExcelXML(data, columns, { sheetName, includeHeaders, ...options });
  
  // Criar blob e download
  const blob = new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
  
  return { success: true, filename, rowCount: data.length };
}

function createExcelXML(data: Array<Record<string, unknown>>, columns: Array<Record<string, unknown>>, options: { sheetName?: string; includeHeaders?: boolean } = {}) {
  const exportableCols = columns.filter(c => c.exportable !== false);
  
  let rows = '';
  
  // Header row
  if (options.includeHeaders) {
    rows += '<Row>';
    exportableCols.forEach(col => {
      rows += `<Cell><Data ss:Type="String">${escapeXml(col.label || col.id)}</Data></Cell>`;
    });
    rows += '</Row>\n';
  }
  
  // Data rows
  data.forEach(row => {
    rows += '<Row>';
    exportableCols.forEach(col => {
      const value = row[col.id as string];
      const type = getExcelType(col.type, value);
      const formattedValue = formatValueForExcel(value, col.type);
      rows += `<Cell><Data ss:Type="${type}">${escapeXml(formattedValue)}</Data></Cell>`;
    });
    rows += '</Row>\n';
  });
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="R$ #,##0.00"/>
  </Style>
  <Style ss:ID="Date">
   <NumberFormat ss:Format="dd/mm/yyyy"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(options.sheetName || 'Dados')}">
  <Table>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function getExcelType(colType: unknown, value: unknown) {
  if (value == null || value === '') return 'String';
  
  switch (colType) {
    case 'number':
    case 'currency':
    case 'percent':
    case 'integer':
      return 'Number';
    case 'date':
    case 'datetime':
      return 'DateTime';
    default:
      return 'String';
  }
}

function formatValueForExcel(value: unknown, type: unknown): string {
  if (value == null) return '';

  switch (type) {
    case 'date':
    case 'datetime':
      const d = new Date(value as string | number);
      return isNaN(d.getTime()) ? String(value) : d.toISOString();
    case 'boolean':
      return value ? 'Sim' : 'Não';
    default:
      return String(value);
  }
}

function escapeXml(str: unknown) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { exportToExcel, info, healthCheck, VERSION, MODULE_ID };
