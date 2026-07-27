// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/data-comparison
// PURPOSE: Panel-01 - Data Comparison
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DataComparisonManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/data-comparison';

export function DataComparisonManager(this: any, options: Record<string, unknown> = {}) {
  this.dateField = options.dateField || 'Data_Requisicao';
  this.valueField = options.valueField || 'valor_total';
  this.groupByField = options.groupByField || 'situacao';
  this._period1Data = [];
  this._period2Data = [];
  this._period1Label = 'Período 1';
  this._period2Label = 'Período 2';
}

DataComparisonManager.prototype.setPeriods = function(period1Data: unknown[], period2Data: unknown[], labels: Record<string, string>) {
  this._period1Data = period1Data || [];
  this._period2Data = period2Data || [];
  if (labels) { this._period1Label = labels.period1 || 'Período 1'; this._period2Label = labels.period2 || 'Período 2'; }
};
DataComparisonManager.prototype.compare = function() {
  const p1Stats = this._calculateStats(this._period1Data);
  const p2Stats = this._calculateStats(this._period2Data);
  return { period1: { label: this._period1Label, stats: p1Stats }, period2: { label: this._period2Label, stats: p2Stats }, diff: this._calculateDiff(p1Stats, p2Stats) };
};
DataComparisonManager.prototype._calculateStats = function(data: Record<string, unknown>[]) {
  if (!data || data.length === 0) return { count: 0, total: 0, average: 0 };
  const values = data.map((item: Record<string, unknown>) => parseFloat((item[this.valueField] || item.valor_total || 0) as string)).filter((v: number) => !isNaN(v));
  const total = values.reduce((a: number, b: number) => a + b, 0);
  return { count: data.length, total, average: values.length > 0 ? total / values.length : 0 };
};
DataComparisonManager.prototype._calculateDiff = (p1: Record<string, number>, p2: Record<string, number>) => {
  const calcDiff = (v1: number, v2: number) => { if (v2 === 0) return v1 > 0 ? 100 : 0; return ((v1 - v2) / v2) * 100; };
  return { count: { value: p1.count - p2.count, percent: calcDiff(p1.count, p2.count) }, total: { value: p1.total - p2.total, percent: calcDiff(p1.total, p2.total) } };
};
DataComparisonManager.prototype.destroy = function() { this._period1Data = []; this._period2Data = []; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });
export default { DataComparisonManager, info, healthCheck };
