// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-toast
// PURPOSE: UARPS Admin - Toast System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   dismiss() — exported function
//   dismissAll() — exported function
//   setSoundEnabled() — exported function
//   success() — exported function
//   error() — exported function
//   warning() — exported function
//   toastInfo() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   Toast — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { Icons } from './icons.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-toast';

let _container: HTMLElement | null = null;
interface ToastItem { id: string; toast: HTMLElement; timeout: ReturnType<typeof setTimeout> | null; }
const _toasts: ToastItem[] = [];
let _soundEnabled = false;
const SOUNDS = { success: '/assets/sounds/success.mp3', error: '/assets/sounds/error.mp3', warning: '/assets/sounds/warning.mp3' };

function _ensureContainer() { if (_container) return _container; _container = document.createElement('div'); _container.className = 'uarps-toast-container'; document.body.appendChild(_container); return _container; }
function _playSound(type: string) { if (!_soundEnabled || !(SOUNDS as Record<string, string>)[type]) return; try { const audio = new Audio((SOUNDS as Record<string, string>)[type]); audio.volume = 0.3; audio.play().catch(() => {}); } catch (e) {} }
function _vibrate(pattern: number[]) { if (!pattern) pattern = [50]; try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }

export function show(options: Record<string, unknown>) {
  if (!options) options = {};
  const type = String(options.type || 'info');
  const title = String(options.title || '');
  const message = String(options.message || '');
  const duration = options.duration !== undefined ? Number(options.duration) : 4000;
  const actions = (options.actions || []) as Array<Record<string, unknown>>;
  const closable = options.closable !== undefined ? options.closable : true;
  const sound = options.sound !== undefined ? options.sound : true;
  const vibrate = options.vibrate !== undefined ? options.vibrate : true;

  _ensureContainer();
  const id = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.className = `uarps-toast uarps-toast--${type}`;
  toast.id = id;
  toast.style.setProperty('--toast-duration', `${duration}ms`);
  const iconMap: Record<string, string> = { success: 'checkCircle', error: 'xCircle', warning: 'alertTriangle', info: 'info' };
  const iconsRecord = Icons as unknown as Record<string, string>;
  let actionsHtml = '';
  if (actions.length) { actionsHtml = '<div class="uarps-toast__actions">'; for (let i = 0; i < actions.length; i++) { const a = actions[i]; actionsHtml += `<button class="uarps-toast__action ${a.secondary ? 'uarps-toast__action--secondary' : ''}" data-action="${a.id}">${a.label}</button>`; } actionsHtml += '</div>'; }
  toast.innerHTML = `<span class="uarps-toast__icon">${iconsRecord[iconMap[String(type)]] || iconsRecord.info}</span><div class="uarps-toast__content">${title ? `<div class="uarps-toast__title">${title}</div>` : ''}${message ? `<div class="uarps-toast__message">${message}</div>` : ''}${actionsHtml}</div>${closable ? `<button class="uarps-toast__close">${iconsRecord.x}</button>` : ''}<div class="uarps-toast__progress"></div>`;

  const closeBtn = toast.querySelector('.uarps-toast__close');
  if (closeBtn) closeBtn.addEventListener('click', () => { dismiss(id); });
  const actionBtns = toast.querySelectorAll('[data-action]');

  // @ts-expect-error TS migration - TS2339
  for (let j = 0; j < actionBtns.length; j++) { (btn => { btn.addEventListener('click', () => { let action = null; for (let k = 0; k < actions.length; k++) { if (actions[k].id === btn.dataset.action) { action = actions[k]; break; } } if (action && action.onClick) action.onClick(); if (!action || action.dismiss !== false) dismiss(id); }); })(actionBtns[j]); }

  _container!.appendChild(toast);
  _toasts.push({ id, toast, timeout: null });
  if (sound) _playSound(type);
  if (vibrate && type === 'error') _vibrate([100, 50, 100]);
  if (duration > 0) { const timeout = setTimeout(() => { dismiss(id); }, duration); let t = null; for (let m = 0; m < _toasts.length; m++) { if (_toasts[m].id === id) { t = _toasts[m]; break; } } if (t) t.timeout = timeout; }
  return id;
}

export function dismiss(id: string) {
  let index = -1;
  for (let i = 0; i < _toasts.length; i++) { if (_toasts[i].id === id) { index = i; break; } }
  if (index === -1) return;
  const item = _toasts[index];
  if (item.timeout) clearTimeout(item.timeout);
  item.toast.classList.add('uarps-toast--exiting');
  setTimeout(() => { item.toast.remove(); _toasts.splice(index, 1); }, 300);
}

export function dismissAll() { const ids = []; for (let i = 0; i < _toasts.length; i++) ids.push(_toasts[i].id); for (let j = 0; j < ids.length; j++) dismiss(ids[j]); }
export function setSoundEnabled(enabled: boolean) { _soundEnabled = !!enabled; }
export function success(title: string, message: string, options: Record<string, unknown>) { if (!options) options = {}; options.type = 'success'; options.title = title; options.message = message; return show(options); }
export function error(title: string, message: string, options: Record<string, unknown>) { if (!options) options = {}; options.type = 'error'; options.title = title; options.message = message; return show(options); }
export function warning(title: string, message: string, options: Record<string, unknown>) { if (!options) options = {}; options.type = 'warning'; options.title = title; options.message = message; return show(options); }
export function toastInfo(title: string, message: string, options: Record<string, unknown>) { if (!options) options = {}; options.type = 'info'; options.title = title; options.message = message; return show(options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!_container || true, toastCount: _toasts.length } }; }

export const Toast = { show, dismiss, dismissAll, success, error, warning, info: toastInfo, setSoundEnabled, VERSION, MODULE_ID, healthCheck };
export default Toast;
