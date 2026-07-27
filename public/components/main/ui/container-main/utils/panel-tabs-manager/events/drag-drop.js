import { getTabs, setTabs, getTabsContainer, getDragState, setDragState } from "../state.js";
import { _renderTabs } from "../ui/renderer.js";
import { _saveTabs, _emit } from "../helpers/index.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.events.drag-drop";
function _setupDragAndDrop() {
  const tabsContainer = getTabsContainer();
  if (!tabsContainer) return;
  const tabsList = tabsContainer.querySelector(".dsd-pt-tabs-list");
  if (!tabsList) return;
  tabsList.addEventListener("dragstart", (e) => {
    const tabEl = e.target.closest(".dsd-pt-tab");
    if (!tabEl) return;
    setDragState({ tabId: tabEl.dataset.tabId });
    tabEl.classList.add("dsd-pt-tab--dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  tabsList.addEventListener("dragend", (e) => {
    const tabEl = e.target.closest(".dsd-pt-tab");
    if (tabEl) {
      tabEl.classList.remove("dsd-pt-tab--dragging");
    }
    setDragState(null);
    tabsList.querySelectorAll(".dsd-pt-tab--drag-over").forEach((el) => {
      el.classList.remove("dsd-pt-tab--drag-over");
    });
  });
  tabsList.addEventListener("dragover", (e) => {
    e.preventDefault();
    const tabEl = e.target.closest(".dsd-pt-tab");
    const dragState = getDragState();
    if (!tabEl || !dragState) return;
    tabsList.querySelectorAll(".dsd-pt-tab--drag-over").forEach((el) => {
      el.classList.remove("dsd-pt-tab--drag-over");
    });
    if (tabEl.dataset.tabId !== dragState.tabId) {
      tabEl.classList.add("dsd-pt-tab--drag-over");
    }
  });
  tabsList.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetTabEl = e.target.closest(".dsd-pt-tab");
    const dragState = getDragState();
    if (!targetTabEl || !dragState) return;
    const sourceId = dragState.tabId;
    const targetId = targetTabEl.dataset.tabId;
    if (sourceId !== targetId) {
      _reorderTabs(sourceId, targetId);
    }
    targetTabEl.classList.remove("dsd-pt-tab--drag-over");
  });
}
function _reorderTabs(sourceId, targetId) {
  const tabs = getTabs();
  const sourceIndex = tabs.findIndex((t) => t.id === sourceId);
  const targetIndex = tabs.findIndex((t) => t.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;
  const [movedTab] = tabs.splice(sourceIndex, 1);
  tabs.splice(targetIndex, 0, movedTab);
  setTabs(tabs);
  _renderTabs();
  _saveTabs();
  _emit("tabsReordered", { tabs: tabs.map((t) => t.id) });
}
export {
  MODULE_ID,
  VERSION,
  _reorderTabs,
  _setupDragAndDrop
};
