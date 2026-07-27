// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mode/blocking
// PURPOSE: Overlay e bloqueio de regiões durante manutenção
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAINTENANCE_TYPES from ./constants.js
//   state, config from ./state.js
//   getDefaultMessage from ./banner.js
// EXPORTS:
//   applyBlockingOverlay — Aplica overlay fullscreen
//   removeBlockingOverlay — Remove overlay
//   blockRegion — Bloqueia região específica
//   unblockRegion — Desbloqueia região
// BROWSER APIs: document.createElement, document.body, document.getElementById
// ═══════════════════════════════════════════════════════════════
/**
 * @module MaintenanceModeBlocking
 * @description Bloqueio de UI durante manutenção
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { MAINTENANCE_TYPES } from './constants.js';
import { state, config } from './state.js';
import { getDefaultMessage } from './banner.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.maintenance-mode.blocking';

export function applyBlockingOverlay() {
    if (!config.blockInteraction) return;
    if (state.type !== MAINTENANCE_TYPES.FULL) return;
    if (typeof document === 'undefined') return;
    
    const overlay = document.createElement('div');
    overlay.id = 'shell-maintenance-overlay';
    overlay.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'right: 0',
        'bottom: 0',
        'background: rgba(0,0,0,0.5)',
        'z-index: 99998',
        'display: flex',
        'align-items: center',
        'justify-content: center'
    ].join(';');
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 32px; border-radius: 8px; text-align: center; max-width: 400px';
    content.innerHTML = `<h2 style="margin: 0 0 16px">🔧 Manutencao</h2><p>${state.message || getDefaultMessage()}</p>`;
    overlay.appendChild(content);
    
    document.body.appendChild(overlay);
}

export function removeBlockingOverlay() {
    const overlay = document.getElementById('shell-maintenance-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

export function blockRegion(regionName: string) {
    if (typeof document === 'undefined') return;
    
    const regionId = `shell-${regionName}-region`;
    const region = document.getElementById(regionId);
    if (!region) return;
    
    region.setAttribute('data-maintenance', 'true');
    region.style.pointerEvents = 'none';
    region.style.opacity = '0.5';
}

export function unblockRegion(regionName: string) {
    if (typeof document === 'undefined') return;
    
    const regionId = `shell-${regionName}-region`;
    const region = document.getElementById(regionId);
    if (!region) return;
    
    region.removeAttribute('data-maintenance');
    region.style.pointerEvents = '';
    region.style.opacity = '';
}
