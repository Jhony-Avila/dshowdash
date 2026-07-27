// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-UX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-controls
// PURPOSE: Container Controls Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS, CONTAINER_INTENTS from /core/runtime/events/catalog/container.events.js
//   ICONS from ../utils/icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createControls() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS, CONTAINER_INTENTS } from '/core/runtime/events/catalog/container.events.js';
import { ICONS } from '../utils/icons.js';

export const VERSION = '9.0.0-UX-ENHANCED';
export const MODULE_ID = 'container-controls';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

// Keyboard shortcuts mapping (#14)
const SHORTCUTS = { minimize: '⌘M', maximize: '⌘⇧F', close: '⌘W', menu: '⌘.' };

export function createControls(container: HTMLElement, options: Record<string, any> = {}) {
  const { collapsible = true, closable = false, fullscreenable = true, onCollapse, onExpand, onClose, onFullscreen, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _isMinimized = false;
  let _isFullscreen = false;
  let _controlsEl: HTMLElement | null = null;
  let _buttonHandlers: { btn: HTMLElement; handler: EventListener; type?: string }[] = [];
  let _keyboardHandler: EventListener | null = null;

  function _emitEvent(eventType: string, data: Record<string, unknown>) {
    try {
      const eb = _getEventBus();
      if (eb?.emit) eb.emit(eventType, { source: MODULE_ID, containerId: container?.id, timestamp: Date.now(), ...data });
    } catch (e) {}
    const domEvent = eventType.replace(/\./g, ':');
    container?.dispatchEvent?.(new CustomEvent(domEvent, { bubbles: true, detail: { containerId: container?.id, ...data } }));
  }

  // Enhanced button creation with tooltip (#14)
  function _createButton(className: string, title: string, icon: string, onClick: (...args: unknown[]) => void, shortcut: string | null) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dsd-container__control ${className}`;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    
    // Add tooltip data attributes (#14)
    btn.setAttribute('data-tooltip', title);
    if (shortcut) {
      btn.setAttribute('data-shortcut', shortcut as string);
    }
    
    btn.innerHTML = `<span class="dsd-container__control-icon">${icon}</span>`;
    const handler = (e: Event) => { e.stopPropagation(); onClick(); };
    btn.addEventListener('click', handler);
    _buttonHandlers.push({ btn, handler });
    return btn;
  }

  function _clearButtonHandlers() {
    _buttonHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
    _buttonHandlers = [];
  }

  // Keyboard shortcuts handler (#14)
  function _setupKeyboardShortcuts() {
    if (_keyboardHandler) return;
    
    // @ts-expect-error strict migration — TS2322
    _keyboardHandler = (e: KeyboardEvent) => {
      // Only handle if this container is focused or active
      if (!container?.classList?.contains('dsd-container--active') && 
          !container?.contains(document.activeElement)) {
        return;
      }
      
      const isMeta = e.metaKey || e.ctrlKey;
      
      if (isMeta && e.key === 'm' && collapsible) {
        e.preventDefault();
        controls.toggle();
      } else if (isMeta && e.shiftKey && e.key === 'f' && fullscreenable) {
        e.preventDefault();
        controls.maximize();
      } else if (isMeta && e.key === 'w' && closable) {
        e.preventDefault();
        controls.close();
      }
    };
    
    // @ts-expect-error strict migration — TS2769
    document.addEventListener('keydown', _keyboardHandler);
  }

  function _removeKeyboardShortcuts() {
    if (_keyboardHandler) {
      document.removeEventListener('keydown', _keyboardHandler);
      _keyboardHandler = null;
    }
  }

  function _render() {
    _controlsEl = container?.querySelector('.dsd-container__controls');
    if (!_controlsEl) {
      const headerRight = container?.querySelector('.dsd-container__header-right');
      if (headerRight) {
        _controlsEl = document.createElement('div');
        _controlsEl.className = 'dsd-container__controls';
        _controlsEl.setAttribute('role', 'group');
        _controlsEl.setAttribute('aria-label', 'Controles do container');
        headerRight.appendChild(_controlsEl);
      }
    }
    if (!_controlsEl) return;
    _clearButtonHandlers();
    _controlsEl.innerHTML = '';

    if (collapsible) {
      const toggleBtn = _createButton(
        'dsd-container__control--minimize',
        _isMinimized ? 'Expandir' : 'Minimizar',
        _isMinimized ? ICONS.chevronDown : ICONS.chevronUp,
        () => controls.toggle(),
        SHORTCUTS.minimize
      );
      toggleBtn.setAttribute('aria-expanded', String(!_isMinimized));
      _controlsEl.appendChild(toggleBtn);
    }

    if (fullscreenable) {
      const fsBtn = _createButton(
        'dsd-container__control--maximize',
        _isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia',
        _isFullscreen ? ICONS.exitFullscreen : ICONS.fullscreen,
        () => controls.maximize(),
        SHORTCUTS.maximize
      );
      fsBtn.setAttribute('aria-pressed', String(_isFullscreen));
      _controlsEl.appendChild(fsBtn);
    }

    if (closable) {
      const closeBtn = _createButton(
        'dsd-container__control--close', 
        'Fechar', 
        ICONS.close, 
        () => controls.close(),
        SHORTCUTS.close
      );
      _controlsEl.appendChild(closeBtn);
    }
    
    // Setup keyboard shortcuts after render
    _setupKeyboardShortcuts();
  }

  function _updateIcons() {
    if (!_controlsEl) return;
    const minimizeBtn = _controlsEl.querySelector('.dsd-container__control--minimize');
    if (minimizeBtn) {
      const title = _isMinimized ? 'Expandir' : 'Minimizar';
      (minimizeBtn as HTMLElement).title = title;
      minimizeBtn.setAttribute('aria-label', title);
      minimizeBtn.setAttribute('aria-expanded', String(!_isMinimized));
      minimizeBtn.setAttribute('data-tooltip', title);
      const icon = minimizeBtn.querySelector('.dsd-container__control-icon');
      if (icon) icon.innerHTML = _isMinimized ? ICONS.chevronDown : ICONS.chevronUp;
    }
    const fsBtn = _controlsEl.querySelector('.dsd-container__control--maximize');
    if (fsBtn) {
      const title = _isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia';
      (fsBtn as HTMLElement).title = title;
      fsBtn.setAttribute('aria-label', title);
      fsBtn.setAttribute('aria-pressed', String(_isFullscreen));
      fsBtn.setAttribute('data-tooltip', title);
      const icon = fsBtn.querySelector('.dsd-container__control-icon');
      if (icon) icon.innerHTML = _isFullscreen ? ICONS.exitFullscreen : ICONS.fullscreen;
    }
  }

  const controls = {
    init() {
      if (_initialized) return this;
      _initialized = true;
      _render();
      return this;
    },
    minimize() {
      if (_isFullscreen) return this;
      _isMinimized = !_isMinimized;
      container?.classList?.toggle('dsd-container--minimized', _isMinimized);
      container?.classList?.toggle('dsd-container--collapsed', _isMinimized);
      container?.setAttribute?.('aria-expanded', String(!_isMinimized));
      _updateIcons();
      _emitEvent(CONTAINER_EVENTS.COLLAPSED, { minimized: _isMinimized });
      if (_isMinimized) onCollapse?.(); else onExpand?.();
      return this;
    },
    collapse() { if (!_isMinimized) this.minimize(); return this; },
    expand() { if (_isMinimized) this.minimize(); return this; },
    toggle() { return this.minimize(); },
    maximize() {
      _isFullscreen = !_isFullscreen;
      if (_isFullscreen) { _isMinimized = false; container?.classList?.remove('dsd-container--minimized', 'dsd-container--collapsed'); }
      container?.classList?.toggle('dsd-container--fullscreen', _isFullscreen);
      _updateIcons();
      if (_isFullscreen) document.addEventListener('keydown', controls._handleEscape);
      else document.removeEventListener('keydown', controls._handleEscape);
      _emitEvent(CONTAINER_EVENTS.FULLSCREEN, { fullscreen: _isFullscreen });
      onFullscreen?.(_isFullscreen);
      return this;
    },
    enterFullscreen() { if (!_isFullscreen) this.maximize(); return this; },
    exitFullscreen() { if (_isFullscreen) this.maximize(); return this; },
    _handleEscape(e: KeyboardEvent) { if (e.key === 'Escape' && _isFullscreen) controls.maximize(); },
    close() {
      container?.classList?.add('dsd-container--animate-out');
      _emitEvent(CONTAINER_INTENTS.CLOSE, {});
      onClose?.();
      setTimeout(() => { container?.remove(); _emitEvent(CONTAINER_EVENTS.CLOSED, {}); }, 200);
      return this;
    },
    isMinimized() { return _isMinimized; },
    isFullscreen() { return _isFullscreen; },
    isInitialized() { return _initialized; },
    restore() { if (_isMinimized) this.minimize(); if (_isFullscreen) this.maximize(); return this; },
    destroy() {
      document.removeEventListener('keydown', controls._handleEscape);
      _removeKeyboardShortcuts();
      _clearButtonHandlers();
      if (_controlsEl) _controlsEl.innerHTML = '';
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, state: { isMinimized: _isMinimized, isFullscreen: _isFullscreen }, hasControlsEl: !!_controlsEl, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasKeyboardShortcuts: !!_keyboardHandler };
    }
  };
  return controls;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, shortcuts: SHORTCUTS }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true }; }

export default { createControls, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
