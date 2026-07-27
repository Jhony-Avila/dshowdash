/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/services/screenshot-client.ts
 * @version 1.1.0
 * Screenshot trigger and polling client
 * FIX: aceita options (url) para paineis sem rota
 * ═══════════════════════════════════════════════════════════════ */

import { triggerScreenshot } from './api-client.js';
import type { ScreenshotRequest } from '../core/types.js';

export type ScreenshotCallback = (panelId: string, status: 'pending' | 'success' | 'error', message?: string) => void;

export interface ScreenshotOptions {
  url?: string;
  width?: number;
  height?: number;
  format?: string;
}

export async function requestScreenshot(
  panelId: string,
  onStatusChange: ScreenshotCallback,
  signal?: AbortSignal,
  options?: ScreenshotOptions
): Promise<ScreenshotRequest | null> {
  try {
    onStatusChange(panelId, 'pending', 'Iniciando captura...');
    const result = await triggerScreenshot(panelId, options ?? {}, signal);
    if (result.ok) {
      onStatusChange(panelId, 'pending', `Captura iniciada (estimativa: ${result.data.estimated_seconds}s)`);
      return {
        screenshot_id: result.data.screenshot_id,
        panel_id: result.data.panel_id,
        status: 'pending',
        estimated_seconds: result.data.estimated_seconds,
      };
    }
    onStatusChange(panelId, 'error', (result as any).meta?.message || 'Erro ao iniciar captura');
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    onStatusChange(panelId, 'error', msg);
    return null;
  }
}
