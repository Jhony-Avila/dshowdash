// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-layout-regions
// PURPOSE: Layout Regions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   REGION_IDS
//   REGION_SELECTORS
//   findRegion
//   findAllRegions
//   createRegionPlaceholder
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '3.2.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-layout-regions';

const REGION_IDS = {
  HEADER: 'header-region',
  SIDEBAR: 'sidebar-region',
  MAIN: 'main-region',
  SUBMAIN: 'submain-region',
  FOOTER: 'footer-region',
  CANVAS: 'canvas-region',
  MODAL: 'modal-region',
  OVERLAY: 'overlay-region',
  NAV_RAIL: 'nav-rail-region'
};

const REGION_SELECTORS: Record<string, string> = {};
REGION_SELECTORS[REGION_IDS.HEADER] = '[data-region="header"], #shell-header-region, #header, .shell-header';
REGION_SELECTORS[REGION_IDS.SIDEBAR] = '[data-region="sidebar"], #shell-sidebar-region, #sidebar, .shell-sidebar';
REGION_SELECTORS[REGION_IDS.MAIN] = '[data-region="main"], #shell-main-region, #main, .shell-main, .main-content';
REGION_SELECTORS[REGION_IDS.SUBMAIN] = '[data-region="submain"], #shell-submain-region, #submain';
REGION_SELECTORS[REGION_IDS.FOOTER] = '[data-region="footer"], #shell-footer-region, #footer, .shell-footer';
REGION_SELECTORS[REGION_IDS.CANVAS] = '[data-region="canvas"], #shell-canvas-region, #canvas';
REGION_SELECTORS[REGION_IDS.MODAL] = '[data-region="modal"], #shell-modal-region, #modal, .modal-container';
REGION_SELECTORS[REGION_IDS.OVERLAY] = '[data-region="overlay"], #shell-overlay-region, #overlay';
REGION_SELECTORS[REGION_IDS.NAV_RAIL] = '[data-region="nav-rail"], #shell-nav-rail-region, #nav-rail, .nav-rail';

function findRegion(regionId: string, doc?: Document) {
  if (!doc) doc = document;
  const selectors = REGION_SELECTORS[regionId];
  if (!selectors) return null;
  const selectorList = selectors.split(', ');
  for (let i = 0; i < selectorList.length; i++) {
    const el = doc.querySelector(selectorList[i]);
    if (el) return el;
  }
  return null;
}

function findAllRegions(doc?: Document) {
  if (!doc) doc = document;
  const found: Record<string, Element | null> = {};
  const keys = Object.keys(REGION_IDS);
  for (let i = 0; i < keys.length; i++) {
    const regionId = (REGION_IDS as Record<string, string>)[keys[i]];
    found[regionId] = findRegion(regionId, doc);
  }
  return found;
}

function createRegionPlaceholder(regionId: string) {
  const div = document.createElement('div');
  div.id = regionId;
  div.setAttribute('data-region', regionId.replace('-region', ''));
  div.className = 'platform-region ' + regionId;
  return div;
}

export { VERSION, MODULE_ID, REGION_IDS, REGION_SELECTORS, findRegion, findAllRegions, createRegionPlaceholder };
export default { VERSION: VERSION, MODULE_ID: MODULE_ID, REGION_IDS: REGION_IDS, REGION_SELECTORS: REGION_SELECTORS, findRegion: findRegion, findAllRegions: findAllRegions, createRegionPlaceholder: createRegionPlaceholder };