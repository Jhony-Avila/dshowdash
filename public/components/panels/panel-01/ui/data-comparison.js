const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/data-comparison";
function DataComparisonManager(options = {}) {
  this.dateField = options.dateField || "Data_Requisicao";
  this.valueField = options.valueField || "valor_total";
  this.groupByField = options.groupByField || "situacao";
  this._period1Data = [];
  this._period2Data = [];
  this._period1Label = "Per\xEDodo 1";
  this._period2Label = "Per\xEDodo 2";
}
DataComparisonManager.prototype.setPeriods = function(period1Data, period2Data, labels) {
  this._period1Data = period1Data || [];
  this._period2Data = period2Data || [];
  if (labels) {
    this._period1Label = labels.period1 || "Per\xEDodo 1";
    this._period2Label = labels.period2 || "Per\xEDodo 2";
  }
};
DataComparisonManager.prototype.compare = function() {
  const p1Stats = this._calculateStats(this._period1Data);
  const p2Stats = this._calculateStats(this._period2Data);
  return { period1: { label: this._period1Label, stats: p1Stats }, period2: { label: this._period2Label, stats: p2Stats }, diff: this._calculateDiff(p1Stats, p2Stats) };
};
DataComparisonManager.prototype._calculateStats = function(data) {
  if (!data || data.length === 0) return { count: 0, total: 0, average: 0 };
  const values = data.map((item) => parseFloat(item[this.valueField] || item.valor_total || 0)).filter((v) => !isNaN(v));
  const total = values.reduce((a, b) => a + b, 0);
  return { count: data.length, total, average: values.length > 0 ? total / values.length : 0 };
};
DataComparisonManager.prototype._calculateDiff = (p1, p2) => {
  const calcDiff = (v1, v2) => {
    if (v2 === 0) return v1 > 0 ? 100 : 0;
    return (v1 - v2) / v2 * 100;
  };
  return { count: { value: p1.count - p2.count, percent: calcDiff(p1.count, p2.count) }, total: { value: p1.total - p2.total, percent: calcDiff(p1.total, p2.total) } };
};
DataComparisonManager.prototype.destroy = function() {
  this._period1Data = [];
  this._period2Data = [];
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var data_comparison_default = { DataComparisonManager, info, healthCheck };
export {
  DataComparisonManager,
  MODULE_ID,
  VERSION,
  data_comparison_default as default,
  healthCheck,
  info
};
