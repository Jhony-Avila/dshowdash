import { state } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
import { ui } from "../ui/renderer.js";
import * as navAdapter from "../core/nav-adapter.js";
import * as crud from "./crud.js";
const MODULE_ID = "panel-nav-admin-handlers-ui-actions";
const VERSION = "9.3.0-P2-ENTERPRISE";
function switchTab(container, tabName) {
  if (!container) return;
  container.querySelectorAll(".pna-tab").forEach((t) => {
    t.classList.toggle("pna-tab-active", t.dataset.tab === tabName);
  });
  container.querySelectorAll(".pna-tab-content").forEach((c) => {
    c.classList.toggle("pna-tab-content-active", c.dataset.tabContent === tabName);
  });
}
function renderItemsList(container) {
  const itemsContainer = container ? container.querySelector('[data-tab-content="items"]') : null;
  if (!itemsContainer) return;
  const currentState = state.getState();
  const filteredItems = state.getFilteredItems();
  const sectionsVM = Object.entries(currentState.sections || {}).map((entry) => {
    const key = entry[0];
    const sec = entry[1];
    return Object.assign({ key }, sec);
  });
  var itemsMapped = filteredItems.map((item, idx) => Object.assign({}, item, {
    order: idx,
    minLevelLabel: "",
    minLevelDescription: "",
    displayHref: item.isDivider ? "(divisor)" : item.href || "-",
    isAdmin: item.section === "admin"
  }));
  var existingUl = itemsContainer.querySelector("ul.pna-list[data-sortable]");
  if (existingUl) {
    var rowsHtml = ui.renderItemsList(
      itemsMapped,
      sectionsVM,
      currentState.phase
    );
    var tmp = document.createElement("div");
    tmp.innerHTML = rowsHtml;
    var newUl = tmp.querySelector("ul.pna-list");
    if (newUl) {
      existingUl.innerHTML = newUl.innerHTML;
    }
  } else {
    itemsContainer.innerHTML = ui.renderItemsList(
      itemsMapped,
      sectionsVM,
      currentState.phase
    );
  }
  setupDragAndDrop(container);
}
function closeAllModals(container) {
  if (!container) return;
  container.querySelectorAll(".pna-modal").forEach((m) => {
    m.hidden = true;
  });
  const backdrop = container.querySelector("[data-modal-backdrop]");
  if (backdrop) backdrop.setAttribute("hidden", "");
  crud.clearEditingItem();
  crud.clearEditingSection();
}
function showLoading(container, show) {
  const overlay = container ? container.querySelector("[data-loading]") : null;
  if (overlay) overlay.hidden = !show;
}
function showToast(container, message, type) {
  if (type === void 0) type = "success";
  const toastContainer = container ? container.querySelector("[data-toast-container]") : null;
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.innerHTML = ui.renderToast(message, type);
  toastContainer.appendChild(toast.firstElementChild);
  setTimeout(() => {
    if (toast.firstElementChild) toast.firstElementChild.remove();
  }, 4e3);
}
function setupDragAndDrop(container) {
  const list = container ? container.querySelector('[data-sortable="items"]') : null;
  if (!list) return;
  let draggedItem = null;
  list.querySelectorAll(".pna-list-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedItem = item;
      item.classList.add("pna-dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragend", () => {
      if (draggedItem) draggedItem.classList.remove("pna-dragging");
      draggedItem = null;
      saveNewOrder(container);
    });
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        item.parentNode.insertBefore(draggedItem, item);
      } else {
        item.parentNode.insertBefore(draggedItem, item.nextSibling);
      }
    });
  });
}
function saveNewOrder(container) {
  const list = container ? container.querySelector('[data-sortable="items"]') : null;
  if (!list) return Promise.resolve();
  const orderedIds = Array.from(list.querySelectorAll(".pna-list-item")).map((item) => item.dataset.itemId);
  return navAdapter.reorderItems(orderedIds).then((result) => {
    if (result.success) {
      tracker.trackItemReordered({ orderedIds });
      showToast(container, "Ordem atualizada", "success");
    }
  }).catch((error) => {
    showToast(container, "Erro ao reordenar", "error");
  });
}
function reattachEventListeners(container) {
  if (!container) return;
  container.querySelectorAll(".pna-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchTab(container, tab.dataset.tab || "");
    });
  });
  setupDragAndDrop(container);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { uiActionsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  closeAllModals,
  healthCheck,
  info,
  reattachEventListeners,
  renderItemsList,
  saveNewOrder,
  setupDragAndDrop,
  showLoading,
  showToast,
  switchTab
};
