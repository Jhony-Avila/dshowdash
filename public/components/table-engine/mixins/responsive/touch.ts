// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:touch
// PURPOSE: Table Engine - Touch Gestures
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_SWIPE_ACTIONS — exported value
//   createTouchHandler() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.1-P18EC';
export const MODULE_ID = 'table-engine:touch';

class TouchHandler {
  [key: string]: any;
  constructor(options: { threshold?: number; maxTime?: number; swipeActions?: Record<string, unknown>; cssPrefix?: string } = {}) {
    this._element = null;
    this._startX = 0;
    this._startY = 0;
    this._currentX = 0;
    this._currentY = 0;
    this._threshold = options.threshold || 50;
    this._maxTime = options.maxTime || 300;
    this._startTime = 0;
    this._isSwiping = false;
    this._listeners = new Map();
    this._swipeActions = options.swipeActions || { left: null, right: null };
    this._cssPrefix = options.cssPrefix || 'tbl-';
  }

  init(element: HTMLElement) { this._element = element; this._bindEvents(); return this; }

  _bindEvents() {
    if (!this._element) return;
    this._element.addEventListener('touchstart', (e: TouchEvent) => this._onTouchStart(e), { passive: true });
    this._element.addEventListener('touchmove', (e: TouchEvent) => this._onTouchMove(e), { passive: false });
    this._element.addEventListener('touchend', (e: TouchEvent) => this._onTouchEnd(e), { passive: true });
    this._element.addEventListener('touchcancel', () => this._reset(), { passive: true });
  }

  _onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this._startX = touch.clientX;
    this._startY = touch.clientY;
    this._currentX = touch.clientX;
    this._currentY = touch.clientY;
    this._startTime = Date.now();
    this._isSwiping = false;
    const row = (e.target as HTMLElement).closest(`.${this._cssPrefix}tr, .${this._cssPrefix}card`);
    if (row) this._activeRow = row;
  }

  _onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1 || !this._activeRow) return;
    const touch = e.touches[0];
    this._currentX = touch.clientX;
    this._currentY = touch.clientY;
    const deltaX = this._currentX - this._startX;
    const deltaY = this._currentY - this._startY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this._isSwiping = true;
      e.preventDefault();
      this._updateSwipeUI(deltaX);
    }
  }

  _onTouchEnd(e: TouchEvent) {
    if (!this._isSwiping || !this._activeRow) { this._reset(); return; }
    const deltaX = this._currentX - this._startX;
    const elapsed = Date.now() - this._startTime;
    if (Math.abs(deltaX) >= this._threshold && elapsed <= this._maxTime) {
      const direction = deltaX > 0 ? 'right' : 'left';
      this._triggerSwipe(direction);
    }
    this._resetSwipeUI();
    this._reset();
  }

  _updateSwipeUI(deltaX: number) {
    if (!this._activeRow) return;
    const p = this._cssPrefix;
    const maxSwipe = 100;
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    this._activeRow.style.transform = `translateX(${clampedDelta}px)`;
    this._activeRow.style.transition = 'none';
    let actionsEl = this._activeRow.querySelector(`.${p}swipe-actions`);
    if (!actionsEl) {
      actionsEl = document.createElement('div');
      actionsEl.className = `${p}swipe-actions`;
      actionsEl.innerHTML = this._renderSwipeActions(deltaX > 0 ? 'right' : 'left');
      this._activeRow.appendChild(actionsEl);
    }
    actionsEl.classList.toggle(`${p}swipe-left`, deltaX < 0);
    actionsEl.classList.toggle(`${p}swipe-right`, deltaX > 0);
  }

  _renderSwipeActions(direction: string) {
    const p = this._cssPrefix;
    const actions = direction === 'left' ? this._swipeActions.left : this._swipeActions.right;
    if (!actions) return '';
    return actions.map((a: Record<string, unknown>) => `<button class="${p}swipe-action ${a.danger ? `${p}swipe-danger` : ''}" data-action="${a.action}" style="background: ${a.color || (a.danger ? '#ef4444' : '#3b82f6')}">${a.icon || a.label}</button>`).join('');
  }

  _resetSwipeUI() {
    if (!this._activeRow) return;
    const p = this._cssPrefix;
    this._activeRow.style.transform = '';
    this._activeRow.style.transition = 'transform 0.2s ease';
    const actionsEl = this._activeRow.querySelector(`.${p}swipe-actions`);
    if (actionsEl) setTimeout(() => actionsEl.remove(), 200);
  }

  _triggerSwipe(direction: string) {
    const rowId = this._activeRow?.dataset?.rowId;
    const actions = direction === 'left' ? this._swipeActions.left : this._swipeActions.right;
    if (actions && actions.length > 0) {
      this._emit('swipe', { direction, rowId, action: actions[0].action });
    }
  }

  _reset() { this._startX = 0; this._startY = 0; this._currentX = 0; this._currentY = 0; this._isSwiping = false; this._activeRow = null; }
  setSwipeActions(left: unknown, right: unknown) { this._swipeActions.left = left; this._swipeActions.right = right; }
  on(event: string, callback: (data: Record<string, unknown>) => void) { if (!this._listeners.has(event)) this._listeners.set(event, new Set()); this._listeners.get(event).add(callback); return () => this._listeners.get(event)?.delete(callback); }
  _emit(event: string, data: Record<string, unknown>) { this._listeners.get(event)?.forEach((cb: (data: Record<string, unknown>) => void) => cb(data)); }
  destroy() { this._listeners.clear(); this._element = null; }
  info() { return { moduleId: MODULE_ID, version: VERSION, threshold: this._threshold }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
}

export function createTouchHandler(options: { threshold?: number; maxTime?: number; swipeActions?: Record<string, unknown>; cssPrefix?: string } = {}) { return new TouchHandler(options); }
export const DEFAULT_SWIPE_ACTIONS = { left: [{ action: 'delete', icon: '🗑', label: 'Excluir', danger: true, color: '#ef4444' }], right: [{ action: 'edit', icon: '✏️', label: 'Editar', color: '#3b82f6' }, { action: 'view', icon: '👁', label: 'Ver', color: '#22c55e' }] };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { createTouchHandler, DEFAULT_SWIPE_ACTIONS, info, healthCheck, VERSION, MODULE_ID };
