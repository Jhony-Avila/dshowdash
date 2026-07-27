import { triggerScreenshot } from "./api-client.js";
async function requestScreenshot(panelId, onStatusChange, signal, options) {
  try {
    onStatusChange(panelId, "pending", "Iniciando captura...");
    const result = await triggerScreenshot(panelId, options ?? {}, signal);
    if (result.ok) {
      onStatusChange(panelId, "pending", `Captura iniciada (estimativa: ${result.data.estimated_seconds}s)`);
      return {
        screenshot_id: result.data.screenshot_id,
        panel_id: result.data.panel_id,
        status: "pending",
        estimated_seconds: result.data.estimated_seconds
      };
    }
    onStatusChange(panelId, "error", result.meta?.message || "Erro ao iniciar captura");
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    onStatusChange(panelId, "error", msg);
    return null;
  }
}
export {
  requestScreenshot
};
