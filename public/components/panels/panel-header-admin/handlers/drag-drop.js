import { state } from "../state/store.js";
import * as adapter from "../core/header-adapter.js";
const MODULE_ID = "panel-header-admin-handlers-drag-drop";
const VERSION = "9.3.0-P2-ENTERPRISE";
let draggedItem = null;
let draggedElement = null;
let placeholder = null;
function initDragDrop(container, callbacks) {
  if (!container) return;
  container.addEventListener("dragstart", handleDragStart);
  container.addEventListener("dragend", handleDragEnd);
  container.addEventListener("dragover", handleDragOver);
  container.addEventListener("dragenter", handleDragEnter);
  container.addEventListener("dragleave", handleDragLeave);
  container.addEventListener("drop", (e) => {
    handleDrop(e, callbacks);
  });
}
function handleDragStart(e) {
  const card = e.target.closest('.pha-card[draggable="true"]');
  if (!card) return;
  draggedItem = card.dataset.componentId ?? null;
  draggedElement = card;
  card.classList.add("pha-card--dragging");
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedItem ?? "");
  }
  placeholder = document.createElement("div");
  placeholder.className = "pha-card-placeholder";
  placeholder.innerHTML = "<span>Soltar aqui</span>";
}
function handleDragEnd(_e) {
  if (draggedElement) draggedElement.classList.remove("pha-card--dragging");
  if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
  document.querySelectorAll(".pha-card--drag-over").forEach((el) => {
    el.classList.remove("pha-card--drag-over");
  });
  draggedItem = null;
  draggedElement = null;
  placeholder = null;
}
function handleDragOver(e) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const card = e.target.closest(".pha-card");
  if (card && card !== draggedElement) {
    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      card.parentNode?.insertBefore(placeholder, card);
    } else {
      card.parentNode?.insertBefore(placeholder, card.nextSibling);
    }
  }
}
function handleDragEnter(e) {
  e.preventDefault();
  const card = e.target.closest(".pha-card");
  if (card && card !== draggedElement) card.classList.add("pha-card--drag-over");
}
function handleDragLeave(e) {
  const card = e.target.closest(".pha-card");
  if (card) card.classList.remove("pha-card--drag-over");
}
function handleDrop(e, callbacks) {
  e.preventDefault();
  const targetCard = e.target.closest(".pha-card");
  if (!targetCard || !draggedItem || targetCard.dataset.componentId === draggedItem) return;
  const targetId = targetCard.dataset.componentId;
  const currentState = state.getState();
  const components = currentState.components.slice();
  let draggedIndex = -1;
  let targetIndex = -1;
  for (let i = 0; i < components.length; i++) {
    if (components[i].id == draggedItem) draggedIndex = i;
    if (components[i].id == targetId) targetIndex = i;
  }
  if (draggedIndex === -1 || targetIndex === -1) return;
  const removed = components.splice(draggedIndex, 1)[0];
  components.splice(targetIndex, 0, removed);
  const groupKey = removed.group_key;
  const groupComponents = components.filter((c) => c.group_key === groupKey);
  const updates = groupComponents.map((comp, idx) => ({
    id: comp.id,
    order_index: idx + 1
  }));
  const updatePromises = updates.map((update) => adapter.updateComponent(update.id, { order_index: update.order_index }));
  Promise.all(updatePromises).then(() => {
    callbacks.showToast("Ordem atualizada!", "success");
    window.dispatchEvent(new CustomEvent("navigation:items:changed", {
      detail: { source: "panel-header-admin", action: "reorder" }
    }));
    callbacks.loadData();
    callbacks.triggerSync();
  }).catch((error) => {
    callbacks.showToast(`Erro ao reordenar: ${error.message}`, "error");
  });
}
function enableDragOnCards(container) {
  const cards = container.querySelectorAll(".pha-card");
  cards.forEach((card) => {
    card.setAttribute("draggable", "true");
    card.classList.add("pha-card--draggable");
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dragDropReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  enableDragOnCards,
  healthCheck,
  info,
  initDragDrop
};
