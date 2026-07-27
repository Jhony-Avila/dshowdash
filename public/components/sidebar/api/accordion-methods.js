const VERSION = "1.0.0";
const MODULE_ID = "sidebar-accordion-methods";
function createAccordionMethods(dependencies) {
  const { engine, renderer, logger } = dependencies;
  return {
    toggleSection(sectionId) {
      try {
        const result = engine.toggleSection(sectionId);
        if (result.success && result.changed) {
          renderer.toggleSectionUI(sectionId);
        }
        return result;
      } catch (error) {
        logger?.error?.("toggleSection error:", error);
        return { success: false, error: error.message };
      }
    },
    expandSection(sectionId) {
      try {
        const result = engine.expandSection(sectionId);
        if (result.success && result.changed) {
          renderer.expandSectionUI(sectionId);
        }
        return result;
      } catch (error) {
        logger?.error?.("expandSection error:", error);
        return { success: false, error: error.message };
      }
    },
    collapseSection(sectionId) {
      try {
        const result = engine.collapseSection(sectionId);
        if (result.success && result.changed) {
          renderer.collapseSectionUI(sectionId);
        }
        return result;
      } catch (error) {
        logger?.error?.("collapseSection error:", error);
        return { success: false, error: error.message };
      }
    },
    expandAllSections() {
      try {
        const result = engine.expandAllSections();
        const expandedIds = engine.getExpandedSections();
        renderer.syncExpandedSections(expandedIds);
        return result;
      } catch (error) {
        logger?.error?.("expandAllSections error:", error);
        return { success: false, error: error.message };
      }
    },
    collapseAllSections() {
      try {
        const result = engine.collapseAllSections();
        renderer.syncExpandedSections([]);
        return result;
      } catch (error) {
        logger?.error?.("collapseAllSections error:", error);
        return { success: false, error: error.message };
      }
    },
    isSectionExpanded(sectionId) {
      return engine?.isSectionExpanded(sectionId) ?? false;
    },
    getExpandedSections() {
      return engine?.getExpandedSections() ?? [];
    },
    setAccordionMode(allowMultiple) {
      try {
        return engine.setAccordionMode(allowMultiple);
      } catch (error) {
        logger?.error?.("setAccordionMode error:", error);
        return { success: false, error: error.message };
      }
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}
var accordion_methods_default = { createAccordionMethods, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createAccordionMethods,
  accordion_methods_default as default,
  healthCheck,
  info
};
