// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:init:init-collaboration
// PURPOSE: Panel-01 - Collaboration Initializer
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
export const MODULE_ID = 'panel-01:init:init-collaboration';

export async function initCollaboration(ctx: Record<string, unknown>, handlers: Record<string, unknown>, result: Record<string, unknown>) {
  const features: Record<string, unknown> = CONFIG.features || {};

  // Activity Log
  if (features.activityLog !== false) {
    const activityModule = await loadFeature('activityLog', FeatureModules.activityLog);
    if (activityModule && (activityModule as Record<string, unknown>).ActivityLogManager) {
      const ActivityLogManager = (activityModule as Record<string, new () => unknown>).ActivityLogManager;
      result.activityLog = initFeature('activityLog.init', () => new ActivityLogManager(), { fallback: null });
    }
  }

  // User Assignments
  if (features.userAssignments !== false) {
    const assignmentsModule = await loadFeature('userAssignments', FeatureModules.userAssignments);
    if (assignmentsModule && (assignmentsModule as Record<string, unknown>).UserAssignmentsManager) {
      const UserAssignmentsManager = (assignmentsModule as Record<string, new (...args: unknown[]) => unknown>).UserAssignmentsManager;
      result.userAssignments = initFeature('userAssignments.init', () => new UserAssignmentsManager({
        onAssign(itemId: string | number, userId: string | number) {
          if (result.activityLog && (result.activityLog as Record<string, unknown>).logAssign) {
            (result.activityLog as Record<string, (...a: unknown[]) => void>).logAssign(itemId, userId);
          }
        }
      }), { fallback: null });
    }
  }

  // Mentions
  if (features.mentions !== false) {
    const mentionsModule = await loadFeature('mentions', FeatureModules.mentions);
    if (mentionsModule && (mentionsModule as Record<string, unknown>).MentionsManager) {
      const MentionsManager = (mentionsModule as Record<string, new () => unknown>).MentionsManager;
      result.mentions = initFeature('mentions.init', () => new MentionsManager(), { fallback: null });
    }
  }

  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { initCollaboration, info };
