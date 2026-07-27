// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: export
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   exportToCSV() — exported function
//   exportToJSON() — exported function
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

export const MODULE_ID = 'panel-16.ui.export';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Export Functionality
 * @module panel-16/ui/export
 * @version 1.1.0-AAA
 */

export function exportToCSV(data: Record<string, unknown>[], filename = 'export.csv') {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map((row: Record<string, unknown>) => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv');
}

export function exportToJSON(data: unknown, filename = 'export.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Alias exports (compatibility layer) ──────────────────────────────────────
export const exportCSV = exportToCSV;

export function exportSelected(data: Record<string, unknown>[], filename = 'export-selected.csv') {
    return exportToCSV(data, filename);
}

export function exportXLSX(data: Record<string, unknown>[], filename = 'export.xlsx') {
    // XLSX export: falls back to CSV with .xlsx extension for now
    return exportToCSV(data, filename);
}

export function exportPDF(_data: Record<string, unknown>[], _filename = 'export.pdf') {
    // PDF export: stub — not yet implemented
    console.warn('[panel-16/export] exportPDF: not yet implemented');
}

export default { exportToCSV, exportToJSON, exportCSV, exportSelected, exportXLSX, exportPDF };
