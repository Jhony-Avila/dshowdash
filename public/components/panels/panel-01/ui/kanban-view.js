const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/kanban-view";
const escHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const corSegura = (v) => /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20}|(rgb|hsl)a?\([\d\s.,%]+\))$/.test(String(v ?? "")) ? String(v) : "#888";
const DEFAULT_COLUMNS = [
  { id: "pendente", label: "Pendente", color: "#f59e0b", status: "Pendente" },
  { id: "em-analise", label: "Em An\xE1lise", color: "#3b82f6", status: "Em An\xE1lise" },
  { id: "aprovado", label: "Aprovado", color: "#10b981", status: "Aprovado" },
  { id: "rejeitado", label: "Rejeitado", color: "#ef4444", status: "Rejeitado" }
];
function KanbanViewManager(options = {}) {
  options = options || {};
  this.container = options.container || null;
  this.columns = options.columns || DEFAULT_COLUMNS;
  this.groupField = options.groupField || "situacao";
  this.onCardClick = options.onCardClick || (() => {
  });
  this.onCardMove = options.onCardMove || (() => {
  });
  this.onMove = options.onMove || (() => {
  });
  this.onAction = options.onAction || (() => {
  });
  this._data = [];
  this._groupedData = {};
}
KanbanViewManager.prototype.setContainer = function(container) {
  this.container = container;
};
KanbanViewManager.prototype.setData = function(data) {
  this._data = data || [];
  this._groupData();
};
KanbanViewManager.prototype._groupData = function() {
  const self = this;
  this._groupedData = {};
  this.columns.forEach((col) => {
    self._groupedData[col.status] = [];
  });
  this._data.forEach((item) => {
    const status = item[self.groupField] || item.situacao || item.Situacao || "Outros";
    if (!self._groupedData[status]) self._groupedData[status] = [];
    self._groupedData[status].push(item);
  });
};
KanbanViewManager.prototype.render = function() {
  if (!this.container) return;
  const self = this;
  let html = '<div class="p01-kanban">';
  this.columns.forEach((col) => {
    const items = self._groupedData[col.status] || [];
    html += `<div class="p01-kanban-column" data-status="${escHtml(col.status)}" style="border-top-color: ${corSegura(col.color)}">`;
    html += `<div class="p01-kanban-header"><span class="p01-kanban-title">${escHtml(col.label)}</span><span class="p01-kanban-count">${items.length}</span></div>`;
    html += '<div class="p01-kanban-cards">';
    items.forEach((item) => {
      const id = item.id || item.Id_Requisicao;
      html += `<div class="p01-kanban-card" draggable="true" data-id="${escHtml(id)}">`;
      html += `<div class="p01-kanban-card-id">#${escHtml(id)}</div>`;
      html += `<div class="p01-kanban-card-title">${escHtml(String(item.descricao || item.Descricao_Requisicao || "-").substring(0, 50))}</div></div>`;
    });
    html += "</div></div>";
  });
  html += "</div>";
  this.container.innerHTML = html;
  this._bindEvents();
};
KanbanViewManager.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  this.container.querySelectorAll(".p01-kanban-card").forEach((card) => {
    card.addEventListener("click", () => {
      self.onCardClick(card.dataset.id);
    });
  });
};
KanbanViewManager.prototype.destroy = function() {
  if (this.container) this.container.innerHTML = "";
  this._data = [];
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var kanban_view_default = { KanbanViewManager, DEFAULT_COLUMNS, info, healthCheck };
export {
  DEFAULT_COLUMNS,
  KanbanViewManager,
  MODULE_ID,
  VERSION,
  kanban_view_default as default,
  healthCheck,
  info
};
