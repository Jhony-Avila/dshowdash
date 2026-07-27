import * as formatters from "../utils/formatters.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:cell-renderers";
const CELL_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
const _renderers = /* @__PURE__ */ new Map();
function textRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const escaped = formatters.escapeHtml(value != null ? value : "");
  return `<span class="${p}cell-text">${escaped || "\u2014"}</span>`;
}
function currencyRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatCurrency(value);
  const isNegative = parseFloat(value) < 0;
  return `<span class="${p}cell-currency ${isNegative ? `${p}negative` : ""}">${formatted}</span>`;
}
function numberRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const decimals = column.decimals != null ? column.decimals : 2;
  const formatted = formatters.formatNumber(value, "pt-BR", decimals);
  return `<span class="${p}cell-number">${formatted}</span>`;
}
function percentRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatPercent(value);
  const colorClass = value >= 0 ? `${p}positive` : `${p}negative`;
  return `<span class="${p}cell-percent ${colorClass}">${formatted}</span>`;
}
function dateRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatDate(value);
  return `<span class="${p}cell-date">${formatted}</span>`;
}
function datetimeRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatDateTime(value);
  return `<span class="${p}cell-datetime">${formatted}</span>`;
}
function statusRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const statusMap = column.statusMap || opts.statusMap || { ativo: { label: "Ativo", color: "success" }, inativo: { label: "Inativo", color: "danger" }, pendente: { label: "Pendente", color: "warning" }, default: { label: value, color: "neutral" } };
  const key = value && value.toLowerCase ? value.toLowerCase() : "default";
  const status = statusMap[key] || statusMap.default || { label: value, color: "neutral" };
  return `<span class="${p}cell-status ${p}status-${status.color}">${formatters.escapeHtml(status.label)}</span>`;
}
function booleanRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const trueLabel = column.trueLabel || CELL_SVGS.check;
  const falseLabel = column.falseLabel || CELL_SVGS.x;
  const isTrue = value === true || value === 1 || value === "1" || value === "true";
  return `<span class="${p}cell-boolean ${isTrue ? `${p}true` : `${p}false`}">${isTrue ? trueLabel : falseLabel}</span>`;
}
function progressRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const percent = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const colorClass = percent >= 75 ? "success" : percent >= 50 ? "warning" : "danger";
  return `<div class="${p}cell-progress"><div class="${p}progress-bar ${p}progress-${colorClass}" style="width: ${percent}%"></div><span class="${p}progress-label">${percent.toFixed(0)}%</span></div>`;
}
function ratingRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const max = column.maxRating || 5;
  const val = Math.min(max, Math.max(0, parseFloat(value) || 0));
  const fullStars = Math.floor(val);
  const halfStar = val % 1 >= 0.5;
  const emptyStars = max - fullStars - (halfStar ? 1 : 0);
  let html = `<span class="${p}cell-rating">`;
  for (let i = 0; i < fullStars; i++) html += "\u2605";
  if (halfStar) html += "\u2606";
  for (let j = 0; j < emptyStars; j++) html += "\u2606";
  html += "</span>";
  return html;
}
function linkRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  if (!value) return `<span class="${p}cell-link">\u2014</span>`;
  const href = column.hrefField ? row[column.hrefField] : value;
  const label = column.labelField ? row[column.labelField] : value;
  const target = column.target || "_blank";
  return `<a href="${formatters.escapeHtml(href)}" target="${target}" class="${p}cell-link">${formatters.escapeHtml(label)}</a>`;
}
function avatarRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  if (!value) {
    const initials = String(row.nome || row.name || "?").slice(0, 2).toUpperCase();
    return `<div class="${p}cell-avatar ${p}avatar-initials">${initials}</div>`;
  }
  return `<img src="${formatters.escapeHtml(value)}" alt="" class="${p}cell-avatar" loading="lazy" />`;
}
function tagsRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const tags = Array.isArray(value) ? value : (value || "").split(",").map((t) => t.trim()).filter(Boolean);
  if (!tags.length) return `<span class="${p}cell-tags">\u2014</span>`;
  return `<div class="${p}cell-tags">${tags.map((t) => `<span class="${p}tag">${formatters.escapeHtml(t)}</span>`).join("")}</div>`;
}
function cnpjRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatCNPJ(value);
  return `<span class="${p}cell-cnpj">${formatted}</span>`;
}
function cpfRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatCPF(value);
  return `<span class="${p}cell-cpf">${formatted}</span>`;
}
function phoneRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const formatted = formatters.formatPhone(value);
  const clean = String(value || "").replace(/\D/g, "");
  if (!clean) return `<span class="${p}cell-phone">\u2014</span>`;
  return `<a href="tel:+55${clean}" class="${p}cell-phone">${formatted}</a>`;
}
function actionsRenderer(value, column, row, options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const actions = column.actions || opts.defaultActions || [{ action: "view", icon: "\u{1F441}", title: "Ver" }, { action: "edit", icon: "\u270F\uFE0F", title: "Editar" }, { action: "delete", icon: "\u{1F5D1}", title: "Excluir", danger: true }];
  return `<div class="${p}cell-actions">${actions.map((a) => `<button class="${p}action-btn ${a.danger ? `${p}action-danger` : ""}" data-action="${a.action}" data-id="${row.id}" title="${a.title || a.action}">${a.icon || a.action}</button>`).join("")}</div>`;
}
function customRenderer(value, column, row, options) {
  if (typeof column.render === "function") return column.render(value, column, row, options);
  return textRenderer(value, column, row, options);
}
_renderers.set("text", textRenderer);
_renderers.set("string", textRenderer);
_renderers.set("currency", currencyRenderer);
_renderers.set("money", currencyRenderer);
_renderers.set("number", numberRenderer);
_renderers.set("percent", percentRenderer);
_renderers.set("percentage", percentRenderer);
_renderers.set("date", dateRenderer);
_renderers.set("datetime", datetimeRenderer);
_renderers.set("status", statusRenderer);
_renderers.set("badge", statusRenderer);
_renderers.set("boolean", booleanRenderer);
_renderers.set("bool", booleanRenderer);
_renderers.set("progress", progressRenderer);
_renderers.set("progressbar", progressRenderer);
_renderers.set("rating", ratingRenderer);
_renderers.set("stars", ratingRenderer);
_renderers.set("link", linkRenderer);
_renderers.set("url", linkRenderer);
_renderers.set("avatar", avatarRenderer);
_renderers.set("image", avatarRenderer);
_renderers.set("tags", tagsRenderer);
_renderers.set("chips", tagsRenderer);
_renderers.set("cnpj", cnpjRenderer);
_renderers.set("cpf", cpfRenderer);
_renderers.set("phone", phoneRenderer);
_renderers.set("telefone", phoneRenderer);
_renderers.set("actions", actionsRenderer);
_renderers.set("custom", customRenderer);
function registerRenderer(type, renderer) {
  if (typeof renderer === "function") _renderers.set(type.toLowerCase(), renderer);
}
function getRenderer(type) {
  return _renderers.get(type && type.toLowerCase ? type.toLowerCase() : "text") || textRenderer;
}
function renderCell(value, column, row, options) {
  const type = column.type || column.renderer || "text";
  const renderer = getRenderer(type);
  try {
    return renderer(value, column, row, options);
  } catch (e) {
    return textRenderer(value, column, row, options);
  }
}
function listRenderers() {
  return Array.from(_renderers.keys());
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, renderers: listRenderers() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, renderersCount: _renderers.size };
}
var cell_renderers_default = { registerRenderer, getRenderer, renderCell, listRenderers, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cell_renderers_default as default,
  getRenderer,
  healthCheck,
  info,
  listRenderers,
  registerRenderer,
  renderCell
};
