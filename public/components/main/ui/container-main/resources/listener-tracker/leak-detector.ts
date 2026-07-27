// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: leak-detector
// PURPOSE: Listener Leak Detector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LISTENER_TRACKER_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createLeakDetector() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LISTENER_TRACKER_EVENT_NAMES.LEAKS_DETECTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LISTENER_TRACKER_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.listener-tracker.leak-detector';

export function createLeakDetector(options: Record<string, any> = {}) {
  const { 
    panelRegistry,
    statsManager,
    emitter,
    getCount
  } = options;

  return {
    detect(inactivityThreshold = 60000) {
      const now = Date.now();
      const leaks: unknown[] = [];

      panelRegistry.forEach((registry: Record<string, unknown>, panelId: string) => {
        const counts = getCount(panelId);
        const inactiveTime = now - (registry.lastActivity as number);

        if (inactiveTime > inactivityThreshold && counts.total > 0) {
          leaks.push({
            panelId,
            counts,
            inactiveFor: inactiveTime,
            severity: counts.total > 20 ? 'high' : counts.total > 10 ? 'medium' : 'low'
          });
          statsManager.incrementLeaksDetected();
        }
      });

      if (leaks.length > 0) {
        emitter?.emit(LISTENER_TRACKER_EVENT_NAMES.LEAKS_DETECTED, { leaks });
      }

      return leaks;
    }
  };
}

export default { createLeakDetector };
