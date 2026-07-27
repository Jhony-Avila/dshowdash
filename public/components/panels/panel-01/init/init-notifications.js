import { CONFIG } from "../core/config.js";
import { initFeature, initFeatureAsync, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-notifications";
const initNotifications = async (ctx, result) => {
  const features = CONFIG.features || {};
  if (features.pushNotifications !== false) {
    const pushModule = await loadFeature("pushNotifications", FeatureModules.pushNotifications);
    if (pushModule && pushModule.PushNotificationManager) {
      const PushNotificationManager = pushModule.PushNotificationManager;
      result.pushNotifications = await initFeatureAsync("pushNotifications.init", async () => {
        const manager = new PushNotificationManager();
        await manager.init();
        return manager;
      }, { fallback: null });
    }
  }
  if (features.soundNotifications !== false) {
    const soundModule = await loadFeature("soundNotifications", FeatureModules.soundNotifications);
    if (soundModule && soundModule.SoundNotificationManager) {
      const SoundNotificationManager = soundModule.SoundNotificationManager;
      result.soundNotifications = initFeature("soundNotifications.init", () => new SoundNotificationManager(), { fallback: null });
    }
  }
  return result;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
var init_notifications_default = { initNotifications, info };
export {
  MODULE_ID,
  VERSION,
  init_notifications_default as default,
  info,
  initNotifications
};
