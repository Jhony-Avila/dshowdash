// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Panel Home - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ./constants.js
//
// PROVIDES:
//   renderStructure() — exported function
//   renderLoading() — exported function
//   removeLoading() — exported function
//   renderMessage() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_ID } from './constants.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-home.core.template';

/**
 * Renderiza a estrutura base do panel-home
 * @param {HTMLElement} container 
 */
export function renderStructure(container: HTMLElement) {
  container.innerHTML = `
    <div class="ph-wrapper" data-panel="${PANEL_ID}">
      <div class="ph-content">
        <div class="ph-message-area" id="${PANEL_ID}-message-area">
          <div class="ph-message-container">
            <span class="ph-message-icon" id="${PANEL_ID}-icon"></span>
            <div class="ph-message-text-wrapper">
              <h2 class="ph-message-primary" id="${PANEL_ID}-primary"></h2>
              <p class="ph-message-secondary" id="${PANEL_ID}-secondary"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza estado de loading
 * @param {HTMLElement} container 
 */
export function renderLoading(container: HTMLElement) {
  const messageArea = container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.add('ph-loading');
  }
}

/**
 * Remove estado de loading
 * @param {HTMLElement} container 
 */
export function removeLoading(container: HTMLElement) {
  const messageArea = container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.remove('ph-loading');
  }
}

/**
 * Renderiza mensagem no template
 * @param {HTMLElement} container 
 * @param {Object|null} message 
 */
export function renderMessage(container: HTMLElement, message: { category?: string; text?: string; subtitle?: string } | null) {
  const primaryEl = container.querySelector<HTMLElement>(`#${PANEL_ID}-primary`);
  const secondaryEl = container.querySelector<HTMLElement>(`#${PANEL_ID}-secondary`);
  const iconEl = container.querySelector<HTMLElement>(`#${PANEL_ID}-icon`);
  const messageArea = container.querySelector<HTMLElement>(`#${PANEL_ID}-message-area`);
  
  if (!primaryEl || !messageArea) return;
  
  // Remove loading state
  messageArea.classList.remove('ph-loading');
  
  if (!message) {
    // No message - hide or show minimal state
    messageArea.classList.add('ph-empty');
    primaryEl.textContent = '';
    if (secondaryEl) secondaryEl.textContent = '';
    if (iconEl) iconEl.textContent = '';
    return;
  }
  
  // Has message - display it
  messageArea.classList.remove('ph-empty');
  messageArea.classList.add('ph-fade-in');
  
  // Set category for styling
  messageArea.dataset.category = message.category || 'default';
  
  // Set icon based on category
  if (iconEl) {
    // @ts-expect-error strict migration — TS2345
    iconEl.textContent = getCategoryIcon(message.category);
  }
  
  // Set primary text
  primaryEl.textContent = message.text || '';
  
  // Set secondary text if available
  if (secondaryEl) {
    secondaryEl.textContent = message.subtitle || '';
    secondaryEl.style.display = message.subtitle ? 'block' : 'none';
  }
  
  // Remove animation class after completion
  setTimeout(() => {
    messageArea.classList.remove('ph-fade-in');
  }, 300);
}

/**
 * Retorna ícone baseado na categoria
 * @param {string} category 
 * @returns {string}
 */
function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    temporal: '🕐',
    acolhimento: '👋',
    acao: '🚀',
    contexto: '🔄',
    estado: '✅',
    inspiracional: '💡',
    idle: '💤',
    default: '✨'
  };
  return icons[category] || icons.default;
}

export default {
  renderStructure,
  renderLoading,
  removeLoading,
  renderMessage
};
