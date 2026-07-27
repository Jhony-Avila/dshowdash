// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: create-container-dom
// PURPOSE: Create Container DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from ../constants.js
//
// PROVIDES:
//   createContainerDOM() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from '../constants.js';

export const MODULE_ID = 'main.ui.container-main.container-factory.dom.create-container-dom';

export function createContainerDOM(containerId: string, options: Record<string, unknown>) {
  const container = document.createElement('div');
  container.id = containerId;
  container.className = `dsd-container dsd-container--${options.variant} ${options.className}`.trim();
  container.setAttribute('role', 'region');
  container.setAttribute('aria-labelledby', `${containerId}-title`);
  container.setAttribute('data-container-id', containerId);
  container.setAttribute('data-version', VERSION);
  container.setAttribute('data-state', 'initializing');
  container.setAttribute('tabindex', '0');

  container.innerHTML = `
    <header class="dsd-container__header" data-draggable="true">
      <div class="dsd-container__header-left">
        ${options.icon ? `<span class="dsd-container__icon" aria-hidden="true">${options.icon}</span>` : ''}
        <h2 id="${containerId}-title" class="dsd-container__title">${options.title}</h2>
      </div>
      <div class="dsd-container__header-right">
        <div class="dsd-container__controls" role="group" aria-label="Controles do container"></div>
      </div>
    </header>
    <div class="dsd-container__body">
      <div class="dsd-container__content" data-slot="content"></div>
      <div class="dsd-container__loading-overlay" aria-hidden="true">
        <div class="dsd-container__spinner"></div>
        <span class="dsd-container__loading-text">Carregando...</span>
      </div>
      <div class="dsd-container__error" role="alert" aria-live="polite">
        <span class="dsd-container__error-icon"></span>
        <span class="dsd-container__error-title">Erro ao carregar</span>
        <span class="dsd-container__error-message"></span>
        <button type="button" class="dsd-container__error-retry" data-action="retry">Tentar novamente</button>
      </div>
    </div>
  `;

  return container;
}

export default { createContainerDOM };
