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
//   createChart() — exported function
//   updateChartData() — exported function
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

export const MODULE_ID = 'panel-11.ui.chart';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 11 - Chart UI
 * @module panel-11/ui/chart
 * @version 1.1.0-AAA
 */

export function createChart(container: HTMLElement, { type = 'bar', data = [] as unknown[], labels = [] as string[], options = {} as Record<string, unknown> }) {
    if (!(window as any).Chart || !container) return null;
    
    const config = {
        type,
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: options.colors || ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            ...options
        }
    };
    
    return new (window as any).Chart(container, config);
}

interface ChartInstance {
    data: { labels?: string[]; datasets: Array<{ data: unknown[] }> };
    update(): void;
    destroy(): void;
}

export function updateChartData(chart: ChartInstance, data: unknown[], labels: string[]) {
    if (!chart) return;
    if (labels) chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}

export function destroyChart(chart: ChartInstance | null) {
    chart?.destroy?.();
}

export default { createChart, updateChartData, destroyChart };
