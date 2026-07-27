// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/summary-row
// PURPOSE: Panel-01 - Summary Row
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AGGREGATIONS — exported value
//   SummaryRowManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/summary-row';

export const AGGREGATIONS = { SUM: 'sum', AVG: 'avg', COUNT: 'count', MIN: 'min', MAX: 'max' };

export function SummaryRowManager(this: any, options: Record<string, unknown> = {}) {
  this.columns = options.columns || [];
  this.aggregations = options.aggregations || {};
  this.formatters = options.formatters || {};
  this._data = [];
  this._summary = {};
}

SummaryRowManager.prototype.setColumns = function(columns: unknown[]) { this.columns = columns; };
SummaryRowManager.prototype.setData = function(data: unknown[]) { this._data = data || []; this._calculate(); };
SummaryRowManager.prototype._calculate = function() {
  this._summary = { _count: this._data.length };
  Object.keys(this.aggregations).forEach((field: string) => {
    const type = this.aggregations[field];
    const values = this._data.map((row: Record<string, unknown>) => parseFloat(String(row[field])) || 0).filter((v: number) => !isNaN(v));
    if (values.length === 0) { this._summary[field] = null; return; }
    switch (type) {
      case AGGREGATIONS.SUM: this._summary[field] = values.reduce((a: number, b: number) => a + b, 0); break;
      case AGGREGATIONS.AVG: this._summary[field] = values.reduce((a: number, b: number) => a + b, 0) / values.length; break;
      case AGGREGATIONS.COUNT: this._summary[field] = values.length; break;
      case AGGREGATIONS.MIN: this._summary[field] = Math.min(...values); break;
      case AGGREGATIONS.MAX: this._summary[field] = Math.max(...values); break;
      default: this._summary[field] = null;
    }
  });
};
SummaryRowManager.prototype.getSummary = function() { return { ...this._summary }; };
SummaryRowManager.prototype.setAggregation = function(field: string, type: string) { this.aggregations[field] = type; this._calculate(); };
SummaryRowManager.prototype.destroy = function() { this._data = []; this._summary = {}; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
export default { SummaryRowManager, AGGREGATIONS, info, healthCheck };
