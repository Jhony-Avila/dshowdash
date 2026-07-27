// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: defaults
// PURPOSE: Command Palette - Default Commands
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   registerCommands from ../api.js
//
// PROVIDES:
//   _registerDefaultCommands() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

import { registerCommands } from '../api.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.commands.defaults';

export function _registerDefaultCommands() {
  // @ts-expect-error TS migration - TS2345
  registerCommands([
    {
      id: 'theme-toggle',
      title: 'Alternar Tema',
      description: 'Alternar entre tema claro e escuro',
      icon: '🌓',
      category: 'Aparência',
      keywords: ['dark', 'light', 'modo', 'escuro', 'claro'],
      handler: () => document.documentElement.classList.toggle('theme-light')
    },
    {
      id: 'fullscreen-toggle',
      title: 'Tela Cheia',
      description: 'Entrar ou sair do modo tela cheia',
      icon: '⛶',
      shortcut: 'F11',
      category: 'Visualização',
      keywords: ['fullscreen', 'maximize'],
      handler: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    },
    {
      id: 'reload',
      title: 'Recarregar Página',
      description: 'Recarregar a página atual',
      icon: '🔄',
      shortcut: 'Ctrl+R',
      category: 'Sistema',
      keywords: ['refresh', 'reload', 'atualizar'],
      handler: () => window.location.reload()
    },
    {
      id: 'print',
      title: 'Imprimir',
      description: 'Abrir diálogo de impressão',
      icon: '🖨️',
      shortcut: 'Ctrl+P',
      category: 'Sistema',
      keywords: ['print', 'imprimir'],
      handler: () => window.print()
    }
  ]);
}
