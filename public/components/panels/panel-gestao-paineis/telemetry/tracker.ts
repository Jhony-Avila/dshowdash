/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/telemetry/tracker.ts
 * @version 1.0.0
 * Action tracking
 * ═══════════════════════════════════════════════════════════════ */

import { MODULE_ID } from '../core/constants.js';

declare const window: Window & Record<string, any>;

export function trackEvent(action: string, data?: Record<string, unknown>): void {
  try {
    if (window.Core?.EventBus?.emit) {
      window.Core.EventBus.emit('telemetry:event', {
        module: MODULE_ID,
        action,
        timestamp: Date.now(),
        ...data,
      });
    }
  } catch (_) {
    // swallow
  }
}

export function trackMount(): void { trackEvent('mount'); }
export function trackUnmount(): void { trackEvent('unmount'); }
export function trackFilterChange(filters: Record<string, unknown>): void { trackEvent('filter-change', filters); }
export function trackScreenshotRequest(panelId: string): void { trackEvent('screenshot-request', { panelId }); }
export function trackToggleActive(panelId: string, newState: boolean): void { trackEvent('toggle-active', { panelId, newState }); }
export function trackSavePanel(panelId: string): void { trackEvent('save-panel', { panelId }); }
