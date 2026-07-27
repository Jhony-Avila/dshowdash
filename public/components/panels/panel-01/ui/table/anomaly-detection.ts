// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/anomaly-detection
// PURPOSE: Panel-01 - Anomaly Detection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ANOMALY_TYPES — exported value
//   AnomalyDetector() — exported function
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
export const MODULE_ID = 'panel-01/ui/anomaly-detection';

const SVGS = {
  high: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  medium: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  low: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

export const ANOMALY_TYPES = { HIGH_VALUE: 'high_value', LOW_VALUE: 'low_value', OUTLIER: 'outlier', UNUSUAL_PATTERN: 'unusual_pattern' };

export function AnomalyDetector(this: any, options: Record<string, unknown>) { this.valueField = (options.valueField as string) || 'valor_total'; this.dateField = (options.dateField as string) || 'Data_Requisicao'; this.threshold = (options.threshold as number) || 2; this.onAnomalyFound = (options.onAnomalyFound as (...args: unknown[]) => void) || (() => {}); this._data = []; this._anomalies = []; this._stats = null; }

AnomalyDetector.prototype.setData = function(data: unknown[]) { this._data = data || []; this._calculateStats(); this._detectAnomalies(); };

AnomalyDetector.prototype._calculateStats = function() {
  const self = this;
  const values = this._data.map((item: Record<string, unknown>) => parseFloat(String(item[self.valueField] || item.valor_total || item.Valor_Total || 0))).filter((v: number) => !isNaN(v));
  if (values.length === 0) { this._stats = { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, iqr: 0 }; return; }
  const sorted = values.slice().sort((a: number, b: number) => a - b);
  const sum = values.reduce((a: number, b: number) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const median = this._percentile(sorted, 50);
  const q1 = this._percentile(sorted, 25);
  const q3 = this._percentile(sorted, 75);
  const iqr = q3 - q1;
  this._stats = { mean, stdDev, median, q1, q3, iqr, min: sorted[0], max: sorted[sorted.length - 1], count: values.length };
};

AnomalyDetector.prototype._percentile = (sorted: number[], p: number) => { const index = (p / 100) * (sorted.length - 1); const lower = Math.floor(index); const upper = Math.ceil(index); if (lower === upper) return sorted[lower]; return sorted[lower] * (upper - index) + sorted[upper] * (index - lower); };

AnomalyDetector.prototype._detectAnomalies = function() {
  const self = this;
  this._anomalies = [];
  if (!this._stats || this._stats.count === 0) return;
  const upperBound = this._stats.q3 + (this._stats.iqr * this.threshold);
  const lowerBound = this._stats.q1 - (this._stats.iqr * this.threshold);
  const zThreshold = this.threshold;
  this._data.forEach((item: Record<string, unknown>, index: number) => {
    const value = parseFloat(String(item[self.valueField] || item.valor_total || item.Valor_Total || 0));
    if (isNaN(value)) return;
    const zScore = self._stats.stdDev > 0 ? (value - self._stats.mean) / self._stats.stdDev : 0;
    let anomaly: Record<string, unknown> | null = null;
    if (value > upperBound || zScore > zThreshold) { anomaly = { type: ANOMALY_TYPES.HIGH_VALUE, severity: 'high', reason: 'Valor muito acima da média' }; }
    else if (value < lowerBound || zScore < -zThreshold) { anomaly = { type: ANOMALY_TYPES.LOW_VALUE, severity: 'medium', reason: 'Valor muito abaixo da média' }; }
    else if (Math.abs(zScore) > zThreshold * 0.7) { anomaly = { type: ANOMALY_TYPES.OUTLIER, severity: 'low', reason: 'Valor fora do padrão' }; }
    if (anomaly) { anomaly.item = item; anomaly.index = index; anomaly.value = value; anomaly.zScore = zScore; anomaly.deviation = ((value - self._stats.mean) / self._stats.mean * 100).toFixed(1); self._anomalies.push(anomaly); }
  });
  this._anomalies.sort((a: Record<string, unknown>, b: Record<string, unknown>) => Math.abs(b.zScore as number) - Math.abs(a.zScore as number));
  if (this._anomalies.length > 0) { this.onAnomalyFound(this._anomalies); }
};

AnomalyDetector.prototype.getAnomalies = function() { return this._anomalies.slice(); };
AnomalyDetector.prototype.getStats = function() { return Object.assign({}, this._stats); };
AnomalyDetector.prototype.isAnomaly = function(item: Record<string, unknown>) { const id = item.id || item.Id_Requisicao; return this._anomalies.some((a: Record<string, unknown>) => { const aItem = a.item as Record<string, unknown>; const aId = aItem.id || aItem.Id_Requisicao; return aId === id; }); };
AnomalyDetector.prototype.getAnomalyInfo = function(item: Record<string, unknown>) { const id = item.id || item.Id_Requisicao; return this._anomalies.find((a: Record<string, unknown>) => { const aItem = a.item as Record<string, unknown>; const aId = aItem.id || aItem.Id_Requisicao; return aId === id; }); };

AnomalyDetector.prototype.getRowStyle = function(item: Record<string, unknown>) {
  const anomaly = this.getAnomalyInfo(item) as Record<string, unknown> | null | undefined;
  if (!anomaly) return null;
  const styles: Record<string, string> = { high: 'background: linear-gradient(90deg, rgba(239,68,68,0.1) 0%, transparent 100%); border-left: 3px solid #ef4444;', medium: 'background: linear-gradient(90deg, rgba(245,158,11,0.1) 0%, transparent 100%); border-left: 3px solid #f59e0b;', low: 'background: linear-gradient(90deg, rgba(59,130,246,0.1) 0%, transparent 100%); border-left: 3px solid #3b82f6;' };
  return styles[anomaly.severity as string] || null;
};

AnomalyDetector.prototype.renderBadge = function(item: Record<string, unknown>) {
  const anomaly = this.getAnomalyInfo(item) as Record<string, unknown> | null | undefined;
  if (!anomaly) return '';
  const icons: Record<string, string> = { high: SVGS.high, medium: SVGS.medium, low: SVGS.low };
  const colors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
  return `<span class="p01-anomaly-badge" style="color: ${colors[anomaly.severity as string]}" title="${anomaly.reason} (${anomaly.deviation}%)">${icons[anomaly.severity as string]}</span>`;
};

AnomalyDetector.prototype.setThreshold = function(threshold: number) { this.threshold = threshold; this._detectAnomalies(); };
AnomalyDetector.prototype.destroy = function() { this._data = []; this._anomalies = []; this._stats = null; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { AnomalyDetector, ANOMALY_TYPES, info, healthCheck };
