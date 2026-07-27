// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: subsystem-initializer
// PURPOSE: Kernel Subsystem Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createSlotManager from ../slots/slot-manager.js
//   createResourceManager, MEMORY_LIMITS from ../resources/resource-manager/index.js
//   createCleanupScheduler, CLEANUP_STRATEGIES from ../resources/cleanup-schedule...
//   createCapabilityManager from ../resources/capability-manager/index.js
//   createListenerTracker from ../resources/listener-tracker.js
//   createLifecycleGuard from ../resources/lifecycle-guard.js
//   createLayoutIntegration from ../resources/layout-integration/index.js
//   createMetricsPersistence, METRIC_TYPES from ../resources/metrics-persistence.js
//   createImageVirtualizer from ../resources/image-virtualizer.js
//   createDeprecationManager from ../resources/deprecation-manager.js
//   createCompatLayer from ../resources/compat-layer.js
//   VERSION from ./constants.js
//   KERNEL_UI_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   CLEANUP_STRATEGIES — exported value
//   MEMORY_LIMITS — exported value
//   METRIC_TYPES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   KERNEL_UI_EVENT_NAMES.CAPABILITY_DENIED
//   KERNEL_UI_EVENT_NAMES.CLEANUP
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createSlotManager } from '../slots/slot-manager.js';
import { createResourceManager, MEMORY_LIMITS } from '../resources/resource-manager/index.js';
import { createCleanupScheduler, CLEANUP_STRATEGIES } from '../resources/cleanup-scheduler.js';
import { createCapabilityManager } from '../resources/capability-manager/index.js';
import { createListenerTracker } from '../resources/listener-tracker.js';
import { createLifecycleGuard } from '../resources/lifecycle-guard.js';
import { createLayoutIntegration } from '../resources/layout-integration/index.js';
import { createMetricsPersistence, METRIC_TYPES } from '../resources/metrics-persistence.js';
import { createImageVirtualizer } from '../resources/image-virtualizer.js';
import { createDeprecationManager } from '../resources/deprecation-manager.js';
import { createCompatLayer } from '../resources/compat-layer.js';
import { VERSION } from './constants.js';
import { KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

const MODULE_ID = 'main.ui.container-main.kernel.subsystem-initializer';

export { CLEANUP_STRATEGIES, MEMORY_LIMITS, METRIC_TYPES };

interface ManagerRegistry {
  initManager: (name: string, createFn: () => Record<string, unknown>) => Promise<Record<string, unknown>>;
  get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null;
  [key: string]: unknown;
}

export async function initializeSubsystems(registry: ManagerRegistry, config: Record<string, unknown>) {
  const {
    eventBus,
    eventBridge,
    contentElement,
    cleanupStrategy = CLEANUP_STRATEGIES.BALANCED,
    memoryWarningThreshold = MEMORY_LIMITS.WARNING,
    memoryCriticalThreshold = MEMORY_LIMITS.CRITICAL,
    maxConcurrentLoads = 3,
    enableMetricsPersistence = true,
    enableImageVirtualization = true,
    enableDeprecationWarnings = true,
    errorHandler: _errorHandler,
    onSlotChange,
    onMemoryWarning,
    onMemoryCritical
  } = config;

  const errorHandler = _errorHandler as { handle: (error: unknown, context: string) => void } | null;
  const eventBridgeTyped = eventBridge as { emit: (event: string, data: Record<string, unknown>) => void } | null;

  // 1. Lifecycle Guard
  await registry.initManager('lifecycle', () => 
    createLifecycleGuard({
      eventBus,
      onIdempotencyViolation: (id: string, op: string, reason: string) => {
        errorHandler?.handle(new Error(`Idempotency violation: ${id} ${op} - ${reason}`), 'lifecycle');
      }
    })
  );

  // 2. Capability Manager
  await registry.initManager('capability', () =>
    createCapabilityManager({
      eventBus,
      onCapabilityDenied: (panelId: string, cap: unknown, reason: string) => {
        eventBridgeTyped?.emit(KERNEL_UI_EVENT_NAMES.CAPABILITY_DENIED, { panelId, capability: cap, reason });
      }
    })
  );

  // 3. Listener Tracker
  await registry.initManager('listener', () =>
    createListenerTracker({
      eventBus,
      onLeakDetected: (panelId: string, count: number) => {
        errorHandler?.handle(new Error(`Listener leak: ${panelId} has ${count} listeners`), 'listener');
      }
    })
  );

  // 4. Resource Manager
  await registry.initManager('resource', () =>
    createResourceManager({
      eventBus,
      memoryWarningThreshold,
      memoryCriticalThreshold,
      autoCleanup: true,
      onMemoryWarning,
      onMemoryCritical,
      onResourceError: (error: Record<string, unknown>) => errorHandler?.handle(error, 'resource')
    })
  );

  // 5. Slot Manager
  await registry.initManager('slot', () =>
    createSlotManager({
      container: contentElement,
      eventBus,
      maxConcurrentLoads,
      onSlotChange: (slotId: string, slot: HTMLElement) => {
        registry.get('capability')?.registerPanel(slotId);
        registry.get('listener')?.registerPanel(slotId);
        registry.get('resource')?.registerPanel(slotId);
        registry.get('metrics')?.registerPanel(slotId);
        (onSlotChange as ((slotId: string, slot: HTMLElement) => void) | undefined)?.(slotId, slot);
      },
      onSlotDestroy: (slotId: string) => {
        registry.get('capability')?.unregisterPanel(slotId);
        registry.get('listener')?.cleanupPanel(slotId);
        registry.get('resource')?.cleanupPanel(slotId);
        registry.get('layout')?.unregister(slotId);
      },
      onError: (error: Record<string, unknown>, slotId: string) => errorHandler?.handle(error, `slot:${slotId}`)
    })
  );

  // 6. Cleanup Scheduler
  await registry.initManager('cleanup', () =>
    createCleanupScheduler({
      strategy: cleanupStrategy,
      eventBus,
      onCleanup: (id: string) => eventBridgeTyped?.emit(KERNEL_UI_EVENT_NAMES.CLEANUP, { id })
    })
  );

  // 7. Layout Integration
  await registry.initManager('layout', () =>
    createLayoutIntegration({
      eventBus,
      capabilityManager: registry.get('capability'),
      onLayoutChange: (panelId: string, type: string, data: Record<string, unknown>) => {
        registry.get('metrics')?.record(panelId, `layout_${type}`, 1, { type: METRIC_TYPES.COUNTER });
      }
    })
  );

  // 8. Metrics Persistence
  if (enableMetricsPersistence) {
    await registry.initManager('metrics', () =>
      createMetricsPersistence({
        eventBus,
        persistInterval: 60000,
        onError: (op: string, error: Record<string, unknown>) => errorHandler?.handle(error, `metrics:${op}`)
      })
    );
  }

  // 9. Image Virtualizer
  if (enableImageVirtualization) {
    await registry.initManager('image', () =>
      createImageVirtualizer({
        eventBus,
        onError: (id: string, error: Record<string, unknown>) => errorHandler?.handle(new Error(String(error.message || error)), `image:${id}`)
      })
    );
  }

  // 10. Deprecation Manager
  if (enableDeprecationWarnings) {
    await registry.initManager('deprecation', () =>
      createDeprecationManager({
        eventBus,
        logToConsole: true
      })
    );
  }

  // 11. Compat Layer
  await registry.initManager('compat', () =>
    createCompatLayer({
      eventBus,
      targetVersion: VERSION
    })
  );
}

export default { initializeSubsystems, CLEANUP_STRATEGIES, MEMORY_LIMITS };
