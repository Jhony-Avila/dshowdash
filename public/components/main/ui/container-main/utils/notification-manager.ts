
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:notification-manager
// PURPOSE: Notification Manager - Sistema de notificações toast/alert
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NOTIFICATION_TYPES — exported value
//   POSITIONS — exported value
//   createNotificationManager() — exported function
//   getNotificationManager() — exported function
//   resetNotificationManager() — exported function
//   notify() — exported function
//   notifySuccess() — exported function
//   notifyError() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:notification-manager';

// Tipos de notificação
export const NOTIFICATION_TYPES = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  LOADING: 'loading'
});

// Posições
export const POSITIONS = Object.freeze({
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right'
});

// Cria o Notification Manager
export function createNotificationManager(options: Record<string, any> = {}) {
  const {
    position = POSITIONS.TOP_RIGHT,
    maxVisible = 5,
    defaultDuration = 5000,
    pauseOnHover = true,
    stackDirection = 'down',
    containerClass = 'cm-notifications',
    zIndex = 9999,
    animation = 'slide',
    onShow = null,
    onHide = null,
    onClick = null
  } = options;

  const _logger: ReturnType<typeof createLogger> = createLogger(MODULE_ID);
  let _container: HTMLElement | null = null;
  let _notifications = new Map();
  let _queue: Record<string, unknown>[] = [];
  let _counter = 0;
  let _metrics = { shown: 0, clicked: 0, dismissed: 0, queued: 0 };

  // Estilos inline
  const STYLES = `
    .cm-notifications { position: fixed; z-index: ${zIndex}; display: flex; flex-direction: column; gap: 8px; padding: 16px; pointer-events: none; max-width: 400px; }
    .cm-notifications.top-left { top: 0; left: 0; }
    .cm-notifications.top-center { top: 0; left: 50%; transform: translateX(-50%); }
    .cm-notifications.top-right { top: 0; right: 0; }
    .cm-notifications.bottom-left { bottom: 0; left: 0; }
    .cm-notifications.bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); }
    .cm-notifications.bottom-right { bottom: 0; right: 0; }
    .cm-notification { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 8px; background: #1a1a2e; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); pointer-events: auto; cursor: pointer; min-width: 280px; max-width: 100%; opacity: 0; transform: translateX(100%); transition: all 0.3s ease; }
    .cm-notification.visible { opacity: 1; transform: translateX(0); }
    .cm-notification.removing { opacity: 0; transform: translateX(100%); }
    .cm-notification.info { border-left: 4px solid #3b82f6; }
    .cm-notification.success { border-left: 4px solid #22c55e; }
    .cm-notification.warning { border-left: 4px solid #f59e0b; }
    .cm-notification.error { border-left: 4px solid #ef4444; }
    .cm-notification.loading { border-left: 4px solid #8b5cf6; }
    .cm-notification-icon { font-size: 20px; flex-shrink: 0; }
    .cm-notification-content { flex: 1; min-width: 0; }
    .cm-notification-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .cm-notification-message { font-size: 13px; opacity: 0.9; word-wrap: break-word; }
    .cm-notification-close { background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; padding: 0; font-size: 18px; line-height: 1; }
    .cm-notification-close:hover { opacity: 1; }
    .cm-notification-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: rgba(255,255,255,0.3); border-radius: 0 0 0 8px; transition: width linear; }
    .cm-notification-actions { display: flex; gap: 8px; margin-top: 8px; }
    .cm-notification-action { background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .cm-notification-action:hover { background: rgba(255,255,255,0.3); }
    @keyframes cm-spin { to { transform: rotate(360deg); } }
    .cm-notification.loading .cm-notification-icon { animation: cm-spin 1s linear infinite; }
  `;

  // Ícones por tipo
  const ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳'
  };

  // Cria container
  function _createContainer() {
    if (_container) return;

    // Injeta estilos
    if (!document.getElementById('cm-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'cm-notification-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    }

    _container = document.createElement('div');
    _container.className = `${containerClass} ${position}`;
    document.body.appendChild(_container);
  }

  // Cria elemento da notificação
  function _createElement(notification: Record<string, unknown>) {
    const el = document.createElement('div');
    el.className = `cm-notification ${notification.type}`;
    el.dataset.id = (notification.id) as string;

    let actionsHtml = '';
    // @ts-expect-error TS migration - TS2339
    if (notification.actions?.length > 0) {
      actionsHtml = `<div class="cm-notification-actions">${(notification.actions as unknown[]).map((a: unknown, i: number) => `<button class="cm-notification-action" data-action="${i}">${(a as Record<string, unknown>).label}</button>`).join('')}</div>`;
    }

    el.innerHTML = `
      <span class="cm-notification-icon">${(notification as Record<string, unknown>).icon || (ICONS as Record<string, string>)[(notification as Record<string, unknown>).type as string]}</span>
      <div class="cm-notification-content">
        ${notification.title ? `<div class="cm-notification-title">${notification.title}</div>` : ''}
        <div class="cm-notification-message">${notification.message}</div>
        ${actionsHtml}
      </div>
      ${notification.closable !== false ? '<button class="cm-notification-close">×</button>' : ''}
      ${(notification.duration as number) > 0 ? '<div class="cm-notification-progress"></div>' : ''}
    `;

    // Event listeners
    el.addEventListener('click', (e: Record<string, any>) => {
      if (e.target.classList.contains('cm-notification-close')) {
        _hide((notification.id as string));
        return;
      }
      if (e.target.classList.contains('cm-notification-action')) {
        const actionIndex = parseInt(e.target.dataset.action);
        // @ts-expect-error TS migration - TS2349
        (notification.actions as Record<string, unknown>[])?.[actionIndex]?.onClick?.();
        if ((notification.actions as Record<string, unknown>[])?.[actionIndex]?.closeOnClick !== false) {
          _hide((notification.id as string));
        }
        return;
      }
      _metrics.clicked++;
      onClick?.(notification);
      // @ts-expect-error TS migration - TS2349
      notification.onClick?.();
    });

    if (pauseOnHover && (notification.duration as number) > 0) {
      el.addEventListener('mouseenter', () => _pauseTimer((notification.id as string)));
      el.addEventListener('mouseleave', () => _resumeTimer((notification.id as string)));
    }

    return el;
  }

  // Mostra notificação
  function _show(notification: Record<string, unknown>) {
    _createContainer();

    const visibleCount = _notifications.size;
    if (visibleCount >= maxVisible) {
      _queue.push(notification);
      _metrics.queued++;
      return notification.id;
    }

    const el = _createElement(notification);
    notification.element = el;
    notification.createdAt = Date.now();

    if (stackDirection === 'up') {
      _container!.insertBefore(el, _container!.firstChild);
    } else {
      _container!.appendChild(el);
    }

    _notifications.set(notification.id, notification);
    _metrics.shown++;

    // Anima entrada
    requestAnimationFrame(() => {
      el.classList.add('visible');
    });

    // Auto-dismiss
    if ((notification.duration as number) > 0) {
      _startTimer(notification);
    }

    onShow?.(notification);
    _logger.debug(`Notification shown: ${notification.id}`);

    return notification.id;
  }

  // Esconde notificação
  function _hide(id: string) {
    const notification = _notifications.get(id);
    if (!notification) return;

    _clearTimer(notification);

    const el = notification.element;
    el.classList.remove('visible');
    el.classList.add('removing');

    setTimeout(() => {
      el.remove();
      _notifications.delete(id);
      _metrics.dismissed++;
      onHide?.(notification);
      _processQueue();
    }, 300);
  }

  // Timer management
  function _startTimer(notification: Record<string, unknown>) {
    // @ts-expect-error TS migration - TS2339
    const progress = notification.element?.querySelector('.cm-notification-progress');
    if (progress) {
      progress.style.width = '100%';
      progress.style.transitionDuration = `${notification.duration}ms`;
      requestAnimationFrame(() => {
        progress.style.width = '0%';
      });
    }

    notification.timerId = setTimeout(() => {
      _hide((notification.id as string));
    // @ts-expect-error TS migration - TS2769
    }, notification.duration);
    notification.timerStart = Date.now();
    notification.timerRemaining = notification.duration;
  }

  function _pauseTimer(id: string) {
    const notification = _notifications.get(id);
    if (!notification || !notification.timerId) return;

    clearTimeout(notification.timerId);
    notification.timerRemaining -= Date.now() - notification.timerStart;

    const progress = notification.element?.querySelector('.cm-notification-progress');
    if (progress) {
      const computed = getComputedStyle(progress);
      progress.style.transitionDuration = '0s';
      progress.style.width = computed.width;
    }
  }

  function _resumeTimer(id: string) {
    const notification = _notifications.get(id);
    if (!notification || notification.timerRemaining <= 0) return;

    const progress = notification.element?.querySelector('.cm-notification-progress');
    if (progress) {
      progress.style.transitionDuration = `${notification.timerRemaining}ms`;
      requestAnimationFrame(() => {
        progress.style.width = '0%';
      });
    }

    notification.timerId = setTimeout(() => {
      _hide(notification.id);
    }, notification.timerRemaining);
    notification.timerStart = Date.now();
  }

  function _clearTimer(notification: Record<string, unknown>) {
    if (notification.timerId) {
      // @ts-expect-error TS migration - TS2769
      clearTimeout(notification.timerId);
      notification.timerId = null;
    }
  }

  // Processa fila
  function _processQueue() {
    if (_queue.length === 0) return;
    if (_notifications.size >= maxVisible) return;

    const next = _queue.shift();
    // @ts-expect-error strict migration — TS2345
    _show(next);
  }

  const manager = {
    // Mostra notificação
    show(options: Record<string, unknown>) {
      const notification = {
        id: `notif-${++_counter}`,
        type: options.type || NOTIFICATION_TYPES.INFO,
        title: options.title || null,
        message: options.message || '',
        duration: options.duration ?? defaultDuration,
        icon: options.icon || null,
        closable: options.closable !== false,
        actions: options.actions || [],
        onClick: options.onClick || null,
        data: options.data || null
      };

      return _show(notification);
    },

    // Shortcuts
    info(message: string, options = {}) {
      return this.show({ ...options, type: NOTIFICATION_TYPES.INFO, message });
    },

    success(message: string, options = {}) {
      return this.show({ ...options, type: NOTIFICATION_TYPES.SUCCESS, message });
    },

    warning(message: string, options = {}) {
      return this.show({ ...options, type: NOTIFICATION_TYPES.WARNING, message });
    },

    error(message: string, options: Record<string, any> = {}) {
      return this.show({ ...options, type: NOTIFICATION_TYPES.ERROR, message, duration: options.duration ?? 0 });
    },

    loading(message: string, options = {}) {
      return this.show({ ...options, type: NOTIFICATION_TYPES.LOADING, message, duration: 0, closable: false });
    },

    // Atualiza notificação existente
    update(id: string, options: Record<string, unknown>) {
      const notification = _notifications.get(id);
      if (!notification) return false;

      if (options.type) {
        notification.type = options.type;
        notification.element.className = `cm-notification ${options.type} visible`;
      }
      if (options.title !== undefined) {
        const titleEl = notification.element.querySelector('.cm-notification-title');
        if (titleEl) titleEl.textContent = options.title;
      }
      if (options.message !== undefined) {
        notification.element.querySelector('.cm-notification-message').textContent = options.message;
      }
      if (options.icon) {
        notification.element.querySelector('.cm-notification-icon').textContent = options.icon;
      }

      return true;
    },

    // Esconde
    hide(id: string) {
      _hide(id);
    },

    // Esconde todas
    hideAll() {
      for (const id of _notifications.keys()) {
        _hide(id);
      }
      _queue = [];
    },

    // Promise helper
    async promise(promise: Promise<any>, options: Record<string, any> = {}) {
      const id = this.loading(options.loading || 'Loading...');

      try {
        const result = await promise;
        // @ts-expect-error strict migration — TS2345
        this.update(id, {
          type: NOTIFICATION_TYPES.SUCCESS,
          message: options.success || 'Success!',
          icon: ICONS.success
        });
        // @ts-expect-error strict migration — TS2345
        setTimeout(() => this.hide(id), options.successDuration ?? 3000);
        return result;
      } catch (error) {
        // @ts-expect-error strict migration — TS2345
        this.update(id, {
          type: NOTIFICATION_TYPES.ERROR,
          message: options.error || (error as Error).message || 'Error!',
          icon: ICONS.error
        });
        if (options.errorDuration !== 0) {
          // @ts-expect-error strict migration — TS2345
          setTimeout(() => this.hide(id), options.errorDuration ?? 5000);
        }
        throw error;
      }
    },

    // Getters
    getNotification(id: string) { return _notifications.get(id); },
    getVisible() { return Array.from(_notifications.values()); },
    getQueueLength() { return _queue.length; },
    getMetrics() { return { ..._metrics, visible: _notifications.size, queued: _queue.length }; },
    resetMetrics() { _metrics = { shown: 0, clicked: 0, dismissed: 0, queued: 0 }; },

    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        visible: _notifications.size,
        queued: _queue.length,
        metrics: _metrics
      };
    },

    // Info
    getInfo() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        position,
        maxVisible,
        defaultDuration,
        types: Object.keys(NOTIFICATION_TYPES),
        positions: Object.keys(POSITIONS)
      };
    },

    // Destroy
    destroy() {
      this.hideAll();
      if (_container) {
        _container.remove();
        _container = null;
      }
      const styles = document.getElementById('cm-notification-styles');
      if (styles) styles.remove();
    }
  };

  return manager;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getNotificationManager(options = {}) {
  if (!_instance) {
    _instance = createNotificationManager(options);
  }
  return _instance;
}

export function resetNotificationManager() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

// Shortcuts globais
export function notify(message: string, options = {}) {
  return (getNotificationManager().show as (...args: unknown[]) => unknown)({ message, ...options });
}

export function notifySuccess(message: string, options = {}) {
  return (getNotificationManager().success as (...args: unknown[]) => unknown)(message, options);
}

export function notifyError(message: string, options = {}) {
  return (getNotificationManager().error as (...args: unknown[]) => unknown)(message, options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(NOTIFICATION_TYPES), positions: Object.keys(POSITIONS) };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID, NOTIFICATION_TYPES, POSITIONS,
  createNotificationManager, getNotificationManager, resetNotificationManager,
  notify, notifySuccess, notifyError, info, healthCheck
};
