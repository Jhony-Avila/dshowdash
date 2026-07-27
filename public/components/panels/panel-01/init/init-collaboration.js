import { CONFIG } from "../core/config.js";
import { initFeature, loadFeature } from "./feature-loader.js";
import { FeatureModules } from "./feature-registry.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:init-collaboration";
async function initCollaboration(ctx, handlers, result) {
  const features = CONFIG.features || {};
  if (features.activityLog !== false) {
    const activityModule = await loadFeature("activityLog", FeatureModules.activityLog);
    if (activityModule && activityModule.ActivityLogManager) {
      const ActivityLogManager = activityModule.ActivityLogManager;
      result.activityLog = initFeature("activityLog.init", () => new ActivityLogManager(), { fallback: null });
    }
  }
  if (features.userAssignments !== false) {
    const assignmentsModule = await loadFeature("userAssignments", FeatureModules.userAssignments);
    if (assignmentsModule && assignmentsModule.UserAssignmentsManager) {
      const UserAssignmentsManager = assignmentsModule.UserAssignmentsManager;
      result.userAssignments = initFeature("userAssignments.init", () => new UserAssignmentsManager({
        onAssign(itemId, userId) {
          if (result.activityLog && result.activityLog.logAssign) {
            result.activityLog.logAssign(itemId, userId);
          }
        }
      }), { fallback: null });
    }
  }
  if (features.mentions !== false) {
    const mentionsModule = await loadFeature("mentions", FeatureModules.mentions);
    if (mentionsModule && mentionsModule.MentionsManager) {
      const MentionsManager = mentionsModule.MentionsManager;
      result.mentions = initFeature("mentions.init", () => new MentionsManager(), { fallback: null });
    }
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var init_collaboration_default = { initCollaboration, info };
export {
  MODULE_ID,
  VERSION,
  init_collaboration_default as default,
  info,
  initCollaboration
};
