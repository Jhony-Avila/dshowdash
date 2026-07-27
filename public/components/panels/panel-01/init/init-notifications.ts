// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-notifications
// PURPOSE: Panel-01 - Notifications Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, initFeatureAsync, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initNotifications — exported value
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

import { CONFIG } from '../core/config.js';
import { initFeature, initFeatureAsync, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-notifications';

export const initNotifications = async (ctx: Record<string, unknown>, result: Record<string, unknown>) => {
  const features: Record<string, unknown> = CONFIG.features || {};

  // Push Notifications
  if (features.pushNotifications !== false) {
    const pushModule = await loadFeature('pushNotifications', FeatureModules.pushNotifications);
    if (pushModule && (pushModule as Record<string, unknown>).PushNotificationManager) {
      const PushNotificationManager = (pushModule as Record<string, new () => Record<string, (...a: unknown[]) => Promise<void>>>).PushNotificationManager;
      result.pushNotifications = await initFeatureAsync('pushNotifications.init', async () => {
        const manager = new PushNotificationManager();
        await manager.init();
        return manager;
      }, { fallback: null });
    }
  }

  // Sound Notifications
  if (features.soundNotifications !== false) {
    const soundModule = await loadFeature('soundNotifications', FeatureModules.soundNotifications);
    if (soundModule && (soundModule as Record<string, unknown>).SoundNotificationManager) {
      const SoundNotificationManager = (soundModule as Record<string, new () => unknown>).SoundNotificationManager;
      result.soundNotifications = initFeature('soundNotifications.init', () => new SoundNotificationManager(), { fallback: null });
    }
  }

  return result;
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export default { initNotifications, info };
