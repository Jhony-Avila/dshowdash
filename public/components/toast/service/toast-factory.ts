// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.toast.service.toast-factory
// PURPOSE: Toast Service Factory - Creates toast DOM elements
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract CREATE_ELEMENT - createToastElement() creates toast DOM
// @contract FORMAT_COUNTDOWN - formatCountdown() formats countdown time
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ./config.js
//   getIcon, ICONS from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createToastElement() — exported function
//   formatCountdown() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): toast object
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.createElement
// ───────────────────────────────────────────────────────────────
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-ENTERPRISE: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from './config.js';
import { getIcon, ICONS } from './icons.js';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'toast.service.toast-factory';

type ToastItem = {
  id: string;
  type: string;
  title?: string;
  message?: string;
  badge?: string;
  actions?: Array<{ primary?: boolean; label: string }>;
  countdown?: number;
  duration: number;
  [key: string]: unknown;
};

export function createToastElement(toast: ToastItem) {
  const { id, type, title, message, badge, actions, countdown, duration } = toast;
  const color = (CONFIG.colors as Record<string, { accent: string; rgb: string }>)[type] || CONFIG.colors.info;

  const el = document.createElement('div');
  el.className = `toast-item toast-item--${type}`;
  el.id = id;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', type === 'error' || type === 'critical' ? 'assertive' : 'polite');
  el.dataset.type = type;

  const circleProgress = duration > 0 ? `
    <div class="toast-item__circle-progress">
      <svg viewBox="0 0 24 24" class="toast-item__circle-svg">
        <circle class="toast-item__circle-bg" cx="12" cy="12" r="10" />
        <circle class="toast-item__circle-fill" cx="12" cy="12" r="10" data-duration="${duration}" />
      </svg>
    </div>
  ` : '';

  const actionsHtml = actions?.length ? `
    <div class="toast-item__actions">
      ${actions.map((a, i) => `
        <button class="toast-item__btn ${a.primary ? 'toast-item__btn--primary' : 'toast-item__btn--ghost'}" data-action-index="${i}">${a.label}</button>
      `).join('')}
    </div>
  ` : '';

  const countdownHtml = countdown ? `<span class="toast-item__countdown" data-remaining="${countdown}"></span>` : '';

  el.innerHTML = `
    <div class="toast-item__icon">${getIcon(type)}</div>
    <div class="toast-item__content">
      <div class="toast-item__header">
        <span class="toast-item__badge">${badge || (CONFIG.badges as Record<string, string>)[type]}</span>
        <div class="toast-item__header-actions">
          ${circleProgress}
          <button class="toast-item__close" data-action="close" aria-label="Fechar">${ICONS.close}</button>
        </div>
      </div>
      ${title ? `<strong class="toast-item__title">${title}</strong>` : ''}
      ${message ? `<p class="toast-item__message">${message}${countdownHtml}</p>` : ''}
      ${actionsHtml}
    </div>
  `;

  el.style.setProperty('--toast-type-accent', color.accent);
  el.style.setProperty('--toast-type-rgb', color.rgb);

  return el;
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export function healthCheck() {
  const checks: Record<string, boolean> = { configAvailable: typeof CONFIG === 'object', iconsAvailable: typeof getIcon === 'function' };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if (checks[checkKeys[i]]) passed++; }
  return { status: passed === checkKeys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}

export default { createToastElement, formatCountdown, VERSION, MODULE_ID, info, healthCheck };
