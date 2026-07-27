
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:modal-manager
// PURPOSE: Modal Manager - Gerenciamento de modais
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MODAL_SIZES — exported value
//   createModalManager() — exported function
//   getModalManager() — exported function
//   resetModalManager() — exported function
//   openModal() — exported function
//   closeModal() — exported function
//   alert() — exported function
//   confirm() — exported function
//   prompt() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:modal-manager';

export const MODAL_SIZES = Object.freeze({ SM: 'sm', MD: 'md', LG: 'lg', XL: 'xl', FULL: 'full' });

export function createModalManager(options: Record<string, any> = {}) {
  const { zIndexBase = 10000, closeOnEscape = true, closeOnBackdrop = true, stackable = true, animation = 'fade', animationDuration = 200, onOpen = null, onClose = null } = options;

  const _logger = createLogger(MODULE_ID);
  const _modals = new Map();
  const _stack: Record<string, unknown>[] = [];
  let _counter = 0;
  let _metrics = { opened: 0, closed: 0 };

  // Estilos
  const STYLES = `
    .cm-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity ${animationDuration}ms ease; z-index: var(--z-index); }
    .cm-modal-backdrop.visible { opacity: 1; }
    .cm-modal { background: #1a1a2e; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); max-height: 90vh; display: flex; flex-direction: column; transform: scale(0.9) translateY(-20px); opacity: 0; transition: all ${animationDuration}ms ease; }
    .cm-modal-backdrop.visible .cm-modal { transform: scale(1) translateY(0); opacity: 1; }
    .cm-modal.sm { width: 360px; }
    .cm-modal.md { width: 500px; }
    .cm-modal.lg { width: 700px; }
    .cm-modal.xl { width: 900px; }
    .cm-modal.full { width: 95vw; height: 95vh; }
    .cm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .cm-modal-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
    .cm-modal-close { background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; }
    .cm-modal-close:hover { opacity: 1; }
    .cm-modal-body { padding: 20px; overflow-y: auto; flex: 1; color: #e0e0e0; }
    .cm-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .cm-modal-btn { padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
    .cm-modal-btn-primary { background: #3b82f6; color: #fff; }
    .cm-modal-btn-primary:hover { background: #2563eb; }
    .cm-modal-btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    .cm-modal-btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .cm-modal-btn-danger { background: #ef4444; color: #fff; }
    .cm-modal-btn-danger:hover { background: #dc2626; }
    body.cm-modal-open { overflow: hidden; }
  `;

  function _injectStyles() {
    if (document.getElementById('cm-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-modal-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function _createBackdrop(id: string, zIndex: number) {
    const backdrop = document.createElement('div');
    backdrop.className = 'cm-modal-backdrop';
    // @ts-expect-error TS migration - TS2345
    backdrop.style.setProperty('--z-index', zIndex);
    backdrop.dataset.modalId = id;
    if (closeOnBackdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) manager.close(id);
      });
    }
    return backdrop;
  }

  function _createModal(config: Record<string, unknown>) {
    const modal = document.createElement('div');
    modal.className = `cm-modal ${config.size || MODAL_SIZES.MD}`;
    if (config.className) modal.classList.add((config.className as string));

    let headerHtml = '';
    if (config.title || config.closable !== false) {
      headerHtml = `<div class="cm-modal-header">
        <h3 class="cm-modal-title">${config.title || ''}</h3>
        ${config.closable !== false ? '<button class="cm-modal-close" data-action="close">×</button>' : ''}
      </div>`;
    }

    let footerHtml = '';
    // @ts-expect-error TS migration - TS2339
    if (config.buttons?.length > 0) {
      // @ts-expect-error strict migration — TS2345
      const btns = (config.buttons as unknown[]).map((btn: HTMLButtonElement, i: number) => 
        // @ts-expect-error TS migration - TS2551
        `<button class="cm-modal-btn cm-modal-btn-${btn.type || 'secondary'}" data-action="button" data-index="${i}">${btn.label}</button>`
      ).join('');
      footerHtml = `<div class="cm-modal-footer">${btns}</div>`;
    }

    modal.innerHTML = `${headerHtml}<div class="cm-modal-body"></div>${footerHtml}`;
    
    const body = modal.querySelector('.cm-modal-body');
    if (typeof config.content === 'string') {
      body!.innerHTML = config.content;
    } else if (config.content instanceof HTMLElement) {
      body!.appendChild(config.content);
    }

    // Event listeners
    modal.addEventListener('click', (e: Record<string, any>) => {
      const action = e.target.dataset.action;
      if (action === 'close') {
        manager.close((config.id as string));
      } else if (action === 'button') {
        const index = parseInt(e.target.dataset.index);
        const btn = (config.buttons as Record<string, unknown>)[index];
        // @ts-expect-error TS migration - TS2349
        const result = (btn as Record<string, unknown>).onClick?.(config.id);
        if (result !== false && (btn as Record<string, unknown>).closeOnClick !== false) {
          // @ts-expect-error TS migration - TS2345
          manager.close((config.id as string), (btn as Record<string, unknown>).value);
        }
      }
    });

    return modal;
  }

  function _handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && closeOnEscape && _stack.length > 0) {
      const topModal = _stack[_stack.length - 1];
      const config = _modals.get(topModal);
      if (config?.closable !== false) {
        // @ts-expect-error TS migration - TS2345
        manager.close(topModal);
      }
    }
  }

  const manager = {
    open(config: Record<string, unknown>) {
      _injectStyles();

      const id = config.id || `modal-${++_counter}`;
      config.id = id;

      if (!stackable && _stack.length > 0) {
        // @ts-expect-error strict migration — TS2345
        this.close(_stack[_stack.length - 1]);
      }

      const zIndex = zIndexBase + (_stack.length * 2);
      const backdrop = _createBackdrop((id as string), zIndex);
      const modal = _createModal(config);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      document.body.classList.add('cm-modal-open');

      _modals.set(id, { ...config, backdrop, modal });
      _stack.push((id as Record<string, unknown>));
      _metrics.opened++;

      // Anima entrada
      requestAnimationFrame(() => {
        backdrop.classList.add('visible');
      });

      // Focus trap
      const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) (focusable[0] as HTMLElement).focus();

      if (_stack.length === 1) {
        document.addEventListener('keydown', _handleEscape);
      }

      onOpen?.(id, config);
      // @ts-expect-error TS migration - TS2349
      config.onOpen?.(id);

      return id;
    },

    // @ts-expect-error strict migration — TS2322
    close(id: string, result: Record<string, unknown> = undefined) {
      const config = _modals.get(id);
      if (!config) return;

      config.backdrop.classList.remove('visible');

      setTimeout(() => {
        config.backdrop.remove();
        _modals.delete(id);
        
        // @ts-expect-error TS migration - TS2345
        const stackIndex = _stack.indexOf(id);
        if (stackIndex > -1) _stack.splice(stackIndex, 1);

        if (_stack.length === 0) {
          document.body.classList.remove('cm-modal-open');
          document.removeEventListener('keydown', _handleEscape);
        }

        _metrics.closed++;
        onClose?.(id, result);
        config.onClose?.(result);
        config._resolve?.(result);
      }, animationDuration);
    },

    closeAll() {
      // @ts-expect-error strict migration — TS2345
      [..._stack].forEach(id => this.close(id));
    },

    // Promise-based
    async openAsync(config: Record<string, unknown>) {
      return new Promise((resolve) => {
        config._resolve = resolve;
        this.open(config);
      });
    },

    // Presets
    alert(message: string, options: Record<string, any> = {}) {
      return this.openAsync({
        title: options.title || 'Aviso',
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        buttons: [{ label: options.okText || 'OK', type: 'primary', value: true }],
        ...options
      });
    },

    confirm(message: string, options: Record<string, any> = {}) {
      return this.openAsync({
        title: options.title || 'Confirmar',
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        buttons: [
          { label: options.cancelText || 'Cancelar', type: 'secondary', value: false },
          { label: options.okText || 'Confirmar', type: 'primary', value: true }
        ],
        ...options
      });
    },

    prompt(message: string, options: Record<string, any> = {}) {
      const inputId = `prompt-${Date.now()}`;
      return this.openAsync({
        title: options.title || 'Digite',
        content: `<p>${message}</p><input type="${options.type || 'text'}" id="${inputId}" class="cm-modal-input" value="${options.defaultValue || ''}" placeholder="${options.placeholder || ''}" style="width:100%;padding:10px;margin-top:10px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.1);color:#fff;">`,
        size: MODAL_SIZES.SM,
        buttons: [
          { label: options.cancelText || 'Cancelar', type: 'secondary', value: null },
          { label: options.okText || 'OK', type: 'primary', closeOnClick: false, onClick: (id: string) => {
            const input = document.getElementById(inputId) as HTMLInputElement;
            // @ts-expect-error strict migration — TS2345
            this.close(id, input?.value || '');
            return false;
          }}
        ],
        onOpen: () => {
          setTimeout(() => document.getElementById(inputId)?.focus(), 100);
        },
        ...options
      });
    },

    isOpen(id: string) { return _modals.has(id); },
    getStack() { return [..._stack]; },
    getTopModal() { return _stack[_stack.length - 1] || null; },
    getMetrics() { return { ..._metrics, currentlyOpen: _stack.length }; },
    resetMetrics() { _metrics = { opened: 0, closed: 0 }; },

    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, openModals: _stack.length, metrics: _metrics };
    },

    info() {
      return { moduleId: MODULE_ID, version: VERSION, openModals: _stack.length, sizes: Object.keys(MODAL_SIZES) };
    },

    destroy() {
      this.closeAll();
      const styles = document.getElementById('cm-modal-styles');
      if (styles) styles.remove();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getModalManager(options = {}) { if (!_instance) _instance = createModalManager(options); return _instance; }
export function resetModalManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function openModal(config: Record<string, unknown>) { return (getModalManager().open as (...args: unknown[]) => unknown)(config); }
export function closeModal(id: string, result: Record<string, unknown>) { return (getModalManager().close as (...args: unknown[]) => unknown)(id, result); }
export function alert(message: string, options: Record<string, unknown>) { return (getModalManager().alert as (...args: unknown[]) => unknown)(message, options); }
export function confirm(message: string, options: Record<string, unknown>) { return (getModalManager().confirm as (...args: unknown[]) => unknown)(message, options); }
export function prompt(message: string, options: Record<string, unknown>) { return (getModalManager().prompt as (...args: unknown[]) => unknown)(message, options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, sizes: Object.keys(MODAL_SIZES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, MODAL_SIZES, createModalManager, getModalManager, resetModalManager, openModal, closeModal, alert, confirm, prompt, info, healthCheck };
