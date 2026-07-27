// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-spinner
// PURPOSE: Container Spinner/Loading Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SPINNER_SIZE — exported value
//   SPINNER_VARIANT — exported value
//   createSpinner() — exported function
//   createOverlaySpinner() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-spinner';

export const SPINNER_SIZE = { XS: 'xs', SM: 'sm', MD: 'md', LG: 'lg', XL: 'xl' };
export const SPINNER_VARIANT = { DEFAULT: 'default', PRIMARY: 'primary', WHITE: 'white' };

export function createSpinner(options: Record<string, unknown> = {}) {
  const {
    size = SPINNER_SIZE.MD,
    variant = SPINNER_VARIANT.DEFAULT,
    label = 'Carregando...',
    showLabel = false,
    className = ''
  } = options;
  
  const spinner = document.createElement('div');
  spinner.className = `dsd-spinner dsd-spinner--${size} dsd-spinner--${variant} ${className}`.trim();
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', String(label));
  
  spinner.innerHTML = `
    <svg class="dsd-spinner__svg" viewBox="0 0 24 24" fill="none">
      <circle class="dsd-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
      <circle class="dsd-spinner__indicator" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>
    ${showLabel ? `<span class="dsd-spinner__label">${label}</span>` : `<span class="sr-only">${label}</span>`}
  `;
  
  return {
    element: spinner,
    show() { spinner.hidden = false; return this; },
    hide() { spinner.hidden = true; return this; },
    setLabel(newLabel: string) {
      spinner.setAttribute('aria-label', newLabel);
      const labelEl = spinner.querySelector('.dsd-spinner__label');
      if (labelEl) labelEl.textContent = newLabel;
      return this;
    },
    getElement() { return spinner; }
  };
}

export function createOverlaySpinner(container: HTMLElement, options: Record<string, unknown> = {}) {
  const { label = 'Carregando...', variant = SPINNER_VARIANT.PRIMARY } = options;
  
  const overlay = document.createElement('div');
  overlay.className = 'dsd-spinner-overlay';
  
  const spinner = createSpinner({ size: SPINNER_SIZE.LG, variant, label, showLabel: true });
  overlay.appendChild(spinner.element);
  
  return {
    show() { container.style.position = 'relative'; container.appendChild(overlay); return this; },
    hide() { overlay.remove(); return this; },
    getElement() { return overlay; }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createSpinner, createOverlaySpinner, info, healthCheck, VERSION, MODULE_ID, SPINNER_SIZE, SPINNER_VARIANT };
