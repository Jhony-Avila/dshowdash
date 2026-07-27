// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: offline-manager/ui/banner
// PURPOSE: UI de banner para status de conexão
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, getBannerElement, setBannerElement from ../state.js
// EXPORTS:
//   removeBanner — Remove banner atual
//   showBanner — Exibe banner de status
// BROWSER APIs: document.createElement, document.body
// ═══════════════════════════════════════════════════════════════
/**
 * @module OfflineManagerBanner
 * @description Banner de status de conexão
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config, getBannerElement, setBannerElement } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.offline-manager.ui.banner';

/**
 * Remove banner atual do DOM
 */
export function removeBanner() {
    const bannerElement = getBannerElement();
    if (bannerElement && bannerElement.parentNode) {
        bannerElement.parentNode.removeChild(bannerElement);
        // @ts-expect-error strict migration — TS2345
        setBannerElement(null);
    }
}

/**
 * Exibe banner de status de conexão
 * @param {string} message - Mensagem
 * @param {string} type - Tipo (offline|slow|online)
 */
export function showBanner(message: string, type: DynObj) {
    if (!config.showBanner) return;
    if (typeof document === 'undefined') return;
    
    removeBanner();
    
    const banner = document.createElement('div');
    banner.id = 'shell-offline-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    
    const bgColor = type === 'offline' ? '#dc3545' : (type === 'slow' ? '#fd7e14' : '#28a745');
    
    banner.style.cssText = [
        'position: fixed',
        config.bannerPosition === 'top' ? 'top: 0' : 'bottom: 0',
        'left: 0',
        'right: 0',
        'padding: 10px 16px',
        `background: ${bgColor}`,
        'color: white',
        'font-size: 14px',
        'text-align: center',
        'z-index: 99998',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'gap: 8px'
    ].join(';');
    
    const icon = type === 'offline' ? '📡' : (type === 'slow' ? '🐢' : '✅');
    banner.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    if (type !== 'offline') {
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 12px;';
        closeBtn.onclick = removeBanner;
        banner.appendChild(closeBtn);
        
        setTimeout(removeBanner, 5000);
    }
    
    document.body.appendChild(banner);
    setBannerElement(banner);
}
