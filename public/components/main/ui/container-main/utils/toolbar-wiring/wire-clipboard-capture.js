import { getActivePanelElement } from "./helpers.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-clipboard-capture";
async function wireClipboardCapture(toolbar, wired, failed, logger) {
  try {
    const clipModule = await import("../clipboard-manager.js");
    const clipMgr = clipModule.getClipboardManager ? clipModule.getClipboardManager() : null;
    toolbar.registerAction("clipboard", () => {
      logger.debug("Clipboard dropdown opened");
    });
    wired.push("clipboard");
    toolbar.registerAction("clipboard-copy-url", () => {
      const url = window.location.href;
      if (clipMgr && clipMgr.copy) {
        clipMgr.copy(url, { notify: true }).then((ok) => {
          if (ok) logger.debug("URL copiada", { url });
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => {
        });
        logger.debug("URL copiada (fallback)", { url });
      }
    });
    wired.push("clipboard-copy-url");
    toolbar.registerAction("clipboard-copy-content", () => {
      const panelEl = getActivePanelElement();
      if (!panelEl) {
        logger.warn("Clipboard: nenhum painel ativo");
        return;
      }
      if (clipMgr && clipMgr.copyFromElement) {
        clipMgr.copyFromElement(panelEl, { notify: true }).then((ok) => {
          if (ok) logger.debug("Conte\xFAdo do painel copiado");
        });
      } else {
        const text = panelEl.textContent || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {
          });
        }
        logger.debug("Conte\xFAdo copiado (fallback)", { length: text.length });
      }
    });
    wired.push("clipboard-copy-content");
    if (clipMgr && clipMgr.getHistory) {
      toolbar.registerStateProvider("clipboard", () => {
        let history = [];
        try {
          history = clipMgr.getHistory();
        } catch (_e) {
        }
        const count = history.length || 0;
        return {
          badge: count > 0 ? count : void 0,
          tooltip: `Clipboard${count > 0 ? ` (${count})` : ""}`
        };
      });
    }
  } catch (e) {
    logger.warn("Clipboard Manager indispon\xEDvel", { error: e.message });
    toolbar.registerAction("clipboard", () => {
      logger.debug("Clipboard dropdown (sem manager)");
    });
    wired.push("clipboard");
    toolbar.registerAction("clipboard-copy-url", () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {
        });
      }
    });
    wired.push("clipboard-copy-url");
    toolbar.registerAction("clipboard-copy-content", () => {
      const panelEl = getActivePanelElement();
      if (panelEl && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(panelEl.textContent || "").catch(() => {
        });
      }
    });
    wired.push("clipboard-copy-content");
  }
  try {
    const screenshotModule = await import("../export-content-manager/index.js");
    const ssExportPNG = screenshotModule.exportToPNG;
    const ssExportPDF = screenshotModule.exportToPDF;
    toolbar.registerAction("screenshot", () => {
      logger.debug("Screenshot dropdown opened");
    });
    wired.push("screenshot");
    if (ssExportPNG) {
      toolbar.registerAction("screenshot-png", () => {
        const el = getActivePanelElement();
        logger.debug("Screenshot PNG: capturing", { element: el.id || el.className });
        ssExportPNG(el, { filename: `screenshot-${Date.now()}` }).catch((err) => {
          logger.warn("Screenshot PNG failed", { error: err.message });
        });
      });
      wired.push("screenshot-png");
    } else {
      failed.push("screenshot-png");
    }
    if (ssExportPDF) {
      toolbar.registerAction("screenshot-pdf", () => {
        const el = getActivePanelElement();
        logger.debug("Screenshot PDF: capturing", { element: el.id || el.className });
        ssExportPDF(el, { filename: `screenshot-${Date.now()}` }).catch((err) => {
          logger.warn("Screenshot PDF failed", { error: err.message });
        });
      });
      wired.push("screenshot-pdf");
    } else {
      failed.push("screenshot-pdf");
    }
  } catch (e) {
    logger.warn("Screenshot (Export Content Manager) indispon\xEDvel", { error: e.message });
    toolbar.registerAction("screenshot", () => {
      logger.debug("Screenshot dropdown (sem manager)");
    });
    wired.push("screenshot");
    failed.push("screenshot-png", "screenshot-pdf");
  }
  try {
    const wlModule = await import("../wake-lock-manager.js");
    const wlMgr = wlModule.getWakeLockManager ? wlModule.getWakeLockManager() : null;
    if (wlMgr && wlMgr.toggle) {
      toolbar.registerAction("wakeLock", () => {
        wlMgr.toggle().then((isActive) => {
          logger.debug("Wake Lock toggled", { active: isActive });
        }).catch((err) => {
          logger.warn("Wake Lock toggle failed", { error: err.message });
        });
      });
      toolbar.registerStateProvider("wakeLock", () => {
        let active = false;
        let supported = false;
        try {
          active = wlMgr.isActive();
          supported = wlMgr.isSupported();
        } catch (_e) {
        }
        return {
          active,
          dot: active,
          disabled: !supported,
          tooltip: !supported ? "Wake Lock n\xE3o suportado" : active ? "Tela Ligada (ativo)" : "Manter Tela Ligada"
        };
      });
      wired.push("wakeLock");
    } else {
      toolbar.registerAction("wakeLock", () => {
        logger.debug("Wake Lock (manager sem toggle)");
      });
      toolbar.registerStateProvider("wakeLock", () => ({
        disabled: !("wakeLock" in navigator),
        tooltip: "Manter Tela Ligada"
      }));
      wired.push("wakeLock");
    }
  } catch (e) {
    logger.warn("Wake Lock Manager indispon\xEDvel", { error: e.message });
    toolbar.registerAction("wakeLock", () => {
      logger.debug("Wake Lock (sem manager)");
    });
    toolbar.registerStateProvider("wakeLock", () => ({
      disabled: true,
      tooltip: "Wake Lock indispon\xEDvel"
    }));
    wired.push("wakeLock");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireClipboardCapture
};
