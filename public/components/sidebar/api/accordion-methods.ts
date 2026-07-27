// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-accordion-methods
// PURPOSE: Sidebar API - Accordion Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createAccordionMethods() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'sidebar-accordion-methods';

export function createAccordionMethods(dependencies: DynObj) {
  const { engine, renderer, logger } = dependencies;
  
  return {
    toggleSection(sectionId: string) {
      try {
        const result = engine.toggleSection(sectionId);
        if (result.success && result.changed) {
          renderer.toggleSectionUI(sectionId);
        }
        return result;
      } catch (error: any) {
        logger?.error?.('toggleSection error:', error);
        return { success: false, error: error.message };
      }
    },
    
    expandSection(sectionId: string) {
      try {
        const result = engine.expandSection(sectionId);
        if (result.success && result.changed) {
          renderer.expandSectionUI(sectionId);
        }
        return result;
      } catch (error: any) {
        logger?.error?.('expandSection error:', error);
        return { success: false, error: error.message };
      }
    },
    
    collapseSection(sectionId: string) {
      try {
        const result = engine.collapseSection(sectionId);
        if (result.success && result.changed) {
          renderer.collapseSectionUI(sectionId);
        }
        return result;
      } catch (error: any) {
        logger?.error?.('collapseSection error:', error);
        return { success: false, error: error.message };
      }
    },
    
    expandAllSections() {
      try {
        const result = engine.expandAllSections();
        const expandedIds = engine.getExpandedSections();
        renderer.syncExpandedSections(expandedIds);
        return result;
      } catch (error: any) {
        logger?.error?.('expandAllSections error:', error);
        return { success: false, error: error.message };
      }
    },
    
    collapseAllSections() {
      try {
        const result = engine.collapseAllSections();
        renderer.syncExpandedSections([]);
        return result;
      } catch (error: any) {
        logger?.error?.('collapseAllSections error:', error);
        return { success: false, error: error.message };
      }
    },
    
    isSectionExpanded(sectionId: string) {
      return engine?.isSectionExpanded(sectionId) ?? false;
    },
    
    getExpandedSections() {
      return engine?.getExpandedSections() ?? [];
    },
    
    setAccordionMode(allowMultiple: DynObj) {
      try {
        return engine.setAccordionMode(allowMultiple);
      } catch (error: any) {
        logger?.error?.('setAccordionMode error:', error);
        return { success: false, error: error.message };
      }
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}

export default { createAccordionMethods, info, healthCheck, VERSION, MODULE_ID };
