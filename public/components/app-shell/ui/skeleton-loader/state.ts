// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/state
// PURPOSE: Estado compartilhado do Skeleton Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   activeSkeletons — Map de skeletons ativos
//   customTemplates — Map de templates customizados
//   config — Configurações mutáveis
//   metrics — Métricas de uso
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderState
 * @description Estado centralizado para skeleton loading
 * @version 1.0.0-AAA-ES6
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.skeleton-loader.state';

export const activeSkeletons = new Map();
export const customTemplates = new Map();

export const config = {
    animationType: 'pulse',
    animationDuration: 1500,
    baseColor: 'var(--color-skeleton-base, #e0e0e0)',
    highlightColor: 'var(--color-skeleton-highlight, #f0f0f0)',
    borderRadius: '4px'
};

export const metrics = {
    created: 0,
    destroyed: 0,
    activeCount: 0
};
