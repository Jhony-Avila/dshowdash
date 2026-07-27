// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-progress-bar
// PURPOSE: Container Progress Bar Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   PROGRESS_VARIANT — exported value
//   createProgressBar() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-progress-bar';
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
  if (options.animated !== undefined && typeof options.animated !== 'boolean') errors.push('animated must be a boolean');
  if (options.showText !== undefined && typeof options.showText !== 'boolean') errors.push('showText must be a boolean');
  if (options.variant !== undefined && !['default', 'success', 'warning', 'error', 'info'].includes(options.variant as string)) errors.push('variant must be default|success|warning|error|info');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export const PROGRESS_VARIANT = { DEFAULT: 'default', SUCCESS: 'success', WARNING: 'warning', ERROR: 'error', INFO: 'info' };

export function createProgressBar(container: HTMLElement, options: Record<string, unknown> = {}) {
  _validateOptions(options);
  const { animated = true, showText = true, variant = PROGRESS_VARIANT.DEFAULT, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _progressEl: HTMLElement | null = null;
  let _value = 0;
  let _variant = variant;
  let _indeterminate = false;
  let _visible = false;
  let _label = 'Progresso';

  function _createProgressElement() {
    const header = container.querySelector('.dsd-container__header');
    if (!header) return null;
    let existing = container.querySelector('.dsd-progress-bar');
    if (existing) return existing;
    const progress = document.createElement('div');
    progress.className = 'dsd-progress-bar';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', '0');
    progress.setAttribute('aria-label', _label);
    progress.setAttribute('aria-live', 'polite');
    progress.innerHTML = `<div class="dsd-progress-bar__track"><div class="dsd-progress-bar__fill"></div></div>${showText ? '<span class="dsd-progress-bar__text" aria-hidden="true">0%</span>' : ''}`;
    header.insertAdjacentElement('afterend', progress);
    return progress;
  }

  function _updateProgress() {
    if (!_progressEl) return;
    const fill = _progressEl.querySelector('.dsd-progress-bar__fill');
    const text = _progressEl.querySelector('.dsd-progress-bar__text');

    _progressEl.classList.toggle('dsd-progress-bar--indeterminate', _indeterminate);
    _progressEl.classList.toggle('dsd-progress-bar--animated', animated as boolean);
    _progressEl.classList.toggle('dsd-progress-bar--visible', _visible);

    Object.values(PROGRESS_VARIANT).forEach(v => _progressEl!.classList.remove(`dsd-progress-bar--${v}`));
    _progressEl.classList.add(`dsd-progress-bar--${_variant}`);

    if (_indeterminate) {
      _progressEl.removeAttribute('aria-valuenow');
      _progressEl.setAttribute('aria-valuetext', 'Carregando...');
    } else {
      _progressEl.setAttribute('aria-valuenow', String(_value));
      _progressEl.setAttribute('aria-valuetext', `${Math.round(_value)}% concluído`);
      if (fill) (fill as HTMLElement).style.width = `${_value}%`;
    }

    if (text) text.textContent = _indeterminate ? '' : `${Math.round(_value)}%`;
  }

  const progressApi = {
    init() {
      if (_initialized) return this;
      _progressEl = _createProgressElement() as HTMLElement | null;
      _initialized = true;
      _updateProgress();
      return this;
    },
    show() { _visible = true; _updateProgress(); return this; },
    hide() { _visible = false; _updateProgress(); return this; },
    isVisible() { return _visible; },
    setValue(value: number) {
      if (typeof value !== 'number') return this;
      _value = Math.max(0, Math.min(100, value));
      _updateProgress();
      if (_value >= 100) _emitEvent(MAIN_EVENTS.PROGRESS_COMPLETE, { containerId: container.id });
      return this;
    },
    getValue() { return _value; },
    increment(amount = 10) { return this.setValue(_value + amount); },
    reset() { _value = 0; _updateProgress(); return this; },
    setVariant(v: string) {
      if (Object.values(PROGRESS_VARIANT).includes(v)) { _variant = v; _updateProgress(); }
      return this;
    },
    setLabel(label: string) {
      if (typeof label === 'string') {
        _label = label;
        _progressEl?.setAttribute('aria-label', label);
      }
      return this;
    },
    setIndeterminate(ind: boolean) { _indeterminate = !!ind; _updateProgress(); return this; },
    isIndeterminate() { return _indeterminate; },
    isInitialized() { return _initialized; },
    destroy() { _progressEl?.remove(); _progressEl = null; _initialized = false; },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, value: _value, variant: _variant, indeterminate: _indeterminate, visible: _visible, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return progressApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createProgressBar, injectEventBus, info, healthCheck, VERSION, MODULE_ID, PROGRESS_VARIANT };
