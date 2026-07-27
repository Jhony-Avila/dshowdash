import { DOCK_ZONES, SPLIT_MODES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.position-calculator";
function createPositionCalculator() {
  return {
    // Calcula posição de dock
    calculateDockPosition(zone, containerRect) {
      const positions = {
        [DOCK_ZONES.LEFT]: {
          x: 0,
          y: 0,
          width: containerRect.width * 0.3,
          height: containerRect.height
        },
        [DOCK_ZONES.RIGHT]: {
          x: containerRect.width * 0.7,
          y: 0,
          width: containerRect.width * 0.3,
          height: containerRect.height
        },
        [DOCK_ZONES.TOP]: {
          x: 0,
          y: 0,
          width: containerRect.width,
          height: containerRect.height * 0.3
        },
        [DOCK_ZONES.BOTTOM]: {
          x: 0,
          y: containerRect.height * 0.7,
          width: containerRect.width,
          height: containerRect.height * 0.3
        },
        [DOCK_ZONES.CENTER]: {
          x: containerRect.width * 0.1,
          y: containerRect.height * 0.1,
          width: containerRect.width * 0.8,
          height: containerRect.height * 0.8
        }
      };
      return positions[zone] || positions[DOCK_ZONES.CENTER];
    },
    // Calcula posição de split
    calculateSplitPosition(mode, index, containerRect) {
      if (mode === SPLIT_MODES.HORIZONTAL) {
        const width = containerRect.width / 2;
        return {
          x: index === 0 ? 0 : width,
          y: 0,
          width,
          height: containerRect.height
        };
      } else if (mode === SPLIT_MODES.VERTICAL) {
        const height = containerRect.height / 2;
        return {
          x: 0,
          y: index === 0 ? 0 : height,
          width: containerRect.width,
          height
        };
      } else if (mode === SPLIT_MODES.QUAD) {
        const width = containerRect.width / 2;
        const height = containerRect.height / 2;
        const positions = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: 0, y: height },
          { x: width, y: height }
        ];
        return { ...positions[index] || positions[0], width, height };
      }
      return { x: 0, y: 0, width: containerRect.width, height: containerRect.height };
    },
    // Obtém container de conteúdo
    getContentContainer(container) {
      if (!container) return null;
      return container.querySelector(".dsd-container__content") || container.querySelector('[data-slot="content"]') || container;
    },
    // Obtém rect do container
    getContainerRect(container) {
      const contentContainer = this.getContentContainer(container);
      return contentContainer?.getBoundingClientRect() || { width: 800, height: 600 };
    }
  };
}
var position_calculator_default = { createPositionCalculator };
export {
  MODULE_ID,
  VERSION,
  createPositionCalculator,
  position_calculator_default as default
};
