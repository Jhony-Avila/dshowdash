// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-secondary
// PURPOSE: MainEngine Secondary Container Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ENGINE_EVENTS from ./constants.js
//   isAuthenticated from ./helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   performToggleContainerFocus() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { ENGINE_EVENTS } from './constants.js';
import { isAuthenticated } from './helpers.js';

export const VERSION = '5.0.0-MODULAR';
export const MODULE_ID = 'main-engine-secondary';

export async function performOpenSecondary(engine: Record<string, unknown>, panelId: string, options = {}) {
  if (!engine._initialized) return false;
  if (!isAuthenticated(engine._ports)) return false;
  (engine._metrics as Record<string, number>).secondaryOpens++;
  const emit = engine._emit as (...args: unknown[]) => void;
  const ports = engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>;
  emit(ENGINE_EVENTS.SECONDARY_OPENING, { panelId });
  try {
    const mco = engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null;
    const result = await mco?.openContainer?.(panelId, { ...options, dock: 'secondary', strategy: 'side-by-side' }) as Record<string, unknown> | undefined;
    const containerId = result?.containerId;
    if (containerId) { const container = ports.container?.get?.(containerId) as Record<string, unknown> | undefined; if (container?.contentEl) { const panelModule = await ports.panel?.load?.(panelId); await ports.panel?.mount?.(panelModule, container.contentEl, { panelId }); } }
    emit(ENGINE_EVENTS.SECONDARY_OPENED, { panelId, containerId });
    emit(ENGINE_EVENTS.LAYOUT_CHANGED, { layout: 'side-by-side' });
    return result;
  } catch (error) { (engine._errorSupervisor as Record<string, (...args: unknown[]) => unknown> | null)?.capture?.(error, { panelId, phase: 'openSecondary' }); return false; }
}

export async function performCloseSecondary(engine: Record<string, unknown>, containerId: string) {
  const mco = engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null;
  const emit = engine._emit as (...args: unknown[]) => void;
  if (!containerId) { const containers = (mco?.getActiveContainerIds?.() || []) as string[]; for (const id of containers) { const info = mco?.getContainerInfo?.(id) as Record<string, unknown> | undefined; if (info?.slot === 'secondary') mco?.closeContainer?.(id); } }
  else mco?.closeContainer?.(containerId);
  emit(ENGINE_EVENTS.SECONDARY_CLOSED, { containerId });
  return true;
}

export function performToggleContainerFocus(engine: Record<string, unknown>, containerId: string) { return (engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null)?.toggleFocus?.(containerId) || false; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export default { performOpenSecondary, performCloseSecondary, performToggleContainerFocus, healthCheck, info, MODULE_ID, VERSION };
