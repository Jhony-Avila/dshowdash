// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/utils
// PURPOSE: Utilitários para Animation API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   animationKeyframes from ./keyframes.js
//   config, customAnimations, subscribers from ./state.js
// EXPORTS:
//   shouldAnimate — Verifica se deve animar (reduced motion)
//   notifySubscribers — Notifica subscribers de eventos
//   getKeyframes — Obtém keyframes por nome
// BROWSER APIs: window.matchMedia
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIUtils
 * @description Utilitários para sistema de animações
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { animationKeyframes } from './keyframes.js';
import { config, customAnimations, subscribers } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.utils';

/**
 * Verifica se deve animar (respeita prefers-reduced-motion)
 * @returns {boolean}
 */
export function shouldAnimate() {
    if (!config.respectReducedMotion) return true;
    
    if (typeof window !== 'undefined' && window.matchMedia) {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    return true;
}

/**
 * Notifica todos os subscribers de um evento
 * @param {Object} event - Evento a notificar
 */
export function notifySubscribers(event: string) {
    for (let i = 0; i < subscribers.length; i++) {
        try {
            subscribers[i](event);
        } catch (e) {
            // Silently ignore subscriber errors
        }
    }
}

/**
 * Obtém keyframes por nome (built-in ou custom)
 * @param {string} name - Nome da animação
 * @returns {Array|null} Keyframes ou null
 */
export function getKeyframes(name: string) {
    if ((animationKeyframes as DynObj)[name]) return (animationKeyframes as DynObj)[name];
    if (customAnimations.has(name)) return customAnimations.get(name).keyframes;
    return null;
}
