import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.1-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-utils";
async function initUtils(ctx, result) {
  const features = CONFIG.features || {};
  const toastModule = await loadFeature("toast", FeatureModules.toast);
  if (features.importExport) {
    const importM = await loadFeature("importManager", FeatureModules.importManager);
    if (importM && toastModule) {
      result.importManager = initFeature("importManager.init", () => {
        const importMod = importM;
        const importDef = importMod.default;
        const parseFile = importMod.parseFile || importDef?.parseFile;
        const validateFile = importMod.validateFile || importDef?.validateFile;
        const applyColumnMapping = importMod.applyColumnMapping || importDef?.applyColumnMapping;
        return {
          parseFile: parseFile || null,
          validateFile: validateFile || null,
          applyColumnMapping: applyColumnMapping || null,
          async importFile(file, options = {}) {
            if (!parseFile) return null;
            try {
              if (validateFile) {
                const validation = validateFile(file);
                if (!validation.valid) {
                  const toast = toastModule;
                  if (toast.error) toast.error(`Arquivo invalido: ${validation.reason || "formato nao suportado"}`);
                  return null;
                }
              }
              const data = await parseFile(file, options);
              if (options.onProgress) options.onProgress(100);
              const toast2 = toastModule;
              if (toast2.success) toast2.success(`Importado: ${data.length} registros`);
              if (ctx.loadAllData) ctx.loadAllData();
              return data;
            } catch (err) {
              const toast3 = toastModule;
              if (toast3.error) toast3.error(`Erro na importacao: ${err.message}`);
              return null;
            }
          }
        };
      }, { fallback: null });
    }
    const exportM = await loadFeature("exportUtils", FeatureModules.exportUtils);
    if (exportM) result.exportUtils = exportM;
  }
  if (features.exportXlsx !== false) {
    const xlsxModule = await loadFeature("exportXlsx", FeatureModules.exportXlsx);
    if (xlsxModule && xlsxModule.ExcelExporter) {
      const ExcelExporter = xlsxModule.ExcelExporter;
      result.excelExporter = initFeature("excelExporter.init", () => new ExcelExporter({ filename: "requisicoes", sheetName: "Requisi\xE7\xF5es" }), { fallback: null });
    }
  }
  if (features.exportPDF) {
    const m = await loadFeature("pdfExporter", FeatureModules.pdfExporter);
    if (m) {
      const PDFExporter = m.PDFExporter;
      result.pdfExporter = initFeature("pdfExporter.init", () => new PDFExporter({ title: "Relatorio de Requisicoes", company: "DShow Dash" }), { fallback: null });
    }
  }
  if (features.duplicate) {
    const m = await loadFeature("duplicate", FeatureModules.duplicate);
    if (m && toastModule) {
      const DuplicateManager = m.DuplicateManager;
      const toastDup = toastModule;
      result.duplicateManager = initFeature("duplicate.init", () => new DuplicateManager({
        onDuplicate() {
          if (toastDup.success) toastDup.success("Requisicao duplicada!");
          if (ctx.loadAllData) ctx.loadAllData();
        }
      }), { fallback: null });
    }
  }
  if (features.hapticFeedback) {
    const m = await loadFeature("haptic", FeatureModules.haptic);
    if (m && m.getHapticManager) {
      const getHapticManager = m.getHapticManager;
      result.haptic = initFeature("haptic.init", () => getHapticManager(), { fallback: null });
    }
  }
  if (features.urlState) {
    const m = await loadFeature("urlState", FeatureModules.urlState);
    if (m) result.urlState = m;
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_utils_default = { initUtils, info };
export {
  MODULE_ID,
  VERSION,
  init_utils_default as default,
  info,
  initUtils
};
