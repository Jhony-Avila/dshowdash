// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/elements
// PURPOSE: Criação de elementos DOM para skeleton loading
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config from ./state.js
// EXPORTS:
//   createSkeletonElement — Cria elemento skeleton com configuração
// BROWSER APIs: document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderElements
 * @description Factory de elementos skeleton
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.elements';

/**
 * Cria um elemento skeleton com configuração
 * @param {Object} cfg - Configuração do elemento
 * @returns {HTMLElement} Elemento skeleton
 */
export function createSkeletonElement(cfg: DynObj) {
    const el = document.createElement('div');
    el.className = `skeleton-loader skeleton-${config.animationType}`;
    
    if (cfg.width) el.style.width = cfg.width;
    if (cfg.height) el.style.height = cfg.height;
    if (cfg.marginTop) el.style.marginTop = cfg.marginTop;
    if (cfg.marginBottom) el.style.marginBottom = cfg.marginBottom;
    if (cfg.radius) el.style.borderRadius = cfg.radius;
    if (cfg.flex) el.style.flex = cfg.flex;
    
    if (cfg.type === 'circle') {
        el.classList.add('skeleton-circle');
        el.style.width = cfg.size || '40px';
        el.style.height = cfg.size || '40px';
    }
    
    return el;
}
