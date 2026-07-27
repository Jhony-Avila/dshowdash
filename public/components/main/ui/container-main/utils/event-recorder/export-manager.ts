// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: export-manager
// PURPOSE: Event Recorder Export Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from ./constants.js
//
// PROVIDES:
//   createExportManager() — exported function
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

import { VERSION } from './constants.js';

export const MODULE_ID = 'main.ui.container-main.utils.event-recorder.export-manager';

export function createExportManager(options: Record<string, any> = {}) {
  const { eventStore, logger } = options;

  return {
    // Exporta sessão como objeto
    export() {
      return {
        version: VERSION,
        sessionId: eventStore.getSessionId(),
        startTime: eventStore.getStartTime(),
        endTime: Date.now(),
        duration: eventStore.getDuration(),
        eventCount: eventStore.getEventCount(),
        events: eventStore.getEvents()
      };
    },

    // Exporta como JSON string
    exportJSON() {
      return JSON.stringify(this.export(), null, 2);
    },

    // Exporta como Blob para download
    exportBlob() {
      const json = this.exportJSON();
      return new Blob([json], { type: 'application/json' });
    },

    // Importa sessão
    import(data: Record<string, unknown>) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        
        eventStore.setSessionId(parsed.sessionId);
        eventStore.setStartTime(parsed.startTime);
        eventStore.setEvents(parsed.events || []);
        
        logger?.info(`Imported session: ${parsed.sessionId} with ${parsed.events?.length || 0} events`);
        return { success: true, eventCount: parsed.events?.length || 0 };
      } catch (e: any) {
        logger?.error('Import failed:', e);
        return { success: false, error: e.message };
      }
    },

    // Importa de arquivo
    async importFromFile(file: unknown) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // @ts-expect-error strict migration — TS18047, TS2345
          const result = this.import(e.target.result);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        };
        reader.onerror = () => reject(new Error('File read failed'));
        // @ts-expect-error TS migration - TS2345
        reader.readAsText(file);
      });
    }
  };
}

export default { createExportManager };
