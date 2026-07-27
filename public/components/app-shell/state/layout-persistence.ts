// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: state/layout-persistence-wrapper
// PURPOSE: Wrapper de compatibilidade para layout-persistence modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./layout-persistence/index.js
// EXPORTS: default, VERSION, MODULE_ID, load, save, get, getPreference,
//          setPreference, setPreferences, reset, clear, subscribe,
//          isSidebarCollapsed, setSidebarCollapsed, toggleSidebar,
//          getSidebarWidth, setSidebarWidth, getLayoutMode, setLayoutMode,
//          isFullscreen, getThemeMode, setThemeMode, getMetrics,
//          healthCheck, info
// DEPRECATION: Importar de './layout-persistence/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module LayoutPersistenceWrapper
 * @description Compatibilidade retroativa para layout-persistence
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './layout-persistence/index.js' diretamente
 */
'use strict';

export { default } from './layout-persistence/index.js';
export {
    VERSION,
    MODULE_ID,
    load,
    save,
    get,
    getPreference,
    setPreference,
    setPreferences,
    reset,
    clear,
    subscribe,
    isSidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    getSidebarWidth,
    setSidebarWidth,
    getLayoutMode,
    setLayoutMode,
    isFullscreen,
    getThemeMode,
    setThemeMode,
    getMetrics,
    healthCheck,
    info
} from './layout-persistence/index.js';
