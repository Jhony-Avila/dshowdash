import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-data-analysis";
async function initDataAnalysis(ctx, result) {
  const features = CONFIG.features || {};
  if (features.highlightingRules !== false) {
    const highlightModule = await loadFeature("highlightingRules", FeatureModules.highlightingRules);
    if (highlightModule && highlightModule.HighlightingRulesManager) {
      const HighlightingRulesManager = highlightModule.HighlightingRulesManager;
      result.highlightingRules = initFeature("highlightingRules.init", () => new HighlightingRulesManager(), { fallback: null });
    }
  }
  if (features.dataComparison !== false) {
    const comparisonModule = await loadFeature("dataComparison", FeatureModules.dataComparison);
    if (comparisonModule && comparisonModule.DataComparisonManager) {
      const DataComparisonManager = comparisonModule.DataComparisonManager;
      result.dataComparison = initFeature("dataComparison.init", () => new DataComparisonManager(), { fallback: null });
    }
  }
  if (features.dataTrends !== false) {
    const trendsModule = await loadFeature("dataTrends", FeatureModules.dataTrends);
    if (trendsModule && trendsModule.DataTrendsManager) {
      const DataTrendsManager = trendsModule.DataTrendsManager;
      result.dataTrends = initFeature("dataTrends.init", () => new DataTrendsManager(), { fallback: null });
    }
  }
  if (features.anomalyDetection !== false) {
    const anomalyModule = await loadFeature("anomalyDetection", FeatureModules.anomalyDetection);
    if (anomalyModule && anomalyModule.AnomalyDetectionManager) {
      const AnomalyDetectionManager = anomalyModule.AnomalyDetectionManager;
      result.anomalyDetection = initFeature("anomalyDetection.init", () => new AnomalyDetectionManager(), { fallback: null });
    }
  }
  if (features.summaryRow !== false) {
    const summaryModule = await loadFeature("summaryRow", FeatureModules.summaryRow);
    if (summaryModule && summaryModule.SummaryRowManager) {
      const SummaryRowManager = summaryModule.SummaryRowManager;
      result.summaryRow = initFeature("summaryRow.init", () => new SummaryRowManager(), { fallback: null });
    }
  }
  if (features.skeletonCustom !== false) {
    const skeletonModule = await loadFeature("skeletonCustom", FeatureModules.skeletonCustom);
    if (skeletonModule && skeletonModule.SkeletonCustomManager) {
      const SkeletonCustomManager = skeletonModule.SkeletonCustomManager;
      result.skeletonCustom = initFeature("skeletonCustom.init", () => new SkeletonCustomManager(), { fallback: null });
    }
  }
  if (features.infiniteScroll !== false) {
    const infiniteModule = await loadFeature("infiniteScroll", FeatureModules.infiniteScroll);
    if (infiniteModule && infiniteModule.InfiniteScrollManager) {
      const InfiniteScrollManager = infiniteModule.InfiniteScrollManager;
      result.infiniteScroll = initFeature("infiniteScroll.init", () => new InfiniteScrollManager({ onLoadMore: ctx.loadMoreData }), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_data_analysis_default = { initDataAnalysis, info };
export {
  MODULE_ID,
  VERSION,
  init_data_analysis_default as default,
  info,
  initDataAnalysis
};
