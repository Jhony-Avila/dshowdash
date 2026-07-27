import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PERMISSION_LEVELS } from "../../core/contracts.js";
const VERSION = "10.2.0-MIGRATION-PHASE4";
const MODULE_ID = "panel-nav-admin.ui.views.card-view";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[CardView]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const VIEW_MODES = Object.freeze({
  TABLE: "table",
  CARD: "card",
  COMPACT_CARD: "compact-card"
});
function CardView(options = {}) {
  const container = options.container;
  const onAction = options.onAction;
  const onSelect = options.onSelect;
  const onCardClick = options.onCardClick;
  let _items = [];
  let _selected = /* @__PURE__ */ new Set();
  let _mode = options.mode || VIEW_MODES.CARD;
  function render(items) {
    if (!container) return;
    _items = items || [];
    if (_items.length === 0) {
      container.innerHTML = `
        <div class="pna-card-view__empty">
          <p>Nenhum item de navega\xE7\xE3o encontrado</p>
        </div>`;
      return;
    }
    const isCompact = _mode === VIEW_MODES.COMPACT_CARD;
    const cards = _items.map((item) => _renderCard(item, isCompact)).join("");
    container.innerHTML = `
      <div class="pna-card-view pna-card-view--${isCompact ? "compact" : "full"}">
        ${cards}
      </div>`;
    _bindEvents();
  }
  function _renderCard(item, isCompact) {
    const selectedClass = _selected.has(item.id) ? " pna-card--selected" : "";
    const activeClass = item.isActive === false ? " pna-card--inactive" : "";
    const dividerClass = item.isDivider ? " pna-card--divider" : "";
    const permLevel = _getPermissionLabel(item.minLevel || 0);
    const context = item.context || item.sourceTable || "sidebar";
    const contextBadge = `<span class="pna-card__context pna-card__context--${context}">${context}</span>`;
    const statusDot = item.isActive !== false ? '<span class="pna-card__status pna-card__status--active" title="Ativo"></span>' : '<span class="pna-card__status pna-card__status--inactive" title="Inativo"></span>';
    if (isCompact) {
      return `
        <div class="pna-card pna-card--compact${selectedClass}${activeClass}" data-card-id="${item.id}">
          <div class="pna-card__icon-wrap"><span class="pna-card__icon" data-icon="${item.icon || "default"}">${item.icon || "default"}</span></div>
          <div class="pna-card__info">
            <span class="pna-card__label">${_esc(item.label || item.id)}</span>
            ${contextBadge}${statusDot}
          </div>
        </div>`;
    }
    return `
      <div class="pna-card${selectedClass}${activeClass}${dividerClass}" data-card-id="${item.id}">
        <div class="pna-card__header">
          <div class="pna-card__icon-wrap"><span class="pna-card__icon" data-icon="${item.icon || "default"}">${item.icon || "default"}</span></div>
          <div class="pna-card__title">
            <span class="pna-card__label">${_esc(item.label || item.id)}</span>
            <span class="pna-card__id">${_esc(item.id)}</span>
          </div>
          ${statusDot}
        </div>
        <div class="pna-card__body">
          <div class="pna-card__row"><span class="pna-card__key">Rota:</span> <span class="pna-card__val">${_esc(item.href || "\u2014")}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">Contexto:</span> ${contextBadge}</div>
          <div class="pna-card__row"><span class="pna-card__key">Se\xE7\xE3o:</span> <span class="pna-card__val">${_esc(item.section || "\u2014")}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">N\xEDvel:</span> <span class="pna-card__val">${permLevel}</span></div>
          <div class="pna-card__row"><span class="pna-card__key">Ordem:</span> <span class="pna-card__val">${item.order ?? "\u2014"}</span></div>
        </div>
        <div class="pna-card__actions">
          <button type="button" class="pna-card__action" data-action="edit" data-id="${item.id}" title="Editar">Editar</button>
          <button type="button" class="pna-card__action" data-action="duplicate" data-id="${item.id}" title="Duplicar">Duplicar</button>
          <button type="button" class="pna-card__action" data-action="toggle" data-id="${item.id}" title="${item.isActive !== false ? "Desativar" : "Ativar"}">${item.isActive !== false ? "Desativar" : "Ativar"}</button>
          <button type="button" class="pna-card__action pna-card__action--danger" data-action="delete" data-id="${item.id}" title="Excluir">Excluir</button>
        </div>
      </div>`;
  }
  function _bindEvents() {
    if (!container) return;
    container.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action || "";
        const id = actionBtn.dataset.id;
        const item = _items.find((i) => String(i.id) === String(id));
        if (item && typeof onAction === "function") {
          onAction(action, item);
        }
        e.stopPropagation();
        return;
      }
      const card = e.target.closest("[data-card-id]");
      if (card) {
        const id = card.dataset.cardId;
        const item = _items.find((i) => String(i.id) === String(id));
        if (!item) return;
        if (e.ctrlKey || e.metaKey) {
          _toggleSelection(item, card);
        } else if (typeof onCardClick === "function") {
          onCardClick(item);
        }
      }
    });
  }
  function _toggleSelection(item, cardEl) {
    const id = item.id;
    if (_selected.has(id)) {
      _selected.delete(id);
      cardEl.classList.remove("pna-card--selected");
    } else {
      _selected.add(id);
      cardEl.classList.add("pna-card--selected");
    }
    if (typeof onSelect === "function") {
      onSelect(item, _selected.has(id));
    }
  }
  function _getPermissionLabel(level) {
    const pl = PERMISSION_LEVELS.find((p) => p.value === level);
    return pl ? `${pl.label} (${level})` : String(level);
  }
  function _esc(str) {
    const d = document.createElement("div");
    d.textContent = String(str ?? "");
    return d.innerHTML;
  }
  function getSelectedIds() {
    return new Set(_selected);
  }
  function clearSelection() {
    _selected.clear();
    container?.querySelectorAll(".pna-card--selected").forEach((el) => el.classList.remove("pna-card--selected"));
  }
  function setMode(newMode) {
    _mode = newMode;
    render(_items);
  }
  function destroy() {
    if (container) container.innerHTML = "";
    _items = [];
    _selected.clear();
  }
  return { render, getSelectedIds, clearSelection, setMode, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, viewModes: Object.values(VIEW_MODES) };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var card_view_default = { CardView, VIEW_MODES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  CardView,
  MODULE_ID,
  VERSION,
  VIEW_MODES,
  card_view_default as default,
  healthCheck,
  info,
  injectPorts
};
