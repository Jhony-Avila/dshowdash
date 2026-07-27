// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils/config-exporter-wrapper
// PURPOSE: Wrapper de compatibilidade para config-exporter modularizado
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM: ./config-exporter/index.js
// EXPORTS: default, VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES,
//          exportConfig, exportToFile, exportToClipboard, importConfig,
//          importFromFile, importFromClipboard, getLastExport, getLastImport,
//          configure, getConfig, subscribe, getMetrics, healthCheck, info
// DEPRECATION: Importar de './config-exporter/index.js'
// ═══════════════════════════════════════════════════════════════
/**
 * @module ConfigExporterWrapper
 * @description Compatibilidade retroativa para config-exporter
 * @version 1.1.0-AAA
 * @since 2025-02-02
 * @deprecated Use './config-exporter/index.js' diretamente
 */
'use strict';

export { default } from './config-exporter/index.js';
export {
    VERSION,
    MODULE_ID,
    EXPORT_FORMATS,
    EXPORT_SCOPES,
    exportConfig,
    exportToFile,
    exportToClipboard,
    importConfig,
    importFromFile,
    importFromClipboard,
    getLastExport,
    getLastImport,
    configure,
    getConfig,
    subscribe,
    getMetrics,
    healthCheck,
    info
} from './config-exporter/index.js';
