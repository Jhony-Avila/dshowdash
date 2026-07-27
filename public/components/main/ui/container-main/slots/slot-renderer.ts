// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:slot-renderer
// PURPOSE: Slot Renderer - Renderizador de slots
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SLOT_TYPES from ../contracts/slot-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSlotRenderer() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { SLOT_TYPES } from '../contracts/slot-contract.js';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:slot-renderer';

// Template base para slot
function _createSlotTemplate(slotId: string, slotType: unknown) {
  return `
    <div class="dsd-slot__wrapper" data-slot-wrapper="${slotId}">
      <div class="dsd-slot__header" data-slot-header="${slotId}"></div>
      <div class="dsd-slot__content" data-slot-content="${slotId}"></div>
      <div class="dsd-slot__loading" data-slot-loading="${slotId}" hidden>
        <div class="dsd-slot__spinner"></div>
        <span class="dsd-slot__loading-text">Carregando...</span>
      </div>
      <div class="dsd-slot__error" data-slot-error="${slotId}" hidden>
        <span class="dsd-slot__error-icon">⚠️</span>
        <span class="dsd-slot__error-message"></span>
        <button class="dsd-slot__error-retry" data-action="retry">Tentar novamente</button>
      </div>
    </div>
  `;
}

// Cria um renderer para slot
export function createSlotRenderer(options: Record<string, any> = {}) {
  const {
    onRetry,
    onError,
    showHeader = true,
    animateTransitions = true
  } = options;

  let _element: HTMLElement | null = null;
  let _contentEl: HTMLElement | null = null;
  let _loadingEl: HTMLElement | null = null;
  let _errorEl: HTMLElement | null = null;
  let _headerEl: HTMLElement | null = null;
  let _state = 'idle';
  let _currentContent: unknown = null;

  return {
    // Inicializa o renderer em um elemento
    init(targetElement: HTMLElement, slotId: string, slotType = SLOT_TYPES.PANEL) {
      _element = targetElement;
      _element.innerHTML = _createSlotTemplate(slotId, slotType);
      _element.classList.add('dsd-slot', `dsd-slot--${slotType}`);
      
      _contentEl = _element.querySelector(`[data-slot-content="${slotId}"]`);
      _loadingEl = _element.querySelector(`[data-slot-loading="${slotId}"]`);
      _errorEl = _element.querySelector(`[data-slot-error="${slotId}"]`);
      _headerEl = _element.querySelector(`[data-slot-header="${slotId}"]`);

      if (!showHeader && _headerEl) {
        _headerEl.hidden = true;
      }

      // Setup retry button
      const retryBtn = _element.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => onRetry?.());
      }

      _state = 'initialized';
      return this;
    },

    // Mostra estado de loading
    showLoading(message = 'Carregando...') {
      if (!_element) return this;
      
      _state = 'loading';
      _contentEl!.hidden = true;
      _errorEl!.hidden = true;
      _loadingEl!.hidden = false;
      
      const textEl = _loadingEl!.querySelector('.dsd-slot__loading-text');
      if (textEl) textEl.textContent = message;

      _element.setAttribute('data-state', 'loading');
      return this;
    },

    // Esconde loading
    hideLoading() {
      if (!_element) return this;
      
      _loadingEl!.hidden = true;
      return this;
    },

    // Mostra erro
    showError(error: Record<string, unknown>, retryable = true) {
      if (!_element) return this;
      
      _state = 'error';
      _contentEl!.hidden = true;
      _loadingEl!.hidden = true;
      _errorEl!.hidden = false;

      const messageEl = _errorEl!.querySelector('.dsd-slot__error-message');
      if (messageEl) {
        messageEl.textContent = (error?.message as string) || String(error) || 'Erro desconhecido';
      }

      const retryBtn = _errorEl!.querySelector('.dsd-slot__error-retry') as HTMLElement | null;
      if (retryBtn) {
        retryBtn.hidden = !retryable;
      }

      _element.setAttribute('data-state', 'error');
      onError?.(error);
      return this;
    },

    // Esconde erro
    hideError() {
      if (!_element) return this;
      
      _errorEl!.hidden = true;
      return this;
    },

    // Renderiza conteúdo
    render(content: string | HTMLElement | { render: (el: HTMLElement) => void }) {
      if (!_element || !_contentEl) return this;

      _state = 'ready';
      this.hideLoading();
      this.hideError();
      
      _contentEl.hidden = false;

      if (typeof content === 'string') {
        _contentEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        _contentEl.innerHTML = '';
        _contentEl.appendChild(content);
      } else if (content?.render) {
        _contentEl.innerHTML = '';
        content.render(_contentEl);
      }

      _currentContent = content;
      _element.setAttribute('data-state', 'ready');

      if (animateTransitions) {
        _contentEl.classList.add('dsd-slot__content--animate-in');
        setTimeout(() => {
          _contentEl!.classList.remove('dsd-slot__content--animate-in');
        }, 300);
      }

      return this;
    },

    // Atualiza header
    setHeader(headerContent: unknown) {
      if (!_headerEl) return this;
      
      _headerEl.hidden = false;
      
      if (typeof headerContent === 'string') {
        _headerEl.innerHTML = headerContent;
      } else if (headerContent instanceof HTMLElement) {
        _headerEl.innerHTML = '';
        _headerEl.appendChild(headerContent);
      }

      return this;
    },

    // Limpa conteúdo
    clear() {
      if (_contentEl) _contentEl.innerHTML = '';
      _currentContent = null;
      _state = 'cleared';
      return this;
    },

    // Obtém elemento de conteúdo
    getContentElement() {
      return _contentEl;
    },

    // Obtém elemento raiz
    getElement() {
      return _element;
    },

    // Obtém conteúdo atual
    getCurrentContent() {
      return _currentContent;
    },

    // Obtém estado
    getState() {
      return _state;
    },

    // Destroy
    destroy() {
      if (_element) {
        _element.innerHTML = '';
      }
      _element = null;
      _contentEl = null;
      _loadingEl = null;
      _errorEl = null;
      _headerEl = null;
      _currentContent = null;
      _state = 'destroyed';
    },

    // Health check
    healthCheck() {
      return {
        status: _element ? 'HEALTHY' : 'NOT_INITIALIZED',
        version: VERSION,
        moduleId: MODULE_ID,
        state: _state,
        hasContent: !!_currentContent
      };
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['createSlotRenderer']
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  createSlotRenderer,
  info, healthCheck
};
