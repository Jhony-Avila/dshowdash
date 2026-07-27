const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.domain.permissions";
function checkPermission(entity, permissionsPort) {
  if (!entity?.visibilityPolicy) return true;
  if (!permissionsPort) return true;
  const policy = entity.visibilityPolicy;
  const { triggerId, regionId, mode, fallback } = policy || {};
  try {
    let allowed = true;
    if (triggerId && permissionsPort.checkTrigger) {
      allowed = allowed && permissionsPort.checkTrigger(triggerId);
    }
    if (regionId && permissionsPort.checkRegion) {
      allowed = allowed && permissionsPort.checkRegion(regionId);
    }
    if (!allowed && mode === "disable") {
      return false;
    }
    return allowed;
  } catch {
    return fallback !== "hide" && fallback !== "disable";
  }
}
function findItemById(structure, itemId) {
  if (!structure?.sections) return null;
  for (const section of structure.sections) {
    const item = section.items?.find((i) => i.id === itemId);
    if (item) return item;
  }
  return null;
}
function findSectionById(structure, sectionId) {
  if (!structure?.sections) return null;
  return structure.sections.find((s) => s.id === sectionId) || null;
}
function healthCheck() {
  const checks = {
    checkPermissionAvailable: typeof checkPermission === "function",
    findItemByIdAvailable: typeof findItemById === "function",
    findSectionByIdAvailable: typeof findSectionById === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    functions: ["checkPermission", "findItemById", "findSectionById"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var accordion_permissions_default = {
  checkPermission,
  findItemById,
  findSectionById,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  checkPermission,
  accordion_permissions_default as default,
  findItemById,
  findSectionById,
  healthCheck,
  info
};
