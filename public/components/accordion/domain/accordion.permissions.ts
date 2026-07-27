// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.domain.permissions
// PURPOSE: Permission checking for accordion entities
// ───────────────────────────────────────────────────────────────
// @contract CHECK_PERMISSION - checkPermission(entity, port) checks access
// @contract FIND_ITEM_BY_ID - findItemById(structure, id) finds item
// @contract FIND_SECTION_BY_ID - findSectionById(structure, id) finds section
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: checkPermission, findItemById, findSectionById,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial permission checking
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.domain.permissions';

export function checkPermission(entity: Record<string, any>, permissionsPort: Record<string, any> | null) {
  if (!entity?.visibilityPolicy) return true;
  if (!permissionsPort) return true;

  const policy = entity.visibilityPolicy as { triggerId?: string; regionId?: string; mode?: string; fallback?: string } | null;
  const { triggerId, regionId, mode, fallback } = policy || {};

  try {
    let allowed = true;

    if (triggerId && permissionsPort.checkTrigger) {
      allowed = allowed && permissionsPort.checkTrigger(triggerId);
    }

    if (regionId && permissionsPort.checkRegion) {
      allowed = allowed && permissionsPort.checkRegion(regionId);
    }

    if (!allowed && mode === 'disable') {
      return false;
    }

    return allowed;
  } catch {
    return fallback !== 'hide' && fallback !== 'disable';
  }
}

export function findItemById(structure: Record<string, any>, itemId: string) {
  if (!structure?.sections) return null;
  for (const section of structure.sections) {
    const item = section.items?.find((i: Record<string, any>) => i.id === itemId);
    if (item) return item;
  }
  return null;
}

export function findSectionById(structure: Record<string, any>, sectionId: string) {
  if (!structure?.sections) return null;
  return structure.sections.find((s: Record<string, any>) => s.id === sectionId) || null;
}

export function healthCheck() {
  const checks = {
    checkPermissionAvailable: typeof checkPermission === 'function',
    findItemByIdAvailable: typeof findItemById === 'function',
    findSectionByIdAvailable: typeof findSectionById === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    functions: ['checkPermission', 'findItemById', 'findSectionById'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  checkPermission,
  findItemById,
  findSectionById,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
