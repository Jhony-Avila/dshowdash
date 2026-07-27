// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.2.0-LOG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase-7
// PURPOSE: Bootstrap Phase 7 - Device & Browser APIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPermissionManager from ../../utils/permission-manager.js
//   createNetworkManager from ../../utils/network-manager.js
//   createGeolocationManager from ../../utils/geolocation-manager.js
//   createDeviceManager from ../../utils/device-manager.js
//   createBatteryManager from ../../utils/battery-manager.js
//   createFullscreenManager from ../../utils/fullscreen-manager.js
//   createVisibilityManager from ../../utils/visibility-manager.js
//   createWakeLockManager from ../../utils/wake-lock-manager.js
//   createShareManager from ../../utils/share-manager.js
//   registerLoaded from ../../core/dependency-map.js
//
// PROVIDES:
//   (none)
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

import { createPermissionManager } from '../../utils/permission-manager.js';
import { createNetworkManager } from '../../utils/network-manager.js';
import { createGeolocationManager } from '../../utils/geolocation-manager.js';
import { createDeviceManager } from '../../utils/device-manager.js';
import { createBatteryManager } from '../../utils/battery-manager.js';
import { createFullscreenManager } from '../../utils/fullscreen-manager.js';
import { createVisibilityManager } from '../../utils/visibility-manager.js';
import { createWakeLockManager } from '../../utils/wake-lock-manager.js';
import { createShareManager } from '../../utils/share-manager.js';
import { registerLoaded } from '../../core/dependency-map.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers.phase-7';

export async function initPhase7(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const managers = context.managers as import("../types.js").ManagerRef;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase7');
  // v13.2.0: debug — phase start/ready are internal plumbing
  logger?.debug('Phase 7 starting...');
  
  if (config.enablePermissionManager) { managers.set('permissionManager', createPermissionManager({})); registerLoaded('permission-manager'); }
  if (config.enableNetworkManager) { managers.set('networkManager', createNetworkManager({ pingInterval: 30000 })); registerLoaded('network-manager'); }
  if (config.enableGeolocationManager) { managers.set('geolocationManager', createGeolocationManager({ enableHighAccuracy: true })); registerLoaded('geolocation-manager'); }
  if (config.enableDeviceManager) { managers.set('deviceManager', createDeviceManager({})); registerLoaded('device-manager'); }
  if (config.enableBatteryManager) { managers.set('batteryManager', createBatteryManager({ lowThreshold: 0.2, criticalThreshold: 0.1 })); registerLoaded('battery-manager'); }
  if (config.enableFullscreenManager) { managers.set('fullscreenManager', createFullscreenManager({})); registerLoaded('fullscreen-manager'); }
  if (config.enableVisibilityManager) { managers.set('visibilityManager', createVisibilityManager({})); registerLoaded('visibility-manager'); }
  if (config.enableWakeLockManager) { managers.set('wakeLockManager', createWakeLockManager({ autoReacquire: true })); registerLoaded('wake-lock-manager'); }
  if (config.enableShareManager) { managers.set('shareManager', createShareManager({ fallbackToClipboard: true })); registerLoaded('share-manager'); }
  
  bootMetrics?.endPhase('phase7');
  logger?.debug('Phase 7 ready');
}

export default { initPhase7 };
