// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/performance
// PURPOSE: Renderização da tab Performance no Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, statusClass, formatBytes, formatTime, getAppShell from ../helpers.js
// EXPORTS:
//   renderPerformanceTab — Retorna HTML da tab de performance
// BROWSER APIs: performance.memory
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevtoolsPanelTabPerformance
 * @description Tab de métricas de performance no Debug Panel
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { icon, sanitizeAttr, statusClass, formatBytes, formatTime, getAppShell } from '../helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.performance';

/**
 * Renderiza a tab de Performance
 * @param {Object} renderTimings - Timings de renderização
 * @returns {string} HTML da tab
 */
export function renderPerformanceTab(renderTimings: DynObj) {
    const shell = getAppShell();
    if (!shell) return '<div class="dsd-ui-empty">AppShell not available</div>';
    
    try {
        const info = shell.info();
        const metrics = info.metrics;
        const perf = typeof performance !== 'undefined' ? performance : null;

        // @ts-expect-error TS migration - TS2339
        const memory = perf && perf.memory ? perf.memory : null;
        
        // Memory section
        const memoryHtml = memory 
            ? `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('memory')} Memory</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Used</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${formatBytes(memory.usedJSHeapSize)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${formatBytes(memory.totalJSHeapSize)}</div></div></div></div>`
            : '';
        
        // Render timings section
        let renderTimingsHtml = '';
        const timingKeys = Object.keys(renderTimings || {});
        if (timingKeys.length > 0) {
            const timingItems = timingKeys.map(tab => {
                const t = renderTimings[tab];
                const avgClass = t.avg > 50 ? 'dsd-ui-status--unhealthy' : t.avg > 20 ? 'dsd-ui-status--degraded' : 'dsd-ui-status--healthy';
                return `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(tab)}</span><span class="dsd-ui-list-item__value ${avgClass}">${t.avg.toFixed(1)}ms (last: ${t.last.toFixed(1)}ms, max: ${t.max.toFixed(1)}ms)</span></div>`;
            }).join('');
            renderTimingsHtml = `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('performance')} Tab Render Timings</div><div class="dsd-ui-list">${timingItems}</div></div>`;
        }
        
        // Phase timings
        const timingsHtml = Object.keys(info.phaseTimings || {}).map(phase => `<div class="dsd-ui-list-item"><span class="dsd-ui-list-item__label">${sanitizeAttr(phase)}</span><span class="dsd-ui-list-item__value">${formatTime(info.phaseTimings[phase])}</span></div>`).join('');
        
        return `<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('zap')} Boot Performance</div><div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Init Duration</div><div class="dsd-ui-card__value">${formatTime(metrics.initDuration || 0)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Boot Time</div><div class="dsd-ui-card__value">${formatTime(info.bootTime || 0)}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Init Count</div><div class="dsd-ui-card__value">${metrics.initCount}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Errors</div><div class="dsd-ui-card__value ${metrics.errors > 0 ? 'dsd-ui-status--unhealthy' : 'dsd-ui-status--healthy'}">${metrics.errors}</div></div></div></div>${memoryHtml}${renderTimingsHtml}<div class="dsd-ui-section"><div class="dsd-ui-section__title">${icon('clock')} Phase Timings</div><div class="dsd-ui-list">${timingsHtml}</div></div>`;
    } catch (e: any) {
        return `<div class="dsd-ui-empty">Error rendering performance: ${sanitizeAttr(e.message)}</div>`;
    }
}
