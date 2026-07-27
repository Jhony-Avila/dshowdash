import { registerCommands } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.commands.defaults";
function _registerDefaultCommands() {
  registerCommands([
    {
      id: "theme-toggle",
      title: "Alternar Tema",
      description: "Alternar entre tema claro e escuro",
      icon: "\u{1F313}",
      category: "Apar\xEAncia",
      keywords: ["dark", "light", "modo", "escuro", "claro"],
      handler: () => document.documentElement.classList.toggle("theme-light")
    },
    {
      id: "fullscreen-toggle",
      title: "Tela Cheia",
      description: "Entrar ou sair do modo tela cheia",
      icon: "\u26F6",
      shortcut: "F11",
      category: "Visualiza\xE7\xE3o",
      keywords: ["fullscreen", "maximize"],
      handler: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    },
    {
      id: "reload",
      title: "Recarregar P\xE1gina",
      description: "Recarregar a p\xE1gina atual",
      icon: "\u{1F504}",
      shortcut: "Ctrl+R",
      category: "Sistema",
      keywords: ["refresh", "reload", "atualizar"],
      handler: () => window.location.reload()
    },
    {
      id: "print",
      title: "Imprimir",
      description: "Abrir di\xE1logo de impress\xE3o",
      icon: "\u{1F5A8}\uFE0F",
      shortcut: "Ctrl+P",
      category: "Sistema",
      keywords: ["print", "imprimir"],
      handler: () => window.print()
    }
  ]);
}
export {
  MODULE_ID,
  VERSION,
  _registerDefaultCommands
};
