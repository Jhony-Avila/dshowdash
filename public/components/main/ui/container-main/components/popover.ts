
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-popover
// PURPOSE: Container Popover Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   POPOVER_POSITION — exported value
//   POPOVER_TRIGGER — exported value
//   createPopover() — exported function
//   closeAll() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'blur'
//   'click'
//   'focus'
//   'keydown'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
//   window.scrollX
//   window.scrollY
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-popover';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;
let _activePopovers = new Map();
let _popoverCounter = 0;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}

export const POPOVER_POSITION = {
  TOP: 'top', TOP_START: 'top-start', TOP_END: 'top-end',
  BOTTOM: 'bottom', BOTTOM_START: 'bottom-start', BOTTOM_END: 'bottom-end',
  LEFT: 'left', LEFT_START: 'left-start', LEFT_END: 'left-end',
  RIGHT: 'right', RIGHT_START: 'right-start', RIGHT_END: 'right-end'
};

export const POPOVER_TRIGGER = { CLICK: 'click', HOVER: 'hover', FOCUS: 'focus', MANUAL: 'manual' };

export function createPopover(triggerElement: any, options: Record<string, any> = {}) {
  const {
    content = '',
    position = POPOVER_POSITION.BOTTOM,
    trigger = POPOVER_TRIGGER.CLICK,
    offset = 8,
    showArrow = true,
    closeOnClickOutside = true,
    closeOnEscape = true,
    showDelay = 0,
    hideDelay = 0,
    className = '',
    onShow,
    onHide,
    eventBus
  } = options;
  
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  
  const popoverId = `popover-${++_popoverCounter}`;
  let _isOpen = false;
  let _popoverEl: HTMLElement | null = null;
  let _showTimeout: ReturnType<typeof setTimeout> | null = null;
  let _hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let _clickOutsideHandler: EventListener | null = null;
  let _keydownHandler: EventListener | null = null;
  let _hoverHandlers: Record<string, any> = {};
  
  function _createPopoverElement() {
    const popover = document.createElement('div');
    popover.id = popoverId;
    popover.className = `dsd-popover dsd-popover--${position.split('-')[0]} ${className}`.trim();
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-hidden', 'true');
    popover.tabIndex = -1;
    
    let contentHtml = typeof content === 'string' ? content : '';
    popover.innerHTML = `
      ${showArrow ? '<div class="dsd-popover__arrow"></div>' : ''}
      <div class="dsd-popover__content">${contentHtml}</div>
    `;
    
    if (content instanceof HTMLElement) {
      // @ts-expect-error strict migration — TS2531
      popover.querySelector('.dsd-popover__content').appendChild(content);
    }
    
    return popover;
  }
  
  function _positionPopover() {
    if (!_popoverEl || !triggerElement) return;
    
    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverRect = _popoverEl.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    const [mainPos, align = 'center'] = position.split('-');
    
    // Main position
    switch (mainPos) {
      case 'top':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }
    
    // Alignment adjustment
    if (mainPos === 'top' || mainPos === 'bottom') {
      if (align === 'start') left = triggerRect.left;
      else if (align === 'end') left = triggerRect.right - popoverRect.width;
    } else {
      if (align === 'start') top = triggerRect.top;
      else if (align === 'end') top = triggerRect.bottom - popoverRect.height;
    }
    
    // Keep within viewport
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - popoverRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - popoverRect.height - padding));
    
    _popoverEl.style.top = `${top + window.scrollY}px`;
    _popoverEl.style.left = `${left + window.scrollX}px`;
  }
  
  function _handleClickOutside(e: Event) {
    if (!_popoverEl?.contains(e.target as Node) && !triggerElement?.contains(e.target as Node)) {
      popover.hide();
    }
  }
  
  function _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && closeOnEscape) {
      popover.hide();
      triggerElement?.focus();
    }
  }
  
  const popover = {
    show() {
      if (_isOpen) return this;
      if (_hideTimeout) { clearTimeout(_hideTimeout); _hideTimeout = null; }
      
      const doShow = () => {
        if (!_popoverEl) {
          _popoverEl = _createPopoverElement();
          document.body.appendChild(_popoverEl);
        }
        
        _popoverEl.classList.add('dsd-popover--visible');
        _popoverEl.setAttribute('aria-hidden', 'false');
        triggerElement?.setAttribute('aria-expanded', 'true');
        
        requestAnimationFrame(() => _positionPopover());
        
        if (closeOnClickOutside && trigger !== POPOVER_TRIGGER.HOVER) {
          _clickOutsideHandler = _handleClickOutside;
          // @ts-expect-error strict migration — TS2769
          setTimeout(() => document.addEventListener('click', _clickOutsideHandler), 0);
        }
        
        // @ts-expect-error strict migration — TS2322
        _keydownHandler = _handleKeydown;
        // @ts-expect-error strict migration — TS2769
        document.addEventListener('keydown', _keydownHandler);
        
        _isOpen = true;
        _activePopovers.set(popoverId, this);
        
        _emitEvent('popover:show', { popoverId });
        onShow?.();
      };
      
      if (showDelay > 0) {
        _showTimeout = setTimeout(doShow, showDelay);
      } else {
        doShow();
      }
      
      return this;
    },
    
    hide() {
      if (!_isOpen) return this;
      if (_showTimeout) { clearTimeout(_showTimeout); _showTimeout = null; }
      
      const doHide = () => {
        _popoverEl?.classList.remove('dsd-popover--visible');
        _popoverEl?.setAttribute('aria-hidden', 'true');
        triggerElement?.setAttribute('aria-expanded', 'false');
        
        if (_clickOutsideHandler) document.removeEventListener('click', _clickOutsideHandler);
        if (_keydownHandler) document.removeEventListener('keydown', _keydownHandler);
        
        _isOpen = false;
        _activePopovers.delete(popoverId);
        
        _emitEvent('popover:hide', { popoverId });
        onHide?.();
      };
      
      if (hideDelay > 0) {
        _hideTimeout = setTimeout(doHide, hideDelay);
      } else {
        doHide();
      }
      
      return this;
    },
    
    toggle() {
      return _isOpen ? this.hide() : this.show();
    },
    
    setContent(newContent: string | HTMLElement) {
      const contentEl = _popoverEl?.querySelector('.dsd-popover__content');
      if (!contentEl) return this;
      if (typeof newContent === 'string') contentEl.innerHTML = newContent;
      else if (newContent instanceof HTMLElement) { contentEl.innerHTML = ''; contentEl.appendChild(newContent); }
      if (_isOpen) _positionPopover();
      return this;
    },
    
    reposition() {
      _positionPopover();
      return this;
    },
    
    isOpen() { return _isOpen; },
    getId() { return popoverId; },
    getElement() { return _popoverEl; },
    
    destroy() {
      this.hide();
      _popoverEl?.remove();
      _popoverEl = null;
      
      // Remove trigger listeners
      if (_hoverHandlers.enter) triggerElement?.removeEventListener('mouseenter', _hoverHandlers.enter);
      if (_hoverHandlers.leave) triggerElement?.removeEventListener('mouseleave', _hoverHandlers.leave);
    },
    
    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, popoverId, isOpen: _isOpen, hasEventBus: !!_injectedEventBus };
    }
  };
  
  // Setup trigger listeners
  if (triggerElement) {
    triggerElement.setAttribute('aria-haspopup', 'dialog');
    triggerElement.setAttribute('aria-expanded', 'false');
    
    switch (trigger) {
      case POPOVER_TRIGGER.CLICK:
        triggerElement.addEventListener('click', () => popover.toggle());
        break;
      case POPOVER_TRIGGER.HOVER:
        _hoverHandlers.enter = () => popover.show();
        _hoverHandlers.leave = () => popover.hide();
        triggerElement.addEventListener('mouseenter', _hoverHandlers.enter);
        triggerElement.addEventListener('mouseleave', _hoverHandlers.leave);
        break;
      case POPOVER_TRIGGER.FOCUS:
        triggerElement.addEventListener('focus', () => popover.show());
        triggerElement.addEventListener('blur', () => popover.hide());
        break;
    }
  }
  
  return popover;
}

export function closeAll() {
  [..._activePopovers.values()].forEach(p => p.hide());
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, activeCount: _activePopovers.size, hasEventBus: !!_injectedEventBus };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, activeCount: _activePopovers.size, hasEventBus: !!_injectedEventBus };
}

export default {
  createPopover, closeAll, injectEventBus,
  info, healthCheck, VERSION, MODULE_ID, POPOVER_POSITION, POPOVER_TRIGGER
};
