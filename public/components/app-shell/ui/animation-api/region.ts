// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/region
// PURPOSE: Transições de animação para regiões do shell
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ANIMATIONS from ./constants.js
//   config from ./state.js
//   animate from ./core.js
// EXPORTS:
//   transitionIn — Transição de entrada em região
//   transitionOut — Transição de saída em região
//   crossfade — Crossfade com callback de update
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIRegion
 * @description Animações de transição para regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { ANIMATIONS } from './constants.js';
import { config } from './state.js';
import { animate } from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.region';

/**
 * Transição de entrada em região
 * @param {string} regionName - Nome da região
 * @param {string} animation - Nome da animação (default: fade-in)
 * @param {Object} options - Opções de animação
 * @returns {Promise} Promise da animação
 */
export function transitionIn(regionName: string, animation: string, options: DynObj) {
    animation = animation || ANIMATIONS.FADE_IN;
    const regionId = `shell-${regionName}-region`;
    return animate(`#${regionId}` as DynObj, animation, options);
}

/**
 * Transição de saída em região
 * @param {string} regionName - Nome da região
 * @param {string} animation - Nome da animação (default: fade-out)
 * @param {Object} options - Opções de animação
 * @returns {Promise} Promise da animação
 */
export function transitionOut(regionName: string, animation: string, options: DynObj) {
    animation = animation || ANIMATIONS.FADE_OUT;
    const regionId = `shell-${regionName}-region`;
    return animate(`#${regionId}` as DynObj, animation, options);
}

/**
 * Crossfade com callback para atualização de conteúdo
 * @param {string} regionName - Nome da região
 * @param {Function} updateFn - Função de atualização
 * @param {Object} options - Opções de animação
 * @returns {Promise} Promise da animação completa
 */
export function crossfade(regionName: string, updateFn: DynObj, options: DynObj) {
    options = options || {};
    const duration = options.duration || config.defaultDuration;
    
    return transitionOut(regionName, ANIMATIONS.FADE_OUT, { duration: duration / 2 })
        .then(() => {
            if (typeof updateFn === 'function') {
                updateFn();
            }
            return transitionIn(regionName, ANIMATIONS.FADE_IN, { duration: duration / 2 });
        });
}
