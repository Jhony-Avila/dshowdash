// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/state
// PURPOSE: Estado compartilhado para sistema de redimensionamento
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESIZE_CONFIGS from ./constants.js
// EXPORTS:
//   sizes — Mapa de tamanhos por região
//   resizing — Flag de região em resize
//   listeners — Array de listeners
//   initialized — Flag de inicialização
//   metrics — Métricas de uso
//   dragState — Estado de drag
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeState
 * @description Estado centralizado para resize de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { RESIZE_CONFIGS } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.region-resize.state';

export const sizes = {};
export const resizing = { value: null as DynObj };
export const listeners: DynObj[] = [];
export const initialized = { value: false };

export const metrics = {
    resizes: 0,
    dragResizes: 0,
    errors: 0
};

export const dragState = {
    active: false,
    region: null as DynObj,
    startPos: 0,
    startSize: 0,
    config: null as DynObj
};

// Inicializa tamanhos a partir da configuração
const configKeys = Object.keys(RESIZE_CONFIGS);
for (let i = 0; i < configKeys.length; i++) {
    (sizes as DynObj)[configKeys[i]] = (RESIZE_CONFIGS as DynObj)[configKeys[i]].default;
}
