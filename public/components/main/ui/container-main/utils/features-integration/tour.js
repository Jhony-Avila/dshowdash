import { MODULE_ID } from "./constants.js";
import { metrics, tourManager } from "./state.js";
import { getCM } from "./helpers.js";
import { createLogger } from "../logger.js";
const VERSION = "1.1.1-WARN-FIX";
const logger = createLogger(`${MODULE_ID}:tour`);
function registerWelcomeTour() {
  const CM = getCM();
  if (!CM) return;
  tourManager.value = CM.getTourManager ? CM.getTourManager() : null;
  if (!tourManager.value) {
    logger.debug("TourManager not available (optional feature)");
    return;
  }
  const welcomeTour = {
    id: "welcome",
    name: "Bem-vindo ao DShowDash",
    description: "Conhe\xE7a as principais funcionalidades",
    steps: [
      {
        target: ".dsd-shell__region--nav-rail",
        title: "Navega\xE7\xE3o Principal",
        description: "Use a barra lateral para navegar entre os pain\xE9is da aplica\xE7\xE3o. Clique nos \xEDcones para acessar diferentes se\xE7\xF5es.",
        position: "right"
      },
      {
        target: ".dsd-container__header",
        title: "Cabe\xE7alho do Painel",
        description: "Aqui voc\xEA encontra o t\xEDtulo do painel atual e os controles de janela.",
        position: "bottom"
      },
      {
        target: "#features-toolbar",
        title: "Barra de Ferramentas",
        description: "Acesse rapidamente: navega\xE7\xE3o, busca, zoom, favoritos, exporta\xE7\xE3o e acessibilidade.",
        position: "bottom"
      },
      {
        target: "#ft-btn-search",
        title: "Busca R\xE1pida",
        description: "Clique aqui ou pressione Ctrl+F para buscar texto no painel atual.",
        position: "bottom"
      },
      {
        target: "#ft-btn-command",
        title: "Paleta de Comandos",
        description: "Pressione Ctrl+K para abrir a paleta de comandos e acessar todas as funcionalidades rapidamente.",
        position: "bottom"
      },
      {
        target: "#ft-dropdown-export",
        title: "Exportar Conte\xFAdo",
        description: "Exporte o conte\xFAdo do painel como PNG, JPEG, PDF ou SVG.",
        position: "bottom"
      },
      {
        target: ".dsd-container__content",
        title: "\xC1rea de Conte\xFAdo",
        description: "Esta \xE9 a \xE1rea principal onde o conte\xFAdo do painel \xE9 exibido. Voc\xEA pode usar scroll para navegar.",
        position: "top"
      }
    ],
    onComplete() {
      logger.debug("Welcome tour completed");
    }
  };
  try {
    if (tourManager.value.registerTour) {
      tourManager.value.registerTour(welcomeTour);
      metrics.toursRegistered++;
      logger.debug("Registered welcome tour");
    }
  } catch (e) {
    metrics.errors++;
    logger.warn("Failed to register welcome tour", { error: e.message });
  }
}
export {
  VERSION,
  registerWelcomeTour
};
