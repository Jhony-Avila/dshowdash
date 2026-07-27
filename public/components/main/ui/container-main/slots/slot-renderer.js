import { SLOT_TYPES } from "../contracts/slot-contract.js";
const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:slot-renderer";
function _createSlotTemplate(slotId, slotType) {
  return `
    <div class="dsd-slot__wrapper" data-slot-wrapper="${slotId}">
      <div class="dsd-slot__header" data-slot-header="${slotId}"></div>
      <div class="dsd-slot__content" data-slot-content="${slotId}"></div>
      <div class="dsd-slot__loading" data-slot-loading="${slotId}" hidden>
        <div class="dsd-slot__spinner"></div>
        <span class="dsd-slot__loading-text">Carregando...</span>
      </div>
      <div class="dsd-slot__error" data-slot-error="${slotId}" hidden>
        <span class="dsd-slot__error-icon">\u26A0\uFE0F</span>
        <span class="dsd-slot__error-message"></span>
        <button class="dsd-slot__error-retry" data-action="retry">Tentar novamente</button>
      </div>
    </div>
  `;
}
function createSlotRenderer(options = {}) {
  const {
    onRetry,
    onError,
    showHeader = true,
    animateTransitions = true
  } = options;
  let _element = null;
  let _contentEl = null;
  let _loadingEl = null;
  let _errorEl = null;
  let _headerEl = null;
  let _state = "idle";
  let _currentContent = null;
  return {
    // Inicializa o renderer em um elemento
    init(targetElement, slotId, slotType = SLOT_TYPES.PANEL) {
      _element = targetElement;
      _element.innerHTML = _createSlotTemplate(slotId, slotType);
      _element.classList.add("dsd-slot", `dsd-slot--${slotType}`);
      _contentEl = _element.querySelector(`[data-slot-content="${slotId}"]`);
      _loadingEl = _element.querySelector(`[data-slot-loading="${slotId}"]`);
      _errorEl = _element.querySelector(`[data-slot-error="${slotId}"]`);
      _headerEl = _element.querySelector(`[data-slot-header="${slotId}"]`);
      if (!showHeader && _headerEl) {
        _headerEl.hidden = true;
      }
      const retryBtn = _element.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener("click", () => onRetry?.());
      }
      _state = "initialized";
      return this;
    },
    // Mostra estado de loading
    showLoading(message = "Carregando...") {
      if (!_element) return this;
      _state = "loading";
      _contentEl.hidden = true;
      _errorEl.hidden = true;
      _loadingEl.hidden = false;
      const textEl = _loadingEl.querySelector(".dsd-slot__loading-text");
      if (textEl) textEl.textContent = message;
      _element.setAttribute("data-state", "loading");
      return this;
    },
    // Esconde loading
    hideLoading() {
      if (!_element) return this;
      _loadingEl.hidden = true;
      return this;
    },
    // Mostra erro
    showError(error, retryable = true) {
      if (!_element) return this;
      _state = "error";
      _contentEl.hidden = true;
      _loadingEl.hidden = true;
      _errorEl.hidden = false;
      const messageEl = _errorEl.querySelector(".dsd-slot__error-message");
      if (messageEl) {
        messageEl.textContent = error?.message || String(error) || "Erro desconhecido";
      }
      const retryBtn = _errorEl.querySelector(".dsd-slot__error-retry");
      if (retryBtn) {
        retryBtn.hidden = !retryable;
      }
      _element.setAttribute("data-state", "error");
      onError?.(error);
      return this;
    },
    // Esconde erro
    hideError() {
      if (!_element) return this;
      _errorEl.hidden = true;
      return this;
    },
    // Renderiza conteúdo
    render(content) {
      if (!_element || !_contentEl) return this;
      _state = "ready";
      this.hideLoading();
      this.hideError();
      _contentEl.hidden = false;
      if (typeof content === "string") {
        _contentEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        _contentEl.innerHTML = "";
        _contentEl.appendChild(content);
      } else if (content?.render) {
        _contentEl.innerHTML = "";
        content.render(_contentEl);
      }
      _currentContent = content;
      _element.setAttribute("data-state", "ready");
      if (animateTransitions) {
        _contentEl.classList.add("dsd-slot__content--animate-in");
        setTimeout(() => {
          _contentEl.classList.remove("dsd-slot__content--animate-in");
        }, 300);
      }
      return this;
    },
    // Atualiza header
    setHeader(headerContent) {
      if (!_headerEl) return this;
      _headerEl.hidden = false;
      if (typeof headerContent === "string") {
        _headerEl.innerHTML = headerContent;
      } else if (headerContent instanceof HTMLElement) {
        _headerEl.innerHTML = "";
        _headerEl.appendChild(headerContent);
      }
      return this;
    },
    // Limpa conteúdo
    clear() {
      if (_contentEl) _contentEl.innerHTML = "";
      _currentContent = null;
      _state = "cleared";
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
        _element.innerHTML = "";
      }
      _element = null;
      _contentEl = null;
      _loadingEl = null;
      _errorEl = null;
      _headerEl = null;
      _currentContent = null;
      _state = "destroyed";
    },
    // Health check
    healthCheck() {
      return {
        status: _element ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID,
        state: _state,
        hasContent: !!_currentContent
      };
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createSlotRenderer"]
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var slot_renderer_default = {
  VERSION,
  MODULE_ID,
  createSlotRenderer,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createSlotRenderer,
  slot_renderer_default as default,
  healthCheck,
  info
};
