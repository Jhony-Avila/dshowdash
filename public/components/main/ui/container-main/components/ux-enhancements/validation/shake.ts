// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: shake
// PURPOSE: UX Enhancements - Validation Shake (#17)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createValidationShake() — exported function
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

export const VERSION = '3.0.0-UX-ENHANCED';
export const MODULE_ID = 'main.ui.container-main.components.ux-enhancements.validation.shake';

export function createValidationShake(container: HTMLElement) {
  let _shakeTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    shake() {
      if (!container) return this;
      
      if (_shakeTimeout) {
        clearTimeout(_shakeTimeout);
        container.classList.remove('dsd-container--validation-error');
      }
      
      void container.offsetWidth;
      
      container.classList.add('dsd-container--validation-error');
      
      _shakeTimeout = setTimeout(() => {
        container.classList.remove('dsd-container--validation-error');
        _shakeTimeout = null;
      }, 500);
      
      return this;
    },
    onValidationError(errors: Record<string, unknown> | unknown[]) {
      if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
        this.shake();
      }
      return this;
    },
    destroy() {
      if (_shakeTimeout) {
        clearTimeout(_shakeTimeout);
        container?.classList?.remove('dsd-container--validation-error');
      }
    }
  };
}
