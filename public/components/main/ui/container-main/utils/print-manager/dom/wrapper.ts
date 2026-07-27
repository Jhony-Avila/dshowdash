// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: wrapper
// PURPOSE: Print Manager - Print Wrapper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//   _formatDate from ../helpers/utils.js
//
// PROVIDES:
//   _createPrintWrapper() — exported function
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

import { getConfig } from '../state.js';
import { _formatDate } from '../helpers/utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.dom.wrapper';

export function _createPrintWrapper(element: HTMLElement) {
  const config = getConfig();
  const wrapper = document.createElement('div');
  wrapper.id = 'dsd-print-wrapper';
  wrapper.className = 'dsd-print-content';
  
  if (config.showHeader) {
    const header = document.createElement('div');
    header.className = 'dsd-print-header dsd-print-only';
    
    if (config.headerContent) {
      header.innerHTML = typeof config.headerContent === 'function' 
        // @ts-expect-error strict migration — TS2349
        ? config.headerContent() 
        : config.headerContent;
    } else {
      const title = config.title || document.title || 'Documento';
      header.innerHTML = `
        <span class="dsd-print-title">${config.showTitle ? title : ''}</span>
        <span class="dsd-print-date">${config.showDate ? _formatDate() : ''}</span>
      `;
    }
    
    wrapper.appendChild(header);
  }
  
  const content = element.cloneNode(true);
  // @ts-expect-error TS migration - TS2339
  content.classList.add('dsd-print-body');
  wrapper.appendChild(content);
  
  if (config.showFooter) {
    const footer = document.createElement('div');
    footer.className = 'dsd-print-footer dsd-print-only';
    
    if (config.footerContent) {
      footer.innerHTML = typeof config.footerContent === 'function'
        // @ts-expect-error strict migration — TS2349
        ? config.footerContent()
        : config.footerContent;
    } else {
      footer.innerHTML = `
        <span>Impresso em ${_formatDate()}</span>
        ${config.showPageNumbers ? '<span class="dsd-print-page-number"></span>' : ''}
      `;
    }
    
    wrapper.appendChild(footer);
  }
  
  return wrapper;
}
