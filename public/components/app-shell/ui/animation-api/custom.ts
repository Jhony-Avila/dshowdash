// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/custom
// PURPOSE: Gerenciamento de animações customizadas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   animationKeyframes from ./keyframes.js
//   customAnimations from ./state.js
// EXPORTS:
//   registerAnimation — Registra animação custom
//   unregisterAnimation — Remove animação custom
//   listAnimations — Lista todas as animações
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPICustom
 * @description Registro de animações customizadas
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { animationKeyframes } from './keyframes.js';
import { customAnimations } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.custom';

/**
 * Registra uma animação customizada
 * @param {string} name - Nome da animação
 * @param {Array} keyframes - Keyframes da animação
 * @returns {Object} Resultado { ok, error? }
 */
export function registerAnimation(name: string, keyframes: DynObj) {
    if ((animationKeyframes as DynObj)[name]) {
        return { ok: false, error: 'Cannot override built-in animation' };
    }
    
    customAnimations.set(name, { keyframes });
    return { ok: true };
}

/**
 * Remove uma animação customizada
 * @param {string} name - Nome da animação
 * @returns {boolean} Sucesso
 */
export function unregisterAnimation(name: string) {
    return customAnimations.delete(name);
}

/**
 * Lista todas as animações disponíveis
 * @returns {Array} Lista de { name, isBuiltIn }
 */
export function listAnimations() {
    const result = Object.keys(animationKeyframes).map(name => ({
        name,
        isBuiltIn: true
    }));
    
    customAnimations.forEach((cfg, name) => {
        result.push({ name, isBuiltIn: false });
    });
    
    return result;
}
