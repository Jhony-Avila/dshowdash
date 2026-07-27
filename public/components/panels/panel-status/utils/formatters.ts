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
//   formatStatus() — exported function
//   formatUptime() — exported function
//   formatBytes() — exported function
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

export const MODULE_ID = 'panel-status.utils.formatters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Status - Formatters
 * @module panel-status/utils/formatters
 * @version 1.1.0-AAA
 */

export function formatStatus(status: string) {
    const statusMap: Record<string, { label: string; class: string; icon: string }> = {
        online: { label: 'Online', class: 'status-online', icon: 'fa-check-circle' },
        offline: { label: 'Offline', class: 'status-offline', icon: 'fa-times-circle' },
        warning: { label: 'Alerta', class: 'status-warning', icon: 'fa-exclamation-triangle' },
        error: { label: 'Erro', class: 'status-error', icon: 'fa-exclamation-circle' },
        unknown: { label: 'Desconhecido', class: 'status-unknown', icon: 'fa-question-circle' }
    };
    return statusMap[status] || statusMap.unknown;
}

export function formatUptime(seconds: number) {
    if (!seconds || seconds < 0) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ') || '< 1m';
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
