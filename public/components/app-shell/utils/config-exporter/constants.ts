// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-exporter/constants
// PURPOSE: Constantes e utilitários para exportação de config
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   VERSION, MODULE_ID — Identificadores
//   EXPORT_FORMATS — Enum de formatos (frozen)
//   EXPORT_SCOPES — Enum de escopos (frozen)
//   base64Encode, base64Decode — Helpers de encoding
//   generateChecksum — Gera hash de dados
// BROWSER APIs: btoa, atob
// ═══════════════════════════════════════════════════════════════
/**
 * @module ConfigExporterConstants
 * @description Constantes e helpers para exportação de config
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-AAA';
export const MODULE_ID = 'app-shell-config-exporter';

export const EXPORT_FORMATS = Object.freeze({
    JSON: 'json',
    BASE64: 'base64',
    URL: 'url'
});

export const EXPORT_SCOPES = Object.freeze({
    ALL: 'all',
    LAYOUT: 'layout',
    THEME: 'theme',
    PREFERENCES: 'preferences',
    DEBUG: 'debug',
    CUSTOM: 'custom'
});

/**
 * Encode string para Base64 (UTF-8 safe)
 * @param {string} str - String a encodar
 * @returns {string}
 */
export function base64Encode(str: DynObj) {
    try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
    } catch (e) {
        return btoa(str);
    }
}

/**
 * Decode string de Base64 (UTF-8 safe)
 * @param {string} str - String encodada
 * @returns {string}
 */
export function base64Decode(str: DynObj) {
    try {
        return decodeURIComponent(atob(str).split('').map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
    } catch (e) {
        return atob(str);
    }
}

/**
 * Gera checksum simples de dados
 * @param {*} data - Dados para hash
 * @returns {string} Hash hex
 */
export function generateChecksum(data: DynObj) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
