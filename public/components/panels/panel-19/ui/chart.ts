// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: chart
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initChart() — exported function
//   updateChart() — exported function
//   destroyChart() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).Chart
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-19.ui.chart';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 19 - Chart UI
 * @module panel-19/ui/chart
 * @version 1.1.0-AAA
 */

export function initChart(container: HTMLElement, options: Record<string, unknown> = {}) {
    const { type = 'line', data = [], labels = [] } = options;
    
    const chartConfig = {
        type,
        data: { labels, datasets: [{ data }] },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    };
    
    if ((window as any).Chart && container) {
        return new (window as any).Chart(container, chartConfig);
    }
    
    return null;
}

export function updateChart(chart: { data: { labels: unknown[]; datasets: Array<{ data: unknown[] }> }; update(): void } | null, data: unknown[], labels: unknown[]) {
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

export function destroyChart(chart: { destroy?(): void } | null) {
    if (chart?.destroy) chart.destroy();
}

export default { initChart, updateChart, destroyChart };
