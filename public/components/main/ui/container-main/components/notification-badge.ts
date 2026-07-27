// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-notification-badge
// PURPOSE: Container Notification Badge Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   BADGE_VARIANTS — exported value
//   createNotificationBadge() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-notification-badge';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

export const BADGE_VARIANTS = { DEFAULT: 'default', SUCCESS: 'success', WARNING: 'warning', ERROR: 'error', INFO: 'info' };

export function createNotificationBadge(container: HTMLElement, options: Record<string, any> = {}) {
  const { position = 'top-right', maxCount = 99, showZero = false, animate = true, variant = BADGE_VARIANTS.DEFAULT, onClick, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _count = 0;
  let _badgeEl: HTMLElement | null = null;
  let _variant = variant;
  let _visible = false;
  let _flashInterval: ReturnType<typeof setInterval> | null = null;
  let _clickHandler: EventListener | null = null;

  function _createBadgeElement() {
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = header.querySelector('.dsd-notification-badge');
    if (existing) return existing;
    const badge = document.createElement('div');
    badge.className = `dsd-notification-badge dsd-notification-badge--${position}`;
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    badge.innerHTML = `<span class="dsd-notification-badge__count">0</span><span class="dsd-notification-badge__pulse"></span>`;
    const titleEl = header.querySelector('.dsd-container__title');
    if (titleEl) { (titleEl as HTMLElement).style.position = 'relative'; titleEl.appendChild(badge); }
    else { (header as HTMLElement).style.position = 'relative'; header.appendChild(badge); }
    if (onClick) {
      badge.style.cursor = 'pointer';
      _clickHandler = (e: Event) => { e.stopPropagation(); onClick(_count); };
      badge.addEventListener('click', _clickHandler as EventListener);
    }
    return badge;
  }

  function _updateBadge() {
    if (!_badgeEl) return;
    const countEl = _badgeEl.querySelector('.dsd-notification-badge__count');
    const displayCount = _count > maxCount ? `${maxCount}+` : String(_count);
    if (countEl) countEl.textContent = displayCount;
    _badgeEl.setAttribute('aria-label', `${_count} notificações`);
    const shouldShow = _count > 0 || showZero;
    _badgeEl.classList.toggle('dsd-notification-badge--visible', shouldShow);
    _badgeEl.classList.toggle('dsd-notification-badge--hidden', !shouldShow);
    _visible = shouldShow;
    Object.values(BADGE_VARIANTS).forEach(v => { _badgeEl!.classList.remove(`dsd-notification-badge--${v}`); });
    _badgeEl.classList.add(`dsd-notification-badge--${_variant}`);
    if (animate && _count > 0) { _badgeEl.classList.add('dsd-notification-badge--bump'); setTimeout(() => { _badgeEl?.classList.remove('dsd-notification-badge--bump'); }, 300); }
  }

  const badge = {
    init() { if (_initialized) return this; _badgeEl = _createBadgeElement() as HTMLElement | null; _updateBadge(); _initialized = true; return this; },
    setCount(count: number) {
      const prevCount = _count;
      _count = Math.max(0, Math.floor(count));
      _updateBadge();
      if (_count !== prevCount) _emitEvent(MAIN_EVENTS.BADGE_CHANGE, { count: _count, prevCount, containerId: container.id });
      return this;
    },
    increment(amount = 1) { return badge.setCount(_count + amount); },
    decrement(amount = 1) { return badge.setCount(_count - amount); },
    clear() { return badge.setCount(0); },
    getCount() { return _count; },
    setVariant(v: string) { if (Object.values(BADGE_VARIANTS).includes(v)) { _variant = v; _updateBadge(); } return this; },
    getVariant() { return _variant; },
    pulse() { if (!_badgeEl) return this; _badgeEl.classList.add('dsd-notification-badge--pulse-active'); setTimeout(() => { _badgeEl?.classList.remove('dsd-notification-badge--pulse-active'); }, 1000); return this; },
    flash(times = 3) {
      if (!_badgeEl) return this;
      if (_flashInterval) clearInterval(_flashInterval);
      let count = 0;
      _flashInterval = setInterval(() => {
        _badgeEl?.classList.toggle('dsd-notification-badge--flash');
        count++;
        // @ts-expect-error strict migration — TS2769
        if (count >= times * 2) { clearInterval(_flashInterval); _flashInterval = null; _badgeEl?.classList.remove('dsd-notification-badge--flash'); }
      }, 200);
      return this;
    },
    isVisible() { return _visible; },
    isInitialized() { return _initialized; },
    destroy() {
      if (_flashInterval) { clearInterval(_flashInterval); _flashInterval = null; }
      if (_badgeEl && _clickHandler) { (_badgeEl as HTMLElement).removeEventListener('click', _clickHandler as EventListener); _clickHandler = null; }
      _badgeEl?.remove();
      _badgeEl = null;
      _initialized = false;
    },
    healthCheck() { return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, count: _count, variant: _variant, visible: _visible, hasInjectedEventBus: !!_injectedEventBus }; }
  };
  return badge;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus }; }

export default { createNotificationBadge, injectEventBus, info, healthCheck, VERSION, MODULE_ID, BADGE_VARIANTS };
