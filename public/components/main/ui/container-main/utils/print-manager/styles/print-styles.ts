// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: print-styles
// PURPOSE: Print Manager - Print Styles Generator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PRINT_ORIENTATIONS from ../constants.js
//   getConfig from ../state.js
//   _getPageSizeCSS from ../helpers/utils.js
//
// PROVIDES:
//   _generatePrintStyles() — exported function
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

import { PRINT_ORIENTATIONS } from '../constants.js';
import { getConfig } from '../state.js';
import { _getPageSizeCSS } from '../helpers/utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.print-manager.styles.print-styles';

export function _generatePrintStyles() {
  const config = getConfig();
  const { margins, orientation, pageSize, grayscale, removeBackgrounds, scale } = config;
  const pageSizeCSS = _getPageSizeCSS(pageSize);

  // @ts-expect-error TS migration - TS2367
  const orientationCSS = orientation === PRINT_ORIENTATIONS.LANDSCAPE ? 'landscape' : 'portrait';
  
  let excludeRules = '';
  if (config.excludeSelectors.length > 0) {
    excludeRules = config.excludeSelectors.map(sel => `${sel} { display: none !important; }`).join('\n');
  }
  
  let includeOnlyRules = '';
  if (config.includeOnlySelector) {
    includeOnlyRules = `
      body > *:not(#dsd-print-wrapper):not(style):not(script) { display: none !important; }
      #dsd-print-wrapper { display: block !important; }
    `;
  }
  
  return `
    @media print {
      @page {
        size: ${pageSizeCSS} ${orientationCSS};
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }
      
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      html, body {
        height: auto !important;
        overflow: visible !important;
        background: white !important;
        ${scale !== 1.0 ? `transform: scale(${scale}); transform-origin: top left;` : ''}
      }
      
      ${excludeRules}
      ${includeOnlyRules}
      
      .dsd-print-page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .dsd-print-avoid-break {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .dsd-print-keep-together {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      ${grayscale ? `body { filter: grayscale(100%) !important; }` : ''}
      
      ${removeBackgrounds ? `* { background: transparent !important; background-image: none !important; }` : ''}
      
      a[href]:after { content: none !important; }
      ::-webkit-scrollbar { display: none !important; }
      
      .dsd-print-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 30px;
        display: flex !important;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #666;
        border-bottom: 1px solid #ddd;
        padding: 0 10px;
        background: white;
      }
      
      .dsd-print-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 25px;
        display: flex !important;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        color: #999;
        border-top: 1px solid #ddd;
        padding: 0 10px;
        background: white;
      }
      
      .dsd-print-content {
        padding-top: ${config.showHeader ? '40px' : '0'};
        padding-bottom: ${config.showFooter ? '35px' : '0'};
      }
      
      ${config.optimizeImages ? `
        img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid !important;
        }
      ` : ''}
      
      table { page-break-inside: auto !important; }
      tr { page-break-inside: avoid !important; page-break-after: auto !important; }
      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
    }
    
    @media screen {
      .dsd-print-only { display: none !important; }
    }
  `;
}
