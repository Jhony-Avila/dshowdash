import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:funil";
const icon = (name) => IconRegistry.get(name) || "";
const STAGE_COLORS = {
  prospecto: { bg: "var(--p05-info-bg)", border: "var(--p05-info)", text: "var(--p05-info)" },
  qualificado: { bg: "var(--p05-cyan-bg)", border: "var(--p05-cyan)", text: "var(--p05-cyan)" },
  proposta: { bg: "var(--p05-warning-bg)", border: "var(--p05-warning)", text: "var(--p05-warning)" },
  negociacao: { bg: "var(--p05-purple-bg)", border: "var(--p05-purple)", text: "var(--p05-purple)" },
  ganho: { bg: "var(--p05-success-bg)", border: "var(--p05-success)", text: "var(--p05-success)" },
  perdido: { bg: "var(--p05-danger-bg)", border: "var(--p05-danger)", text: "var(--p05-danger)" }
};
class FunilRenderer {
  constructor() {
  }
  renderFunil(stages = []) {
    if (!stages?.length) return `<div class="p05-funil-empty"><p>Sem dados de funil</p></div>`;
    const maxValue = Math.max(...stages.map((s) => s.quantidade || 0));
    return `<div class="p05-funil"><div class="p05-funil-stages">${stages.map((stage, index) => this._renderFunilStage(stage, index, maxValue, stages.length)).join("")}</div></div>`;
  }
  _renderFunilStage(stage, index, maxValue, total) {
    const { id, nome } = stage;
    const quantidade = Number(stage.quantidade ?? 0);
    const valor = Number(stage.valor ?? 0);
    const conversao = Number(stage.conversao ?? 0);
    const widthPercent = maxValue > 0 ? Math.max(20, quantidade / maxValue * 100) : 20;
    const colors = STAGE_COLORS[id] || STAGE_COLORS.prospecto;
    const isLast = index === total - 1;
    return `<div class="p05-funil-stage" style="--stage-width: ${widthPercent}%"><div class="p05-funil-bar" style="background: ${colors.bg}; border-color: ${colors.border};"><span class="p05-funil-stage-name" style="color: ${colors.text}">${this._escapeHtml(nome)}</span><div class="p05-funil-stage-values"><span class="p05-funil-qty">${this._formatNumber(quantidade)}</span><span class="p05-funil-value">${this._formatCurrencyCompact(valor)}</span></div></div>${!isLast ? `<div class="p05-funil-arrow">${icon("ui:chevron-down")}<span class="p05-funil-conversao">${conversao.toFixed(1)}%</span></div>` : ""}</div>`;
  }
  renderMotivosPerda(motivos = []) {
    if (!motivos?.length) return `<div class="p05-motivos-empty"><p>Sem dados de motivos</p></div>`;
    const maxPercent = Math.max(...motivos.map((m) => m.percentual || 0));
    const top5 = motivos.slice(0, 5);
    return `<div class="p05-motivos-perda"><h4 class="p05-motivos-title">Motivos de Perda</h4><div class="p05-motivos-list">${top5.map((motivo, index) => {
      const pct = Number(motivo.percentual ?? 0);
      const qty = Number(motivo.quantidade ?? 0);
      return `<div class="p05-motivo-item"><div class="p05-motivo-header"><span class="p05-motivo-rank">${index + 1}</span><span class="p05-motivo-nome">${this._escapeHtml(motivo.motivo)}</span><span class="p05-motivo-percent">${pct.toFixed(1)}%</span></div><div class="p05-motivo-bar-track"><div class="p05-motivo-bar-fill" style="width: ${pct / maxPercent * 100}%"></div></div><span class="p05-motivo-count">${this._formatNumber(qty)} ocorrencias</span></div>`;
    }).join("")}</div></div>`;
  }
  renderMetricasAvancadas(metricas = {}) {
    const { ltv = 0, tempoConversao = 0, taxaRetencao = 0, crescimento = 0, concentracaoTop10 = 0, melhorMes = null } = metricas;
    const cards = [
      { icon: icon("business:dollar"), label: "LTV Medio", value: this._formatCurrency(ltv), highlight: true },
      { icon: icon("system:clock"), label: "Tempo Conversao", value: `${tempoConversao} dias`, subtitle: "media" },
      { icon: icon("business:users"), label: "Taxa Retencao", value: `${taxaRetencao.toFixed(1)}%`, subtitle: `${metricas.clientesRetidos || 0} clientes` },
      { icon: crescimento >= 0 ? icon("charts:trending-up") : icon("charts:trending-down"), label: "Crescimento", value: `${crescimento >= 0 ? "+" : ""}${crescimento.toFixed(1)}%`, className: crescimento >= 0 ? "p05-metric-positive" : "p05-metric-negative" },
      { icon: icon("charts:pie"), label: "Top 10% Clientes", value: `${concentracaoTop10.toFixed(1)}%`, subtitle: "da receita" },
      { icon: icon("business:calendar"), label: "Melhor Mes", value: melhorMes?.nome || "\u2014", subtitle: melhorMes ? this._formatCurrencyCompact(melhorMes.valor) : "" }
    ];
    return `<div class="p05-metricas-avancadas"><h4 class="p05-metricas-title">Metricas Avancadas</h4><div class="p05-metricas-grid">${cards.map((card) => `<div class="p05-metrica-card ${card.highlight ? "p05-metrica-highlight" : ""} ${card.className || ""}"><div class="p05-metrica-icon">${card.icon}</div><div class="p05-metrica-content"><span class="p05-metrica-label">${card.label}</span><span class="p05-metrica-value">${card.value}</span>${card.subtitle ? `<span class="p05-metrica-subtitle">${card.subtitle}</span>` : ""}</div></div>`).join("")}</div></div>`;
  }
  renderConversaoPorTipo(tipos = []) {
    if (!tipos?.length) return "";
    return `<div class="p05-conversao-tipo"><h4 class="p05-conversao-title">Conversao por Tipo</h4><div class="p05-conversao-list">${tipos.map((tipo) => {
      const ganhos = Number(tipo.ganhos ?? 0);
      const perdidos = Number(tipo.perdidos ?? 0);
      const total = ganhos + perdidos;
      const taxaGanho = total > 0 ? ganhos / total * 100 : 0;
      const taxaPerda = total > 0 ? perdidos / total * 100 : 0;
      return `<div class="p05-conversao-item"><div class="p05-conversao-header"><span class="p05-conversao-nome">${this._escapeHtml(tipo.nome)}</span><span class="p05-conversao-badge ${taxaGanho >= 50 ? "p05-badge-success" : "p05-badge-warning"}">${taxaGanho.toFixed(0)}%</span></div><div class="p05-conversao-bars"><div class="p05-conversao-bar p05-bar-ganho" style="width: ${taxaGanho}%" title="Ganhos: ${ganhos}"></div><div class="p05-conversao-bar p05-bar-perda" style="width: ${taxaPerda}%" title="Perdidos: ${perdidos}"></div></div><div class="p05-conversao-legend"><span class="p05-legend-ganho">${ganhos} ganhos</span><span class="p05-legend-perda">${perdidos} perdidos</span></div></div>`;
    }).join("")}</div></div>`;
  }
  _formatNumber(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    return new Intl.NumberFormat("pt-BR").format(Number(value));
  }
  _formatCurrency(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  }
  _formatCurrencyCompact(value) {
    if (value === null || value === void 0 || isNaN(Number(value))) return "\u2014";
    const num = Number(value);
    if (Math.abs(num) >= 1e6) return `R$ ${(num / 1e6).toFixed(1)}M`;
    if (Math.abs(num) >= 1e3) return `R$ ${(num / 1e3).toFixed(1)}K`;
    return `R$ ${num.toFixed(0)}`;
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
const funilRenderer = new FunilRenderer();
var funil_default = funilRenderer;
export {
  MODULE_ID,
  VERSION,
  funil_default as default,
  funilRenderer
};
