// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   injectStyles from ./styles.js
//
// PROVIDES:
//   createNotificationElement() — exported function
//   createNotificationController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Update Notifier - Notification Element
 * @module update-notifier/notification
 */
'use strict';

import { injectStyles } from './styles.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.update-notifier.notification';

export function createNotificationElement(config: Record<string, unknown>, onApply: unknown, onDismiss: unknown) {
  const notification = document.createElement('div');
  notification.className = 'dsd-update-notification';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  
  const positionClass = `dsd-update-notification--${config.position}`;
  notification.classList.add(positionClass);
  
  notification.innerHTML = `
    <div class="dsd-update-notification__content">
      <div class="dsd-update-notification__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <div class="dsd-update-notification__text">
        <strong>Atualização disponível</strong>
        <span class="dsd-update-notification__version"></span>
      </div>
      <div class="dsd-update-notification__actions">
        <button class="dsd-update-notification__btn dsd-update-notification__btn--primary" data-action="reload">
          Atualizar
        </button>
        ${config.dismissable ? `
          <button class="dsd-update-notification__btn dsd-update-notification__btn--secondary" data-action="dismiss">
            Depois
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // @ts-expect-error TS migration - TS2769
  notification.querySelector('[data-action="reload"]')?.addEventListener('click', onApply);
  // @ts-expect-error TS migration - TS2769
  notification.querySelector('[data-action="dismiss"]')?.addEventListener('click', onDismiss);
  
  return notification;
}

export function createNotificationController(config: Record<string, unknown>, notifyListeners: unknown) {
  let _element: HTMLElement | null = null;
  let _latestVersion = null;
  
  return {
    show(version: string) {
      if (!config.showNotification) return;
      
      _latestVersion = version;
      injectStyles();
      
      if (!_element) {
        _element = createNotificationElement(
          config,
          // @ts-expect-error strict migration — TS2349
          () => this.onApplyRequested?.(),
          () => this.hide()
        );
        document.body.appendChild(_element);
      }
      
      const versionSpan = _element.querySelector('.dsd-update-notification__version');
      if (versionSpan && _latestVersion) {
        versionSpan.textContent = `Versão ${_latestVersion} disponível`;
      }
      
      requestAnimationFrame(() => {
        _element!.classList.add('dsd-update-notification--visible');
      });
      
      (notifyListeners as (...args: unknown[]) => unknown)('notificationShown', { version: _latestVersion });
    },
    
    hide() {
      if (_element) {
        _element.classList.remove('dsd-update-notification--visible');
        
        setTimeout(() => {
          _element?.remove();
          _element = null;
        }, 300);
      }
      
      (notifyListeners as (...args: unknown[]) => unknown)('notificationDismissed', {});
    },
    
    onApplyRequested: null as Record<string, unknown> | null
  };
}
