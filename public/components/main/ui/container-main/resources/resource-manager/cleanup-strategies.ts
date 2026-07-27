// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:resource-manager:cleanup-strategies
// PURPOSE: Resource Manager - Cleanup Strategies
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESOURCE_STATES, getRegisteredResources, getResourcesByType, disposeAllResour...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
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

import { 
  RESOURCE_STATES,
  getRegisteredResources,
  getResourcesByType,
  disposeAllResources 
} from '../../contracts/resource-contract.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:resource-manager:cleanup-strategies';

// Cleanup por prioridade global
export async function cleanupByPriority(options: Record<string, any> = {}) {
  const {
    throttledPanels = new Set(),
    panelResources = new Map(),
    unregisterResource,
    onProgress
  } = options;

  let cleaned = 0;
  const initialTotal = getRegisteredResources().length;

  // 1. Recursos em estado de erro
  const errorResources = getRegisteredResources().filter(
    r => r.getState?.()?.state === RESOURCE_STATES.ERROR
  );
  for (const r of errorResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.('error', cleaned);
  }

  // 2. Recursos de painéis throttled
  for (const panelId of throttledPanels) {
    const record = panelResources.get(panelId);
    if (record) {
      for (const [resourceId, info] of record.resources) {
        if (info.resource?.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
          await unregisterResource?.(panelId, resourceId);
          cleaned++;
          onProgress?.('throttled', cleaned);
        }
      }
    }
  }

  // 3. Recursos pausados
  const pausedResources = getRegisteredResources().filter(
    r => r.getState?.()?.state === RESOURCE_STATES.PAUSED
  );
  for (const r of pausedResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.('paused', cleaned);
  }

  // 4. Recursos idle
  const idleResources = getRegisteredResources().filter(
    r => r.getState?.()?.state === RESOURCE_STATES.IDLE
  );
  for (const r of idleResources) {
    await r.dispose?.();
    cleaned++;
    onProgress?.('idle', cleaned);
  }

  return { cleaned, previousTotal: initialTotal };
}

// Cleanup por tipo específico
export async function cleanupByType(type: string) {
  const resources = getResourcesByType(type);
  let cleaned = 0;

  for (const r of resources) {
    if (r.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
      await r.dispose?.();
      cleaned++;
    }
  }

  return cleaned;
}

// Cleanup de painel específico
export async function cleanupPanel(panelId: string, options: Record<string, any> = {}) {
  const { panelResources, unregisterResource } = options;
  
  const record = panelResources?.get(panelId);
  if (!record) return 0;

  let cleaned = 0;
  for (const [resourceId, info] of record.resources) {
    if (info.resource?.getState?.()?.state !== RESOURCE_STATES.ACTIVE) {
      await unregisterResource?.(panelId, resourceId);
      cleaned++;
    }
  }

  return cleaned;
}

// Dispose de todos os recursos
export async function disposeAll(panelResources: Map<string, unknown>, unregisterPanel: (panelId: string) => Promise<unknown>) {
  // Dispose panel resources primeiro
  if (panelResources && unregisterPanel) {
    for (const [panelId] of panelResources) {
      await unregisterPanel(panelId);
    }
  }

  return disposeAllResources();
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['cleanupByPriority', 'cleanupByType', 'cleanupPanel', 'disposeAll'],
    priorities: ['error', 'throttled', 'paused', 'idle']
  };
}

export default {
  VERSION,
  MODULE_ID,
  cleanupByPriority,
  cleanupByType,
  cleanupPanel,
  disposeAll,
  info
};
