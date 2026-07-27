/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/handlers/screenshot.ts
 * @version 1.1.0
 * Screenshot capture handler
 * FIX: gera URL fallback para paineis sem rota no banco
 * ═══════════════════════════════════════════════════════════════ */

import { store } from '../state/store.js';
import { requestScreenshot } from '../services/screenshot-client.js';
import type { ScreenshotOptions } from '../services/screenshot-client.js';

/**
 * Gera URL de captura para um painel.
 * - Se o painel tem rota, o backend já resolve.
 * - Se NÃO tem rota, usa URL padrão baseada no panel_id: /#/PANEL_ID
 */
function buildCaptureUrl(panelId: string): ScreenshotOptions {
  const panel = store.getState().panels.find(p => p.panel_id === panelId);
  if (panel && !panel.route) {
    return { url: `https://dshowdash.com.br/#/${panelId}` };
  }
  return {};
}

export async function handleScreenshotRequest(panelId: string, signal?: AbortSignal): Promise<void> {
  const pending = store.getState().pendingScreenshots;
  if (pending.has(panelId)) return;

  const options = buildCaptureUrl(panelId);

  const result = await requestScreenshot(panelId, (id, status, message) => {
    if (status === 'pending') {
      // Keep spinner active
    } else if (status === 'error') {
      store.removePendingScreenshot(id);
      console.warn(`[panel-gestao-paineis] Screenshot failed for ${id}: ${message}`);
    }
  }, signal, options);

  if (result) {
    store.addPendingScreenshot(panelId, result);
    // Auto-clear pending after estimated time + buffer
    const timeout = (result.estimated_seconds + 10) * 1000;
    setTimeout(() => {
      store.removePendingScreenshot(panelId);
    }, timeout);
  }
}
