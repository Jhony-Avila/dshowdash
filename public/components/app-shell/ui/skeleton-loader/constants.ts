// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: skeleton-loader/constants
// PURPOSE: Constantes e enums para Skeleton Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION — Versão do módulo
//   MODULE_ID — Identificador único
//   TEMPLATES — Enum de templates disponíveis (frozen)
// ═══════════════════════════════════════════════════════════════
/**
 * @module SkeletonLoaderConstants
 * @description Constantes para skeleton loading UI
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell-skeleton-loader';

export const TEMPLATES = Object.freeze({
    TEXT: 'text',
    PARAGRAPH: 'paragraph',
    AVATAR: 'avatar',
    THUMBNAIL: 'thumbnail',
    CARD: 'card',
    LIST: 'list',
    TABLE: 'table',
    FORM: 'form',
    DASHBOARD: 'dashboard',
    ARTICLE: 'article'
});
