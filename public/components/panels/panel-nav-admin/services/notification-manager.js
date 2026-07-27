import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.5.0-MIGRATION-PHASE9";
const MODULE_ID = "panel-nav-admin.services.notification-manager";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[NotificationManager]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const NOTIFICATION_TYPES = Object.freeze({
  NAV_CHANGED: "nav_changed",
  NAV_PUBLISHED: "nav_published",
  IMPORT_COMPLETE: "import_complete",
  EXPORT_COMPLETE: "export_complete",
  BULK_COMPLETE: "bulk_complete",
  COLLAB_UPDATE: "collab_update",
  ERROR: "error"
});
const SOUND_FREQUENCIES = {
  success: [523.25, 659.25, 783.99],
  info: [440],
  warning: [349.23, 349.23],
  error: [220, 220, 220]
};
function NotificationManager(options = {}) {
  const soundEnabled = options.soundEnabled !== void 0 ? options.soundEnabled : true;
  const soundVolume = options.soundVolume !== void 0 ? options.soundVolume : 0.3;
  const notificationDuration = options.notificationDuration !== void 0 ? options.notificationDuration : 5e3;
  let _permissionGranted = false;
  let _audioContext = null;
  let _totalSent = 0;
  let _totalSounds = 0;
  async function requestPermission() {
    if (!isEnabled("pushNotifications")) return false;
    if (typeof Notification === "undefined") {
      _log("debug", "Notifications API not available");
      return false;
    }
    if (Notification.permission === "granted") {
      _permissionGranted = true;
      return true;
    }
    if (Notification.permission === "denied") {
      _log("debug", "Notifications previously denied");
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      _permissionGranted = result === "granted";
      return _permissionGranted;
    } catch (err) {
      _log("error", "Permission request failed:", err);
      return false;
    }
  }
  function notify(title, notifOptions = {}) {
    const body = notifOptions.body;
    const icon = notifOptions.icon;
    const tag = notifOptions.tag;
    const type = notifOptions.type || "info";
    const sound = notifOptions.sound !== void 0 ? notifOptions.sound : true;
    if (sound && soundEnabled && isEnabled("soundNotifications")) {
      playSound(type);
    }
    if (!isEnabled("pushNotifications") || !_permissionGranted) {
      return null;
    }
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || "/assets/icons/nav-admin.png",
        tag: tag || `pna_${Date.now()}`,
        silent: true
      });
      _totalSent++;
      if (Number(notificationDuration) > 0) {
        setTimeout(() => notification.close(), Number(notificationDuration));
      }
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return notification;
    } catch (err) {
      _log("error", "Failed to send notification:", err);
      return null;
    }
  }
  function playSound(type) {
    if (!soundEnabled || !isEnabled("soundNotifications")) return;
    try {
      if (!_audioContext) {
        _audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const frequencies = SOUND_FREQUENCIES[type] || SOUND_FREQUENCIES.info;
      const duration = 0.15;
      frequencies.forEach((freq, i) => {
        const oscillator = _audioContext.createOscillator();
        const gainNode = _audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(_audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gainNode.gain.value = soundVolume;
        const startTime = _audioContext.currentTime + i * duration * 1.2;
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(1e-3, startTime + duration);
        oscillator.stop(startTime + duration);
      });
      _totalSounds++;
    } catch (err) {
      _log("debug", "Sound playback failed:", err);
    }
  }
  function notifyEvent(notificationType, data = {}) {
    const configs = {
      [NOTIFICATION_TYPES.NAV_CHANGED]: { title: "Navega\xE7\xE3o Alterada", body: `Item "${data.label || ""}" foi alterado por ${data.actor || "outro admin"}`, type: "info" },
      [NOTIFICATION_TYPES.NAV_PUBLISHED]: { title: "Navega\xE7\xE3o Publicada", body: "As altera\xE7\xF5es foram aplicadas em produ\xE7\xE3o", type: "success" },
      [NOTIFICATION_TYPES.IMPORT_COMPLETE]: { title: "Importa\xE7\xE3o Conclu\xEDda", body: `${data.count || 0} itens importados com sucesso`, type: "success" },
      [NOTIFICATION_TYPES.EXPORT_COMPLETE]: { title: "Exporta\xE7\xE3o Conclu\xEDda", body: `Exporta\xE7\xE3o ${data.format || ""} gerada`, type: "success" },
      [NOTIFICATION_TYPES.BULK_COMPLETE]: { title: "Opera\xE7\xE3o em Lote", body: `${data.count || 0} itens atualizados`, type: "info" },
      [NOTIFICATION_TYPES.COLLAB_UPDATE]: { title: "Atualiza\xE7\xE3o Colaborativa", body: `${data.actor || "Admin"} est\xE1 editando a navega\xE7\xE3o`, type: "info" },
      [NOTIFICATION_TYPES.ERROR]: { title: "Erro", body: String(data.message || "Ocorreu um erro"), type: "error" }
    };
    const config = configs[notificationType];
    if (config) {
      notify(config.title, { body: config.body, type: config.type, tag: notificationType });
    }
  }
  function getStats() {
    return {
      permissionGranted: _permissionGranted,
      totalSent: _totalSent,
      totalSounds: _totalSounds,
      pushEnabled: isEnabled("pushNotifications"),
      soundEnabled: soundEnabled && isEnabled("soundNotifications")
    };
  }
  function destroy() {
    if (_audioContext) {
      void _audioContext.close();
      _audioContext = null;
    }
  }
  return {
    requestPermission,
    notify,
    playSound,
    notifyEvent,
    getStats,
    destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(NOTIFICATION_TYPES).length };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    notificationAPI: typeof Notification !== "undefined",
    // @ts-expect-error TS migration - TS2551
    audioAPI: typeof AudioContext !== "undefined" || typeof window?.webkitAudioContext !== "undefined"
  };
}
var notification_manager_default = { NotificationManager, NOTIFICATION_TYPES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  NOTIFICATION_TYPES,
  NotificationManager,
  VERSION,
  notification_manager_default as default,
  healthCheck,
  info,
  injectPorts
};
