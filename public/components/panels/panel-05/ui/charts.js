import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:charts";
const icon = (name) => IconRegistry.get(name) || "";
const COLORS = { primary: "#3B82F6", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", purple: "#8B5CF6", cyan: "#06B6D4", gray: "#6B7280" };
const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan, COLORS.danger];
class ChartsRenderer {
  constructor() {
  }
  renderReceitaMensal(data = [], options = {}) {
    const { height = 200 } = options;
    if (!data?.length) return `<div class="p05-chart-empty"><p>Sem dados de receita mensal</p></div>`;
    const maxValue = Math.max(...data.map((d) => Number(d.valor) || 0));
    const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
    return `<div class="p05-chart p05-chart-bar"><div class="p05-chart-header"><h4 class="p05-chart-title">Receita Mensal</h4></div><div class="p05-chart-body" style="height: ${height}px"><div class="p05-bar-chart">${data.map((item, index) => {
      const heightPercent = maxValue > 0 ? Number(item.valor) / maxValue * 100 : 0;
      const isCurrent = index === currentMonth;
      return `<div class="p05-bar-item ${isCurrent ? "p05-bar-current" : ""}"><div class="p05-bar-value">${this._formatCurrencyCompact(item.valor)}</div><div class="p05-bar-track"><div class="p05-bar-fill" style="height: ${heightPercent}%"></div></div><div class="p05-bar-label">${item.mes}</div></div>`;
    }).join("")}</div></div></div>`;
  }
  renderDonutChart(data = [], options = {}) {
    const { title = "Por Tipo", size = 160 } = options;
    if (!data?.length) return `<div class="p05-chart-empty"><p>Sem dados</p></div>`;
    const total = data.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
    const radius = 40, hole = 25, center = 50;
    let cumulativePercent = 0;
    const segments = data.map((item, index) => {
      const percent = total > 0 ? Number(item.valor) / total * 100 : 0;
      const startAngle = cumulativePercent / 100 * 360;
      const endAngle = (cumulativePercent + percent) / 100 * 360;
      cumulativePercent += percent;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const x1 = center + radius * Math.cos(startRad), y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad), y2 = center + radius * Math.sin(endRad);
      const largeArc = percent > 50 ? 1 : 0;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return { path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`, color, item, percent };
    });
    return `<div class="p05-chart p05-chart-donut"><div class="p05-chart-header"><h4 class="p05-chart-title">${this._escapeHtml(title)}</h4></div><div class="p05-chart-body"><div class="p05-donut-container" style="width: ${size}px; height: ${size}px"><svg viewBox="0 0 100 100" class="p05-donut-svg">${segments.map((s) => `<path d="${s.path}" fill="${s.color}" class="p05-donut-segment" data-tipo="${s.item.tipo}"/>`).join("")}<circle cx="${center}" cy="${center}" r="${hole}" fill="var(--p05-bg-surface)" class="p05-donut-hole"/></svg><div class="p05-donut-center"><span class="p05-donut-total-label">Total</span><span class="p05-donut-total-value">${this._formatCurrencyCompact(total)}</span></div></div><div class="p05-donut-legend">${data.map((item, index) => {
      const percent = total > 0 ? (Number(item.valor) / total * 100).toFixed(1) : 0;
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return `<div class="p05-legend-item"><span class="p05-legend-color" style="background: ${color}"></span><span class="p05-legend-label">${this._escapeHtml(item.tipo)}</span><span class="p05-legend-value">${percent}%</span></div>`;
    }).join("")}</div></div></div>`;
  }
  renderTopClientes(clientes = [], options = {}) {
    const { limit = 5 } = options;
    if (!clientes?.length) return `<div class="p05-chart-empty"><p>Sem dados de clientes</p></div>`;
    const top = clientes.slice(0, Number(limit));
    const maxValue = Math.max(...top.map((c) => Number(c.receita) || 0));
    const medals = [icon("business:trophy"), icon("business:award"), icon("charts:target")];
    return `<div class="p05-chart p05-chart-ranking"><div class="p05-chart-header"><h4 class="p05-chart-title">Top Clientes</h4></div><div class="p05-chart-body"><div class="p05-ranking-list">${top.map((cliente, index) => {
      const widthPercent = maxValue > 0 ? Number(cliente.receita) / maxValue * 100 : 0;
      const medal = index < 3 ? medals[index] : `<span class="p05-rank-num">${index + 1}</span>`;
      return `<div class="p05-ranking-item ${index < 3 ? "p05-top-3" : ""}" data-cliente-id="${cliente.id}"><div class="p05-rank-medal ${index < 3 ? `p05-medal-${index + 1}` : ""}">${medal}</div><div class="p05-rank-info"><span class="p05-rank-nome">${this._escapeHtml(cliente.nome)}</span><div class="p05-rank-bar-track"><div class="p05-rank-bar-fill" style="width: ${widthPercent.toFixed(1)}%"></div></div></div><span class="p05-rank-value">${this._formatCurrencyCompact(cliente.receita)}</span></div>`;
    }).join("")}</div></div></div>`;
  }
  renderVendedores(vendedores = []) {
    if (!vendedores?.length) return `<div class="p05-chart-empty"><p>Sem dados de vendedores</p></div>`;
    return `<div class="p05-chart p05-chart-table"><div class="p05-chart-header"><h4 class="p05-chart-title">Performance Vendedores</h4></div><div class="p05-chart-body"><table class="p05-vendedores-table"><thead><tr><th>Vendedor</th><th>Receita</th><th>Ganhos</th><th>Conv.</th><th>Ticket</th><th>Clientes</th></tr></thead><tbody>${vendedores.map((v) => {
      const conversao = Number(v.conversao) || 0;
      return `<tr><td class="p05-td-nome">${this._escapeHtml(v.nome)}</td><td class="p05-td-value">${this._formatCurrencyCompact(v.receita)}</td><td class="p05-td-value">${this._formatNumber(v.ganhos)}</td><td><span class="p05-badge ${conversao >= 30 ? "p05-badge-success" : conversao >= 15 ? "p05-badge-warning" : "p05-badge-danger"}">${conversao.toFixed(1)}%</span></td><td class="p05-td-value">${this._formatCurrencyCompact(v.ticketMedio)}</td><td class="p05-td-value">${this._formatNumber(v.clientes)}</td></tr>`;
    }).join("")}</tbody></table></div></div>`;
  }
  renderPorUF(data = [], options = {}) {
    const { limit = 10 } = options;
    if (!data?.length) return `<div class="p05-chart-empty"><p>Sem dados por UF</p></div>`;
    const sorted = [...data].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0)).slice(0, Number(limit));
    const maxValue = Math.max(...sorted.map((d) => Number(d.valor) || 0));
    return `<div class="p05-chart p05-chart-horizontal"><div class="p05-chart-header"><h4 class="p05-chart-title">Receita por UF</h4></div><div class="p05-chart-body"><div class="p05-horizontal-bars">${sorted.map((item) => {
      const widthPercent = maxValue > 0 ? Number(item.valor) / maxValue * 100 : 0;
      return `<div class="p05-hbar-item"><span class="p05-hbar-label">${item.uf}</span><div class="p05-hbar-track"><div class="p05-hbar-fill" style="width: ${widthPercent}%"></div></div><span class="p05-hbar-value">${this._formatCurrencyCompact(item.valor)}</span></div>`;
    }).join("")}</div></div></div>`;
  }
  renderTimeline(eventos = [], options = {}) {
    const { limit = 10 } = options;
    if (!eventos?.length) return `<div class="p05-chart-empty"><p>Sem eventos recentes</p></div>`;
    const eventIcons = { criacao: { icon: icon("charts:activity"), className: "p05-event-info" }, ganho: { icon: icon("ui:check-circle"), className: "p05-event-success" }, perdido: { icon: icon("ui:x-circle"), className: "p05-event-danger" }, andamento: { icon: icon("system:clock"), className: "p05-event-warning" } };
    return `<div class="p05-chart p05-chart-timeline"><div class="p05-chart-header"><h4 class="p05-chart-title">Timeline</h4></div><div class="p05-chart-body"><div class="p05-timeline">${eventos.slice(0, Number(limit)).map((evento) => {
      const config = eventIcons[evento.tipo] || eventIcons.criacao;
      return `<div class="p05-timeline-item ${config.className}"><div class="p05-timeline-marker">${config.icon}</div><div class="p05-timeline-content"><span class="p05-timeline-title">${this._escapeHtml(evento.titulo)}</span>${evento.descricao ? `<span class="p05-timeline-desc">${this._escapeHtml(evento.descricao)}</span>` : ""}<span class="p05-timeline-time">${this._formatRelativeTime(evento.data)}</span></div>${evento.valor ? `<span class="p05-timeline-value">${this._formatCurrencyCompact(evento.valor)}</span>` : ""}</div>`;
    }).join("")}</div></div></div>`;
  }
  renderSparkline(data = [], options = {}) {
    const { width = 80, height = 24, stroke = "currentColor" } = options;
    const _width = Number(width), _height = Number(height);
    if (!data?.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;
    const values = data.map((d) => typeof d === "object" ? Number(d.value) : Number(d)).filter((v) => !isNaN(v));
    if (!values.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1, padding = 2;
    const points = values.map((v, i) => ({ x: (padding + i / (values.length - 1) * (_width - padding * 2)).toFixed(1), y: (padding + (_height - padding * 2) - (v - min) / range * (_height - padding * 2)).toFixed(1) }));
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const lastPoint = points[points.length - 1];
    const trend = values[values.length - 1] > values[0] ? "up" : values[values.length - 1] < values[0] ? "down" : "neutral";
    return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-${trend}"><path d="${pathD}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="2" fill="${stroke}"/></svg>`;
  }
  _formatNumber(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    return new Intl.NumberFormat("pt-BR").format(Number(value));
  }
  _formatCurrencyCompact(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    const num = Number(value);
    if (Math.abs(num) >= 1e6) return `R$ ${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `R$ ${(num / 1e3).toFixed(1)}K`;
    return `R$ ${num.toFixed(0)}`;
  }
  // @ts-expect-error TS migration - TS2362, TS2363
  _formatRelativeTime(date) {
    if (!date) return "\u2014";
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "\u2014";
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 6e4);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return d.toLocaleDateString("pt-BR");
  }
  // @ts-expect-error strict migration — TS2769
  _escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, source: "IconRegistry" };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
  }
}
const chartsRenderer = new ChartsRenderer();
var charts_default = chartsRenderer;
export {
  MODULE_ID,
  VERSION,
  chartsRenderer,
  charts_default as default
};
