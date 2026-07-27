const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards/ui/renderer";
function renderCard(card, options = {}) {
  const { loading = false, error = null } = options;
  const statusClass = error ? "card--error" : loading ? "card--loading" : "card--ready";
  return `<div class="dashboard-card ${statusClass}" data-card-id="${card.id || ""}"><div class="card__header"><h3 class="card__title">${escapeHtml(String(card.title || "Card"))}</h3>${card.icon ? `<span class="card__icon">${card.icon}</span>` : ""}</div><div class="card__content">${loading ? renderSkeleton() : error ? renderError(error) : renderContent(card)}</div><div class="card__footer"><span class="card__updated">${formatLastUpdate(card.lastUpdate)}</span></div></div>`;
}
function renderSkeleton() {
  return '<div class="card__skeleton"><div class="skeleton-line skeleton-line--title"></div><div class="skeleton-line skeleton-line--text"></div><div class="skeleton-line skeleton-line--text"></div></div>';
}
function renderError(error) {
  return `<div class="card__error"><span class="error-icon">\u26A0\uFE0F</span><span class="error-message">${escapeHtml(error.message || "Erro ao carregar")}</span><button class="error-retry" data-action="retry">Tentar novamente</button></div>`;
}
function renderContent(card) {
  if (!card.data) return '<div class="card__empty">Sem dados</div>';
  if (card.type === "metric") return renderMetric(card.data);
  if (card.type === "chart") return renderChartPlaceholder(card.data);
  if (card.type === "list") return renderList(card.data);
  return `<div class="card__data">${escapeHtml(JSON.stringify(card.data))}</div>`;
}
function renderMetric(data) {
  const change = data.change;
  return `<div class="card__metric"><span class="metric__value">${escapeHtml(String(data.value || "0"))}</span><span class="metric__label">${escapeHtml(String(data.label || ""))}</span>${change !== void 0 && change !== null ? `<span class="metric__change ${change >= 0 ? "positive" : "negative"}">${change >= 0 ? "+" : ""}${change}%</span>` : ""}</div>`;
}
function renderChartPlaceholder(data) {
  return `<div class="card__chart" data-chart-type="${data.chartType || "line"}"><div class="chart-placeholder">\u{1F4CA}</div></div>`;
}
function renderList(data) {
  if (!Array.isArray(data.items)) return '<div class="card__empty">Sem itens</div>';
  return `<ul class="card__list">${data.items.slice(0, 5).map((item) => `<li class="list__item">${escapeHtml(String(item.label || item))}</li>`).join("")}</ul>`;
}
function renderGrid(cards, options = {}) {
  const { columns = 3, loading = [], errors = [] } = options;
  return `<div class="cards-grid cards-grid--${columns}col">${cards.map((card) => renderCard(card, { loading: loading.includes(String(card.id)), error: errors.find((e) => e.cardId === String(card.id)) })).join("")}</div>`;
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function formatLastUpdate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var renderer_default = { renderCard, renderSkeleton, renderError, renderContent, renderMetric, renderChartPlaceholder, renderList, renderGrid };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  renderCard,
  renderChartPlaceholder,
  renderContent,
  renderError,
  renderGrid,
  renderList,
  renderMetric,
  renderSkeleton
};
