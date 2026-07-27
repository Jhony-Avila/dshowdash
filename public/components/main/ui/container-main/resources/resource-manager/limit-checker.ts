// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: limit-checker
// PURPOSE: Resource Manager Limit Checker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESOURCE_TYPES from ../../contracts/resource-contract.js
//   DEFAULT_PANEL_LIMITS from ./constants.js
//   RESOURCE_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createLimitChecker() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   RESOURCE_EVENT_NAMES.PANEL_LIMITS_UPDATED
//   RESOURCE_EVENT_NAMES.PANEL_LIMIT_EXCEEDED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { RESOURCE_TYPES } from '../../contracts/resource-contract.js';
import { DEFAULT_PANEL_LIMITS } from './constants.js';
import { RESOURCE_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

declare const defaultPanelLimits: Record<string, unknown>;
export const VERSION = '2.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'main.ui.container-main.resources.resource-manager.limit-checker';

export function createLimitChecker(options: Record<string, unknown> = {}) {
  const {
    panelRegistry,
    throttleController,
    emitter,
    defaultPanelLimits: limitsOpt = {},
    onPanelLimitExceeded
  } = options as Record<string, any>;

  // Merge default limits
  const _defaultLimits = { ...DEFAULT_PANEL_LIMITS, ...limitsOpt };

  // Panel-specific limits
  const _panelLimits = new Map();

  return {
    // Obtém limites do painel
    getLimits(panelId: string) {
      return _panelLimits.get(panelId) || _defaultLimits;
    },

    // Define limites para um painel
    setLimits(panelId: string, limits: Record<string, unknown>) {
      const current = this.getLimits(panelId);
      _panelLimits.set(panelId, { ...current, ...limits });
      emitter?.emit(RESOURCE_EVENT_NAMES.PANEL_LIMITS_UPDATED, { 
        panelId, 
        limits: _panelLimits.get(panelId) 
      });
    },

    // Remove limites customizados
    removeLimits(panelId: string) {
      _panelLimits.delete(panelId);
    },

    // Verifica limites do painel
    check(panelId: string, resourceType: string, estimatedMemory = 0) {
      const record = panelRegistry.get(panelId);
      if (!record) return [];

      const limits = this.getLimits(panelId);
      const violations = [];

      // Check total resources
      if (record.resources.size >= limits.maxResources) {
        violations.push({ 
          type: 'maxResources', 
          current: record.resources.size, 
          limit: limits.maxResources 
        });
      }

      // Check memory
      if (record.memoryUsage + estimatedMemory > limits.maxMemory) {
        violations.push({ 
          type: 'maxMemory', 
          current: record.memoryUsage, 
          limit: limits.maxMemory 
        });
      }

      // Check media resources
      if (resourceType === RESOURCE_TYPES.VIDEO || resourceType === RESOURCE_TYPES.STREAM) {
        const mediaCount = Array.from((record.resources as any).values())

          // @ts-expect-error TS migration - TS2339
          .filter(r => r.type === RESOURCE_TYPES.VIDEO || r.type === RESOURCE_TYPES.STREAM).length;
        if (mediaCount >= limits.maxMediaResources) {
          violations.push({ 
            type: 'maxMediaResources', 
            current: mediaCount, 
            limit: limits.maxMediaResources 
          });
        }
      }

      // Check network resources

      // @ts-expect-error TS migration - TS2339
      if (resourceType === RESOURCE_TYPES.FETCH || resourceType === RESOURCE_TYPES.STREAM) {
        const networkCount = Array.from(record.resources.values())

          // @ts-expect-error TS migration - TS2339
          .filter(r => r.type === RESOURCE_TYPES.FETCH || r.type === RESOURCE_TYPES.STREAM).length;
        if (networkCount >= limits.maxNetworkResources) {
          violations.push({ 
            type: 'maxNetworkResources', 
            current: networkCount, 
            limit: limits.maxNetworkResources 
          });
        }
      }

      // Handle violations
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
    getUsage(panelId: string) {
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
          resourcesPercent: Math.round((record.resources.size / limits.maxResources) * 100),
          memoryPercent: Math.round((record.memoryUsage / limits.maxMemory) * 100)
        }
      };
    },

    // Limpa
    clear() {
      _panelLimits.clear();
    }
  };
}

export default { createLimitChecker };
