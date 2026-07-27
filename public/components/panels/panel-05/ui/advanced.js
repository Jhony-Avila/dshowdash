import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:advanced";
const getIcon = (name) => {
  const map = {
    alertTriangle: "system:alert-triangle",
    alertCircle: "system:alert-circle",
    checkCircle: "ui:check-circle",
    trophy: "business:trophy",
    award: "business:award",
    target: "charts:target",
    trendingUp: "charts:trending-up",
    trendingDown: "charts:trending-down",
    search: "ui:search",
    mapPin: "business:map-pin",
    dollarSign: "business:dollar",
    building: "business:building"
  };
  return IconRegistry.get(map[name] || "system:info") || "";
};
const CHURN_LEVELS = {
  critico: { icon: "alertTriangle", className: "p05-churn-critical", label: "Critico", color: "#DC2626" },
  alto: { icon: "alertCircle", className: "p05-churn-danger", label: "Alto", color: "#EF4444" },
  medio: { icon: "alertCircle", className: "p05-churn-warning", label: "Medio", color: "#F59E0B" },
  baixo: { icon: "checkCircle", className: "p05-churn-success", label: "Baixo", color: "#22C55E" }
};
class AdvancedRenderer {
  constructor() {
  }
  renderChurnRisk(clientes = []) {
    if (!clientes?.length) {
      return `<div class="p05-churn-empty"><p>Sem dados de risco de churn</p></div>`;
    }
    return `
      <div class="p05-churn-panel">
        <h4 class="p05-churn-title">Risco de Churn</h4>
        <div class="p05-churn-list">
          ${clientes.map((cliente) => this._renderChurnCard(cliente)).join("")}
        </div>
      </div>
    `;
  }
  _renderChurnCard(cliente) {
    const { id, nome, risco = 0, nivel = "baixo", fatores = [] } = cliente;
    const config = CHURN_LEVELS[nivel] || CHURN_LEVELS.baixo;
    const icon = getIcon(config.icon);
    return `
      <div class="p05-churn-card ${config.className}" data-cliente-id="${id}">
        <div class="p05-churn-header">
          <div class="p05-churn-icon">${icon}</div>
          <div class="p05-churn-info">
            <span class="p05-churn-nome">${this._escapeHtml(nome)}</span>
            <span class="p05-churn-nivel">${config.label}</span>
          </div>
          <div class="p05-churn-score"><span class="p05-churn-value">${risco}%</span></div>
        </div>
        <div class="p05-churn-bar-track">
          <div class="p05-churn-bar-fill" style="width: ${risco}%; background: ${config.color}"></div>
        </div>
        ${fatores.length ? `<div class="p05-churn-fatores">${fatores.slice(0, 3).map((f) => `<span class="p05-churn-fator">${this._escapeHtml(f)}</span>`).join("")}</div>` : ""}
      </div>
    `;
  }
  renderRanking(data = {}, options = {}) {
    const { tipo = "receita", periodo = "30d" } = options;
    const { itens = [] } = data;
    const tipos = [
      { id: "receita", label: "Receita" },
      { id: "orcamentos", label: "Orcamentos" },
      { id: "crescimento", label: "Crescimento" }
    ];
    const periodos = [
      { id: "7d", label: "7d" },
      { id: "30d", label: "30d" },
      { id: "90d", label: "90d" },
      { id: "12m", label: "12m" }
    ];
    return `
      <div class="p05-ranking">
        <div class="p05-ranking-header">
          <h4 class="p05-ranking-title">Ranking</h4>
          <div class="p05-ranking-controls">
            <select class="p05-select p05-select-sm" data-action="ranking-tipo">
              ${tipos.map((t) => `<option value="${t.id}" ${t.id === tipo ? "selected" : ""}>${t.label}</option>`).join("")}
            </select>
            <div class="p05-ranking-periodos">
              ${periodos.map((p) => `<button class="p05-ranking-periodo ${p.id === periodo ? "p05-active" : ""}" data-action="ranking-periodo" data-periodo="${p.id}">${p.label}</button>`).join("")}
            </div>
          </div>
        </div>
        <div class="p05-ranking-list">
          ${itens.length ? itens.slice(0, 10).map((item, index) => this._renderRankingItem(item, index, tipo)).join("") : '<p class="p05-ranking-empty">Sem dados</p>'}
        </div>
      </div>
    `;
  }
  _renderRankingItem(item, index, tipo) {
    const { id, nome, valor } = item;
    const variacao = Number(item.variacao ?? 0);
    const isTop3 = index < 3;
    const rankingIcons = [getIcon("trophy"), getIcon("award"), getIcon("target")];
    const medal = isTop3 ? rankingIcons[index] : `<span class="p05-ranking-num">${index + 1}</span>`;
    const varIcon = variacao > 0 ? getIcon("trendingUp") : variacao < 0 ? getIcon("trendingDown") : "";
    const varClass = variacao > 0 ? "p05-var-positive" : variacao < 0 ? "p05-var-negative" : "";
    const formattedValue = tipo === "crescimento" ? `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%` : this._formatCurrencyCompact(valor);
    return `
      <div class="p05-ranking-item ${isTop3 ? "p05-ranking-top" : ""}" data-cliente-id="${id}">
        <div class="p05-ranking-medal ${isTop3 ? `p05-medal-${index + 1}` : ""}">${medal}</div>
        <div class="p05-ranking-info"><span class="p05-ranking-nome">${this._escapeHtml(nome)}</span></div>
        <div class="p05-ranking-value">
          <span class="p05-ranking-amount">${formattedValue}</span>
          ${variacao !== 0 && tipo !== "crescimento" ? `<span class="p05-ranking-var ${varClass}">${varIcon} ${Math.abs(variacao).toFixed(1)}%</span>` : ""}
        </div>
      </div>
    `;
  }
  renderHeatmapUF(dados = []) {
    if (!dados?.length) {
      return `<div class="p05-heatmap-empty"><p>Sem dados geograficos</p></div>`;
    }
    const maxValue = Math.max(...dados.map((d) => Number(d.valor) || 0));
    const estados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
    const dadosMap = new Map(dados.map((d) => [d.uf, d]));
    return `
      <div class="p05-heatmap">
        <h4 class="p05-heatmap-title">Distribuicao por UF</h4>
        <div class="p05-heatmap-grid">
          ${estados.map((uf) => {
      const data = dadosMap.get(uf);
      const valor = Number(data?.valor) || 0;
      const intensity = maxValue > 0 ? valor / maxValue * 100 : 0;
      const colorClass = this._getHeatmapColor(intensity);
      return `<div class="p05-heatmap-cell ${colorClass}" data-uf="${uf}" data-value="${valor}" title="${uf}: ${this._formatCurrencyCompact(valor)}"><span class="p05-heatmap-uf">${uf}</span></div>`;
    }).join("")}
        </div>
        <div class="p05-heatmap-legend">
          <span class="p05-legend-min">Menor</span>
          <div class="p05-legend-scale">
            <span class="p05-legend-color p05-heat-0"></span>
            <span class="p05-legend-color p05-heat-20"></span>
            <span class="p05-legend-color p05-heat-40"></span>
            <span class="p05-legend-color p05-heat-60"></span>
            <span class="p05-legend-color p05-heat-80"></span>
          </div>
          <span class="p05-legend-max">Maior</span>
        </div>
      </div>
    `;
  }
  _getHeatmapColor(intensity) {
    if (intensity >= 80) return "p05-heat-80";
    if (intensity >= 60) return "p05-heat-60";
    if (intensity >= 40) return "p05-heat-40";
    if (intensity >= 20) return "p05-heat-20";
    return "p05-heat-0";
  }
  renderAutocomplete(results = [], query = "") {
    if (!results?.length) {
      return `<div class="p05-autocomplete-empty"><span class="p05-autocomplete-icon">${getIcon("search")}</span><p>Nenhum resultado para "${this._escapeHtml(query)}"</p></div>`;
    }
    return `
      <div class="p05-autocomplete-results" role="listbox">
        ${results.map((item, index) => `
          <div class="p05-autocomplete-item ${index === 0 ? "p05-selected" : ""}" role="option" aria-selected="${index === 0}" data-action="select-autocomplete" data-id="${item.id}">
            <div class="p05-autocomplete-main">
              <span class="p05-autocomplete-nome">${this._highlightMatch(item.nome, query)}</span>
              ${item.status ? `<span class="p05-autocomplete-status p05-status-${item.status}">${item.status}</span>` : ""}
            </div>
            <div class="p05-autocomplete-meta">
              ${item.cidade ? `<span class="p05-autocomplete-loc">${getIcon("mapPin")} ${this._escapeHtml(item.cidade)}/${item.uf}</span>` : ""}
              ${item.receita ? `<span class="p05-autocomplete-receita">${getIcon("dollarSign")} ${this._formatCurrencyCompact(item.receita)}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }
  _highlightMatch(text, query) {
    if (!query || !text) return this._escapeHtml(text);
    const escaped = this._escapeHtml(text);
    const regex = new RegExp(`(${this._escapeRegex(query)})`, "gi");
    return escaped.replace(regex, "<mark>$1</mark>");
  }
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  renderSparkline(data = [], options = {}) {
    const { width = 80, height = 24, color = "currentColor" } = options;
    const _width = Number(width), _height = Number(height);
    if (!data?.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;
    const values = data.map((d) => typeof d === "object" ? Number(d.value) : Number(d)).filter((v) => !isNaN(v));
    if (!values.length) return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-empty"></svg>`;
    const min = Math.min(...values), max = Math.max(...values), range = max - min || 1, padding = 2;
    const points = values.map((v, i) => {
      const x = padding + i / (values.length - 1) * (_width - padding * 2);
      const y = padding + (_height - padding * 2) - (v - min) / range * (_height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const trend = values[values.length - 1] > values[0] ? "up" : values[values.length - 1] < values[0] ? "down" : "neutral";
    return `<svg viewBox="0 0 ${_width} ${_height}" class="p05-sparkline p05-sparkline-${trend}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${points.split(" ").pop().split(",")[0]}" cy="${points.split(" ").pop().split(",")[1]}" r="2" fill="${color}"/></svg>`;
  }
  renderProgressBar(value, max, options = {}) {
    const { size = "md", color = "primary", showLabel = false } = options;
    const percent = max > 0 ? Math.min(100, value / max * 100) : 0;
    return `<div class="p05-progress p05-progress-${size} p05-progress-${color}"><div class="p05-progress-bar" style="width: ${percent}%" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>${showLabel ? `<span class="p05-progress-label">${percent.toFixed(0)}%</span>` : ""}</div>`;
  }
  renderDeltaBadge(value, options = {}) {
    const { inverse = false } = options;
    const isPositive = inverse ? value < 0 : value > 0;
    const icon = value > 0 ? getIcon("trendingUp") : value < 0 ? getIcon("trendingDown") : "";
    const className = isPositive ? "p05-delta-positive" : value < 0 ? "p05-delta-negative" : "p05-delta-neutral";
    return `<span class="p05-delta-badge ${className}">${icon} ${value > 0 ? "+" : ""}${value.toFixed(1)}%</span>`;
  }
  _formatCurrencyCompact(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    const num = Number(value);
    if (Math.abs(num) >= 1e6) return `R$ ${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `R$ ${(num / 1e3).toFixed(1)}K`;
    return `R$ ${num.toFixed(0)}`;
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
const advancedRenderer = new AdvancedRenderer();
var advanced_default = advancedRenderer;
export {
  MODULE_ID,
  VERSION,
  advancedRenderer,
  advanced_default as default
};
