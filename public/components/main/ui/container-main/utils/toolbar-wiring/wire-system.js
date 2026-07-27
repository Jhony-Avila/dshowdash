const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-system";
import { getEventBus, getActivePanelId } from "./helpers.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
async function wireSystem(toolbar, wired, failed, logger) {
  try {
    const offlineModule = await import("../offline-mode-manager/index.js");
    const offlineMgr = offlineModule.getOfflineModeManager ? offlineModule.getOfflineModeManager() : null;
    if (offlineMgr) {
      toolbar.registerAction("offline", () => {
        if (offlineMgr.init) {
          offlineMgr.init().then(() => {
            const state = offlineMgr.getState ? offlineMgr.getState() : "unknown";
            const cacheSize = offlineMgr.getCacheSize ? offlineMgr.getCacheSize() : null;
            logger.debug("Offline manager initialized", {
              state,
              cache: cacheSize ? cacheSize.formatted : "N/A"
            });
          }).catch((err) => {
            logger.warn("Offline manager init failed", { error: err.message });
          });
        }
      });
      toolbar.registerStateProvider("offline", () => {
        const isOff = offlineMgr.isOffline ? offlineMgr.isOffline() : !navigator.onLine;
        let cacheSize = null;
        try {
          cacheSize = offlineMgr.getCacheSize ? offlineMgr.getCacheSize() : null;
        } catch (_e) {
        }
        const cacheInfo = cacheSize ? ` | Cache: ${cacheSize.formatted}` : "";
        return {
          active: isOff,
          dot: isOff,
          tooltip: isOff ? `Offline${cacheInfo}` : `Online${cacheInfo}`
        };
      });
      wired.push("offline");
    } else {
      toolbar.registerAction("offline", () => {
        logger.debug(`Offline status: ${navigator.onLine ? "online" : "offline"}`);
      });
      toolbar.registerStateProvider("offline", () => {
        const isOff = !navigator.onLine;
        return { active: isOff, dot: isOff, tooltip: isOff ? "Offline" : "Online" };
      });
      wired.push("offline");
    }
  } catch (e) {
    logger.warn("Offline Mode Manager indispon\xEDvel", { error: e.message });
    toolbar.registerAction("offline", () => {
      logger.debug(`Offline status: ${navigator.onLine ? "online" : "offline"}`);
    });
    toolbar.registerStateProvider("offline", () => ({
      active: !navigator.onLine,
      dot: !navigator.onLine,
      tooltip: navigator.onLine ? "Online" : "Offline"
    }));
    wired.push("offline");
  }
  try {
    const tabsModule = await import("../panel-tabs-manager/index.js");
    const tabsMgr = tabsModule.getPanelTabsManager?.() || tabsModule.default || tabsModule;
    const tabsInit = tabsMgr.init || tabsModule.init;
    const tabsAddTab = tabsMgr.addTab || tabsModule.addTab;
    const tabsGetTabs = tabsMgr.getAllTabs || tabsMgr.getTabs || tabsModule.getAllTabs;
    let _tabsInitialized = false;
    toolbar.registerAction("tabs", () => {
      if (!_tabsInitialized && tabsInit) {
        const container = document.getElementById("container-main");
        if (container) {
          const result = tabsInit(container);
          _tabsInitialized = result !== false;
          logger.debug("Panel Tabs initialized", { success: _tabsInitialized });
        }
      }
      if (tabsAddTab) {
        const panelId = getActivePanelId();
        if (panelId) {
          tabsAddTab(panelId, { title: panelId });
          logger.debug("Tab added for panel", { panelId });
        }
      }
    });
    if (tabsGetTabs) {
      toolbar.registerStateProvider("tabs", () => {
        let tabs = [];
        try {
          tabs = tabsGetTabs();
        } catch (_e) {
        }
        const count = Array.isArray(tabs) ? tabs.length : 0;
        return {
          badge: count > 1 ? count : void 0,
          tooltip: `Abas (${count})`
        };
      });
    }
    wired.push("tabs");
  } catch (e) {
    logger.warn("Panel Tabs Manager indispon\xEDvel", { error: e.message });
    toolbar.registerAction("tabs", () => {
      logger.debug("Tabs: manager indispon\xEDvel");
    });
    wired.push("tabs");
  }
  try {
    toolbar.registerAction("layout", () => {
      logger.debug("Layout dropdown opened");
    });
    wired.push("layout");
    toolbar.registerAction("layout-default", () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: "default", source: "toolbar" });
      }
      document.body.classList.remove("layout-compact", "layout-wide");
      logger.debug("Layout set to default");
    });
    wired.push("layout-default");
    toolbar.registerAction("layout-compact", () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: "compact", source: "toolbar" });
      }
      document.body.classList.remove("layout-wide");
      document.body.classList.add("layout-compact");
      logger.debug("Layout set to compact");
    });
    wired.push("layout-compact");
    toolbar.registerAction("layout-wide", () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: "wide", source: "toolbar" });
      }
      document.body.classList.remove("layout-compact");
      document.body.classList.add("layout-wide");
      logger.debug("Layout set to wide");
    });
    wired.push("layout-wide");
    toolbar.registerStateProvider("layout", () => {
      let current = "default";
      if (document.body.classList.contains("layout-compact")) current = "compact";
      else if (document.body.classList.contains("layout-wide")) current = "wide";
      return { tooltip: `Layout: ${current}` };
    });
  } catch (e) {
    logger.warn("Layout wiring failed", { error: e.message });
    toolbar.registerAction("layout", () => {
      logger.debug("Layout dropdown (fallback)");
    });
    wired.push("layout");
    failed.push("layout-default", "layout-compact", "layout-wide");
  }
  try {
    const devtoolsModule = await import("../devtools-panel/index.js");
    const devtoolsPanel = devtoolsModule.getDevToolsPanel({ autoHideInProduction: false });
    if (devtoolsPanel && devtoolsPanel.toggle) {
      toolbar.registerAction("devtools", () => {
        devtoolsPanel.toggle();
      });
      toolbar.registerStateProvider("devtools", () => {
        let isVisible = false;
        try {
          isVisible = devtoolsPanel.isVisible?.() || false;
        } catch (_e) {
        }
        return { active: isVisible, tooltip: isVisible ? "Fechar DevTools" : "Abrir DevTools" };
      });
      wired.push("devtools");
    } else {
      toolbar.registerAction("devtools", () => {
        try {
          const panel = devtoolsModule.createDevToolsPanel({ autoHideInProduction: false });
          if (panel && panel.toggle) panel.toggle();
        } catch (_e) {
          logger.debug("DevTools: falha ao criar painel");
        }
      });
      wired.push("devtools");
    }
  } catch (e) {
    logger.warn("DevTools Panel indispon\xEDvel", { error: e.message });
    failed.push("devtools");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireSystem
};
