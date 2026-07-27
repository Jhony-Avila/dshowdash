// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-15:ui:formatters
// PURPOSE: Panel-15 - Formatters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatNumber() — exported function
//   formatPercent() — exported function
//   formatDateTime() — exported function
//   formatDuration() — exported function
//   escape() — exported function
//   info() — exported function
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
export const MODULE_ID = 'panel-15:ui:formatters';

export function formatNumber(value: unknown) {
    if (value == null) return '--';
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return num.toLocaleString('pt-BR');
}

export function formatPercent(value: unknown) {
    if (value == null) return '--';
    const num = parseFloat(String(value));
    if (isNaN(num)) return String(value);
    return `${num.toFixed(1)}%`;
}

export function formatDateTime(date: unknown) {
    if (!date) return '--';
    try {
        return new Date(date as string | number).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return String(date); }
}

export function formatDuration(seconds: unknown) {
    if (seconds == null) return '--';
    const num = parseFloat(String(seconds));
    if (isNaN(num)) return String(seconds);
    if (num < 1) return `${(num * 1000).toFixed(0)}ms`;
    if (num < 60) return `${num.toFixed(2)}s`;
    return `${(num / 60).toFixed(1)}min`;
}

export function escape(str: unknown) {
    if (!str) return '';
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { formatNumber, formatPercent, formatDateTime, formatDuration, escape };
