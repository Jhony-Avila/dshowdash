// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: kpis
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderKPIs() — exported function
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

export const MODULE_ID = 'panel-16.ui.render.kpis';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - KPIs Renderer
 * @module panel-16/ui/render/kpis
 * @version 1.1.0-AAA
 */

export function renderKPIs(container: HTMLElement, kpis: Array<Record<string, unknown>> = []) {
    const html = `
        <div class="kpis-container">
            ${kpis.map(kpi => `
                <div class="kpi-card ${kpi.highlight ? 'kpi-highlight' : ''}">
                    <div class="kpi-icon"><i class="fas ${kpi.icon || 'fa-chart-line'}"></i></div>
                    <div class="kpi-content">
                        <div class="kpi-label">${kpi.label}</div>
                        <div class="kpi-value">${kpi.value}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    if (container instanceof HTMLElement) {
        container.innerHTML = html;
    }
    return html;
}

export function renderQuickStats(kpis: Record<string, unknown>, displayCount: number, totalCount: number, searchTerm?: string, favorites?: Set<string> | Record<string, unknown>): string {
    const filteredLabel = searchTerm ? ` (filtrado de ${totalCount})` : '';
    return `
        <div class="p16-quick-stats">
            <span class="p16-qs-count">${displayCount} fornecedores${filteredLabel}</span>
        </div>
    `;
}

export function renderDistributions(kpis: Record<string, unknown>): string {
    return `<div class="p16-distributions-content">${kpis ? 'Distribuições carregadas' : ''}</div>`;
}

export function renderLoading(section: string): string {
    return `<div class="p16-loading p16-loading-${section}"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>`;
}

export default { renderKPIs, renderQuickStats, renderDistributions, renderLoading };
