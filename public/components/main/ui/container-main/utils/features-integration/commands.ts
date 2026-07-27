
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.1-WARN-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: commands
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   ICONS from ./icons.js
//   metrics, commandPalette, splitView, zoomManager, printManager, exportManager,...
//   getCM, getEventBus from ./helpers.js
//   createLogger from ../logger.js
//   PANEL_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   registerDefaultCommands() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   'nav.navigate.path'
//   PANEL_EVENT_NAMES.REFRESH_REQUEST
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Features Integration - Commands
 * @module features-integration/commands
 * @version 1.3.1-WARN-FIX
 * @changelog v1.3.1-WARN-FIX - CommandPaletteManager warn→debug (optional feature, not an error)
 * @changelog v1.3.0-EVENT-CONSTANTS - Migrate panel.refresh.request to PANEL_EVENT_NAMES constant
 * @changelog v1.2.0-SPLIT-CONTAINER-FIX - split toggle/activate passam .dsd-container__body
 * @changelog v1.1.0 - Migrated from console.* to centralized Logger
 */
'use strict';

import { MODULE_ID } from './constants.js';
import { ICONS } from './icons.js';
import { metrics, commandPalette, splitView, zoomManager, printManager, exportManager, bookmarksManager, accessibilityManager, panelSearchManager } from './state.js';
import { getCM, getEventBus } from './helpers.js';
import { createLogger } from '../logger.js';
import { PANEL_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '1.3.1-WARN-FIX';

const logger = createLogger(`${MODULE_ID}:commands`);

/**
 * Helper: retorna o container correto para o split-view
 * @returns {HTMLElement}
 */
function _getSplitContainer() {
  return document.querySelector('.dsd-container__body') || document.getElementById('container-main');
}

export function registerDefaultCommands() {
  const CM = getCM();
  if (!CM) return;

  commandPalette.value = CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null;
  if (!commandPalette.value) {
    // @ts-expect-error strict migration — TS2345
    logger.debug('CommandPaletteManager not available (optional feature)', null);
    return;
  }

  const commands = [
    // === NAVEGAÇÃO ===
    {
      id: 'nav.home',
      title: 'Ir para Home',
      description: 'Navegar para o painel inicial',
      icon: ICONS.home,
      category: 'Navegação',
      shortcut: 'Alt+H',
      type: 'navigation',
      action() {
        const eb = getEventBus();
        if (eb && eb.emit) eb.emit('nav.navigate.path', { panelId: 'panel-home', path: '#/home' });
      }
    },
    {
      id: 'nav.back',
      title: 'Voltar',
      description: 'Voltar para o painel anterior',
      icon: ICONS.back,
      category: 'Navegação',
      shortcut: 'Alt+←',
      type: 'navigation',
      action() { if (CM.goBack) CM.goBack(); }
    },
    {
      id: 'nav.forward',
      title: 'Avançar',
      description: 'Avançar para o próximo painel',
      icon: ICONS.forward,
      category: 'Navegação',
      shortcut: 'Alt+→',
      type: 'navigation',
      action() { if (CM.goForward) CM.goForward(); }
    },
    // === VISUALIZAÇÃO ===
    {
      id: 'view.split.toggle',
      title: 'Dividir Tela',
      description: 'Ativar/desativar divisão de tela',
      icon: ICONS.split,
      category: 'Visualização',
      shortcut: 'Ctrl+\\',
      type: 'action',
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value && splitView.value.toggle) (splitView.value.toggle as (...args: unknown[]) => unknown)(_getSplitContainer());
      }
    },
    {
      id: 'view.split.horizontal',
      title: 'Dividir Horizontalmente',
      description: 'Dividir tela lado a lado',
      icon: ICONS.split,
      category: 'Visualização',
      type: 'action',
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value) {
          if (splitView.value.setOrientation) (splitView.value.setOrientation as (...args: unknown[]) => unknown)('horizontal');
          if (splitView.value.activate) (splitView.value.activate as (...args: unknown[]) => unknown)(_getSplitContainer());
        }
      }
    },
    {
      id: 'view.split.vertical',
      title: 'Dividir Verticalmente',
      description: 'Dividir tela em cima/baixo',
      icon: ICONS.split,
      category: 'Visualização',
      type: 'action',
      action() {
        splitView.value = splitView.value || (CM.getSplitViewManager ? CM.getSplitViewManager() : null);
        if (splitView.value) {
          if (splitView.value.setOrientation) (splitView.value.setOrientation as (...args: unknown[]) => unknown)('vertical');
          if (splitView.value.activate) (splitView.value.activate as (...args: unknown[]) => unknown)(_getSplitContainer());
        }
      }
    },
    {
      id: 'view.zoom.in',
      title: 'Aumentar Zoom',
      description: 'Aumentar o zoom do conteúdo',
      icon: ICONS.zoomIn,
      category: 'Visualização',
      shortcut: 'Ctrl++',
      type: 'action',
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.zoomIn) (zoomManager.value.zoomIn as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'view.zoom.out',
      title: 'Diminuir Zoom',
      description: 'Diminuir o zoom do conteúdo',
      icon: ICONS.zoomOut,
      category: 'Visualização',
      shortcut: 'Ctrl+-',
      type: 'action',
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.zoomOut) (zoomManager.value.zoomOut as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'view.zoom.reset',
      title: 'Resetar Zoom',
      description: 'Voltar zoom para 100%',
      icon: ICONS.zoomReset,
      category: 'Visualização',
      shortcut: 'Ctrl+0',
      type: 'action',
      action() {
        zoomManager.value = zoomManager.value || (CM.getZoomManager ? CM.getZoomManager() : null);
        if (zoomManager.value && zoomManager.value.resetZoom) (zoomManager.value.resetZoom as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'view.fullscreen',
      title: 'Tela Cheia',
      description: 'Entrar/sair do modo tela cheia',
      icon: ICONS.fullscreen,
      category: 'Visualização',
      shortcut: 'F11',
      type: 'action',
      action() { if (CM.toggleFullscreen) CM.toggleFullscreen(); }
    },
    // === BUSCA ===
    {
      id: 'search.panel',
      title: 'Buscar no Painel',
      description: 'Buscar texto no painel atual',
      icon: ICONS.search,
      category: 'Busca',
      shortcut: 'Ctrl+F',
      type: 'action',
      action() {
        panelSearchManager.value = panelSearchManager.value || (CM.getPanelSearchManager ? CM.getPanelSearchManager() : null);
        if (panelSearchManager.value && panelSearchManager.value.open) (panelSearchManager.value.open as (...args: unknown[]) => unknown)();
      }
    },
    // === AÇÕES ===
    {
      id: 'action.print',
      title: 'Imprimir',
      description: 'Imprimir o conteúdo atual',
      icon: ICONS.print,
      category: 'Ações',
      shortcut: 'Ctrl+P',
      type: 'action',
      action() {
        printManager.value = printManager.value || (CM.getPrintManager ? CM.getPrintManager() : null);
        if (printManager.value && printManager.value.print) (printManager.value.print as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'action.export.png',
      title: 'Exportar como PNG',
      description: 'Exportar o conteúdo como imagem PNG',
      icon: ICONS.download,
      category: 'Exportar',
      type: 'action',
      action() {
        exportManager.value = exportManager.value || (CM.getExportContentManager ? CM.getExportContentManager() : null);
        if (exportManager.value && exportManager.value.exportToPNG) (exportManager.value.exportToPNG as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'action.export.pdf',
      title: 'Exportar como PDF',
      description: 'Exportar o conteúdo como PDF',
      icon: ICONS.download,
      category: 'Exportar',
      type: 'action',
      action() {
        exportManager.value = exportManager.value || (CM.getExportContentManager ? CM.getExportContentManager() : null);
        if (exportManager.value && exportManager.value.exportToPDF) (exportManager.value.exportToPDF as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'action.bookmark',
      title: 'Adicionar aos Favoritos',
      description: 'Adicionar painel atual aos favoritos',
      icon: ICONS.bookmark,
      category: 'Ações',
      shortcut: 'Ctrl+D',
      type: 'action',
      action() {
        bookmarksManager.value = bookmarksManager.value || (CM.getPanelBookmarksManager ? CM.getPanelBookmarksManager() : null);
        const navHistory = CM.getNavigationHistory ? CM.getNavigationHistory() : null;
        const current = navHistory && navHistory.getCurrentEntry ? navHistory.getCurrentEntry() : null;
        if (current && bookmarksManager.value && bookmarksManager.value.addBookmark) {
          (bookmarksManager.value.addBookmark as (...args: unknown[]) => unknown)(current.panelId, { title: current.title || current.panelId });
        }
      }
    },
    {
      id: 'action.refresh',
      title: 'Atualizar Painel',
      description: 'Recarregar o conteúdo do painel atual',
      icon: ICONS.refresh,
      category: 'Ações',
      shortcut: 'F5',
      type: 'action',
      action() {
        const eb = getEventBus();
        if (eb && eb.emit) eb.emit(PANEL_EVENT_NAMES.REFRESH_REQUEST, { source: 'command-palette' });
      }
    },
    // === ACESSIBILIDADE ===
    {
      id: 'a11y.contrast.toggle',
      title: 'Alto Contraste',
      description: 'Ativar/desativar modo de alto contraste',
      icon: ICONS.accessibility,
      category: 'Acessibilidade',
      type: 'setting',
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.toggleHighContrast) (accessibilityManager.value.toggleHighContrast as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'a11y.text.increase',
      title: 'Aumentar Texto',
      description: 'Aumentar tamanho do texto',
      icon: ICONS.accessibility,
      category: 'Acessibilidade',
      type: 'setting',
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.increaseTextScale) (accessibilityManager.value.increaseTextScale as (...args: unknown[]) => unknown)();
      }
    },
    {
      id: 'a11y.text.decrease',
      title: 'Diminuir Texto',
      description: 'Diminuir tamanho do texto',
      icon: ICONS.accessibility,
      category: 'Acessibilidade',
      type: 'setting',
      action() {
        accessibilityManager.value = accessibilityManager.value || (CM.getAccessibilityManager ? CM.getAccessibilityManager() : null);
        if (accessibilityManager.value && accessibilityManager.value.decreaseTextScale) (accessibilityManager.value.decreaseTextScale as (...args: unknown[]) => unknown)();
      }
    },
    // === CONFIGURAÇÕES ===
    {
      id: 'settings.theme.toggle',
      title: 'Alternar Tema',
      description: 'Alternar entre tema claro e escuro',
      icon: ICONS.theme,
      category: 'Configurações',
      type: 'setting',
      action() {
        const themeManager = CM.getThemeManager ? CM.getThemeManager() : null;
        if (themeManager && themeManager.toggle) themeManager.toggle();
      }
    },
    // === AJUDA ===
    {
      id: 'help.tour',
      title: 'Iniciar Tour',
      description: 'Ver guia interativo da aplicação',
      icon: ICONS.tour,
      category: 'Ajuda',
      type: 'action',
      action() {
        const tm = CM.getTourManager ? CM.getTourManager() : null;
        if (tm && tm.startTour) tm.startTour('welcome');
      }
    },
    {
      id: 'help.shortcuts',
      title: 'Atalhos de Teclado',
      description: 'Ver lista de atalhos de teclado',
      icon: ICONS.help,
      category: 'Ajuda',
      shortcut: 'Ctrl+/',
      type: 'action',
      action() {
        alert('Atalhos:\n\nCtrl+K - Paleta de comandos\nCtrl+F - Buscar\nCtrl+P - Imprimir\nCtrl+D - Favoritos\nCtrl+\\ - Dividir tela\nAlt+← - Voltar\nAlt+→ - Avançar\nF11 - Tela cheia');
      }
    }
  ];

  commands.forEach(cmd => {
    try {
      // @ts-expect-error strict migration — TS18047
      if (commandPalette.value.registerCommand) {
        // @ts-expect-error strict migration — TS18047
        (commandPalette.value.registerCommand as (...args: unknown[]) => unknown)(cmd);
        metrics.commandsRegistered++;
      }
    } catch (e: any) {
      metrics.errors++;
      logger.warn('Failed to register command', { id: cmd.id, error: e.message });
    }
  });

  logger.debug('Registered commands', { count: metrics.commandsRegistered });
}
