// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: animation-api/control
// PURPOSE: Controle de animações (pause, resume, cancel)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   activeAnimations from ./state.js
// EXPORTS:
//   cancel — Cancela animação por ID
//   cancelAll — Cancela todas as animações
//   pause — Pausa animação por ID
//   resume — Retoma animação por ID
//   pauseAll — Pausa todas
//   resumeAll — Retoma todas
//   getActive — Lista animações ativas
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnimationAPIControl
 * @description Controle de animações ativas
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { activeAnimations } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.animation-api.control';

export function cancel(id: DynObj) {
    const entry = activeAnimations.get(id);
    if (!entry) return false;
    
    entry.animation.cancel();
    activeAnimations.delete(id);
    return true;
}

export function cancelAll() {
    let count = 0;
    activeAnimations.forEach(entry => {
        entry.animation.cancel();
        count++;
    });
    activeAnimations.clear();
    return count;
}

export function pause(id: DynObj) {
    const entry = activeAnimations.get(id);
    if (!entry) return false;
    
    entry.animation.pause();
    return true;
}

export function resume(id: DynObj) {
    const entry = activeAnimations.get(id);
    if (!entry) return false;
    
    entry.animation.play();
    return true;
}

export function pauseAll() {
    activeAnimations.forEach(entry => {
        entry.animation.pause();
    });
}

export function resumeAll() {
    activeAnimations.forEach(entry => {
        entry.animation.play();
    });
}

export function getActive() {
    const result: DynObj[] = [];
    activeAnimations.forEach(entry => {
        result.push({
            id: entry.id,
            name: entry.name,
            startedAt: entry.startedAt,
            playState: entry.animation.playState
        });
    });
    return result;
}
