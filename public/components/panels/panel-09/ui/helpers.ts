// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: helpers
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createButton() — exported function
//   createBadge() — exported function
//   createTooltip() — exported function
//   formatCellValue() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-09.ui.helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 09 - UI Helpers
 * @module panel-09/ui/helpers
 * @version 1.1.0-AAA
 */

export function createButton(text: string, options: Record<string, unknown> = {}) {
    const { type = 'default', icon = null, disabled = false, onClick } = options;
    const btn = document.createElement('button');
    btn.className = `btn btn-${type}`;
    btn.disabled = disabled as boolean;
    btn.innerHTML = icon ? `<i class="fas ${icon}"></i> ${text}` : text;
    if (onClick) btn.addEventListener('click', onClick as EventListener);
    return btn;
}

export function createBadge(text: string, type: string = 'info') {
    return `<span class="badge badge-${type}">${text}</span>`;
}

export function createTooltip(element: HTMLElement, text: string) {
    element.setAttribute('title', text);
    element.setAttribute('data-toggle', 'tooltip');
}

export function formatCellValue(value: unknown, type: string = 'text') {
    if (value == null) return '-';
    if (type === 'date') return new Date(value as string | number).toLocaleDateString('pt-BR');
    if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
    return String(value);
}

export default { createButton, createBadge, createTooltip, formatCellValue };

// ── Alias exports required by consumers ──────────────────────────────────────

export const ARROW_SVGS: Record<string, string> = {
    up: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M5 2l4 6H1z" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M5 8L1 2h8z" fill="currentColor"/></svg>',
    neutral: '<svg viewBox="0 0 10 10" width="10" height="10"><rect x="1" y="4" width="8" height="2" fill="currentColor"/></svg>',
};

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function formatNumber(value: number, decimals: number = 2, locale: string = 'pt-BR'): string {
    if (value == null || isNaN(value)) return '-';
    return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function getChangeArrow(value: number): string {
    if (value > 0) return ARROW_SVGS.up;
    if (value < 0) return ARROW_SVGS.down;
    return ARROW_SVGS.neutral;
}

export function getChangeColor(value: number): string {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
}

export function getRateColor(rate: number, thresholdWarn: number = 80, thresholdDanger: number = 95): string {
    if (rate >= thresholdDanger) return 'text-danger';
    if (rate >= thresholdWarn) return 'text-warning';
    return 'text-success';
}

// ── Missing alias exports required by consumers ───────────────────────────────

/**
 * formatTime — formats a date/timestamp into a human-readable time string (HH:MM:SS).
 * Alias export required by panel-09 consumers.
 */
export function formatTime(value: string | number | Date, locale: string = 'pt-BR'): string {
    if (value == null) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleTimeString(locale);
}

/**
 * hashData — produces a lightweight non-cryptographic hash string from any value.
 * Alias export required by panel-09 consumers.
 */
export function hashData(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return (hash >>> 0).toString(16);
}
