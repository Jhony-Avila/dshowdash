const MODULE_ID = "panel-19-chart-renderer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function ChartRenderer(options) {
  if (!(this instanceof ChartRenderer)) return new ChartRenderer(options);
  options = options || {};
  this._config = { slaTarget: 95, height: 180 };
  if (options.config) {
    const cfg = options.config;
    for (const k in cfg) {
      if (cfg.hasOwnProperty(k)) this._config[k] = cfg[k];
    }
  }
}
ChartRenderer.prototype.setConfig = function(config) {
  for (const k in config) {
    if (config.hasOwnProperty(k)) this._config[k] = config[k];
  }
  return this;
};
ChartRenderer.prototype.render = function(params) {
  const chartData = params.chartData;
  const period = params.period;
  const config = params.config || {};
  const cfg = {};
  for (const k in this._config) {
    if (this._config.hasOwnProperty(k)) cfg[k] = this._config[k];
  }
  const configObj = config;
  for (const k2 in configObj) {
    if (configObj.hasOwnProperty(k2)) cfg[k2] = configObj[k2];
  }
  const periodObj = period;
  const periodDays = periodObj && periodObj.days ? periodObj.days : 30;
  return `<div style="padding:16px;height:260px;max-height:260px;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-shrink:0;"><span style="font-size:13px;font-weight:600;color:#f0f0f5;">Evolu\xE7\xE3o da Taxa de Sucesso</span><span style="font-size:11px;color:#606070;">${periodDays} dias</span></div><div style="display:flex;gap:8px;flex:1;min-height:0;max-height:180px;overflow:hidden;"><div style="display:flex;flex-direction:column;justify-content:space-between;font-size:10px;color:#606070;width:36px;text-align:right;padding-right:4px;flex-shrink:0;"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div style="flex:1;position:relative;background:#12121a;border-radius:4px;overflow:hidden;max-height:180px;">${this._renderSVG(chartData, cfg)}</div></div><div style="position:relative;height:24px;margin-top:8px;margin-left:44px;font-size:10px;color:#606070;flex-shrink:0;">${this._renderXAxis(chartData)}</div></div>`;
};
ChartRenderer.prototype._renderSVG = (chartData, config) => {
  if (!chartData || !chartData.length) return '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#606070;">Sem dados</div>';
  const slaY = (100 - config.slaTarget).toFixed(2);
  const pts = [];
  for (let i = 0; i < chartData.length; i++) {
    const d = chartData[i];
    pts.push({ x: (i / (chartData.length - 1 || 1) * 100).toFixed(2), y: (100 - d.success_rate).toFixed(2) });
  }
  const lineParts = [];
  for (let j = 0; j < pts.length; j++) {
    lineParts.push(`${(j === 0 ? "M" : "L") + pts[j].x},${pts[j].y}`);
  }
  const line = lineParts.join(" ");
  const area = `${line} L100,100 L0,100 Z`;
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="display:block;width:100%;height:100%;max-height:180px;"><defs><linearGradient id="p19g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22c55e" stop-opacity="0.2"/><stop offset="100%" stop-color="#22c55e" stop-opacity="0.02"/></linearGradient></defs><line x1="0" y1="25" x2="100" y2="25" stroke="#2a2a3a" stroke-width="0.3" stroke-dasharray="2"/><line x1="0" y1="50" x2="100" y2="50" stroke="#2a2a3a" stroke-width="0.3" stroke-dasharray="2"/><line x1="0" y1="75" x2="100" y2="75" stroke="#2a2a3a" stroke-width="0.3" stroke-dasharray="2"/><path d="${area}" fill="url(#p19g)"/><line x1="0" y1="${slaY}" x2="100" y2="${slaY}" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="3 2" opacity="0.7"/><path d="${line}" fill="none" stroke="#22c55e" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg><div style="position:absolute;right:8px;top:${slaY}%;transform:translateY(-50%);font-size:9px;color:#f59e0b;background:rgba(245,158,11,0.15);padding:2px 6px;border-radius:3px;">SLA ${config.slaTarget}%</div>`;
};
ChartRenderer.prototype._renderXAxis = (chartData) => {
  if (!chartData || !chartData.length) return "";
  const step = Math.max(1, Math.floor(chartData.length / 5));
  const filtered = [];
  for (let i = 0; i < chartData.length; i++) {
    if (i % step === 0) filtered.push(chartData[i]);
  }
  const parts = [];
  for (let j = 0; j < filtered.length; j++) {
    const d = filtered[j];
    const left = (j / (filtered.length - 1 || 1) * 100).toFixed(1);
    const date = /* @__PURE__ */ new Date(`${d.date}T00:00:00`);
    parts.push(`<span style="position:absolute;left:${left}%;transform:translateX(-50%);white-space:nowrap;">${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>`);
  }
  return parts.join("");
};
ChartRenderer.prototype.renderError = (msg) => `<div style="height:260px;display:flex;align-items:center;justify-content:center;color:#ef4444;">${msg || "Erro"}</div>`;
ChartRenderer.prototype.renderLoading = () => '<div style="height:260px;background:#12121a;display:flex;align-items:center;justify-content:center;color:#606070;">Carregando...</div>';
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var renderer_default = ChartRenderer;
export {
  ChartRenderer,
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info
};
