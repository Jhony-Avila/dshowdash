// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/styles
// PURPOSE: Injeção de CSS para skeleton loaders
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
// EXPORTS:
//   injectStyles — Injeta CSS de skeleton
//   removeStyles — Remove CSS de skeleton
// BROWSER APIs: document.createElement, document.head
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderStyles
 * @description CSS para skeleton loading
 * @version 1.0.0-AAA-ES6
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.styles';

/**
 * Injeta estilos CSS de skeleton
 */
export function injectStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('skeleton-loader-styles')) return;
    
    const css = `\n.skeleton-loader {\n  position: relative;\n  overflow: hidden;\n  background: var(--skeleton-base-color, ${config.baseColor});\n  border-radius: var(--skeleton-radius, ${config.borderRadius});\n}\n.skeleton-loader.skeleton-pulse {\n  animation: skeleton-pulse ${config.animationDuration}ms ease-in-out infinite;\n}\n.skeleton-loader.skeleton-wave::after {\n  content: "";\n  position: absolute;\n  top: 0; left: 0; right: 0; bottom: 0;\n  background: linear-gradient(90deg, transparent, var(--skeleton-highlight-color, ${config.highlightColor}), transparent);\n  animation: skeleton-wave ${config.animationDuration}ms ease-in-out infinite;\n}\n@keyframes skeleton-pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.5; }\n}\n@keyframes skeleton-wave {\n  0% { transform: translateX(-100%); }\n  100% { transform: translateX(100%); }\n}\n.skeleton-container { display: flex; flex-direction: column; }\n.skeleton-row { display: flex; flex-direction: row; align-items: center; }\n.skeleton-grid { display: grid; }\n.skeleton-circle { border-radius: 50%; }\n`;
    
    const style = document.createElement('style');
    style.id = 'skeleton-loader-styles';
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Remove estilos de skeleton
 */
export function removeStyles() {
    const existing = document.getElementById('skeleton-loader-styles');
    if (existing) existing.remove();
}
