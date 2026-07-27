// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-11/icons
// PURPOSE: panel-11 - Icons (IconRegistry Adapter)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ICONS — exported value
//   getFileIcon() — exported function
//   healthCheck() — exported function
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

import { IconRegistry } from '/components/icon-registry/index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-11/icons';

function getIcon(name: string, size: number = 16) {
  const namespaces = ['extended', 'ui', 'system', 'charts', 'business'];
  for (const ns of namespaces) {
    const svg = IconRegistry.get(`${ns}:${name}`);
    if (svg) return svg.replace(/width="24"/g, `width="${size}"`).replace(/height="24"/g, `height="${size}"`);
  }
  return '';
}

const NAME_MAP = {
  'document': 'file-document', 'folderOpen': 'folder-open', 'cloudUpload': 'cloud-upload',
  'hdd': 'hard-drive', 'checkCircle': 'check-circle', 'alertCircle': 'alert-circle',
  'alertTriangle': 'alert-triangle', 'recent': 'clock', 'checkSquare': 'check-square',
  'sortAsc': 'sort-asc', 'sortDesc': 'sort-desc', 'pieChart': 'pie', 'barChart': 'bar'
};

export const ICONS = new Proxy({} as Record<string, string>, {
  get(target: Record<string, string>, prop: string | symbol) {
    if (prop === 'then') return undefined;
    const key = typeof prop === 'string' ? prop : String(prop);
    return getIcon((NAME_MAP as Record<string, string>)[key] || key, 16);
  },
  has() { return true; }
});

export function getFileIcon(type: string) {
  const map: Record<string, string> = { 'image': 'image', 'video': 'video', 'audio': 'audio', 'document': 'file-document', 'other': 'archive' };
  return getIcon(map[type] || 'file', 16);
}

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, source: 'IconRegistry' }; }
export default ICONS;
