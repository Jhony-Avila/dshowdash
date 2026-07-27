// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-data-analysis
// PURPOSE: Panel-01 - Data Analysis Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   initFeature, loadFeature from ./feature-loader.js
//   FeatureModules from ./feature-registry.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONFIG } from '../core/config.js';
import { initFeature, loadFeature } from './feature-loader.js';
import { FeatureModules } from './feature-registry.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:init:init-data-analysis';

export async function initDataAnalysis(ctx: Record<string, unknown>, result: Record<string, unknown>) {
  const features: Record<string, unknown> = CONFIG.features || {};

  // Highlighting Rules
  if (features.highlightingRules !== false) {
    const highlightModule = await loadFeature('highlightingRules', FeatureModules.highlightingRules);
    if (highlightModule && (highlightModule as Record<string, unknown>).HighlightingRulesManager) {
      const HighlightingRulesManager = (highlightModule as Record<string, new () => unknown>).HighlightingRulesManager;
      result.highlightingRules = initFeature('highlightingRules.init', () => new HighlightingRulesManager(), { fallback: null });
    }
  }

  // Data Comparison
  if (features.dataComparison !== false) {
    const comparisonModule = await loadFeature('dataComparison', FeatureModules.dataComparison);
    if (comparisonModule && (comparisonModule as Record<string, unknown>).DataComparisonManager) {
      const DataComparisonManager = (comparisonModule as Record<string, new () => unknown>).DataComparisonManager;
      result.dataComparison = initFeature('dataComparison.init', () => new DataComparisonManager(), { fallback: null });
    }
  }

  // Data Trends
  if (features.dataTrends !== false) {
    const trendsModule = await loadFeature('dataTrends', FeatureModules.dataTrends);
    if (trendsModule && (trendsModule as Record<string, unknown>).DataTrendsManager) {
      const DataTrendsManager = (trendsModule as Record<string, new () => unknown>).DataTrendsManager;
      result.dataTrends = initFeature('dataTrends.init', () => new DataTrendsManager(), { fallback: null });
    }
  }

  // Anomaly Detection
  if (features.anomalyDetection !== false) {
    const anomalyModule = await loadFeature('anomalyDetection', FeatureModules.anomalyDetection);
    if (anomalyModule && (anomalyModule as Record<string, unknown>).AnomalyDetectionManager) {
      const AnomalyDetectionManager = (anomalyModule as Record<string, new () => unknown>).AnomalyDetectionManager;
      result.anomalyDetection = initFeature('anomalyDetection.init', () => new AnomalyDetectionManager(), { fallback: null });
    }
  }

  // Summary Row
  if (features.summaryRow !== false) {
    const summaryModule = await loadFeature('summaryRow', FeatureModules.summaryRow);
    if (summaryModule && (summaryModule as Record<string, unknown>).SummaryRowManager) {
      const SummaryRowManager = (summaryModule as Record<string, new () => unknown>).SummaryRowManager;
      result.summaryRow = initFeature('summaryRow.init', () => new SummaryRowManager(), { fallback: null });
    }
  }

  // Skeleton Custom
  if (features.skeletonCustom !== false) {
    const skeletonModule = await loadFeature('skeletonCustom', FeatureModules.skeletonCustom);
    if (skeletonModule && (skeletonModule as Record<string, unknown>).SkeletonCustomManager) {
      const SkeletonCustomManager = (skeletonModule as Record<string, new () => unknown>).SkeletonCustomManager;
      result.skeletonCustom = initFeature('skeletonCustom.init', () => new SkeletonCustomManager(), { fallback: null });
    }
  }

  // Infinite Scroll
  if (features.infiniteScroll !== false) {
    const infiniteModule = await loadFeature('infiniteScroll', FeatureModules.infiniteScroll);
    if (infiniteModule && (infiniteModule as Record<string, unknown>).InfiniteScrollManager) {
      const InfiniteScrollManager = (infiniteModule as Record<string, new (...args: unknown[]) => unknown>).InfiniteScrollManager;
      result.infiniteScroll = initFeature('infiniteScroll.init', () => new InfiniteScrollManager({ onLoadMore: ctx.loadMoreData }), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initDataAnalysis, info };
