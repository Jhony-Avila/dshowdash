// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-09-ui-comparisons
// PURPOSE: Painel-09 UI Components
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

const ARROW_SVGS = {
  up: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>',
  right: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="9 18 15 12 9 6"/></svg>'
};

export class ComparisonsGrid {
  [key: string]: any;
  constructor(container: HTMLElement) { this.container = container; this.element = null; }

  render() { this.element = document.createElement('div'); this.element.className = 'p09-grid'; this.element.id = 'p09-comparisons-grid'; this.container.appendChild(this.element); return this.element; }

  update(comparisons: Record<string, unknown>[]) { if (!this.element || !comparisons || comparisons.length === 0) { this.showEmpty(); return; } this.element.innerHTML = comparisons.map((comp: Record<string, unknown>) => this.renderCard(comp)).join(''); }

  renderCard(comparison: Record<string, unknown>) {
    const current = comparison.current as Record<string, number>;
    const previous = comparison.previous as Record<string, number>;
    const currentTotal = current.total;
    const previousTotal = previous.total;
    const diff = currentTotal - previousTotal;
    const diffPercent = previousTotal > 0 ? ((diff / previousTotal) * 100).toFixed(1) : 0;
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const statusClass = isPositive ? 'positive' : (isNegative ? 'negative' : 'neutral');
    const arrow = isPositive ? ARROW_SVGS.up : (isNegative ? ARROW_SVGS.down : ARROW_SVGS.right);

    // @ts-expect-error TS migration - TS2345
    return `<div class="p09-comparison-card ${statusClass}"><div class="p09-card-title">${comparison.title}</div><div class="p09-metrics"><div class="p09-metric current"><div class="p09-metric-label">${comparison.currentLabel}</div><div class="p09-metric-value">${this.formatNumber(currentTotal)}</div></div><div class="p09-metric previous"><div class="p09-metric-label">${comparison.previousLabel}</div><div class="p09-metric-value">${this.formatNumber(previousTotal)}</div></div><div class="p09-metric variation"><div class="p09-metric-label">Variação</div><div class="p09-metric-value ${statusClass}">${arrow} ${Math.abs(diffPercent)}%</div></div></div></div>`;
  }

  formatNumber(value: number) { return value.toLocaleString('pt-BR'); }

  showLoading() { if (!this.element) return; this.element.innerHTML = '<div class="p09-loading-state" role="status" aria-live="polite"><div class="p09-loading-spinner"></div><div>Carregando comparações...</div></div>'; }

  showEmpty() { if (!this.element) return; this.element.innerHTML = '<div class="p09-empty-state" role="status" aria-live="polite"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><div>Nenhum dado de comparação disponível</div></div>'; }

  showError(message: string) { if (!this.element) return; this.element.innerHTML = `<div class="p09-error-state" role="alert" aria-live="assertive"><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><div>${message || 'Erro ao carregar comparações'}</div></div>`; }

  destroy() { if (this.element) { this.element.remove(); this.element = null; } }
}

export const MODULE_ID = 'panels-panel-09-ui-comparisons';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } });
