const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-keyboard";
function createKeyboardHandler(state, callbacks = {}) {
  const { onActivate, onClose, closableTabs = true } = callbacks;
  function handleTabKeydown(e, tabId) {
    const tabs = state.tabBarEl?.querySelectorAll(".dsd-tab");
    if (!tabs || tabs.length === 0) return;
    const tabsArray = Array.from(tabs);
    const currentIndex = tabsArray.findIndex((t) => t.dataset.tabId === tabId);
    if (currentIndex === -1) return;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        navigateTo((currentIndex - 1 + tabsArray.length) % tabsArray.length);
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        navigateTo((currentIndex + 1) % tabsArray.length);
        break;
      case "Home":
        e.preventDefault();
        navigateTo(0);
        break;
      case "End":
        e.preventDefault();
        navigateTo(tabsArray.length - 1);
        break;
      case "Delete":
        if (closableTabs) {
          e.preventDefault();
          onClose?.(tabId);
        }
        break;
    }
  }
  function navigateTo(index) {
    const tab = state.tabs[index];
    if (tab) onActivate?.(tab.id);
  }
  function attachListener(tabEl, tabId) {
    tabEl.addEventListener("keydown", (e) => handleTabKeydown(e, tabId));
  }
  return { handleTabKeydown, attachListener };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { handlerReady: true } };
}
var keyboard_default = { createKeyboardHandler, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createKeyboardHandler,
  keyboard_default as default,
  healthCheck,
  info
};
