// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-MIGRATION-PHASE9)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.services.notification-manager
// PURPOSE: Notification Manager — Push + Sound para alterações de nav
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   NotificationManager — Factory function
//   NOTIFICATION_TYPES — Available notification types
//   info(), healthCheck()
//
// @origin Adapted from panel-01 push + sound notifications for nav-admin
// @changelog
//   10.5.0-MIGRATION-PHASE9: Initial creation — FASE 9 G.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.5.0-MIGRATION-PHASE9';
export const MODULE_ID = 'panel-nav-admin.services.notification-manager';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[NotificationManager]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Notification types.
 * @type {Object}
 */
export const NOTIFICATION_TYPES = Object.freeze({
  NAV_CHANGED: 'nav_changed',
  NAV_PUBLISHED: 'nav_published',
  IMPORT_COMPLETE: 'import_complete',
  EXPORT_COMPLETE: 'export_complete',
  BULK_COMPLETE: 'bulk_complete',
  COLLAB_UPDATE: 'collab_update',
  ERROR: 'error'
});

/**
 * Sound effect types.
 * @private
 */
const SOUND_FREQUENCIES = {
  success: [523.25, 659.25, 783.99],
  info: [440],
  warning: [349.23, 349.23],
  error: [220, 220, 220]
};

/**
 * Factory: creates a NotificationManager.
 * Handles browser push notifications and sound feedback.
 *
 * @param {Object} [options]
 * @param {boolean} [options.soundEnabled=true] — Enable sound notifications
 * @param {number} [options.soundVolume=0.3] — Sound volume (0-1)
 * @param {number} [options.notificationDuration=5000] — Push notification auto-close (ms)
 * @returns {Object} NotificationManager instance
 */
export function NotificationManager(options: Record<string, unknown> = {}) {
  const soundEnabled = options.soundEnabled !== undefined ? options.soundEnabled : true;
  const soundVolume = options.soundVolume !== undefined ? (options.soundVolume as number) : 0.3;
  const notificationDuration = options.notificationDuration !== undefined ? (options.notificationDuration as number) : 5000;

  /** @private */
  let _permissionGranted = false;
  let _audioContext: AudioContext | null = null;
  let _totalSent = 0;
  let _totalSounds = 0;

  /**
   * Request notification permission from the user.
   * @returns {Promise<boolean>} Permission granted
   */
  async function requestPermission() {
    if (!isEnabled('pushNotifications')) return false;

    if (typeof Notification === 'undefined') {
      _log('debug', 'Notifications API not available');
      return false;
    }

    if (Notification.permission === 'granted') {
      _permissionGranted = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      _log('debug', 'Notifications previously denied');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      _permissionGranted = result === 'granted';
      return _permissionGranted;
    } catch (err) {
      _log('error', 'Permission request failed:', err);
      return false;
    }
  }

  /**
   * Send a push notification.
   *
   * @param {string} title — Notification title
   * @param {Object} [notifOptions]
   * @param {string} [notifOptions.body] — Notification body
   * @param {string} [notifOptions.icon] — Icon URL
   * @param {string} [notifOptions.tag] — Notification tag (for grouping)
   * @param {string} [notifOptions.type='info'] — Type: success | info | warning | error
   * @param {boolean} [notifOptions.sound=true] — Play sound
   * @returns {Notification|null}
   */
  function notify(title: string, notifOptions: Record<string, unknown> = {}) {
    const body = notifOptions.body as string | undefined;
    const icon = notifOptions.icon as string | undefined;
    const tag = notifOptions.tag as string | undefined;
    const type = (notifOptions.type as string) || 'info';
    const sound = notifOptions.sound !== undefined ? notifOptions.sound : true;

    // Play sound if enabled
    if (sound && soundEnabled && isEnabled('soundNotifications')) {
      playSound(type);
    }

    // Push notification
    if (!isEnabled('pushNotifications') || !_permissionGranted) {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: body,
        icon: icon || '/assets/icons/nav-admin.png',
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
      _log('error', 'Failed to send notification:', err);
      return null;
    }
  }

  /**
   * Play a sound effect.
   *
   * @param {string} type — 'success' | 'info' | 'warning' | 'error'
   */
  function playSound(type: string) {
    if (!soundEnabled || !isEnabled('soundNotifications')) return;

    try {
      if (!_audioContext) {

        // @ts-expect-error TS migration - TS2551
        _audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const frequencies = (SOUND_FREQUENCIES as Record<string, number[]>)[type] || SOUND_FREQUENCIES.info;
      const duration = 0.15;

      frequencies.forEach((freq, i) => {
        const oscillator = _audioContext!.createOscillator();
        const gainNode = _audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(_audioContext!.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.value = soundVolume;

        const startTime = _audioContext!.currentTime + (i * duration * 1.2);
        oscillator.start(startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        oscillator.stop(startTime + duration);
      });

      _totalSounds++;
    } catch (err) {
      _log('debug', 'Sound playback failed:', err);
    }
  }

  /**
   * Send a pre-configured notification for common nav-admin events.
   *
   * @param {string} notificationType — One of NOTIFICATION_TYPES values
   * @param {Object} [data] — Additional data
   */
  function notifyEvent(notificationType: string, data: Record<string, unknown> = {}) {
    const configs: Record<string, { title: string; body: string; type: string }> = {
      [NOTIFICATION_TYPES.NAV_CHANGED]: { title: 'Navegação Alterada', body: `Item "${data.label || ''}" foi alterado por ${data.actor || 'outro admin'}`, type: 'info' },
      [NOTIFICATION_TYPES.NAV_PUBLISHED]: { title: 'Navegação Publicada', body: 'As alterações foram aplicadas em produção', type: 'success' },
      [NOTIFICATION_TYPES.IMPORT_COMPLETE]: { title: 'Importação Concluída', body: `${data.count || 0} itens importados com sucesso`, type: 'success' },
      [NOTIFICATION_TYPES.EXPORT_COMPLETE]: { title: 'Exportação Concluída', body: `Exportação ${data.format || ''} gerada`, type: 'success' },
      [NOTIFICATION_TYPES.BULK_COMPLETE]: { title: 'Operação em Lote', body: `${data.count || 0} itens atualizados`, type: 'info' },
      [NOTIFICATION_TYPES.COLLAB_UPDATE]: { title: 'Atualização Colaborativa', body: `${data.actor || 'Admin'} está editando a navegação`, type: 'info' },
      [NOTIFICATION_TYPES.ERROR]: { title: 'Erro', body: String(data.message || 'Ocorreu um erro'), type: 'error' }
    };

    const config = configs[notificationType];
    if (config) {
      notify(config.title, { body: config.body, type: config.type, tag: notificationType });
    }
  }

  /**
   * Get notification stats.
   * @returns {Object}
   */
  function getStats() {
    return {
      permissionGranted: _permissionGranted,
      totalSent: _totalSent,
      totalSounds: _totalSounds,
      pushEnabled: isEnabled('pushNotifications'),
      soundEnabled: soundEnabled && isEnabled('soundNotifications')
    };
  }

  /**
   * Destroy the manager.
   */
  function destroy() {
    if (_audioContext) {
      void _audioContext.close();
      _audioContext = null;
    }
  }

  return {
    requestPermission, notify, playSound,
    notifyEvent, getStats, destroy
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(NOTIFICATION_TYPES).length };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    notificationAPI: typeof Notification !== 'undefined',

    // @ts-expect-error TS migration - TS2551
    audioAPI: typeof AudioContext !== 'undefined' || typeof window?.webkitAudioContext !== 'undefined'
  };
}

export default { NotificationManager, NOTIFICATION_TYPES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
