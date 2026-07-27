// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-slider
// PURPOSE: Container Slider/Range Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createSlider() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'change'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-slider';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

export function createSlider(container: HTMLElement, options: Record<string, any> = {}) {
  const {
    min = 0,
    max = 100,
    value = 50,
    step = 1,
    label = '',
    showValue = true,
    showTicks = false,
    tickCount = 5,
    disabled = false,
    className = '',
    formatValue = (v: string) => v,
    onChange,
    onInput,
    eventBus
  } = options;
  
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  
  let _value = Math.max(min, Math.min(max, value));
  let _initialized = false;
  let _sliderEl: HTMLElement | null = null;
  let _inputEl: HTMLElement | null = null;
  let _valueEl: HTMLElement | null = null;
  
  function _getPercentage(val: number) {
    return ((val - min) / (max - min)) * 100;
  }
  
  function _render() {
    if (!container) return;
    
    const sliderId = `slider-${Date.now()}`;
    const ticksHtml = showTicks ? _renderTicks() : '';
    
    container.innerHTML = `
      <div class="dsd-slider ${disabled ? 'dsd-slider--disabled' : ''} ${className}".trim()>
        ${label ? `<label for="${sliderId}" class="dsd-slider__label">${label}</label>` : ''}
        <div class="dsd-slider__wrapper">
          <input 
            type="range" 
            id="${sliderId}"
            class="dsd-slider__input" 
            min="${min}" 
            max="${max}" 
            step="${step}" 
            value="${_value}"
            ${disabled ? 'disabled' : ''}
            aria-valuemin="${min}"
            aria-valuemax="${max}"
            aria-valuenow="${_value}"
            aria-valuetext="${formatValue(_value)}"
          />
          <div class="dsd-slider__track">
            <div class="dsd-slider__fill" style="width: ${_getPercentage(_value)}%"></div>
          </div>
          ${ticksHtml}
        </div>
        ${showValue ? `<div class="dsd-slider__value">${formatValue(_value)}</div>` : ''}
      </div>
    `;
    
    _sliderEl = container.querySelector('.dsd-slider');
    _inputEl = container.querySelector('.dsd-slider__input');
    _valueEl = container.querySelector('.dsd-slider__value');
  }
  
  function _renderTicks() {
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickValue = min + (max - min) * (i / tickCount);
      const percent = _getPercentage(tickValue);
      ticks.push(`<div class="dsd-slider__tick" style="left: ${percent}%"></div>`);
    }
    return `<div class="dsd-slider__ticks">${ticks.join('')}</div>`;
  }
  
  function _updateVisual() {
    if (_inputEl) {
      (_inputEl as HTMLInputElement).value = String(_value);
      (_inputEl as HTMLElement).setAttribute('aria-valuenow', String(_value));
      (_inputEl as HTMLElement).setAttribute('aria-valuetext', formatValue(_value));
    }
    
    const fill = _sliderEl?.querySelector('.dsd-slider__fill');
    if (fill) (fill as HTMLElement).style.width = `${_getPercentage(_value)}%`;
    
    if (_valueEl) (_valueEl as HTMLElement).textContent = formatValue(_value);
  }
  
  function _handleInput(e: Event) {
    const newValue = parseFloat((e.target as HTMLInputElement).value);
    _value = newValue;
    _updateVisual();
    onInput?.(_value);
    _emitEvent('slider:input', { value: _value });
  }
  
  function _handleChange(e: Event) {
    const newValue = parseFloat((e.target as HTMLInputElement).value);
    _value = newValue;
    _updateVisual();
    onChange?.(_value);
    _emitEvent('slider:change', { value: _value });
  }
  
  const slider = {
    init() {
      if (_initialized) return this;
      _render();
      (_inputEl as HTMLElement)?.addEventListener('input', _handleInput);
      (_inputEl as HTMLElement)?.addEventListener('change', _handleChange);
      _initialized = true;
      return this;
    },
    
    getValue() { return _value; },
    
    setValue(newValue: number) {
      _value = Math.max(min, Math.min(max, newValue));
      _updateVisual();
      onChange?.(_value);
      return this;
    },
    
    setDisabled(isDisabled: boolean) {
      if (_inputEl) (_inputEl as HTMLInputElement).disabled = isDisabled;
      (_sliderEl as HTMLElement)?.classList.toggle('dsd-slider--disabled', isDisabled);
      return this;
    },
    
    isDisabled() { return (_inputEl as HTMLInputElement)?.disabled || false; },
    isInitialized() { return _initialized; },
    
    destroy() {
      (_inputEl as HTMLElement)?.removeEventListener('input', _handleInput);
      (_inputEl as HTMLElement)?.removeEventListener('change', _handleChange);
      container.innerHTML = '';
      _initialized = false;
    },
    
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, value: _value, min, max, hasEventBus: !!_injectedEventBus };
    }
  };
  
  return slider;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasEventBus: !!_injectedEventBus };
}

export default { createSlider, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
