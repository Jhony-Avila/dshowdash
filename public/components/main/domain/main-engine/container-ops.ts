// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-ON-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-container-ops
// PURPOSE: MainEngine Container Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAX_CONTAINERS, CRITICAL_PANELS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   cleanupOldContainers() — exported function
//   schedulePreload() — exported function
//   getContainerSnapshot() — exported function
//   clearContainerSnapshot() — exported function
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

import { MAX_CONTAINERS, CRITICAL_PANELS } from './constants.js';

export const VERSION = '5.1.0-ON-DEMAND';
export const MODULE_ID = 'main-engine-container-ops';

// Container cleanup - mantém limite de containers ativos
export function cleanupOldContainers(engine: Record<string, unknown>, currentContainerId: string) {
  try {
    const adapters = engine._adapters as Record<string, Record<string, (...args: unknown[]) => unknown>>;
    const containerAdapter = adapters.container;
    if (!containerAdapter?.list || !containerAdapter?.destroy) return;
    const containers = containerAdapter.list();
    const protectedIds = new Set(['primary', currentContainerId, engine._lastContainerId as string].filter(Boolean));
    if ((containers as unknown[]).length > MAX_CONTAINERS) {
      const sortedByAge = (containers as Record<string, unknown>[])
        .filter((c: Record<string, unknown>) => !protectedIds.has(c.id as string) && c.state === 'inactive')
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.createdAt as number) - (b.createdAt as number));
      const toRemove = sortedByAge.slice(0, (containers as unknown[]).length - MAX_CONTAINERS);
      for (const container of toRemove) {
        try {
          containerAdapter.destroy(container.id);
          (engine._metrics as Record<string, number>).containerCleanups++;
          ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('container:cleanup', { id: container.id });
        } catch (e: any) {}
      }
    }
  } catch (e: any) {}
}

// ON-DEMAND POLICY: Preload automático DESABILITADO
// Painéis devem ser carregados APENAS quando o usuário navegar explicitamente
// Esta função é mantida como no-op para compatibilidade com chamadas existentes
export function schedulePreload(engine: Record<string, unknown>) {
  // DESABILITADO: Preload automático viola o princípio de lazy loading on-demand
  // Painéis só devem ser carregados quando o usuário explicitamente navegar
  ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('main:preload-skipped', {
    reason: 'on-demand-policy',
    criticalPanels: CRITICAL_PANELS,
    timestamp: Date.now()
  });
}

// Preload controlado - disponível para uso MANUAL se necessário
// Deve ser chamado explicitamente após autenticação e em idle time
// NÃO é chamado automaticamente no boot
export async function preloadCriticalPanels(engine: Record<string, unknown>, options: Record<string, unknown> = {}) {
  // Validação: só executa se explicitamente autorizado
  if (!options.force && !options.enablePreload) {
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('main:preload-blocked', {
      reason: 'requires-explicit-enable',
      timestamp: Date.now()
    });
    return { ok: false, reason: 'Preload requires explicit enablePreload option' };
  }

  // Validação: verificar autenticação antes de preload
  const auth = (engine._adapters as Record<string, Record<string, (...args: unknown[]) => unknown>> | null)?.auth;
  if (!auth?.isAuthenticated?.()) {
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('main:preload-blocked', {
      reason: 'not-authenticated',
      timestamp: Date.now()
    });
    return { ok: false, reason: 'User not authenticated' };
  }

  try {
    const panelAdapter = (engine._adapters as Record<string, Record<string, (...args: unknown[]) => unknown>>).panelLoader;
    const results = { loaded: [] as unknown[], skipped: [] as unknown[], failed: [] as unknown[] };

    for (const panelId of CRITICAL_PANELS) {
      if (panelId === engine._lastNavigatedPanel) {
        results.skipped.push({ panelId, reason: 'already-navigated' });
        continue;
      }

      try {
        if (panelAdapter?.preload) {
          await panelAdapter.preload([panelId]);
        } else if ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).panel?.load) {
          await (engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).panel.load(panelId);
        }
        results.loaded.push(panelId);
      } catch (e: any) {
        results.failed.push({ panelId, error: (e as Error).message });
      }
    }

    (engine._metrics as Record<string, number>).preloadsTriggered++;
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('main:preload-executed', {
      panels: CRITICAL_PANELS,
      results,
      timestamp: Date.now()
    });

    return { ok: true, results };
  } catch (e: any) {
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>).telemetry)?.track?.('main:preload-error', {
      error: (e as Error).message,
      timestamp: Date.now()
    });
    return { ok: false, error: e.message };
  }
}

// Warm cache - para uso controlado (deve ser chamado manualmente)
export async function warmCache(engine: Record<string, unknown>, panelIds: unknown, options: Record<string, unknown> = {}) {
  if (!options.force) {
    const auth = (engine._adapters as Record<string, Record<string, (...args: unknown[]) => unknown>> | null)?.auth;
    if (!auth?.isAuthenticated?.()) {
      return { ok: false, reason: 'User not authenticated' };
    }
  }

  const panelLifecycle = engine._panelLifecycle as Record<string, (...args: unknown[]) => unknown> | null;
  if (panelLifecycle?.warmCache) {
    return panelLifecycle.warmCache(panelIds);
  }
  return { ok: false, reason: 'warmCache not available' };
}

// Snapshot operations
export function getContainerSnapshot(engine: Record<string, unknown>) {
  return (engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null)?.snapshot?.() || null;
}

export async function restoreContainerSnapshot(engine: Record<string, unknown>, snapshotData: Record<string, unknown>) {
  return (engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null)?.restore?.(snapshotData) || false;
}

export function clearContainerSnapshot(engine: Record<string, unknown>) {
  return (engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null)?.clearSnapshot?.() || false;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    onDemandPolicy: true,
    preloadDisabled: true,
    criticalPanels: CRITICAL_PANELS
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    onDemandPolicy: true,
    preloadDisabled: true,
    timestamp: Date.now()
  };
}

export default {
  cleanupOldContainers,
  schedulePreload,
  preloadCriticalPanels,
  warmCache,
  getContainerSnapshot,
  restoreContainerSnapshot,
  clearContainerSnapshot,
  healthCheck,
  info,
  MODULE_ID,
  VERSION
};
