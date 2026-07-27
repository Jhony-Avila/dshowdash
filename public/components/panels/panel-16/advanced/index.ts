// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:advanced
// PURPOSE: Advanced Module Index - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SnapshotManager from ./snapshot-manager.js
//   EventReplay from ./event-replay.js
//   HeadlessPanel from ./headless.js
//   FeatureFlags from ./feature-flags.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initAll() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   SnapshotManager — exported value
//   EventReplay — exported value
//   HeadlessPanel — exported value
//   FeatureFlags — exported value
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

import { SnapshotManager } from './snapshot-manager.js';
import { EventReplay as _EventReplay } from './event-replay.js';
import { HeadlessPanel } from './headless.js';
import { FeatureFlags } from './feature-flags.js';

interface EventReplayAPI {
  init(): EventReplayAPI;
  healthCheck(): { status: string; moduleId: string; version: string; [key: string]: unknown };
  info(): { moduleId: string; version: string; [key: string]: unknown };
  [key: string]: unknown;
}
const EventReplay = _EventReplay as unknown as EventReplayAPI;

export { SnapshotManager, EventReplay, HeadlessPanel, FeatureFlags };

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:advanced';

// Inicializa todos os módulos avançados
export function initAll() {
  SnapshotManager.init();
  EventReplay.init();
  FeatureFlags.init();
  return { SnapshotManager, EventReplay, HeadlessPanel, FeatureFlags };
}

// Health check agregado
export function healthCheck() {
  const checks = {
    snapshotManager: SnapshotManager.healthCheck(),
    eventReplay: EventReplay.healthCheck(),
    headlessPanel: HeadlessPanel.healthCheck(),
    featureFlags: FeatureFlags.healthCheck()
  };
  
  const statuses = Object.values(checks).map(c => c.status);
  const healthy = statuses.filter(s => s === 'HEALTHY').length;
  
  return {
    status: healthy === 4 ? 'HEALTHY' : healthy >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${healthy}/4`,
    moduleId: MODULE_ID,
    version: VERSION,
    modules: checks
  };
}

// Info agregado
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modules: {
      snapshotManager: SnapshotManager.info(),
      eventReplay: EventReplay.info(),
      headlessPanel: HeadlessPanel.info(),
      featureFlags: FeatureFlags.info()
    }
  };
}

export default { VERSION, MODULE_ID, initAll, healthCheck, info, SnapshotManager, EventReplay, HeadlessPanel, FeatureFlags };
