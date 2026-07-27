// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-home.ui.message-display
// PURPOSE: Panel Home - Message Display
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ../core/constants.js
//   CONFIG from ../core/config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   display() — exported function
//   showLoading() — exported function
//   hideLoading() — exported function
//   getCurrentMessage() — exported function
//   clear() — exported function
//   destroy() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'panel-home.ui.message-display';

import { PANEL_ID } from '../core/constants.js';
import { CONFIG } from '../core/config.js';

/**
 * Estado do display
 */
const _state: { currentMessage: Record<string, unknown> | null; isAnimating: boolean; container: HTMLElement | null } = {
  currentMessage: null,
  isAnimating: false,
  container: null
};

/**
 * Ícones por categoria
 */
const CATEGORY_ICONS = {
  temporal: '🌤️',
  acolhimento: '👋',
  acao: '🚀',
  contexto: '🔄',
  estado: '✅',
  inspiracional: '💡',
  idle: '⏸️',
  default: '✨'
};

/**
 * Obtém ícone para categoria
 * @param {string} category 
 * @returns {string}
 */
function getIcon(category: string) {
  return (CATEGORY_ICONS as Record<string, string>)[category] || CATEGORY_ICONS.default;
}

/**
 * Inicializa o display
 * @param {HTMLElement} container 
 */
export function init(container: HTMLElement) {
  _state.container = container;
  _state.currentMessage = null;
  _state.isAnimating = false;
}

/**
 * Exibe uma mensagem com animação
 * @param {Object|null} message 
 * @param {Object} options 
 */
export function display(message: { text?: string; category?: string; subtitle?: string } | null, options: Record<string, unknown> = {}) {
  if (!_state.container) return;
  
  const messageArea = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-message-area`);
  const primaryEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-primary`);
  const secondaryEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-secondary`);
  const iconEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-icon`);

  if (!messageArea || !primaryEl) return;

  // Se não há mensagem, exibe estado vazio (silêncio é experiência)
  if (!message) {
    displayEmpty(messageArea, primaryEl, secondaryEl, iconEl);
    return;
  }

  // Animação de fade out -> update -> fade in
  if (CONFIG.features.animations && !options.skipAnimation) {
    animateTransition(messageArea, () => {
      updateContent(message, messageArea, primaryEl, secondaryEl, iconEl);
    });
  } else {
    updateContent(message, messageArea, primaryEl, secondaryEl, iconEl);
  }
  
  _state.currentMessage = message;
}

/**
 * Atualiza conteúdo dos elementos
 */
function updateContent(message: { text?: string; category?: string; subtitle?: string }, messageArea: HTMLElement, primaryEl: HTMLElement, secondaryEl: HTMLElement | null, iconEl: HTMLElement | null) {
  // Remove estado vazio
  messageArea.classList.remove('ph-empty', 'ph-loading');
  
  // Define categoria para estilização
  messageArea.dataset.category = message.category || 'default';
  
  // Ícone
  if (iconEl) {
    // @ts-expect-error strict migration — TS2345
    iconEl.textContent = getIcon(message.category);
    iconEl.style.display = 'block';
  }
  
  // Texto principal
  primaryEl.textContent = message.text || '';
  
  // Texto secundário (subtítulo)
  if (secondaryEl) {
    if (message.subtitle) {
      secondaryEl.textContent = message.subtitle;
      secondaryEl.style.display = 'block';
    } else {
      secondaryEl.textContent = '';
      secondaryEl.style.display = 'none';
    }
  }
}

/**
 * Exibe estado vazio
 */
function displayEmpty(messageArea: HTMLElement, primaryEl: HTMLElement, secondaryEl: HTMLElement | null, iconEl: HTMLElement | null) {
  messageArea.classList.add('ph-empty');
  messageArea.classList.remove('ph-loading');
  messageArea.dataset.category = 'empty';
  
  if (iconEl) {
    iconEl.textContent = '';
    iconEl.style.display = 'none';
  }
  
  primaryEl.textContent = '';
  
  if (secondaryEl) {
    secondaryEl.textContent = '';
    secondaryEl.style.display = 'none';
  }
  
  _state.currentMessage = null;
}

/**
 * Exibe estado de loading
 */
export function showLoading() {
  if (!_state.container) return;
  
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.add('ph-loading');
    messageArea.classList.remove('ph-empty');
  }
}

/**
 * Remove estado de loading
 */
export function hideLoading() {
  if (!_state.container) return;
  
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.remove('ph-loading');
  }
}

/**
 * Animação de transição
 * @param {HTMLElement} element 
 * @param {Function} updateFn 
 */
function animateTransition(element: HTMLElement, updateFn: () => void) {
  if (_state.isAnimating) {
    updateFn();
    return;
  }
  
  _state.isAnimating = true;
  const duration = CONFIG.display.fadeDuration;
  
  // Fade out
  element.style.opacity = '0';
  element.style.transform = 'translateY(8px)';
  
  setTimeout(() => {
    // Update content
    updateFn();
    
    // Fade in
    element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
    
    setTimeout(() => {
      _state.isAnimating = false;
      element.style.transition = '';
    }, duration);
  }, duration);
}

/**
 * Obtém mensagem atual
 * @returns {Object|null}
 */
export function getCurrentMessage() {
  return _state.currentMessage;
}

/**
 * Limpa display
 */
export function clear() {
  if (!_state.container) return;
  
  const messageArea = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-message-area`);
  const primaryEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-primary`);
  const secondaryEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-secondary`);
  const iconEl = _state.container.querySelector<HTMLElement>(`#${PANEL_ID}-icon`);

  if (messageArea && primaryEl) {
    displayEmpty(messageArea, primaryEl, secondaryEl, iconEl);
  }
  
  _state.currentMessage = null;
}

/**
 * Destroi o display
 */
export function destroy() {
  _state.container = null;
  _state.currentMessage = null;
  _state.isAnimating = false;
}

export default {
  init,
  display,
  showLoading,
  hideLoading,
  getCurrentMessage,
  clear,
  destroy
};
