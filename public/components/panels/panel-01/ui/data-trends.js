const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/data-trends";
const PERIODS = { DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" };
function DataTrendsManager(options = {}) {
  options = options || {};
  this.valueField = options.valueField || "valor_total";
  this.dateField = options.dateField || "Data_Requisicao";
  this._currentData = [];
  this._previousData = [];
}
DataTrendsManager.prototype.setData = function(currentData, previousData) {
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
DataTrendsManager.prototype._aggregateData = function(data) {
  const self = this;
  if (!data || data.length === 0) return { count: 0, total: 0, average: 0 };
  const values = data.map((item) => parseFloat(item[self.valueField] || item.valor_total || 0)).filter((v) => !isNaN(v));
  const total = values.reduce((a, b) => a + b, 0);
  return { count: data.length, total, average: values.length > 0 ? total / values.length : 0 };
};
DataTrendsManager.prototype._calculateTrend = (current, previous) => {
  if (previous === 0) return { value: current, change: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "neutral" };
  const change = (current - previous) / previous * 100;
  return { value: current, previous, change, direction: change > 0 ? "up" : change < 0 ? "down" : "neutral" };
};
DataTrendsManager.prototype.destroy = function() {
  this._currentData = [];
  this._previousData = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var data_trends_default = { DataTrendsManager, PERIODS, info, healthCheck };
export {
  DataTrendsManager,
  MODULE_ID,
  PERIODS,
  VERSION,
  data_trends_default as default,
  healthCheck,
  info
};
