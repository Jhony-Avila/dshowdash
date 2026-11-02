// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

import { PANEL_INTENTS } from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — helper functions for panel event handling

/**
 * Creates a filtered event handler that only fires for the specified panel.
 * Used by panels to register refresh handlers scoped to their panel ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPanelHandler(panelId: string, handler: (...args: any[]) => void): (payload: unknown) => void {
  return (payload: unknown): void => {
    const p = payload as Record<string, unknown> | null;
    if (p && (p.panelId === panelId || p.target === panelId || p.panel === panelId)) {
      handler(payload);
    }
  };
}

/**
 * Emits a panel intent event to the global event bus.
 * Resolves the intent name from PANEL_INTENTS and dispatches a CustomEvent.
 */
export function emitPanelIntent(intentName: string, panelId: string): void {
  const eventName: string = (PANEL_INTENTS as Record<string, string>)[intentName] || `panel.${intentName.toLowerCase()}.request`;
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { panelId, timestamp: Date.now() } }));
  }
}
