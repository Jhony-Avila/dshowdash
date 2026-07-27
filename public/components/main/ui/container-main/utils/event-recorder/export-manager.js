import { VERSION } from "./constants.js";
const MODULE_ID = "main.ui.container-main.utils.event-recorder.export-manager";
function createExportManager(options = {}) {
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
      return new Blob([json], { type: "application/json" });
    },
    // Importa sessão
    import(data) {
      try {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        eventStore.setSessionId(parsed.sessionId);
        eventStore.setStartTime(parsed.startTime);
        eventStore.setEvents(parsed.events || []);
        logger?.info(`Imported session: ${parsed.sessionId} with ${parsed.events?.length || 0} events`);
        return { success: true, eventCount: parsed.events?.length || 0 };
      } catch (e) {
        logger?.error("Import failed:", e);
        return { success: false, error: e.message };
      }
    },
    // Importa de arquivo
    async importFromFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = this.import(e.target.result);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        };
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsText(file);
      });
    }
  };
}
var export_manager_default = { createExportManager };
export {
  MODULE_ID,
  createExportManager,
  export_manager_default as default
};
