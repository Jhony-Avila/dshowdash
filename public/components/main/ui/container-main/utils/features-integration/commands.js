import { MODULE_ID } from "./constants.js";
import { ICONS } from "./icons.js";
import { metrics, commandPalette, splitView, zoomManager, printManager, exportManager, bookmarksManager, accessibilityManager, panelSearchManager } from "./state.js";
import { getCM, getEventBus } from "./helpers.js";
import { createLogger } from "../logger.js";
import { PANEL_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "1.3.1-WARN-FIX";
const logger = createLogger(`${MODULE_ID}:commands`);
function _getSplitContainer() {
  return document.querySelector(".dsd-container__body") || document.getElementById("container-main");
}
function registerDefaultCommands() {
  const CM = getCM();
  if (!CM) return;
  commandPalette.value = CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null;
  if (!commandPalette.value) {
    logger.debug("CommandPaletteManager not available (optional feature)", null);
    return;
  }
  const commands = [
    // === NAVEGAÇÃO ===
    {
      id: "nav.home",
      title: "Ir para Home",
      description: "Navegar para o painel inicial",
      icon: ICONS.home,
      category: "Navega\xE7\xE3o",
      shortcut: "Alt+H",
      type: "navigation",
      action() {
        const eb = getEventBus();
        if (eb && eb.emit) eb.emit("nav.navigate.path", { panelId: "panel-home", path: "#/home" });
      }
    },
    {
      id: "nav.back",
      title: "Voltar",
      description: "Voltar para o painel anterior",
      icon: ICONS.back,
      category: "Navega\xE7\xE3o",
      shortcut: "Alt+\u2190",
      type: "navigation",
      action() {
        if (CM.goBack) CM.goBack();
      }
    },
    {
      id: "nav.forward",
      title: "Avan\xE7ar",
      description: "Avan\xE7ar para o pr\xF3ximo painel",
      icon: ICONS.forward,
      category: "Navega\xE7\xE3o",
      shortcut: "Alt+\u2192",
      type: "navigation",
      action() {
        if (CM.goForward) CM.goForward();
      }
    },
    // === VISUALIZAÇÃO ===
    {
      id: "view.split.toggle",
      title: "Dividir Tela",
      description: "Ativar/desativar divis\xE3o de tela",
      icon: ICONS.split,
      category: "Visualiza\xE7\xE3o",
      shortcut: "Ctrl+\\",
      type: "action",
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value && splitView.value.toggle) splitView.value.toggle(_getSplitContainer());
      }
    },
    {
      id: "view.split.horizontal",
      title: "Dividir Horizontalmente",
      description: "Dividir tela lado a lado",
      icon: ICONS.split,
      category: "Visualiza\xE7\xE3o",
      type: "action",
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value) {
          if (splitView.value.setOrientation) splitView.value.setOrientation("horizontal");
          if (splitView.value.activate) splitView.value.activate(_getSplitContainer());
        }
      }
    },
    {
      id: "view.split.vertical",
      title: "Dividir Verticalmente",
      description: "Dividir tela em cima/baixo",
      icon: ICONS.split,
      category: "Visualiza\xE7\xE3o",
      type: "action",
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value) {
          if (splitView.value.setOrientation) splitView.value.setOrientation("vertical");
          if (splitView.value.activate) splitView.value.activate(_getSplitContainer());
        }
      }
    },
    {
      id: "view.zoom.in",
      title: "Aumentar Zoom",
      description: "Aumentar o zoom do conte\xFAdo",
      icon: ICONS.zoomIn,
      category: "Visualiza\xE7\xE3o",
      shortcut: "Ctrl++",
      type: "action",
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.zoomIn) zoomManager.value.zoomIn();
      }
    },
    {
      id: "view.zoom.out",
      title: "Diminuir Zoom",
      description: "Diminuir o zoom do conte\xFAdo",
      icon: ICONS.zoomOut,
      category: "Visualiza\xE7\xE3o",
      shortcut: "Ctrl+-",
      type: "action",
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.zoomOut) zoomManager.value.zoomOut();
      }
    },
    {
      id: "view.zoom.reset",
      title: "Resetar Zoom",
      description: "Voltar zoom para 100%",
      icon: ICONS.zoomReset,
      category: "Visualiza\xE7\xE3o",
      shortcut: "Ctrl+0",
      type: "action",
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.resetZoom) zoomManager.value.resetZoom();
      }
    },
    {
      id: "view.fullscreen",
      title: "Tela Cheia",
      description: "Entrar/sair do modo tela cheia",
      icon: ICONS.fullscreen,
      category: "Visualiza\xE7\xE3o",
      shortcut: "F11",
      type: "action",
      action() {
        if (CM.toggleFullscreen) CM.toggleFullscreen();
      }
    },
    // === BUSCA ===
    {
      id: "search.panel",
      title: "Buscar no Painel",
      description: "Buscar texto no painel atual",
      icon: ICONS.search,
      category: "Busca",
      shortcut: "Ctrl+F",
      type: "action",
      action() {
        panelSearchManager.value = panelSearchManager.value || (CM.getPanelSearchManager ? CM.getPanelSearchManager() : null);
        if (panelSearchManager.value && panelSearchManager.value.open) panelSearchManager.value.open();
      }
    },
    // === AÇÕES ===
    {
      id: "action.print",
      title: "Imprimir",
      description: "Imprimir o conte\xFAdo atual",
      icon: ICONS.print,
      category: "A\xE7\xF5es",
      shortcut: "Ctrl+P",
      type: "action",
      action() {
        printManager.value = printManager.value || (CM.getPrintManager ? CM.getPrintManager() : null);
        if (printManager.value && printManager.value.print) printManager.value.print();
      }
    },
    {
      id: "action.export.png",
      title: "Exportar como PNG",
      description: "Exportar o conte\xFAdo como imagem PNG",
      icon: ICONS.download,
      category: "Exportar",
      type: "action",
      action() {
        exportManager.value = exportManager.value || (CM.getExportContentManager ? CM.getExportContentManager() : null);
        if (exportManager.value && exportManager.value.exportToPNG) exportManager.value.exportToPNG();
      }
    },
    {
      id: "action.export.pdf",
      title: "Exportar como PDF",
      description: "Exportar o conte\xFAdo como PDF",
      icon: ICONS.download,
      category: "Exportar",
      type: "action",
      action() {
        exportManager.value = exportManager.value || (CM.getExportContentManager ? CM.getExportContentManager() : null);
        if (exportManager.value && exportManager.value.exportToPDF) exportManager.value.exportToPDF();
      }
    },
    {
      id: "action.bookmark",
      title: "Adicionar aos Favoritos",
      description: "Adicionar painel atual aos favoritos",
      icon: ICONS.bookmark,
      category: "A\xE7\xF5es",
      shortcut: "Ctrl+D",
      type: "action",
      action() {
        bookmarksManager.value = bookmarksManager.value || (CM.getPanelBookmarksManager ? CM.getPanelBookmarksManager() : null);
        const navHistory = CM.getNavigationHistory ? CM.getNavigationHistory() : null;
        const current = navHistory && navHistory.getCurrentEntry ? navHistory.getCurrentEntry() : null;
        if (current && bookmarksManager.value && bookmarksManager.value.addBookmark) {
          bookmarksManager.value.addBookmark(current.panelId, { title: current.title || current.panelId });
        }
      }
    },
    {
      id: "action.refresh",
      title: "Atualizar Painel",
      description: "Recarregar o conte\xFAdo do painel atual",
      icon: ICONS.refresh,
      category: "A\xE7\xF5es",
      shortcut: "F5",
      type: "action",
      action() {
        const eb = getEventBus();
        if (eb && eb.emit) eb.emit(PANEL_EVENT_NAMES.REFRESH_REQUEST, { source: "command-palette" });
      }
    },
    // === ACESSIBILIDADE ===
    {
      id: "a11y.contrast.toggle",
      title: "Alto Contraste",
      description: "Ativar/desativar modo de alto contraste",
      icon: ICONS.accessibility,
      category: "Acessibilidade",
      type: "setting",
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.toggleHighContrast) accessibilityManager.value.toggleHighContrast();
      }
    },
    {
      id: "a11y.text.increase",
      title: "Aumentar Texto",
      description: "Aumentar tamanho do texto",
      icon: ICONS.accessibility,
      category: "Acessibilidade",
      type: "setting",
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.increaseTextScale) accessibilityManager.value.increaseTextScale();
      }
    },
    {
      id: "a11y.text.decrease",
      title: "Diminuir Texto",
      description: "Diminuir tamanho do texto",
      icon: ICONS.accessibility,
      category: "Acessibilidade",
      type: "setting",
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.decreaseTextScale) accessibilityManager.value.decreaseTextScale();
      }
    },
    // === CONFIGURAÇÕES ===
    {
      id: "settings.theme.toggle",
      title: "Alternar Tema",
      description: "Alternar entre tema claro e escuro",
      icon: ICONS.theme,
      category: "Configura\xE7\xF5es",
      type: "setting",
      action() {
        const themeManager = CM.getThemeManager ? CM.getThemeManager() : null;
        if (themeManager && themeManager.toggle) themeManager.toggle();
      }
    },
    // === AJUDA ===
    {
      id: "help.tour",
      title: "Iniciar Tour",
      description: "Ver guia interativo da aplica\xE7\xE3o",
      icon: ICONS.tour,
      category: "Ajuda",
      type: "action",
      action() {
        const tm = CM.getTourManager ? CM.getTourManager() : null;
        if (tm && tm.startTour) tm.startTour("welcome");
      }
    },
    {
      id: "help.shortcuts",
      title: "Atalhos de Teclado",
      description: "Ver lista de atalhos de teclado",
      icon: ICONS.help,
      category: "Ajuda",
      shortcut: "Ctrl+/",
      type: "action",
      action() {
        alert("Atalhos:\n\nCtrl+K - Paleta de comandos\nCtrl+F - Buscar\nCtrl+P - Imprimir\nCtrl+D - Favoritos\nCtrl+\\ - Dividir tela\nAlt+\u2190 - Voltar\nAlt+\u2192 - Avan\xE7ar\nF11 - Tela cheia");
      }
    }
  ];
  commands.forEach((cmd) => {
    try {
      if (commandPalette.value.registerCommand) {
        commandPalette.value.registerCommand(cmd);
        metrics.commandsRegistered++;
      }
    } catch (e) {
      metrics.errors++;
      logger.warn("Failed to register command", { id: cmd.id, error: e.message });
    }
  });
  logger.debug("Registered commands", { count: metrics.commandsRegistered });
}
export {
  VERSION,
  registerDefaultCommands
};
