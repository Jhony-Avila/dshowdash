import { getContainerStatePersistence } from "../../container-state-persistence.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.navigation-history.storage.persistence";
async function saveHistory(history, currentIndex, config, logger) {
  if (!config.persistHistory) return;
  try {
    const persistence = getContainerStatePersistence();
    await persistence.setCustomSetting("navigationHistory", {
      history: history.slice(-20),
      currentIndex: Math.min(currentIndex, 19)
    });
  } catch (e) {
    logger.warn("Failed to save history:", e);
  }
}
async function restoreHistory(config, logger) {
  if (!config.persistHistory) return { history: [], currentIndex: -1 };
  try {
    const persistence = getContainerStatePersistence();
    await persistence.init();
    const saved = persistence.getCustomSetting("navigationHistory");
    if (saved && saved.history) {
      logger.debug("History restored:", { size: saved.history.length, index: saved.currentIndex });
      return {
        history: saved.history,
        currentIndex: saved.currentIndex ?? saved.history.length - 1
      };
    }
  } catch (e) {
    logger.warn("Failed to restore history:", e);
  }
  return { history: [], currentIndex: -1 };
}
export {
  MODULE_ID,
  VERSION,
  restoreHistory,
  saveHistory
};
