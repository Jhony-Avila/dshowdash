import { NavRailAdapter } from "../core/navrail-adapter.js";
const MODULE_ID = "panel-navrail-admin-handlers-drag-drop";
const VERSION = "9.0.0-CROSS-GROUP-DND";
let _container = null;
let _callbacks = null;
let _draggedItem = null;
function init(container, callbacks) {
  _container = container;
  _callbacks = callbacks;
  setupDragListeners();
}
function refresh(container, callbacks) {
  _container = container;
  _callbacks = callbacks;
  setupDragListeners();
}
function destroy() {
  _container = null;
  _callbacks = null;
  _draggedItem = null;
}
function setupDragListeners() {
  if (!_container) return;
  const cards = _container.querySelectorAll('[data-draggable="true"]');
  cards.forEach((el) => {
    const card = el;
    card.setAttribute("draggable", "true");
    card.ondragstart = (e) => {
      _draggedItem = card;
      card.classList.add("pna-card--dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.dataset.itemId);
    };
    card.ondragend = () => {
      card.classList.remove("pna-card--dragging");
      _container.querySelectorAll(".pna-card--drag-over").forEach((el2) => {
        el2.classList.remove("pna-card--drag-over");
      });
      _draggedItem = null;
    };
    card.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    card.ondragenter = (e) => {
      e.preventDefault();
      if (card !== _draggedItem) {
        card.classList.add("pna-card--drag-over");
      }
    };
    card.ondragleave = () => {
      card.classList.remove("pna-card--drag-over");
    };
    card.ondrop = async (e) => {
      e.preventDefault();
      card.classList.remove("pna-card--drag-over");
      if (!_draggedItem || card === _draggedItem) return;
      var sourceGroup = _draggedItem.dataset.group || "";
      var targetGroup = card.dataset.group || "";
      var isCrossGroup = sourceGroup !== targetGroup && targetGroup !== "";
      if (isCrossGroup) {
        await handleCrossGroupDrop(_draggedItem, card, targetGroup);
      } else {
        var groupContainer = card.closest("[data-group]");
        if (!groupContainer) return;
        var allCards = Array.from(groupContainer.querySelectorAll('[data-draggable="true"]'));
        var fromIndex = allCards.indexOf(_draggedItem);
        var toIndex = allCards.indexOf(card);
        if (fromIndex < toIndex) {
          card.after(_draggedItem);
        } else {
          card.before(_draggedItem);
        }
        await saveNewOrder(targetGroup);
      }
    };
  });
}
async function handleCrossGroupDrop(draggedCard, targetCard, newGroupKey) {
  var itemId = draggedCard.dataset.itemId || "";
  var dbId = draggedCard.dataset.dbId || itemId;
  var sourceTable = draggedCard.dataset.sourceTable || "navrail_items";
  var sourceId = draggedCard.dataset.sourceId || dbId;
  try {
    await NavRailAdapter.updateItem(dbId, {
      sourceTable,
      sourceId,
      parentKey: newGroupKey
    });
    _callbacks?.showToast?.("Item movido para outro grupo!", "success");
    window.dispatchEvent(new CustomEvent("navigation:items:changed", {
      detail: { source: "panel-navrail-admin", action: "cross-group-move", itemId, newGroup: newGroupKey }
    }));
    _callbacks?.loadData?.();
    _callbacks?.triggerSync?.();
  } catch (error) {
    _callbacks?.showToast?.("Erro ao mover item: " + error.message, "error");
    console.error("[DragDrop NavRail] cross-group error:", error);
  }
}
async function saveNewOrder(group) {
  var groupContainer = _container.querySelector('[data-group="' + group + '"]');
  if (!groupContainer) {
    groupContainer = _container;
  }
  if (!groupContainer) return;
  var cards = groupContainer.querySelectorAll('[data-draggable="true"]');
  var itemIds = Array.from(cards).map((card) => card.dataset.dbId);
  try {
    await NavRailAdapter.reorderItems(itemIds);
    _callbacks?.showToast?.("Ordem atualizada!", "success");
    window.dispatchEvent(new CustomEvent("navigation:items:changed", {
      detail: { source: "panel-navrail-admin", action: "reorder" }
    }));
    _callbacks?.loadData?.();
    _callbacks?.triggerSync?.();
  } catch (error) {
    _callbacks?.showToast?.("Erro ao reordenar: " + error.message, "error");
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dragDropReady: true } };
}
export {
  destroy,
  healthCheck,
  info,
  init,
  refresh
};
