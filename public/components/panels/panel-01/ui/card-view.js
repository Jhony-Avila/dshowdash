const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/card-view";
const VIEW_MODES = { TABLE: "table", CARD: "card", COMPACT_CARD: "compact-card" };
function CardViewManager(options = {}) {
  options = options || {};
  this.container = options.container || null;
  this.onAction = options.onAction || (() => {
  });
  this.onSelect = options.onSelect || (() => {
  });
  this.onCardClick = options.onCardClick || (() => {
  });
  this.formatters = options.formatters || {};
  this._data = [];
  this._selectedIds = /* @__PURE__ */ new Set();
  this._mode = VIEW_MODES.CARD;
}
CardViewManager.prototype.setContainer = function(container) {
  this.container = container;
};
CardViewManager.prototype.setData = function(data) {
  this._data = data || [];
};
CardViewManager.prototype.setSelected = function(ids) {
  this._selectedIds = new Set(ids);
};
CardViewManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-card-view">';
  this._data.forEach((item) => {
    const id = item.id || item.Id_Requisicao;
    const selected = self._selectedIds.has(String(id)) ? " selected" : "";
    html += `<div class="p01-card${selected}" data-id="${id}">`;
    html += `<div class="p01-card-header"><span class="p01-card-id">#${id}</span></div>`;
    html += `<div class="p01-card-body"><div class="p01-card-title">${item.descricao || item.Descricao_Requisicao || "-"}</div>`;
    html += `<div class="p01-card-meta"><span>${item.situacao || item.Situacao || "-"}</span></div></div>`;
    html += `<div class="p01-card-footer"><span class="p01-card-value">R$ ${self._formatCurrency(item.valor_total || item.Valor_Total || 0)}</span></div></div>`;
  });
  html += "</div>";
  this.container.innerHTML = html;
  this._bindEvents();
};
CardViewManager.prototype._formatCurrency = (num) => parseFloat(num || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 });
CardViewManager.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  this.container.querySelectorAll(".p01-card").forEach((card) => {
    card.addEventListener("click", () => {
      self.onCardClick(card.dataset.id);
    });
  });
};
CardViewManager.prototype.destroy = function() {
  if (this.container) this.container.innerHTML = "";
  this._data = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var card_view_default = { CardViewManager, VIEW_MODES, info, healthCheck };
export {
  CardViewManager,
  MODULE_ID,
  VERSION,
  VIEW_MODES,
  card_view_default as default,
  healthCheck,
  info
};
