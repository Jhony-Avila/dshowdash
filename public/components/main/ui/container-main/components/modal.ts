
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-modal
// PURPOSE: Container Modal Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../utils/icons.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   MODAL_SIZE — exported value
//   MODAL_POSITION — exported value
//   createModal() — exported function
//   closeAll() — exported function
//   getActiveCount() — exported function
//   confirm() — exported function
//   alert() — exported function
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

import { ICONS } from '../utils/icons.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-modal';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;
let _activeModals: unknown[] = [];
let _modalCounter = 0;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

export const MODAL_SIZE = { SM: 'sm', MD: 'md', LG: 'lg', XL: 'xl', FULL: 'full' };
export const MODAL_POSITION = { CENTER: 'center', TOP: 'top', RIGHT: 'right', BOTTOM: 'bottom', LEFT: 'left' };

function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.size && !Object.values(MODAL_SIZE).includes(options.size as string)) {
    errors.push(`size must be one of: ${Object.values(MODAL_SIZE).join(', ')}`);
  }
  if (options.position && !Object.values(MODAL_POSITION).includes(options.position as string)) {
    errors.push(`position must be one of: ${Object.values(MODAL_POSITION).join(', ')}`);
  }
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createModal(options: Record<string, any> = {}) {
  _validateOptions(options);
  
  const {
    title = '',
    content = '',
    size = MODAL_SIZE.MD,
    position = MODAL_POSITION.CENTER,
    closable = true,
    closeOnEscape = true,
    closeOnBackdrop = true,
    showHeader = true,
    showFooter = false,
    footerButtons = [],
    className = '',
    onOpen,
    onClose,
    onConfirm,
    eventBus
  } = options;
  
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  
  const modalId = `modal-${++_modalCounter}`;
  let _isOpen = false;
  let _modalEl: HTMLElement | null = null;
  let _backdropEl: HTMLElement | null = null;
  let _previousActiveElement: Element | null = null;
  let _focusableElements = [];
  let _keydownHandler: EventListener | null = null;
  
  function _createModalElement() {
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = `dsd-modal dsd-modal--${size} dsd-modal--${position} ${className}`.trim();
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${modalId}-title`);
    modal.setAttribute('aria-hidden', 'true');
    modal.tabIndex = -1;
    
    let headerHtml = '';
    if (showHeader) {
      headerHtml = `
        <header class="dsd-modal__header">
          <h2 id="${modalId}-title" class="dsd-modal__title">${title}</h2>
          ${closable ? `<button type="button" class="dsd-modal__close" aria-label="Fechar" data-action="close">${ICONS.close}</button>` : ''}
        </header>
      `;
    }
    
    let footerHtml = '';
    if (showFooter || footerButtons.length > 0) {
      const buttonsHtml = footerButtons.map((btn: Record<string, unknown>, i: number) => `
        <button type="button" class="dsd-modal__btn dsd-modal__btn--${btn.variant || 'secondary'}" data-action="${btn.action || 'button'}" data-index="${i}">
          ${btn.label || 'Button'}
        </button>
      `).join('');
      footerHtml = `<footer class="dsd-modal__footer">${buttonsHtml}</footer>`;
    }
    
    modal.innerHTML = `
      <div class="dsd-modal__container">
        ${headerHtml}
        <div class="dsd-modal__body">${typeof content === 'string' ? content : ''}</div>
        ${footerHtml}
      </div>
    `;
    
    if (content instanceof HTMLElement) {
      modal.querySelector('.dsd-modal__body')!.appendChild(content);
    }
    
    return modal;
  }
  
  function _createBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'dsd-modal__backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    return backdrop;
  }
  
  function _getFocusableElements() {
    if (!_modalEl) return [];
    return Array.from(_modalEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !(el as HTMLButtonElement).disabled && (el as HTMLElement).offsetParent !== null);
  }
  
  function _trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    
    _focusableElements = _getFocusableElements();
    if (_focusableElements.length === 0) return;
    
    const firstEl = _focusableElements[0];
    const lastEl = _focusableElements[_focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      (lastEl as HTMLElement).focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      (firstEl as HTMLElement).focus();
    }
  }
  
  function _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && closeOnEscape && closable) {
      e.preventDefault();
      modal.close();
    }
    _trapFocus(e);
  }
  
  function _handleClick(e: Event) {
    const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
    if (action === 'close') {
      modal.close();
    } else if (action === 'confirm') {
      onConfirm?.();
      modal.close();
    } else if (action === 'button') {
      const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '', 10);
      footerButtons[index]?.onClick?.();
    }
  }
  
  function _handleBackdropClick(e: Event) {
    if (closeOnBackdrop && closable && e.target === (_backdropEl as EventTarget)) {
      modal.close();
    }
  }
  
  const modal = {
    open() {
      if (_isOpen) return this;
      
      _previousActiveElement = document.activeElement;
      
      _backdropEl = _createBackdrop();
      _modalEl = _createModalElement();
      
      document.body.appendChild(_backdropEl as HTMLElement);
      document.body.appendChild(_modalEl);
      document.body.classList.add('dsd-modal-open');
      
      // Force reflow for animation
      _modalEl.offsetHeight;
      (_backdropEl as HTMLElement).offsetHeight;
      
      (_backdropEl as HTMLElement).classList.add('dsd-modal__backdrop--visible');
      _modalEl.classList.add('dsd-modal--visible');
      _modalEl.setAttribute('aria-hidden', 'false');
      
      // @ts-expect-error strict migration — TS2322
      _keydownHandler = _handleKeydown;
      document.addEventListener('keydown', _keydownHandler as EventListener);
      _modalEl.addEventListener('click', _handleClick);
      (_backdropEl as HTMLElement).addEventListener('click', _handleBackdropClick);
      
      // Focus first focusable element
      _focusableElements = _getFocusableElements();
      if (_focusableElements.length > 0) {
        (_focusableElements[0] as HTMLElement).focus();
      } else {
        _modalEl.focus();
      }
      
      _isOpen = true;
      _activeModals.push(this);
      
      _emitEvent('modal:open', { modalId });
      onOpen?.();
      
      return this;
    },
    
    close() {
      if (!_isOpen) return this;
      
      _modalEl?.classList.remove('dsd-modal--visible');
      (_backdropEl as HTMLElement | null)?.classList.remove('dsd-modal__backdrop--visible');
      _modalEl?.setAttribute('aria-hidden', 'true');
      
      setTimeout(() => {
        if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler as EventListener);
        _modalEl?.remove();
        _backdropEl?.remove();
        
        _activeModals = _activeModals.filter(m => m !== this);
        if (_activeModals.length === 0) {
          document.body.classList.remove('dsd-modal-open');
        }
        
        (_previousActiveElement as HTMLElement)?.focus();
      }, 300);
      
      _isOpen = false;
      _emitEvent('modal:close', { modalId });
      onClose?.();
      
      return this;
    },
    
    setTitle(newTitle: string) {
      const titleEl = _modalEl?.querySelector('.dsd-modal__title');
      if (titleEl) titleEl.textContent = newTitle;
      return this;
    },
    
    setContent(newContent: string | HTMLElement) {
      const bodyEl = _modalEl?.querySelector('.dsd-modal__body');
      if (!bodyEl) return this;
      if (typeof newContent === 'string') bodyEl.innerHTML = newContent;
      else if (newContent instanceof HTMLElement) { bodyEl.innerHTML = ''; bodyEl.appendChild(newContent); }
      return this;
    },
    
    isOpen() { return _isOpen; },
    getId() { return modalId; },
    getElement() { return _modalEl; },
    
    destroy() {
      if (_isOpen) this.close();
      _modalEl = null;
      _backdropEl = null;
    },
    
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        modalId,
        isOpen: _isOpen,
        hasEventBus: !!_injectedEventBus
      };
    }
  };
  
  return modal;
}

// Static methods
export function closeAll() {
  [..._activeModals].forEach(m => (m as { close: () => void }).close());
}

export function getActiveCount() {
  return _activeModals.length;
}

export function confirm(message: string, options: Record<string, any> = {}) {
  return new Promise((resolve) => {
    const modal = createModal({
      title: options.title || 'Confirmar',
      content: `<p class="dsd-modal__message">${message}</p>`,
      size: MODAL_SIZE.SM,
      showFooter: true,
      footerButtons: [
        { label: options.cancelLabel || 'Cancelar', variant: 'secondary', action: 'close', onClick: () => resolve(false) },
        { label: options.confirmLabel || 'Confirmar', variant: 'primary', action: 'confirm' }
      ],
      onConfirm: () => resolve(true),
      onClose: () => resolve(false),
      ...options
    });
    modal.open();
  });
}

export function alert(message: string, options: Record<string, any> = {}) {
  return new Promise<void>((resolve) => {
    const modal = createModal({
      title: options.title || 'Aviso',
      content: `<p class="dsd-modal__message">${message}</p>`,
      size: MODAL_SIZE.SM,
      showFooter: true,
      footerButtons: [
        { label: options.buttonLabel || 'OK', variant: 'primary', action: 'close' }
      ],
      onClose: () => resolve(),
      ...options
    });
    modal.open();
  });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, activeModals: _activeModals.length, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, activeModals: _activeModals.length, hasEventBus: !!_injectedEventBus };
}

export default {
  createModal, closeAll, getActiveCount, confirm, alert,
  injectEventBus, info, healthCheck, VERSION, MODULE_ID, MODAL_SIZE, MODAL_POSITION
};
