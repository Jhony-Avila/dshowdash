// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-EXPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-exporter/collectors
// PURPOSE: Coletores de configuração do App Shell
// ───────────────────────────────────────────────────────────────
// IMPORTS: none (usa (window as any).AppShell)
// EXPORTS:
//   collectLayoutConfig — Coleta configuração de layout
//   collectThemeConfig — Coleta configuração de tema
//   collectPreferencesConfig — Coleta preferências
//   collectDebugConfig — Coleta configuração de debug
//   collectAllConfig — Coleta todas as configurações
//   collectConfigByScope — Coleta configuração por escopo
// ═══════════════════════════════════════════════════════════════
/**
 * @module ConfigExporterCollectors
 * @description Coletores de configuração
 * @version 1.2.0-EXPORT-FIX
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.config-exporter.collectors';

function _getShell() {
    return (typeof window !== 'undefined' && (window as any).AppShell) ? (window as any).AppShell : null;
}

export function collectLayoutConfig() {
    const shell = _getShell();
    if (!shell) return {};

    const data: Record<string, any> = {};

    if (shell.layoutPrefs && shell.layoutPrefs.get) {
        data.layoutPrefs = shell.layoutPrefs.get();
    }
    if (shell.layoutPresets && shell.layoutPresets.getCurrent) {
        data.layoutPreset = shell.layoutPresets.getCurrent();
    }
    if (shell.visibility && shell.visibility.getState) {
        data.visibility = shell.visibility.getState();
    }
    if (shell.resize && shell.resize.getSizes) {
        data.regionSizes = shell.resize.getSizes();
    }

    return data;
}

export function collectThemeConfig() {
    const shell = _getShell();
    if (!shell || !shell.theme) return {};

    const data: Record<string, any> = {};

    if (shell.theme.getTheme) {
        data.theme = shell.theme.getTheme();
    }
    if (shell.theme.getRegionThemes) {
        data.regionThemes = shell.theme.getRegionThemes();
    }
    if (shell.theme.getThemeVariables) {
        data.customVariables = shell.theme.getThemeVariables();
    }

    return data;
}

export function collectPreferencesConfig() {
    const shell = _getShell();
    if (!shell) return {};

    const data: Record<string, any> = {};

    if (shell.a11y && shell.a11y.getActivePresets) {
        data.a11yPresets = shell.a11y.getActivePresets();
        if (shell.a11y.getAllSettings) {
            data.a11ySettings = shell.a11y.getAllSettings();
        }
    }
    if (shell.animations && shell.animations.getConfig) {
        data.animationConfig = shell.animations.getConfig();
    }
    if (shell.shortcuts && shell.shortcuts.getConfig) {
        data.shortcutsConfig = shell.shortcuts.getConfig();
    }
    if (shell.notify && shell.notify.getConfig) {
        data.notifyConfig = shell.notify.getConfig();
    }

    return data;
}

export function collectDebugConfig() {
    const shell = _getShell();
    if (!shell) return {};

    const data: Record<string, any> = {};

    if (shell.logger && shell.logger.getConfig) {
        data.loggerConfig = shell.logger.getConfig();
    }
    if (shell.debugPresets && shell.debugPresets.getCurrent) {
        data.debugPreset = shell.debugPresets.getCurrent();
        data.debugConfig = shell.debugPresets.getCurrentConfig();
    }
    if (shell.autoHealthCheck && shell.autoHealthCheck.getConfig) {
        data.healthCheckConfig = shell.autoHealthCheck.getConfig();
    }

    return data;
}

export function collectAllConfig() {
    return {
        layout: collectLayoutConfig(),
        theme: collectThemeConfig(),
        preferences: collectPreferencesConfig(),
        debug: collectDebugConfig()
    };
}

// Dispatcher: collectConfigByScope routes to the appropriate collector by scope name
export function collectConfigByScope(scope: DynObj) {
    switch (scope) {
        case 'layout': return collectLayoutConfig();
        case 'theme': return collectThemeConfig();
        case 'preferences': return collectPreferencesConfig();
        case 'debug': return collectDebugConfig();
        case 'all': return collectAllConfig();
        default: return {};
    }
}
