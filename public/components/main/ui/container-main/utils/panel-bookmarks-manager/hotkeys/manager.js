import { getConfig, getBookmarks, getHotkeyHandler, setHotkeyHandler } from "../state.js";
import { navigateToBookmark } from "../operations/navigation.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.hotkeys.manager";
function setupHotkeys() {
  const config = getConfig();
  if (!config.enableHotkeys || getHotkeyHandler()) return;
  const handler = (e) => {
    if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const bookmarks = getBookmarks();
        const bookmark = bookmarks[num - 1];
        if (bookmark) {
          e.preventDefault();
          navigateToBookmark(bookmark.id);
        }
      }
    }
  };
  setHotkeyHandler(handler);
  document.addEventListener("keydown", handler);
}
function removeHotkeys() {
  const handler = getHotkeyHandler();
  if (handler) {
    document.removeEventListener("keydown", handler);
    setHotkeyHandler(null);
  }
}
export {
  MODULE_ID,
  VERSION,
  removeHotkeys,
  setupHotkeys
};
