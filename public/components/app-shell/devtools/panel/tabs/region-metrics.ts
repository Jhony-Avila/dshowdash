// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/region-metrics
// PURPOSE: Renderização da tab Region Metrics no Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, statusClass, formatTime, getAppShell from ../helpers.js
// EXPORTS:
//   renderRegionMetricsTab — Retorna HTML da tab
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevtoolsPanelTabRegionMetrics
 * @description Tab de métricas de região no Debug Panel
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { icon, sanitizeAttr, statusClass, formatTime, getAppShell } from '../helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.region-metrics';

/**
 * Renderiza a tab de Region Metrics
 * @returns {string} HTML da tab
 */
export function renderRegionMetricsTab() {
    const shell = getAppShell();
    if (!shell || !shell.regionMetrics) {
        return '<div class="dsd-ui-empty">RegionMetrics not available</div>';
    }
    
    try {
        const allMetrics = shell.regionMetrics.getAllMetrics();
        const summary = shell.regionMetrics.getPerformanceSummary();
        const problematic = shell.regionMetrics.getProblematicRegions();
        const isEnabled = shell.regionMetrics.isEnabled();
        
        const regionsHtml = Object.keys(allMetrics).map(region => {
            const m = allMetrics[region];
            const hasIssue = problematic.some((p: DynObj) => p.region === region);
            return `<div class="dsd-ui-region-metric ${hasIssue ? 'has-issue' : ''}"><div class="dsd-ui-region-metric__name">${sanitizeAttr(region)}${hasIssue ? ` ${icon('alertTriangle', 12)}` : ''}</div><div class="dsd-ui-region-metric__stats"><span>Renders: ${m.renderCount}</span><span>Updates: ${m.updateCount}</span><span>Errors: <span class="${m.errorCount > 0 ? 'dsd-ui-status--unhealthy' : 'dsd-ui-status--healthy'}">${m.errorCount}</span></span><span>Avg: ${formatTime(m.avgRenderTime || 0)}</span></div></div>`;
        }).join('');
        
        return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('metrics')} Region Metrics</div><div class="dsd-ui-toolbar"><button class="dsd-ui-btn ${isEnabled ? 'active' : ''}" id="btn-toggle-metrics">${icon(isEnabled ? 'pause' : 'play', 14)} ${isEnabled ? 'Disable' : 'Enable'}</button><button class="dsd-ui-btn" id="btn-reset-metrics">${icon('refresh', 14)} Reset</button></div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Slowest</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(summary.slowestRegion || 'N/A')}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Active</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${sanitizeAttr(summary.mostActiveRegion || 'N/A')}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Most Errors</div><div class="dsd-ui-card__value dsd-ui-card__value--sm ${summary.mostErrorsRegion ? 'dsd-ui-status--unhealthy' : 'dsd-ui-status--healthy'}">${sanitizeAttr(summary.mostErrorsRegion || 'None')}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Problematic</div><div class="dsd-ui-card__value">${problematic.length}</div></div></div></div><div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('regions')} Per Region</div>${regionsHtml}</div>`;
    } catch (e: any) {
        return `<div class="dsd-ui-empty">Error rendering region metrics: ${sanitizeAttr(e.message)}</div>`;
    }
}
