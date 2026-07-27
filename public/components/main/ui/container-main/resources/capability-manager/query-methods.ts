// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: query-methods
// PURPOSE: Query Methods - Métodos de consulta de capacidades
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CAPABILITY_STATUS from ./constants.js
//
// PROVIDES:
//   createQueryMethods() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CAPABILITY_STATUS } from './constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.capability-manager.query-methods';

export function createQueryMethods(options: Record<string, any> = {}) {
  const { store, requestHandler } = options;

  return {
    // Verifica se painel tem capacidade
    has(panelId: string, capability: string) {
      if (!store.hasPanelRecord(panelId)) return false;
      const record = store.getPanelRecord(panelId);
      const state = record.get(capability);
      return state?.status === CAPABILITY_STATUS.GRANTED;
    },

    // Verifica se painel tem todas as capacidades
    hasAll(panelId: string, capabilities: string[]) {
      return capabilities.every((cap: string) => this.has(panelId, cap));
    },

    // Verifica se painel tem alguma das capacidades
    hasAny(panelId: string, capabilities: string[]) {
      return capabilities.some((cap: string) => this.has(panelId, cap));
    },

    // Verifica e solicita se necessário
    ensure(panelId: string, capability: string) {
      if (this.has(panelId, capability)) {
        return { status: CAPABILITY_STATUS.GRANTED };
      }
      return requestHandler.request(panelId, capability);
    },

    // Obtém status de capacidade
    getStatus(panelId: string, capability: string) {
      if (!store.hasPanelRecord(panelId)) return CAPABILITY_STATUS.NOT_REQUESTED;
      const record = store.getPanelRecord(panelId);
      const state = record.get(capability);
      return state?.status || CAPABILITY_STATUS.NOT_REQUESTED;
    },

    // Obtém todas as capacidades de um painel
    getPanelCapabilities(panelId: string) {
      if (!store.hasPanelRecord(panelId)) return {};
      
      const record = store.getPanelRecord(panelId);
      const result: Record<string, any> = {};
      record.forEach((state: Record<string, unknown>, cap: string) => {
        result[cap] = { ...state };
      });
      return result;
    },

    // Obtém capacidades concedidas de um painel
    getGrantedCapabilities(panelId: string) {
      if (!store.hasPanelRecord(panelId)) return [];

      const record = store.getPanelRecord(panelId);
      const granted: unknown[] = [];
      record.forEach((state: Record<string, unknown>, cap: unknown) => {
        if (state.status === CAPABILITY_STATUS.GRANTED) {
          granted.push(cap);
        }
      });
      return granted;
    },

    // Lista todos os painéis com uma capacidade específica
    getPanelsWithCapability(capability: string) {
      const panels: unknown[] = [];
      store.getAllPanels().forEach((record: Map<string, Record<string, unknown>>, panelId: string) => {
        const state = record.get(capability);
        if (state?.status === CAPABILITY_STATUS.GRANTED) {
          panels.push(panelId);
        }
      });
      return panels;
    }
  };
}

export default { createQueryMethods };
