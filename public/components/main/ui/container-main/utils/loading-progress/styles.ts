// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Loading Progress - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   injectStyles() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.loading-progress.styles';

export function injectStyles(config: Record<string, unknown>) {
  if (document.getElementById('loading-progress-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'loading-progress-styles';
  styles.textContent = `
    .dsd-loading-progress {
      position: fixed;
      left: 0;
      right: 0;
      height: ${config.height}px;
      z-index: ${config.zIndex};
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .dsd-loading-progress--top {
      top: 0;
    }
    
    .dsd-loading-progress--bottom {
      bottom: 0;
    }
    
    .dsd-loading-progress--visible {
      opacity: 1;
    }
    
    .dsd-loading-progress__bar {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: ${config.color};
      box-shadow: 0 0 10px ${config.color}, 0 0 5px ${config.color};
      transition: width 0.2s ease-out;
      border-radius: 0 2px 2px 0;
    }
    
    .dsd-loading-progress__bar::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      width: 100px;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3));
      animation: loadingShimmer 1s ease-in-out infinite;
    }
    
    @keyframes loadingShimmer {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    .dsd-loading-progress__spinner {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 20px;
      height: 20px;
      z-index: ${(config.zIndex as number) + 1};
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }
    
    .dsd-loading-progress__spinner--visible {
      opacity: 1;
    }
    
    .dsd-loading-progress__spinner svg {
      animation: loadingSpin 0.8s linear infinite;
    }
    
    @keyframes loadingSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .dsd-loading-progress--completing .dsd-loading-progress__bar {
      transition: width 0.4s ease-out;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .dsd-loading-progress__bar::after,
      .dsd-loading-progress__spinner svg {
        animation: none;
      }
    }
  `;
  
  document.head.appendChild(styles);
}
