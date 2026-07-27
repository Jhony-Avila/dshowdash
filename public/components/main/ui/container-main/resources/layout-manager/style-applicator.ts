// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: style-applicator
// PURPOSE: Layout Style Applicator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES from ./constants.js
//
// PROVIDES:
//   createStyleApplicator() — exported function
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

import { LAYOUT_STATES } from './constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.style-applicator';

export function createStyleApplicator(options: Record<string, unknown> = {}) {
  const { animationDuration = 300 } = options;

  return {
    // Aplica estilo de layout ao elemento
    apply(element: HTMLElement, layout: Record<string, unknown>, animate = true) {
      if (!element) return;

      const style = element.style;
      
      if (animate) {
        style.transition = `all ${animationDuration}ms ease-out`;
      } else {
        style.transition = 'none';
      }

      if (layout.state === LAYOUT_STATES.FULLSCREEN) {
        style.position = 'fixed';
        style.top = '0';
        style.left = '0';
        style.width = '100vw';
        style.height = '100vh';
        style.zIndex = '9999';
      } else if (layout.state === LAYOUT_STATES.MINIMIZED) {
        style.display = 'none';
      } else {
        style.position = layout.state === LAYOUT_STATES.FLOATING ? 'absolute' : 'relative';
        style.display = 'block';
        style.width = `${layout.width}px`;
        style.height = `${layout.height}px`;
        
        if (layout.x !== undefined) style.left = `${layout.x}px`;
        if (layout.y !== undefined) style.top = `${layout.y}px`;
        
        style.zIndex = (layout.zIndex as string) || 'auto';
      }

      element.setAttribute('data-layout-state', layout.state as string);
    },

    // Remove estilos de layout
    clear(element: HTMLElement) {
      if (!element) return;
      
      const style = element.style;
      style.transition = '';
      style.position = '';
      style.top = '';
      style.left = '';
      style.width = '';
      style.height = '';
      style.zIndex = '';
      style.display = '';
      
      element.removeAttribute('data-layout-state');
    },

    getAnimationDuration() {
      return animationDuration;
    }
  };
}

export default { createStyleApplicator };
