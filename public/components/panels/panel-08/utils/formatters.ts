// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08-formatters
// PURPOSE: Panel-08 Formatters Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   formatRelativeTime() — exported function
//   formatDateTime() — exported function
//   formatSeverity() — exported function
//   formatAlertType() — exported function
//   formatNumber() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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

export const MODULE_ID = 'panel-08-formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function formatRelativeTime(dateStr: string) {
    if (!dateStr) return '--';
    try {
        const date = new Date(dateStr);
        const now = new Date();

        // @ts-expect-error TS migration - TS2362, TS2363
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    } catch (e) { return dateStr; }
}

export function formatDateTime(dateStr: string) {
    if (!dateStr) return '--';
    try {
        return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return dateStr; }
}

export function formatSeverity(severity: string) {
    const map: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };
    const key = severity ? severity.toLowerCase() : '';
    return map[key] || severity || '--';
}

export function formatAlertType(type: string) {
    const map: Record<string, string> = { ERROR: 'Erro', WARNING: 'Aviso', INFO: 'Info', SUCCESS: 'Sucesso' };
    return map[type] || type || '--';
}

export function formatNumber(value: number | string | null | undefined) {
    if (value == null) return '--';
    const num = parseFloat(String(value));
    return isNaN(num) ? String(value) : num.toLocaleString('pt-BR');
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function getVersion() { return VERSION; }
export default { MODULE_ID, VERSION, formatRelativeTime, formatDateTime, formatSeverity, formatAlertType, formatNumber, getVersion, info, healthCheck };
