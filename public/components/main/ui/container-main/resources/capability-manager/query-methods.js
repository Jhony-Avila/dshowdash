import { CAPABILITY_STATUS } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.capability-manager.query-methods";
function createQueryMethods(options = {}) {
  const { store, requestHandler } = options;
  return {
    // Verifica se painel tem capacidade
    has(panelId, capability) {
      if (!store.hasPanelRecord(panelId)) return false;
      const record = store.getPanelRecord(panelId);
      const state = record.get(capability);
      return state?.status === CAPABILITY_STATUS.GRANTED;
    },
    // Verifica se painel tem todas as capacidades
    hasAll(panelId, capabilities) {
      return capabilities.every((cap) => this.has(panelId, cap));
    },
    // Verifica se painel tem alguma das capacidades
    hasAny(panelId, capabilities) {
      return capabilities.some((cap) => this.has(panelId, cap));
    },
    // Verifica e solicita se necessário
    ensure(panelId, capability) {
      if (this.has(panelId, capability)) {
        return { status: CAPABILITY_STATUS.GRANTED };
      }
      return requestHandler.request(panelId, capability);
    },
    // Obtém status de capacidade
    getStatus(panelId, capability) {
      if (!store.hasPanelRecord(panelId)) return CAPABILITY_STATUS.NOT_REQUESTED;
      const record = store.getPanelRecord(panelId);
      const state = record.get(capability);
      return state?.status || CAPABILITY_STATUS.NOT_REQUESTED;
    },
    // Obtém todas as capacidades de um painel
    getPanelCapabilities(panelId) {
      if (!store.hasPanelRecord(panelId)) return {};
      const record = store.getPanelRecord(panelId);
      const result = {};
      record.forEach((state, cap) => {
        result[cap] = { ...state };
      });
      return result;
    },
    // Obtém capacidades concedidas de um painel
    getGrantedCapabilities(panelId) {
      if (!store.hasPanelRecord(panelId)) return [];
      const record = store.getPanelRecord(panelId);
      const granted = [];
      record.forEach((state, cap) => {
        if (state.status === CAPABILITY_STATUS.GRANTED) {
          granted.push(cap);
        }
      });
      return granted;
    },
    // Lista todos os painéis com uma capacidade específica
    getPanelsWithCapability(capability) {
      const panels = [];
      store.getAllPanels().forEach((record, panelId) => {
        const state = record.get(capability);
        if (state?.status === CAPABILITY_STATUS.GRANTED) {
          panels.push(panelId);
        }
      });
      return panels;
    }
  };
}
var query_methods_default = { createQueryMethods };
export {
  MODULE_ID,
  VERSION,
  createQueryMethods,
  query_methods_default as default
};
