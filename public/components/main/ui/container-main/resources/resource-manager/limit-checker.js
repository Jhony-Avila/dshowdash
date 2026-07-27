import { RESOURCE_TYPES } from "../../contracts/resource-contract.js";
import { DEFAULT_PANEL_LIMITS } from "./constants.js";
import { RESOURCE_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "2.1.0-EVENT-CONSTANTS";
const MODULE_ID = "main.ui.container-main.resources.resource-manager.limit-checker";
function createLimitChecker(options = {}) {
  const {
    panelRegistry,
    throttleController,
    emitter,
    defaultPanelLimits: limitsOpt = {},
    onPanelLimitExceeded
  } = options;
  const _defaultLimits = { ...DEFAULT_PANEL_LIMITS, ...limitsOpt };
  const _panelLimits = /* @__PURE__ */ new Map();
  return {
    // Obtém limites do painel
    getLimits(panelId) {
      return _panelLimits.get(panelId) || _defaultLimits;
    },
    // Define limites para um painel
    setLimits(panelId, limits) {
      const current = this.getLimits(panelId);
      _panelLimits.set(panelId, { ...current, ...limits });
      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_LIMITS_UPDATED, {
        panelId,
        limits: _panelLimits.get(panelId)
      });
    },
    // Remove limites customizados
    removeLimits(panelId) {
      _panelLimits.delete(panelId);
    },
    // Verifica limites do painel
    check(panelId, resourceType, estimatedMemory = 0) {
      const record = panelRegistry.get(panelId);
      if (!record) return [];
      const limits = this.getLimits(panelId);
      const violations = [];
      if (record.resources.size >= limits.maxResources) {
        violations.push({
          type: "maxResources",
          current: record.resources.size,
          limit: limits.maxResources
        });
      }
      if (record.memoryUsage + estimatedMemory > limits.maxMemory) {
        violations.push({
          type: "maxMemory",
          current: record.memoryUsage,
          limit: limits.maxMemory
        });
      }
      if (resourceType === RESOURCE_TYPES.VIDEO || resourceType === RESOURCE_TYPES.STREAM) {
        const mediaCount = Array.from(record.resources.values()).filter((r) => r.type === RESOURCE_TYPES.VIDEO || r.type === RESOURCE_TYPES.STREAM).length;
        if (mediaCount >= limits.maxMediaResources) {
          violations.push({
            type: "maxMediaResources",
            current: mediaCount,
            limit: limits.maxMediaResources
          });
        }
      }
      if (resourceType === RESOURCE_TYPES.FETCH || resourceType === RESOURCE_TYPES.STREAM) {
        const networkCount = Array.from(record.resources.values()).filter((r) => r.type === RESOURCE_TYPES.FETCH || r.type === RESOURCE_TYPES.STREAM).length;
        if (networkCount >= limits.maxNetworkResources) {
          violations.push({
            type: "maxNetworkResources",
            current: networkCount,
            limit: limits.maxNetworkResources
          });
        }
      }
      if (violations.length > 0) {
        onPanelLimitExceeded?.(panelId, violations);
        emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_LIMIT_EXCEEDED, { panelId, violations });
        if (limits.throttleOnWarning && throttleController) {
          throttleController.throttle(panelId);
        }
      }
      return violations;
    },
    // Obtém uso de recursos de um painel
    getUsage(panelId) {
      const record = panelRegistry.get(panelId);
      if (!record) return null;
      const limits = this.getLimits(panelId);
      return {
        panelId,
        resources: record.resources.size,
        memoryUsage: record.memoryUsage,
        throttled: throttleController?.isThrottled(panelId) || false,
        limits,
        usage: {
          resourcesPercent: Math.round(record.resources.size / limits.maxResources * 100),
          memoryPercent: Math.round(record.memoryUsage / limits.maxMemory * 100)
        }
      };
    },
    // Limpa
    clear() {
      _panelLimits.clear();
    }
  };
}
var limit_checker_default = { createLimitChecker };
export {
  MODULE_ID,
  VERSION,
  createLimitChecker,
  limit_checker_default as default
};
