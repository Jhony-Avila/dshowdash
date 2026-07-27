// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-utils
// PURPOSE: Panel-01 - Utils Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   initUtils() — exported async function
//   info() — exported function
//
// @changelog v9.3.1-P2-ENTERPRISE: FIX importManager.init — ImportManager class removed,
//            use functional wrapper with parseFile/validateFile/applyColumnMapping exports
// @changelog v9.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from '../core/config.js';
import { initFeature, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.1-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-utils';

export async function initUtils(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature('toast', FeatureModules.toast);


  if (features.importExport) {
    const importM = await loadFeature('importManager', FeatureModules.importManager);
    if (importM && toastModule) {
      // v9.3.1: ImportManager class was refactored to functional exports.
      // Create a wrapper object that provides the same interface using available functions.
      result.importManager = initFeature('importManager.init', () => {
        const importMod = importM as Record<string, unknown>;
        const importDef = (importMod.default as Record<string, unknown> | undefined);
        const parseFile = importMod.parseFile || importDef?.parseFile;
        const validateFile = importMod.validateFile || importDef?.validateFile;
        const applyColumnMapping = importMod.applyColumnMapping || importDef?.applyColumnMapping;

        return {
          parseFile: parseFile || null,
          validateFile: validateFile || null,
          applyColumnMapping: applyColumnMapping || null,
          async importFile(file: File, options: Record<string, unknown> = {}) {
            if (!parseFile) return null;
            try {
              if (validateFile) {
                const validation = (validateFile as (f: File) => Record<string, unknown>)(file);
                if (!(validation as Record<string, unknown>).valid) {
                  const toast = toastModule as Record<string, ((msg: string) => void) | undefined>;
                if (toast.error) toast.error(`Arquivo invalido: ${(validation as Record<string, unknown>).reason || 'formato nao suportado'}`);
                  return null;
                }
              }
              const data = await (parseFile as (f: File, o: Record<string, unknown>) => Promise<unknown[]>)(file, options);
              if (options.onProgress) (options.onProgress as (n: number) => void)(100);
              const toast2 = toastModule as Record<string, ((msg: string) => void) | undefined>;
              if (toast2.success) toast2.success(`Importado: ${data.length} registros`);
              if (ctx.loadAllData) (ctx.loadAllData as () => void)();
              return data;
            } catch (err) {
              const toast3 = toastModule as Record<string, ((msg: string) => void) | undefined>;
              if (toast3.error) toast3.error(`Erro na importacao: ${(err as Error).message}`);
              return null;
            }
          }
        };
      }, { fallback: null });
    }

    const exportM = await loadFeature('exportUtils', FeatureModules.exportUtils);
    if (exportM) result.exportUtils = exportM;
  }

  // Export XLSX

  // @ts-expect-error TS migration - TS2339
  if (features.exportXlsx !== false) {
    const xlsxModule = await loadFeature('exportXlsx', FeatureModules.exportXlsx);
    if (xlsxModule && (xlsxModule as Record<string, unknown>).ExcelExporter) {
      const ExcelExporter = (xlsxModule as Record<string, new (...args: unknown[]) => unknown>).ExcelExporter;
      result.excelExporter = initFeature('excelExporter.init', () => new ExcelExporter({ filename: 'requisicoes', sheetName: 'Requisições' }), { fallback: null });
    }
  }

  // Export PDF

  if (features.exportPDF) {
    const m = await loadFeature('pdfExporter', FeatureModules.pdfExporter);
    if (m) {
      const PDFExporter = (m as Record<string, new (...args: unknown[]) => unknown>).PDFExporter;
      result.pdfExporter = initFeature('pdfExporter.init', () => new PDFExporter({ title: 'Relatorio de Requisicoes', company: 'DShow Dash' }), { fallback: null });
    }
  }

  // Duplicate

  if (features.duplicate) {
    const m = await loadFeature('duplicate', FeatureModules.duplicate);
    if (m && toastModule) {
      const DuplicateManager = (m as Record<string, new (...args: unknown[]) => unknown>).DuplicateManager;
      const toastDup = toastModule as Record<string, ((msg: string) => void) | undefined>;
      result.duplicateManager = initFeature('duplicate.init', () => new DuplicateManager({
        onDuplicate() {
          if (toastDup.success) toastDup.success('Requisicao duplicada!');
          if (ctx.loadAllData) (ctx.loadAllData as () => void)();
        }
      }), { fallback: null });
    }
  }

  // Haptic Feedback

  if (features.hapticFeedback) {
    const m = await loadFeature('haptic', FeatureModules.haptic);
    if (m && (m as Record<string, unknown>).getHapticManager) {
      const getHapticManager = (m as Record<string, () => unknown>).getHapticManager;
      (result as Record<string, unknown>).haptic = initFeature('haptic.init', () => getHapticManager(), { fallback: null });
    }
  }

  // URL State

  if (features.urlState) {
    const m = await loadFeature('urlState', FeatureModules.urlState);
    if (m) result.urlState = m;
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initUtils, info };
