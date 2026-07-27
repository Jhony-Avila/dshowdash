// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: formatters
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   formatMetricValue() — exported function
//   formatDuration() — exported function
//   formatTimestamp() — exported function
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

export const MODULE_ID = 'panel-dashboard.utils.formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Dashboard - Formatters
 * @module panel-dashboard/utils/formatters
 * @version 1.1.0-AAA
 */

export function formatMetricValue(value: number, type: string = 'number') {
    if (value == null) return '-';
    
    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        case 'percentage':
            return `${(value * 100).toFixed(1)}%`;
        case 'duration':
            return formatDuration(value);
        default:
            return new Intl.NumberFormat('pt-BR').format(value);
    }
}

export function formatDuration(ms: number) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function formatTimestamp(date: string | number | Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium'
    }).format(new Date(date));
}
