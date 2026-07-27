// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/data-trends
// PURPOSE: Panel-01 - Data Trends
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PERIODS — exported value
//   DataTrendsManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/data-trends';

export const PERIODS = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };

export function DataTrendsManager(this: any, options: Record<string, unknown> = {}) {
    options = options || {};
    this.valueField = options.valueField || 'valor_total';
    this.dateField = options.dateField || 'Data_Requisicao';
    this._currentData = [];
    this._previousData = [];
}

DataTrendsManager.prototype.setData = function(currentData: unknown[], previousData: unknown[]) {
    this._currentData = currentData || [];
    this._previousData = previousData || [];
};

DataTrendsManager.prototype.calculateTrends = function() {
    const current = this._aggregateData(this._currentData);
    const previous = this._aggregateData(this._previousData);
    return {
        count: this._calculateTrend(current.count, previous.count),
        total: this._calculateTrend(current.total, previous.total),
        average: this._calculateTrend(current.average, previous.average),
        current,
        previous
    };
};

DataTrendsManager.prototype._aggregateData = function(data: Record<string, unknown>[]) {
    const self = this;
    if (!data || data.length === 0) return { count: 0, total: 0, average: 0 };
    const values = data.map((item: Record<string, unknown>) => parseFloat((item[self.valueField] || item.valor_total || 0) as string)).filter((v: number) => !isNaN(v));
    const total = values.reduce((a: number, b: number) => a + b, 0);
    return { count: data.length, total, average: values.length > 0 ? total / values.length : 0 };
};

DataTrendsManager.prototype._calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: current, change: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return { value: current, previous, change, direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' };
};

DataTrendsManager.prototype.destroy = function() {
    this._currentData = [];
    this._previousData = [];
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { DataTrendsManager, PERIODS, info, healthCheck };
