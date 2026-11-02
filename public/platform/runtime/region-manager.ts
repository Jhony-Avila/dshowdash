// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-region-manager
// PURPOSE: Region Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   REGIONS
//   VERSION
//   MODULE_ID
//   initRegions
//   getRegion
//   getAvailableRegions
//   mountToRegion
//   clearRegion
//   getRegionContent
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

interface Renderable {
  render(container: HTMLElement): void;
}

const VERSION = '3.1.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-region-manager';

const REGIONS: Record<string, string> = {
  HEADER: 'header-region',
  SIDEBAR: 'sidebar-region',
  MAIN: 'main-region',
  SUBMAIN: 'submain-region',
  FOOTER: 'footer-region',
  CANVAS: 'canvas-region',
  MODAL: 'modal-region',
  OVERLAY: 'overlay-region'
};

const _regionElements: Record<string, HTMLElement> = {};
const _regionContents: Record<string, string | HTMLElement | Renderable> = {};

function initRegions(doc: Document) {
  const keys = Object.keys(REGIONS);
  for (let i = 0; i < keys.length; i++) {
    const regionId = REGIONS[keys[i]];
    const el = (doc && doc.querySelector(`[data-region="${regionId}"]`)) || (doc && doc.getElementById(regionId));
    if (el) _regionElements[regionId] = el as HTMLElement;
  }
  return getAvailableRegions();
}

function getRegion(regionId: string) { return _regionElements[regionId] || null; }
function getAvailableRegions() { return Object.keys(_regionElements); }

function mountToRegion(regionId: string, content: string | HTMLElement | Renderable) {
  const region = _regionElements[regionId];
  if (!region) return false;
  if (typeof content === 'string') {
    region.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    region.innerHTML = '';
    region.appendChild(content);
  } else if (content && (content as Renderable).render) {
    region.innerHTML = '';
    (content as Renderable).render(region);
  }
  _regionContents[regionId] = content;
  return true;
}

function clearRegion(regionId: string) {
  const region = _regionElements[regionId];
  if (!region) return false;
  region.innerHTML = '';
  delete _regionContents[regionId];
  return true;
}

function getRegionContent(regionId: string) { return _regionContents[regionId] || null; }

export { REGIONS, VERSION, MODULE_ID, initRegions, getRegion, getAvailableRegions, mountToRegion, clearRegion, getRegionContent };
export default { VERSION, MODULE_ID, REGIONS, initRegions, getRegion, getAvailableRegions, mountToRegion, clearRegion, getRegionContent };
