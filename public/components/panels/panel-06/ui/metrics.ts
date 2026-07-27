// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderMetricCard() — exported function
//   renderMetricsGrid() — exported function
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

export const MODULE_ID = 'panel-06.ui.metrics';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 06 - Metrics UI
 * @module panel-06/ui/metrics
 * @version 1.1.0-AAA
 */

export function renderMetricCard(container: HTMLElement | null, { label, value, unit = '', trend = null }: { label: string; value: string | number; unit?: string; trend?: number | null }) {
    const trendIcon = trend! > 0 ? 'fa-arrow-up text-success' : trend! < 0 ? 'fa-arrow-down text-danger' : '';
    const trendClass = trend! > 0 ? 'positive' : trend! < 0 ? 'negative' : 'neutral';
    
    const html = `
        <div class="metric-card">
            <div class="metric-label">${label}</div>
            <div class="metric-value">${value}${unit ? `<span class="metric-unit">${unit}</span>` : ''}</div>
            ${trend !== null ? `<div class="metric-trend ${trendClass}"><i class="fas ${trendIcon}"></i> ${Math.abs(trend)}%</div>` : ''}
        </div>
    `;
    
    if (container instanceof HTMLElement) {
        container.innerHTML = html;
    }
    return html;
}

export function renderMetricsGrid(container: HTMLElement | null, metrics: { label: string; value: string | number; unit?: string; trend?: number | null }[] = []) {
    const html = `<div class="metrics-grid">${metrics.map(m => renderMetricCard(null, m)).join('')}</div>`;
    if (container instanceof HTMLElement) {
        container.innerHTML = html;
    }
    return html;
}

export default { renderMetricCard, renderMetricsGrid };
