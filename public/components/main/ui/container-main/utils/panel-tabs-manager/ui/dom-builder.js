import { TAB_POSITIONS } from "../constants.js";
import { getConfig, setTabsContainer, setContentContainer } from "../state.js";
import { getStyles } from "./styles.js";
import { _handleTabClick } from "../events/handlers.js";
import { _setupDragAndDrop } from "../events/drag-drop.js";
import { addTab } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.ui.dom-builder";
function _createTabsUI(container) {
  const config = getConfig();
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "dsd-panel-tabs";
  tabsContainer.innerHTML = `
    <style>${getStyles()}</style>
    
    <div class="dsd-pt-tabs-list"></div>
    
    <div class="dsd-pt-actions">
      <button class="dsd-pt-btn dsd-pt-new" title="Nova aba">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      </button>
    </div>
  `;
  if (config.position === TAB_POSITIONS.BOTTOM) {
    tabsContainer.classList.add("dsd-panel-tabs--bottom");
    container.appendChild(tabsContainer);
  } else {
    container.insertBefore(tabsContainer, container.firstChild);
  }
  setTabsContainer(tabsContainer);
  const contentContainer = document.createElement("div");
  contentContainer.className = "dsd-pt-content";
  container.appendChild(contentContainer);
  setContentContainer(contentContainer);
  const newBtn = tabsContainer.querySelector(".dsd-pt-new");
  newBtn.addEventListener("click", () => addTab());
  tabsContainer.querySelector(".dsd-pt-tabs-list").addEventListener("click", _handleTabClick);
  if (config.allowReorder) {
    _setupDragAndDrop();
  }
}
export {
  MODULE_ID,
  VERSION,
  _createTabsUI
};
