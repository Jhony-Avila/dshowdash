// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-zoom-controls
// PURPOSE: Container Zoom Controls Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   ICONS from ../utils/icons.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createZoomControls() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'click'
//   'keydown'
//   'wheel'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { ICONS } from '../utils/icons.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-zoom-controls';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.minZoom !== undefined && (typeof options.minZoom !== 'number' || options.minZoom < 10)) errors.push('minZoom must be a number >= 10');
  if (options.maxZoom !== undefined && (typeof options.maxZoom !== 'number' || options.maxZoom > 500)) errors.push('maxZoom must be a number <= 500');
  if (options.step !== undefined && (typeof options.step !== 'number' || options.step < 1)) errors.push('step must be a number >= 1');
  if (options.defaultZoom !== undefined && typeof options.defaultZoom !== 'number') errors.push('defaultZoom must be a number');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createZoomControls(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { minZoom = 25, maxZoom = 200, step = 10, defaultZoom = 100, showControls = true, persistZoom = true, onZoomChange, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _zoom = defaultZoom;
  let _controlsEl: HTMLElement | null = null;
  const _storageKey = `dsd-zoom-${container?.id || 'default'}`;
  let _boundKeydown: EventListener | null = null;
  let _boundWheel: unknown = null;
  let _boundZoomOut: EventListener | null = null;
  let _boundZoomIn: EventListener | null = null;
  let _boundReset: EventListener | null = null;

  function _createControlsElement() {
    if (!showControls) return null;
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = container.querySelector('.dsd-zoom-controls');
    if (existing) return existing;
    const controls = document.createElement('div');
    controls.className = 'dsd-zoom-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Controles de zoom');
    controls.innerHTML = `<button type="button" class="dsd-zoom-controls__btn dsd-zoom-controls__btn--out" aria-label="Diminuir zoom para ${Math.max(minZoom, _zoom - step)}%" title="Diminuir (Ctrl+-)">${ICONS.minus}</button><button type="button" class="dsd-zoom-controls__value" aria-label="Zoom atual: ${_zoom}%" aria-live="polite" title="Clique para resetar">${_zoom}%</button><button type="button" class="dsd-zoom-controls__btn dsd-zoom-controls__btn--in" aria-label="Aumentar zoom para ${Math.min(maxZoom, _zoom + step)}%" title="Aumentar (Ctrl++)">${ICONS.plus}</button>`;
    const controlsSection = header.querySelector('.dsd-container__controls');
    if (controlsSection) controlsSection.insertAdjacentElement('beforebegin', controls);
    else header.appendChild(controls);
    return controls;
  }

  function _applyZoom() {
    const content = container.querySelector('.dsd-container__content');
    if (content) {
      (content as HTMLElement).style.transform = `scale(${_zoom / 100})`;
      (content as HTMLElement).style.transformOrigin = 'top left';
      (content as HTMLElement).style.width = `${100 / (_zoom / 100)}%`;
      (content as HTMLElement).style.height = `${100 / (_zoom / 100)}%`;
    }
    if (_controlsEl) {
      const valueEl = _controlsEl.querySelector('.dsd-zoom-controls__value');
      const outBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--out');
      const inBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--in');
      if (valueEl) {
        valueEl.textContent = `${_zoom}%`;
        valueEl.setAttribute('aria-label', `Zoom atual: ${_zoom}%`);
      }
      if (outBtn) {
        (outBtn as HTMLButtonElement).disabled = _zoom <= minZoom;
        outBtn.setAttribute('aria-label', `Diminuir zoom para ${Math.max(minZoom, _zoom - step)}%`);
      }
      if (inBtn) {
        (inBtn as HTMLButtonElement).disabled = _zoom >= maxZoom;
        inBtn.setAttribute('aria-label', `Aumentar zoom para ${Math.min(maxZoom, _zoom + step)}%`);
      }
    }
    container.setAttribute('data-zoom', String(_zoom));
    if (persistZoom) { try { localStorage.setItem(_storageKey, String(_zoom)); } catch (e) {} }
    onZoomChange?.(_zoom);
    _emitEvent(MAIN_EVENTS.ZOOM_CHANGE, { zoom: _zoom, containerId: container.id });
  }

  function _loadPersistedZoom() {
    if (!persistZoom) return;
    try {
      const saved = localStorage.getItem(_storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minZoom && parsed <= maxZoom) _zoom = parsed;
      }
    } catch (e) {}
  }

  function _setupKeyboardShortcuts() {
    // @ts-expect-error strict migration — TS2322
    _boundKeydown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomApi.zoomIn(); }
      else if (e.key === '-') { e.preventDefault(); zoomApi.zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); zoomApi.reset(); }
    };
    _boundWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomApi.zoomIn(); else zoomApi.zoomOut();
    };
    container.addEventListener('keydown', _boundKeydown as EventListener);
    container.addEventListener('wheel', _boundWheel as EventListener, { passive: false });
  }

  function _setupControlEvents() {
    if (!_controlsEl) return;
    const outBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--out');
    const inBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--in');
    const valueBtn = _controlsEl.querySelector('.dsd-zoom-controls__value');
    _boundZoomOut = () => zoomApi.zoomOut();
    _boundZoomIn = () => zoomApi.zoomIn();
    _boundReset = () => zoomApi.reset();
    outBtn?.addEventListener('click', _boundZoomOut as EventListener);
    inBtn?.addEventListener('click', _boundZoomIn as EventListener);
    valueBtn?.addEventListener('click', _boundReset as EventListener);
  }

  function _removeEvents() {
    if (_boundKeydown) container.removeEventListener('keydown', _boundKeydown as EventListener);
    if (_boundWheel) container.removeEventListener('wheel', _boundWheel as EventListener);
    if (_controlsEl) {
      const outBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--out');
      const inBtn = _controlsEl.querySelector('.dsd-zoom-controls__btn--in');
      const valueBtn = _controlsEl.querySelector('.dsd-zoom-controls__value');
      if (outBtn && _boundZoomOut) outBtn.removeEventListener('click', _boundZoomOut as EventListener);
      if (inBtn && _boundZoomIn) inBtn.removeEventListener('click', _boundZoomIn as EventListener);
      if (valueBtn && _boundReset) valueBtn.removeEventListener('click', _boundReset as EventListener);
    }
    _boundKeydown = null; _boundWheel = null; _boundZoomOut = null; _boundZoomIn = null; _boundReset = null;
  }

  const zoomApi = {
    init() {
      if (_initialized) return this;
      _loadPersistedZoom();
      _controlsEl = _createControlsElement() as HTMLElement | null;
      _setupKeyboardShortcuts();
      _setupControlEvents();
      _applyZoom();
      _initialized = true;
      return this;
    },
    zoomIn(amount = step) { return this.setZoom(_zoom + amount); },
    zoomOut(amount = step) { return this.setZoom(_zoom - amount); },
    setZoom(value: number) {
      if (typeof value !== 'number') return this;
      _zoom = Math.max(minZoom, Math.min(maxZoom, Math.round(value)));
      _applyZoom();
      return this;
    },
    getZoom() { return _zoom; },
    reset() { return this.setZoom(defaultZoom); },
    fit() {
      const content = container.querySelector('.dsd-container__content');
      if (!content) return this;
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.scrollWidth ? { width: content.scrollWidth, height: content.scrollHeight } : content.getBoundingClientRect();
      const scaleX = (containerRect.width - 40) / contentRect.width;
      const scaleY = (containerRect.height - 100) / contentRect.height;
      const scale = Math.min(scaleX, scaleY, 1) * 100;
      return this.setZoom(Math.round(scale));
    },
    isInitialized() { return _initialized; },
    destroy() { _removeEvents(); _controlsEl?.remove(); _controlsEl = null; _initialized = false; },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, zoom: _zoom, minZoom, maxZoom, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return zoomApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true }; }

export default { createZoomControls, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
