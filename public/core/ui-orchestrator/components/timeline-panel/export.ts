// Timeline Panel - Export Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Exportação de dados do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-export';
const VERSION = '1.0.1-P2-ENTERPRISE';

import { getState } from './state.js';

const exportToJSON = () => {
    const state = getState();
    return JSON.stringify(state.events, null, 2);
};

const exportToCSV = () => {
    const state = getState();
    const headers = 'id,timestamp,type,message\n';
    const rows = state.events.map((evt: unknown) => {
        const e = evt as Record<string, unknown>;
        return `${e.id},${e.timestamp},${e.type},"${e.message}"`;
    }).join('\n');
    return headers + rows;
};

const downloadExport = (format = 'json') => {
    const data = format === 'csv' ? exportToCSV() : exportToJSON();
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
};

export { exportToJSON, exportToCSV, downloadExport, MODULE_ID, VERSION };
