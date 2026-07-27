import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:insights";
const getIcon = (name) => {
  const map = {
    alertTriangle: "system:alert-triangle",
    alertCircle: "system:alert-circle",
    checkCircle: "ui:check-circle",
    info: "system:info",
    trendingUp: "charts:trending-up",
    trendingDown: "charts:trending-down",
    lightbulb: "system:help",
    zap: "charts:zap",
    target: "charts:target",
    x: "ui:x",
    arrowUp: "ui:arrow-up",
    arrowDown: "ui:arrow-down",
    users: "business:users",
    dollarSign: "business:dollar",
    percent: "charts:percent",
    activity: "charts:activity"
  };
  return IconRegistry.get(map[name] || "system:info") || "";
};
const INSIGHT_ICON_MAP = {
  alert: "alertTriangle",
  warning: "alertCircle",
  success: "checkCircle",
  info: "info",
  growth: "trendingUp",
  decline: "trendingDown",
  idea: "lightbulb",
  action: "zap",
  goal: "target",
  users: "users",
  revenue: "dollarSign",
  conversion: "percent",
  performance: "activity"
};
class InsightsRenderer {
  constructor() {
    this._formatNumber = this._formatNumber.bind(this);
    this._formatCurrency = this._formatCurrency.bind(this);
  }
  renderInsightsPanel(insights = []) {
    if (!insights?.length) {
      return `<div class="p05-insights-empty"><span class="p05-insights-empty-icon">${getIcon("lightbulb")}</span><p>Nenhum insight disponivel</p></div>`;
    }
    return `
      <div class="p05-insights-panel">
        <div class="p05-insights-grid">
          ${insights.map((insight) => this._renderInsightCard(insight)).join("")}
        </div>
      </div>
    `;
  }
  _renderInsightCard(insight) {
    const { tipo = "info", nivel = "info", titulo, descricao, valor, variacao, acao } = insight;
    const iconName = INSIGHT_ICON_MAP[tipo] || "info";
    const icon = getIcon(iconName);
    const nivelClassMap = {
      danger: "p05-insight-danger",
      warning: "p05-insight-warning",
      success: "p05-insight-success",
      info: "p05-insight-info",
      primary: "p05-insight-primary"
    };
    const nivelClass = nivelClassMap[nivel] || "p05-insight-info";
    return `
      <div class="p05-insight-card ${nivelClass}">
        <div class="p05-insight-icon">${icon}</div>
        <div class="p05-insight-content">
          <h4 class="p05-insight-title">${this._escapeHtml(titulo)}</h4>
          ${descricao ? `<p class="p05-insight-desc">${this._escapeHtml(descricao)}</p>` : ""}
          ${valor !== void 0 ? `
            <div class="p05-insight-value">
              <span class="p05-insight-number">${this._formatValue(valor, insight.formato)}</span>
              ${variacao !== void 0 ? this._renderVariacao(Number(variacao)) : ""}
            </div>
          ` : ""}
          ${acao ? `<button class="p05-insight-action" data-action="insight-action" data-insight-id="${insight.id}">${this._escapeHtml(acao)}</button>` : ""}
        </div>
      </div>
    `;
  }
  _renderVariacao(variacao) {
    const isPositive = variacao > 0;
    const icon = isPositive ? getIcon("arrowUp") : getIcon("arrowDown");
    const className = isPositive ? "p05-variacao-up" : "p05-variacao-down";
    return `<span class="p05-insight-variacao ${className}">${icon} ${Math.abs(variacao).toFixed(1)}%</span>`;
  }
  renderComparativo(data = {}, options = {}) {
    const { periodo = "30d" } = options;
    const { metricas = [] } = data;
    const periodos = [
      { id: "7d", label: "7 dias" },
      { id: "30d", label: "30 dias" },
      { id: "90d", label: "90 dias" },
      { id: "12m", label: "12 meses" }
    ];
    return `
      <div class="p05-comparativo">
        <div class="p05-comparativo-header">
          <h3 class="p05-comparativo-title">Comparativo de Periodo</h3>
          <div class="p05-comparativo-tabs" role="tablist">
            ${periodos.map((p) => `
              <button class="p05-comparativo-tab ${p.id === periodo ? "p05-active" : ""}" 
                      role="tab" aria-selected="${p.id === periodo}"
                      data-action="change-periodo" data-periodo="${p.id}">${p.label}</button>
            `).join("")}
          </div>
        </div>
        <div class="p05-comparativo-body">
          ${metricas.length ? metricas.map((m) => this._renderComparativoMetrica(m)).join("") : '<p class="p05-comparativo-empty">Sem dados para comparacao</p>'}
        </div>
      </div>
    `;
  }
  _renderComparativoMetrica(metrica) {
    const { label, atual, anterior, formato = "number" } = metrica;
    const variacao = Number(metrica.variacao ?? 0);
    const sparkline = metrica.sparkline || [];
    const isPositive = variacao > 0;
    const varIcon = isPositive ? getIcon("arrowUp") : variacao < 0 ? getIcon("arrowDown") : "";
    const varClass = isPositive ? "p05-var-positive" : variacao < 0 ? "p05-var-negative" : "p05-var-neutral";
    return `
      <div class="p05-comparativo-metrica">
        <div class="p05-comparativo-label">${this._escapeHtml(label)}</div>
        <div class="p05-comparativo-values">
          <div class="p05-comparativo-atual">
            <span class="p05-comparativo-value-label">Atual</span>
            <span class="p05-comparativo-value">${this._formatValue(atual, formato)}</span>
          </div>
          <div class="p05-comparativo-anterior">
            <span class="p05-comparativo-value-label">Anterior</span>
            <span class="p05-comparativo-value">${this._formatValue(anterior, formato)}</span>
          </div>
          <div class="p05-comparativo-variacao ${varClass}">${varIcon} ${variacao > 0 ? "+" : ""}${variacao.toFixed(1)}%</div>
        </div>
        ${sparkline.length ? `<div class="p05-comparativo-sparkline">${this._renderMiniSparkline(sparkline)}</div>` : ""}
      </div>
    `;
  }
  _renderMiniSparkline(data) {
    if (!data?.length) return "";
    const width = 60, height = 20, padding = 2;
    const values = data.map((d) => typeof d === "object" ? d.value : d);
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = padding + i / (values.length - 1) * (width - padding * 2);
      const y = padding + (height - padding * 2) - (v - min) / range * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const trend = values[values.length - 1] > values[0] ? "up" : "down";
    return `<svg viewBox="0 0 ${width} ${height}" class="p05-mini-sparkline p05-sparkline-${trend}"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  renderQuickStats(stats = []) {
    if (!stats?.length) return "";
    return `
      <div class="p05-quick-stats">
        ${stats.map((stat) => `
          <div class="p05-quick-stat">
            <span class="p05-quick-stat-label">${this._escapeHtml(stat.label)}</span>
            <span class="p05-quick-stat-value">${this._formatValue(stat.valor, stat.formato)}</span>
            ${stat.delta !== void 0 ? `
              <span class="p05-quick-stat-delta ${Number(stat.delta) >= 0 ? "p05-delta-positive" : "p05-delta-negative"}">
                ${Number(stat.delta) >= 0 ? "+" : ""}${Number(stat.delta).toFixed(1)}%
              </span>
            ` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }
  renderAlertBanner(alert = {}) {
    const { tipo = "info", titulo, mensagem, dismissible = true, acoes = [] } = alert;
    const config = {
      critical: { icon: getIcon("alertTriangle"), className: "p05-alert-critical" },
      danger: { icon: getIcon("alertCircle"), className: "p05-alert-danger" },
      warning: { icon: getIcon("alertTriangle"), className: "p05-alert-warning" },
      info: { icon: getIcon("info"), className: "p05-alert-info" },
      success: { icon: getIcon("checkCircle"), className: "p05-alert-success" }
    }[tipo] || { icon: getIcon("info"), className: "p05-alert-info" };
    return `
      <div class="p05-alert-banner ${config.className}" role="alert">
        <div class="p05-alert-icon">${config.icon}</div>
        <div class="p05-alert-content">
          ${titulo ? `<strong class="p05-alert-title">${this._escapeHtml(titulo)}</strong>` : ""}
          <span class="p05-alert-message">${this._escapeHtml(mensagem)}</span>
        </div>
        ${acoes.length ? `
          <div class="p05-alert-actions">
            ${acoes.map((a) => `<button class="p05-alert-action-btn" data-action="alert-action" data-alert-action="${a.id}">${this._escapeHtml(a.label)}</button>`).join("")}
          </div>
        ` : ""}
        ${dismissible ? `<button class="p05-alert-dismiss" data-action="dismiss-alert" aria-label="Fechar">${getIcon("x")}</button>` : ""}
      </div>
    `;
  }
  _formatValue(value, formato = "number") {
    if (value === null || value === void 0) return "\u2014";
    switch (formato) {
      case "currency":
        return this._formatCurrency(value);
      case "percent":
        return `${Number(value).toFixed(1)}%`;
      case "compact":
        return this._formatCompact(value);
      default:
        return this._formatNumber(value);
    }
  }
  _formatNumber(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    return new Intl.NumberFormat("pt-BR").format(Number(value));
  }
  _formatCurrency(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  }
  _formatCompact(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    const num = Number(value);
    if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }
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
const insightsRenderer = new InsightsRenderer();
var insights_default = insightsRenderer;
export {
  MODULE_ID,
  VERSION,
  insights_default as default,
  insightsRenderer
};
