/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/telemetry/tracker.ts
 * @version 1.0.0
 * Telemetria leve do painel (stateless; degrada em silêncio).
 * ═══════════════════════════════════════════════════════════════ */

import { MODULE_ID } from '../core/constants.js';

type Telemetry = { track?: (event: string, data?: Record<string, unknown>) => void } | undefined;

function _telemetry(): Telemetry {
  const w = globalThis as unknown as { __telemetry?: Telemetry };
  return w.__telemetry;
}

function _emit(event: string, data: Record<string, unknown> = {}): void {
  try {
    _telemetry()?.track?.(event, { source: MODULE_ID, ...data });
  } catch {
    /* telemetria nunca derruba o painel */
  }
}

export function trackMount(): void {
  _emit('panel.mount');
}

export function trackUnmount(): void {
  _emit('panel.unmount');
}

export function trackAction(action: string, data: Record<string, unknown> = {}): void {
  _emit('panel.action', { action, ...data });
}
