// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: chart-success-rate
// PURPOSE: Chart Component - Enterprise Inline
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ChartRenderer from ./renderer.js
//   ChartStore from ./store.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createChart() — exported function
//   info() — exported function
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

import { ChartRenderer } from './renderer.js';
import { ChartStore } from './store.js';

export const MODULE_ID = 'chart-success-rate';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export class ChartComponent {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.config = { slaTarget: 95, height: 180, ...(options.config as Record<string, unknown>) };
    this.container = null;

    // @ts-expect-error TS migration - TS2350
    this.renderer = new ChartRenderer({ config: this.config });
    this.store = new ChartStore();
    this._mounted = false;
    this._element = null;
    this._unsubscribe = null;
  }

  async mount(container: HTMLElement) {
    if (this._mounted) await this.unmount();
    if (!container) throw new Error('Container inválido');
    this.container = container;
    this.container.style.cssText = 'height:280px !important;max-height:280px !important;overflow:hidden !important;';
    this._element = document.createElement('div');
    this._element.style.cssText = 'width:100%;height:100%;max-height:280px;overflow:hidden;';
    this.container.innerHTML = '';
    this.container.appendChild(this._element);
    this._unsubscribe = this.store.subscribe(() => this._render());
    this._mounted = true;
    this.showLoading();
    return this;
  }

  async unmount() {
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._element) { this._element.remove(); this._element = null; }
    this.container = null;
    this._mounted = false;
    return this;
  }

  setConfig(config: Record<string, unknown>) { this.config = { ...this.config, ...config }; this.renderer.setConfig(this.config); return this; }

  setData(chartData: Record<string, unknown>[], options: Record<string, unknown> = {}) {
    if (!Array.isArray(chartData)) { this.store.setError('Dados inválidos'); return this; }
    const rates = chartData.map(d => (d.success_rate as number) || 0);
    const avg = rates.reduce((a: number, b: number) => a + b, 0) / rates.length;
    this.store.setData({
      chartData,
      analysis: { stats: { avg, min: Math.min(...rates), max: Math.max(...rates) } },
      period: options.period || { days: chartData.length },
      summary: options.summary || {}
    });
    return this;
  }

  _render() {
    if (!this._element || !this._mounted) return;
    const state = this.store.getState();
    if (state.loading) { this._element.innerHTML = this.renderer.renderLoading(); return; }
    if (state.error) { this._element.innerHTML = this.renderer.renderError(state.error); return; }
    if (state.data?.chartData?.length) { this._element.innerHTML = this.renderer.render({ chartData: state.data.chartData, period: state.data.period, config: this.config }); return; }
    this._element.innerHTML = '<div style="height:260px;display:flex;align-items:center;justify-content:center;color:#606070;">Sem dados</div>';
  }

  showLoading() { this.store.setLoading(true); }
  hideLoading() { this.store.setLoading(false); }
  healthCheck() { return { status: this._mounted ? 'HEALTHY' : 'NOT_MOUNTED', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, config: this.config, healthCheck: this.healthCheck(), timestamp: Date.now() }; }
}

export function createChart(options: Record<string, unknown> = {}) { return new ChartComponent(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export default ChartComponent;
