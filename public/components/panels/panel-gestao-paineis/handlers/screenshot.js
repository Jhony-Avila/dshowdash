import { store } from "../state/store.js";
import { requestScreenshot } from "../services/screenshot-client.js";
function buildCaptureUrl(panelId) {
  const panel = store.getState().panels.find((p) => p.panel_id === panelId);
  if (panel && !panel.route) {
    return { url: `https://dshowdash.com.br/#/${panelId}` };
  }
  return {};
}
async function handleScreenshotRequest(panelId, signal) {
  const pending = store.getState().pendingScreenshots;
  if (pending.has(panelId)) return;
  const options = buildCaptureUrl(panelId);
  const result = await requestScreenshot(panelId, (id, status, message) => {
    if (status === "pending") {
    } else if (status === "error") {
      store.removePendingScreenshot(id);
      console.warn(`[panel-gestao-paineis] Screenshot failed for ${id}: ${message}`);
    }
  }, signal, options);
  if (result) {
    store.addPendingScreenshot(panelId, result);
    const timeout = (result.estimated_seconds + 10) * 1e3;
    setTimeout(() => {
      store.removePendingScreenshot(panelId);
    }, timeout);
  }
}
export {
  handleScreenshotRequest
};
