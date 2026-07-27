const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/summary-row";
const AGGREGATIONS = { SUM: "sum", AVG: "avg", COUNT: "count", MIN: "min", MAX: "max" };
function SummaryRowManager(options = {}) {
  this.columns = options.columns || [];
  this.aggregations = options.aggregations || {};
  this.formatters = options.formatters || {};
  this._data = [];
  this._summary = {};
}
SummaryRowManager.prototype.setColumns = function(columns) {
  this.columns = columns;
};
SummaryRowManager.prototype.setData = function(data) {
  this._data = data || [];
  this._calculate();
};
SummaryRowManager.prototype._calculate = function() {
  this._summary = { _count: this._data.length };
  Object.keys(this.aggregations).forEach((field) => {
    const type = this.aggregations[field];
    const values = this._data.map((row) => parseFloat(String(row[field])) || 0).filter((v) => !isNaN(v));
    if (values.length === 0) {
      this._summary[field] = null;
      return;
    }
    switch (type) {
      case AGGREGATIONS.SUM:
        this._summary[field] = values.reduce((a, b) => a + b, 0);
        break;
      case AGGREGATIONS.AVG:
        this._summary[field] = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case AGGREGATIONS.COUNT:
        this._summary[field] = values.length;
        break;
      case AGGREGATIONS.MIN:
        this._summary[field] = Math.min(...values);
        break;
      case AGGREGATIONS.MAX:
        this._summary[field] = Math.max(...values);
        break;
      default:
        this._summary[field] = null;
    }
  });
};
SummaryRowManager.prototype.getSummary = function() {
  return { ...this._summary };
};
SummaryRowManager.prototype.setAggregation = function(field, type) {
  this.aggregations[field] = type;
  this._calculate();
};
SummaryRowManager.prototype.destroy = function() {
  this._data = [];
  this._summary = {};
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var summary_row_default = { SummaryRowManager, AGGREGATIONS, info, healthCheck };
export {
  AGGREGATIONS,
  MODULE_ID,
  SummaryRowManager,
  VERSION,
  summary_row_default as default,
  healthCheck,
  info
};
