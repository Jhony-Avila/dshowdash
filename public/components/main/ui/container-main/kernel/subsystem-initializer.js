import { createSlotManager } from "../slots/slot-manager.js";
import { createResourceManager, MEMORY_LIMITS } from "../resources/resource-manager/index.js";
import { createCleanupScheduler, CLEANUP_STRATEGIES } from "../resources/cleanup-scheduler.js";
import { createCapabilityManager } from "../resources/capability-manager/index.js";
import { createListenerTracker } from "../resources/listener-tracker.js";
import { createLifecycleGuard } from "../resources/lifecycle-guard.js";
import { createLayoutIntegration } from "../resources/layout-integration/index.js";
import { createMetricsPersistence, METRIC_TYPES } from "../resources/metrics-persistence.js";
import { createImageVirtualizer } from "../resources/image-virtualizer.js";
import { createDeprecationManager } from "../resources/deprecation-manager.js";
import { createCompatLayer } from "../resources/compat-layer.js";
import { VERSION } from "./constants.js";
import { KERNEL_UI_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const MODULE_ID = "main.ui.container-main.kernel.subsystem-initializer";
async function initializeSubsystems(registry, config) {
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
  const errorHandler = _errorHandler;
  const eventBridgeTyped = eventBridge;
  await registry.initManager(
    "lifecycle",
    () => createLifecycleGuard({
      eventBus,
      onIdempotencyViolation: (id, op, reason) => {
        errorHandler?.handle(new Error(`Idempotency violation: ${id} ${op} - ${reason}`), "lifecycle");
      }
    })
  );
  await registry.initManager(
    "capability",
    () => createCapabilityManager({
      eventBus,
      onCapabilityDenied: (panelId, cap, reason) => {
        eventBridgeTyped?.emit(KERNEL_UI_EVENT_NAMES.CAPABILITY_DENIED, { panelId, capability: cap, reason });
      }
    })
  );
  await registry.initManager(
    "listener",
    () => createListenerTracker({
      eventBus,
      onLeakDetected: (panelId, count) => {
        errorHandler?.handle(new Error(`Listener leak: ${panelId} has ${count} listeners`), "listener");
      }
    })
  );
  await registry.initManager(
    "resource",
    () => createResourceManager({
      eventBus,
      memoryWarningThreshold,
      memoryCriticalThreshold,
      autoCleanup: true,
      onMemoryWarning,
      onMemoryCritical,
      onResourceError: (error) => errorHandler?.handle(error, "resource")
    })
  );
  await registry.initManager(
    "slot",
    () => createSlotManager({
      container: contentElement,
      eventBus,
      maxConcurrentLoads,
      onSlotChange: (slotId, slot) => {
        registry.get("capability")?.registerPanel(slotId);
        registry.get("listener")?.registerPanel(slotId);
        registry.get("resource")?.registerPanel(slotId);
        registry.get("metrics")?.registerPanel(slotId);
        onSlotChange?.(slotId, slot);
      },
      onSlotDestroy: (slotId) => {
        registry.get("capability")?.unregisterPanel(slotId);
        registry.get("listener")?.cleanupPanel(slotId);
        registry.get("resource")?.cleanupPanel(slotId);
        registry.get("layout")?.unregister(slotId);
      },
      onError: (error, slotId) => errorHandler?.handle(error, `slot:${slotId}`)
    })
  );
  await registry.initManager(
    "cleanup",
    () => createCleanupScheduler({
      strategy: cleanupStrategy,
      eventBus,
      onCleanup: (id) => eventBridgeTyped?.emit(KERNEL_UI_EVENT_NAMES.CLEANUP, { id })
    })
  );
  await registry.initManager(
    "layout",
    () => createLayoutIntegration({
      eventBus,
      capabilityManager: registry.get("capability"),
      onLayoutChange: (panelId, type, data) => {
        registry.get("metrics")?.record(panelId, `layout_${type}`, 1, { type: METRIC_TYPES.COUNTER });
      }
    })
  );
  if (enableMetricsPersistence) {
    await registry.initManager(
      "metrics",
      () => createMetricsPersistence({
        eventBus,
        persistInterval: 6e4,
        onError: (op, error) => errorHandler?.handle(error, `metrics:${op}`)
      })
    );
  }
  if (enableImageVirtualization) {
    await registry.initManager(
      "image",
      () => createImageVirtualizer({
        eventBus,
        onError: (id, error) => errorHandler?.handle(new Error(String(error.message || error)), `image:${id}`)
      })
    );
  }
  if (enableDeprecationWarnings) {
    await registry.initManager(
      "deprecation",
      () => createDeprecationManager({
        eventBus,
        logToConsole: true
      })
    );
  }
  await registry.initManager(
    "compat",
    () => createCompatLayer({
      eventBus,
      targetVersion: VERSION
    })
  );
}
var subsystem_initializer_default = { initializeSubsystems, CLEANUP_STRATEGIES, MEMORY_LIMITS };
export {
  CLEANUP_STRATEGIES,
  MEMORY_LIMITS,
  METRIC_TYPES,
  subsystem_initializer_default as default,
  initializeSubsystems
};
