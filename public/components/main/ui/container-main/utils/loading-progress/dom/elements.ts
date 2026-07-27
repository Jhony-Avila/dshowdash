// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: elements
// PURPOSE: Loading Progress - DOM Elements
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   injectStyles from ../styles.js
//
// PROVIDES:
//   createElements() — exported function
//   removeElements() — exported function
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

import { injectStyles } from '../styles.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.loading-progress.dom.elements';

export function createElements(config: Record<string, unknown>, refs: Record<string, unknown>) {
  if (refs.element) return;
  
  injectStyles(config);
  
  refs.element = document.createElement('div');
  (refs.element as HTMLElement).className = `dsd-loading-progress dsd-loading-progress--${config.position}`;
  (refs.element as HTMLElement).setAttribute('role', 'progressbar');
  (refs.element as HTMLElement).setAttribute('aria-valuemin', '0');
  (refs.element as HTMLElement).setAttribute('aria-valuemax', '100');
  (refs.element as HTMLElement).setAttribute('aria-valuenow', '0');
  
  refs.barElement = document.createElement('div');
  (refs.barElement as HTMLElement).className = 'dsd-loading-progress__bar';
  // @ts-expect-error TS migration - TS2345
  (refs.element as HTMLElement).appendChild(refs.barElement);
  
  if (config.showSpinner) {
    refs.spinnerElement = document.createElement('div');
    (refs.spinnerElement as HTMLElement).className = 'dsd-loading-progress__spinner';
    (refs.spinnerElement as HTMLElement).innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="${config.color}" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    `;
  }
  
  const parent = config.parent || document.body;
  // @ts-expect-error TS migration - TS2345
  (parent as HTMLElement).appendChild(refs.element);
  // @ts-expect-error TS migration - TS2345
  if (refs.spinnerElement) (parent as HTMLElement).appendChild(refs.spinnerElement);
}

export function removeElements(refs: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2339
  refs.element?.remove();
  // @ts-expect-error TS migration - TS2339
  refs.spinnerElement?.remove();
  refs.element = null;
  refs.barElement = null;
  refs.spinnerElement = null;
}
